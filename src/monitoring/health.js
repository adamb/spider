import { TARGET_URL, FREEZER_PROBE_ID, HUMIDITY_PROBE_ID, DEPTH_PROBE_ID } from '../lib/constants.js';
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

    // Use internal API endpoint
    const request = new Request('https://spider.dev.pr/api/devices', {
      method: 'GET',
    });
    
    // Import and call the handler directly
    const { handleDevicesAPI } = await import('../handlers/api.js');
    const response = await handleDevicesAPI(env);

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
        
        console.log(`Checking device ${device.name} (${deviceId}): isOffline=${isOffline}, timeSinceLastReport=${timeSinceLastReport}s`);
        
        if (cachedAlert) {
          try {
            const cachedText = await cachedAlert.text();
            console.log(`Found cached alert for ${device.name}: ${cachedText}`);
            if (cachedText === 'true') {
              // Legacy format
              wasOffline = true;
            } else {
              // New JSON format
              alertData = JSON.parse(cachedText);
              wasOffline = alertData.active;
            }
          } catch (error) {
            console.log(`Error parsing cached alert for ${device.name}:`, error);
            wasOffline = false;
          }
        } else {
          console.log(`No cached alert found for ${device.name}`);
        }
        
        console.log(`Device ${device.name}: isOffline=${isOffline}, wasOffline=${wasOffline}`);
        
        if (isOffline && !wasOffline) {
          // Device went offline - send notification
          const minutesOffline = Math.floor(timeSinceLastReport / 60);
          const lastSeen = new Date(device.last * 1000).toLocaleString();
          const message = `🔴 DEVICE OFFLINE: ${device.name} (${minutesOffline}min offline, last seen: ${lastSeen})\n\nView all probes: https://spider.dev.pr/probes`;
          
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
          console.log(`Cached offline alert for ${device.name}:`, JSON.stringify(alertData));
        } else if (!isOffline && wasOffline) {
          // Device came back online - send recovery notification
          const message = `✅ DEVICE RECOVERED: ${device.name} is back online\n\nLast reading: ${new Date(device.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
          
          await sendPushoverNotification(env, message, "📡 Device Recovery");
          console.log(`Sent recovery alert for device: ${device.name}`);
          
          // Cache clear state instead of deleting
          const clearData = {
            active: false,
            lastClear: Date.now(),
            deviceId: deviceId,
            deviceName: device.name
          };
          await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
        } else if (isOffline && wasOffline) {
          console.log(`Device ${device.name} still offline, alert already sent`);
        } else if (!isOffline && !wasOffline) {
          // Device is online and was online - maintain clear state in cache
          const clearData = {
            active: false,
            lastCheck: Date.now(),
            deviceId: deviceId,
            deviceName: device.name
          };
          await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
          console.log(`Device ${device.name} is online - cached clear state`);
        }
      }
    }

    // Check freezer temperature
    await checkFreezerTemperature(env, thresholds);

    // Check humidity level
    await checkHumidityLevel(env, thresholds);

    // Check depth level
    await checkDepthLevel(env, thresholds);

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

    const currentTempC = probeData.value; // Raw value is in Celsius
    const currentTempF = (currentTempC * 9/5) + 32; // Convert to Fahrenheit for display
    const thresholdF = (thresholds.FREEZER_MAX_TEMP * 9/5) + 32; // Convert threshold to F for display
    console.log(`Freezer temperature: ${currentTempC}°C (${currentTempF.toFixed(1)}°F, threshold: ${thresholds.FREEZER_MAX_TEMP}°C/${thresholdF.toFixed(1)}°F)`);

    // Check if temperature is above the safe threshold (both in Celsius)
    const alertKey = 'freezer-temp-alert';
    const isInAlertState = currentTempC > thresholds.FREEZER_MAX_TEMP;
    
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
      const message = `🚨 FREEZER ALERT: Temperature is ${currentTempC}°C (${currentTempF.toFixed(1)}°F) - above safe limit of ${thresholds.FREEZER_MAX_TEMP}°C (${thresholdF.toFixed(1)}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Alert");
      console.log(`Sent freezer temperature alert: ${currentTempC}°C > ${thresholds.FREEZER_MAX_TEMP}°C`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentTempC
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ FREEZER RECOVERED: Temperature is now ${currentTempC}°C (${currentTempF.toFixed(1)}°F) - back within safe range of ${thresholds.FREEZER_MAX_TEMP}°C (${thresholdF.toFixed(1)}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Normal");
      console.log(`Sent freezer recovery notification: ${currentTempC}°C <= ${thresholds.FREEZER_MAX_TEMP}°C`);
      
      // Cache clear state instead of deleting
      const clearData = {
        active: false,
        lastClear: Date.now(),
        value: currentTempC
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
    } else if (isInAlertState) {
      console.log(`Freezer still in alert state: ${currentTempC}°C > ${thresholds.FREEZER_MAX_TEMP}°C (notification already sent)`);
    } else if (!isInAlertState && !wasInAlertState) {
      // Temperature is normal and was normal - maintain clear state in cache
      const clearData = {
        active: false,
        lastCheck: Date.now(),
        value: currentTempC
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
      console.log(`Freezer temperature is within safe range - cached clear state: ${currentTempC}°C`);
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
      const message = `💧 HUMIDITY ALERT: Level is ${currentHumidity}% (above safe limit of ${thresholds.HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
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
      const message = `✅ HUMIDITY RECOVERED: Level is now ${currentHumidity}% (back within safe range of ${thresholds.HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
      await sendPushoverNotification(env, message, "💧 Humidity Level Normal");
      console.log(`Sent humidity recovery notification: ${currentHumidity}% <= ${thresholds.HUMIDITY_MAX_LEVEL}%`);
      
      // Cache clear state instead of deleting
      const clearData = {
        active: false,
        lastClear: Date.now(),
        value: currentHumidity
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
    } else if (isInAlertState) {
      console.log(`Humidity still in alert state: ${currentHumidity}% > ${thresholds.HUMIDITY_MAX_LEVEL}% (notification already sent)`);
    } else if (!isInAlertState && !wasInAlertState) {
      // Humidity is normal and was normal - maintain clear state in cache
      const clearData = {
        active: false,
        lastCheck: Date.now(),
        value: currentHumidity
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
      console.log(`Humidity level is within safe range - cached clear state: ${currentHumidity}%`);
    }

  } catch (error) {
    console.error('Error checking humidity level:', error);
    await sendPushoverNotification(env, `Humidity level check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

export async function checkDepthLevel(env, thresholds) {
  try {
    console.log('Checking depth level...');
    
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      console.error('Missing authentication configuration for depth check');
      return;
    }

    // Get depth probe data
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${DEPTH_PROBE_ID}`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0-cron',
      },
    });

    if (!response.ok) {
      console.error(`Depth probe API request failed with status ${response.status}`);
      return;
    }

    const probeData = await response.json();
    
    // Check if we have a valid depth reading
    if (probeData.value === null || probeData.value === undefined) {
      console.log('No depth reading available');
      return;
    }

    const currentDepth = probeData.value;
    console.log(`Depth level: ${currentDepth} (threshold: ${thresholds.DEPTH_MAX_LEVEL})`);

    // Check if depth is above the safe threshold
    const alertKey = 'depth-level-alert';
    const isInAlertState = currentDepth > thresholds.DEPTH_MAX_LEVEL;
    
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
      const message = `📏 DEPTH ALERT: Level is ${currentDepth} (above safe limit of ${thresholds.DEPTH_MAX_LEVEL})\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
      await sendPushoverNotification(env, message, "📏 Depth Level Alert");
      console.log(`Sent depth alert: ${currentDepth} > ${thresholds.DEPTH_MAX_LEVEL}`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentDepth
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ DEPTH RECOVERED: Level is now ${currentDepth} (back within safe range of ${thresholds.DEPTH_MAX_LEVEL})\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}\n\nView all probes: https://spider.dev.pr/probes`;
      
      await sendPushoverNotification(env, message, "📏 Depth Level Normal");
      console.log(`Sent depth recovery notification: ${currentDepth} <= ${thresholds.DEPTH_MAX_LEVEL}`);
      
      // Cache clear state instead of deleting
      const clearData = {
        active: false,
        lastClear: Date.now(),
        value: currentDepth
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
    } else if (isInAlertState) {
      console.log(`Depth still in alert state: ${currentDepth} > ${thresholds.DEPTH_MAX_LEVEL} (notification already sent)`);
    } else if (!isInAlertState && !wasInAlertState) {
      // Depth is normal and was normal - maintain clear state in cache
      const clearData = {
        active: false,
        lastCheck: Date.now(),
        value: currentDepth
      };
      await cache.put(cacheKey, new Response(JSON.stringify(clearData)));
      console.log(`Depth level is within safe range - cached clear state: ${currentDepth}`);
    }

  } catch (error) {
    console.error('Error checking depth level:', error);
    await sendPushoverNotification(env, `Depth level check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}