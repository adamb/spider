import { TARGET_URL, FREEZER_PROBE_ID, HUMIDITY_PROBE_ID } from '../lib/constants.js';
import { getThresholds } from '../lib/thresholds.js';
import { sendPushoverNotification } from '../utils/notifications.js';

export async function checkDeviceHealth(env) {
  try {
    console.log('Running device health check...');
    
    // Get thresholds from KV
    const thresholds = await getThresholds(env);
    
    // Get device data using the same logic as the API endpoint
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      console.error('Missing authentication configuration for health check');
      return;
    }

    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/devices`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0-cron',
      },
    });

    if (!response.ok) {
      console.error(`Device API request failed with status ${response.status}`);
      return;
    }

    const data = await response.json();
    const currentTime = Math.floor(Date.now() / 1000);
    const offlineDevices = [];

    // Check each device
    if (data.devices) {
      for (const [deviceId, device] of Object.entries(data.devices)) {
        const timeSinceLastReport = currentTime - device.last;
        
        if (timeSinceLastReport > thresholds.DEVICE_TIMEOUT) {
          const minutesOffline = Math.floor(timeSinceLastReport / 60);
          offlineDevices.push({
            id: deviceId,
            name: device.name,
            minutesOffline: minutesOffline,
            lastSeen: new Date(device.last * 1000).toLocaleString()
          });
        }
      }
    }

    // Check each device for alert state changes
    const cache = caches.default;
    
    if (data.devices) {
      for (const [deviceId, device] of Object.entries(data.devices)) {
        const timeSinceLastReport = currentTime - device.last;
        const isOffline = timeSinceLastReport > thresholds.DEVICE_TIMEOUT;
        
        // Check cached alert state
        const alertKey = `device-offline-${deviceId}`;
        const cacheKey = new Request(`https://alerts.cache/${alertKey}`);
        const cachedAlert = await cache.match(cacheKey);
        let wasOffline = false;
        let alertData = null;
        
        if (cachedAlert) {
          try {
            const cachedText = await cachedAlert.text();
            if (cachedText === 'true') {
              // Legacy format
              wasOffline = true;
            } else {
              // New JSON format
              alertData = JSON.parse(cachedText);
              wasOffline = alertData.active;
            }
          } catch (error) {
            wasOffline = false;
          }
        }
        
        if (isOffline && !wasOffline) {
          // Device went offline - send notification
          const minutesOffline = Math.floor(timeSinceLastReport / 60);
          const lastSeen = new Date(device.last * 1000).toLocaleString();
          const message = `🔴 DEVICE OFFLINE: ${device.name} (${minutesOffline}min offline, last seen: ${lastSeen})`;
          
          await sendPushoverNotification(env, message, "📡 Device Offline Alert");
          console.log(`Sent offline alert for device: ${device.name}`);
          
          // Cache the alert state with timestamp
          const alertData = {
            active: true,
            startTime: Date.now(),
            deviceId: deviceId,
            deviceName: device.name
          };
          await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
        } else if (!isOffline && wasOffline) {
          // Device came back online - send recovery notification
          const message = `✅ DEVICE RECOVERED: ${device.name} is back online\n\nLast reading: ${new Date(device.last * 1000).toLocaleString()}`;
          
          await sendPushoverNotification(env, message, "📡 Device Recovery");
          console.log(`Sent recovery alert for device: ${device.name}`);
          
          // Clear the alert state
          await cache.delete(cacheKey);
        }
      }
    }

    // Check freezer temperature
    await checkFreezerTemperature(env, thresholds);

    // Check humidity level
    await checkHumidityLevel(env, thresholds);

  } catch (error) {
    console.error('Error in device health check:', error);
    await sendPushoverNotification(env, `Device health check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

export async function checkFreezerTemperature(env, thresholds) {
  try {
    console.log('Checking freezer temperature...');
    
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      console.error('Missing authentication configuration for freezer check');
      return;
    }

    // Get freezer probe data
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${FREEZER_PROBE_ID}`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0-cron',
      },
    });

    if (!response.ok) {
      console.error(`Freezer probe API request failed with status ${response.status}`);
      return;
    }

    const probeData = await response.json();
    
    // Check if we have a valid temperature reading
    if (probeData.value === null || probeData.value === undefined) {
      console.log('No temperature reading available for freezer');
      return;
    }

    const currentTemp = probeData.value; // Already in Fahrenheit
    console.log(`Freezer temperature: ${currentTemp}°F (threshold: ${thresholds.FREEZER_MAX_TEMP}°F)`);

    // Check if temperature is above the safe threshold
    const alertKey = 'freezer-temp-alert';
    const isInAlertState = currentTemp > thresholds.FREEZER_MAX_TEMP;
    
    // Get cached alert state
    const cache = caches.default;
    const cacheKey = new Request(`https://alerts.cache/${alertKey}`);
    const cachedAlert = await cache.match(cacheKey);
    let wasInAlertState = false;
    let alertData = null;
    
    if (cachedAlert) {
      try {
        const cachedText = await cachedAlert.text();
        if (cachedText === 'true') {
          // Legacy format
          wasInAlertState = true;
        } else {
          // New JSON format
          alertData = JSON.parse(cachedText);
          wasInAlertState = alertData.active;
        }
      } catch (error) {
        wasInAlertState = false;
      }
    }
    
    if (isInAlertState && !wasInAlertState) {
      // New alert condition - send notification
      const message = `🚨 FREEZER ALERT: Temperature is ${currentTemp}°F (above safe limit of ${thresholds.FREEZER_MAX_TEMP}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Alert");
      console.log(`Sent freezer temperature alert: ${currentTemp}°F > ${thresholds.FREEZER_MAX_TEMP}°F`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentTemp
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ FREEZER RECOVERED: Temperature is now ${currentTemp}°F (back within safe range of ${thresholds.FREEZER_MAX_TEMP}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Normal");
      console.log(`Sent freezer recovery notification: ${currentTemp}°F <= ${thresholds.FREEZER_MAX_TEMP}°F`);
      
      // Clear the alert state
      await cache.delete(cacheKey);
    } else if (isInAlertState) {
      console.log(`Freezer still in alert state: ${currentTemp}°F > ${thresholds.FREEZER_MAX_TEMP}°F (notification already sent)`);
    } else {
      console.log('Freezer temperature is within safe range');
    }

  } catch (error) {
    console.error('Error checking freezer temperature:', error);
    await sendPushoverNotification(env, `Freezer temperature check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

export async function checkHumidityLevel(env, thresholds) {
  try {
    console.log('Checking humidity level...');
    
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      console.error('Missing authentication configuration for humidity check');
      return;
    }

    // Get humidity probe data
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${HUMIDITY_PROBE_ID}`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0-cron',
      },
    });

    if (!response.ok) {
      console.error(`Humidity probe API request failed with status ${response.status}`);
      return;
    }

    const probeData = await response.json();
    
    // Check if we have a valid humidity reading
    if (probeData.value === null || probeData.value === undefined) {
      console.log('No humidity reading available');
      return;
    }

    const currentHumidity = probeData.value;
    console.log(`Humidity level: ${currentHumidity}% (threshold: ${thresholds.HUMIDITY_MAX_LEVEL}%)`);

    // Check if humidity is above the safe threshold
    const alertKey = 'humidity-level-alert';
    const isInAlertState = currentHumidity > thresholds.HUMIDITY_MAX_LEVEL;
    
    // Get cached alert state
    const cache = caches.default;
    const cacheKey = new Request(`https://alerts.cache/${alertKey}`);
    const cachedAlert = await cache.match(cacheKey);
    let wasInAlertState = false;
    let alertData = null;
    
    if (cachedAlert) {
      try {
        const cachedText = await cachedAlert.text();
        if (cachedText === 'true') {
          // Legacy format
          wasInAlertState = true;
        } else {
          // New JSON format
          alertData = JSON.parse(cachedText);
          wasInAlertState = alertData.active;
        }
      } catch (error) {
        wasInAlertState = false;
      }
    }
    
    if (isInAlertState && !wasInAlertState) {
      // New alert condition - send notification
      const message = `💧 HUMIDITY ALERT: Level is ${currentHumidity}% (above safe limit of ${thresholds.HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "💧 Humidity Level Alert");
      console.log(`Sent humidity alert: ${currentHumidity}% > ${thresholds.HUMIDITY_MAX_LEVEL}%`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentHumidity
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ HUMIDITY RECOVERED: Level is now ${currentHumidity}% (back within safe range of ${thresholds.HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "💧 Humidity Level Normal");
      console.log(`Sent humidity recovery notification: ${currentHumidity}% <= ${thresholds.HUMIDITY_MAX_LEVEL}%`);
      
      // Clear the alert state
      await cache.delete(cacheKey);
    } else if (isInAlertState) {
      console.log(`Humidity still in alert state: ${currentHumidity}% > ${thresholds.HUMIDITY_MAX_LEVEL}% (notification already sent)`);
    } else {
      console.log('Humidity level is within safe range');
    }

  } catch (error) {
    console.error('Error checking humidity level:', error);
    await sendPushoverNotification(env, `Humidity level check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}