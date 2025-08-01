const TARGET_URL = 'http://lab.spiderplant.com';
const CACHE_TTL = 300; // 5 minutes
const DEVICE_TIMEOUT = 30 * 60; // 30 minutes - consider device offline if no report
const FREEZER_PROBE_ID = '4c7525046c96-101252130008001E';
const FREEZER_MAX_TEMP = -10; // Maximum safe freezer temperature in Fahrenheit
const HUMIDITY_PROBE_ID = '4c7525046c96-0e76b286d29e_rh';
const HUMIDITY_MAX_LEVEL = 55; // Maximum safe humidity percentage

async function handleDevicesAPI(env) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response(JSON.stringify({
        error: 'Missing authentication configuration'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Construct the API request
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/devices`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `API request failed with status ${response.status}`
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: `Internal error: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleProbesAPI(env) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response(JSON.stringify({
        error: 'Missing authentication configuration'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Construct the API request
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `API request failed with status ${response.status}`
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: `Internal error: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleProbeValueAPI(env, probeId) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response(JSON.stringify({
        error: 'Missing authentication configuration'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Construct the API request
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${probeId}`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `API request failed with status ${response.status}`
      }), {
        status: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: `Internal error: ${error.message}`
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

async function handleProbesPage(env) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response('Authentication not configured', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Get probes data
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch probes: ${response.status}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const data = await response.json();
    
    // Fetch individual probe values
    const probesWithValues = await Promise.all(
      (data.probes || []).map(async (probe) => {
        try {
          const probeUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${probe.id}`;
          const probeResponse = await fetch(probeUrl, {
            method: 'GET',
            headers: {
              'Cookie': cookieHeader,
              'User-Agent': 'spider-proxy/1.0',
            },
          });
          
          if (probeResponse.ok) {
            const probeData = await probeResponse.json();
            return { ...probe, value: probeData.value };
          } else {
            return { ...probe, value: null };
          }
        } catch (error) {
          return { ...probe, value: null };
        }
      })
    );
    
    // Get alert states from cache
    const alertStates = await getAlertStates();
    
    // Generate HTML
    const html = generateProbesHTML(probesWithValues, env, alertStates);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

function generateProbesHTML(probes, env, alertStates) {
  // Generate alerts section
  const alertsSection = generateAlertsSection(probes, alertStates);
  
  // Group probes by device ID (first part of probe ID before the first hyphen)
  const deviceGroups = {};
  const deviceNames = {
    '4c7525046c96': 'Storage',
    '44179312cc0f': 'Tanks'
  };
  
  probes.forEach(probe => {
    const deviceId = probe.id.split('-')[0];
    if (!deviceGroups[deviceId]) {
      deviceGroups[deviceId] = [];
    }
    deviceGroups[deviceId].push(probe);
  });
  
  // Generate HTML for each device group
  const deviceSections = Object.entries(deviceGroups).map(([deviceId, deviceProbes]) => {
    const deviceName = deviceNames[deviceId] || deviceId;
    
    const probeRows = deviceProbes.map(probe => {
      const lastTime = new Date(probe.last * 1000).toLocaleString('en-US', {
        timeZone: 'America/Puerto_Rico',
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const probeTypeLabel = {
        'tf': 'Temperature',
        'rh': 'Humidity',
        '': 'Other'
      }[probe.probetype] || probe.probetype || 'Unknown';
      
      let valueString = '';
      if (probe.value !== null && probe.value !== undefined) {
        if (probe.probetype === 'tf') {
          valueString = `${probe.value}°F`;
        } else if (probe.probetype === 'rh') {
          valueString = `${probe.value}%`;
        } else {
          valueString = probe.value.toString();
        }
      } else {
        valueString = '—';
      }
      
      return `
        <tr>
          <td><a href="/probes/${probe.id}/details" class="probe-link">${probe.name || probe.id}</a></td>
          <td><code>${probe.id}</code></td>
          <td>${probeTypeLabel}</td>
          <td>${valueString}</td>
          <td>${lastTime}</td>
        </tr>
      `;
    }).join('');
    
    return `
      <div class="device-section">
        <h3>${deviceName} <span class="device-id">(${deviceId})</span></h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Probe ID</th>
              <th>Type</th>
              <th>Value</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            ${probeRows}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
    <title>Thermweb Probes - Spider Proxy</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        code {
            background-color: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            font-size: 0.9em;
        }
        a {
            color: #1976d2;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .refresh-btn {
            background-color: #1976d2;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        }
        .refresh-btn:hover {
            background-color: #1565c0;
        }
        .device-section {
            margin-bottom: 30px;
        }
        .device-section h3 {
            color: #1976d2;
            margin-bottom: 15px;
            font-size: 1.2em;
        }
        .device-id {
            color: #666;
            font-weight: normal;
            font-size: 0.9em;
        }
        .probe-link {
            color: #1976d2;
            text-decoration: none;
            font-weight: 500;
        }
        .probe-link:hover {
            text-decoration: underline;
        }
        .alerts-section {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .alerts-section.no-alerts {
            background-color: #d4edda;
            border-color: #c3e6cb;
        }
        .alerts-section h3 {
            margin-top: 0;
            color: #856404;
            font-size: 1.1em;
        }
        .alerts-section.no-alerts h3 {
            color: #155724;
        }
        .alert-item {
            padding: 8px 12px;
            margin: 8px 0;
            border-radius: 4px;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .alert-item.warning {
            background-color: #ffeaa7;
            border-color: #fdd835;
            color: #856404;
        }
        .alert-item.ok {
            background-color: #d1ecf1;
            border-color: #bee5eb;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thermweb Probes</h1>
            <button class="refresh-btn" onclick="location.reload()">Refresh</button>
        </div>
        
        <p>Total probes: <strong>${probes.length}</strong></p>
        
        ${alertsSection}
        
        ${deviceSections}
    </div>
</body>
</html>
  `;
}

async function sendPushoverNotification(env, message, title = "Device Alert") {
  try {
    if (!env.PUSHOVER_TOKEN || !env.PUSHOVER_USER) {
      console.error('Missing Pushover credentials');
      return false;
    }

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: env.PUSHOVER_TOKEN,
        user: env.PUSHOVER_USER,
        message: message,
        title: title,
        priority: 1, // High priority
      }),
    });

    const result = await response.json();
    if (response.ok && result.status === 1) {
      console.log('Pushover notification sent successfully');
      return true;
    } else {
      console.error('Pushover notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending Pushover notification:', error);
    return false;
  }
}

async function checkDeviceHealth(env) {
  try {
    console.log('Running device health check...');
    
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
        
        if (timeSinceLastReport > DEVICE_TIMEOUT) {
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

    // Send alerts for offline devices
    if (offlineDevices.length > 0) {
      const deviceList = offlineDevices
        .map(d => `${d.name} (${d.minutesOffline}min offline, last seen: ${d.lastSeen})`)
        .join('\n');
      
      const message = `${offlineDevices.length} device(s) offline:\n${deviceList}`;
      
      await sendPushoverNotification(env, message, "Thermweb Device Alert");
      console.log(`Sent alert for ${offlineDevices.length} offline devices`);
    } else {
      console.log('All devices are online');
    }

    // Check freezer temperature
    await checkFreezerTemperature(env);

    // Check humidity level
    await checkHumidityLevel(env);

  } catch (error) {
    console.error('Error in device health check:', error);
    await sendPushoverNotification(env, `Device health check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

async function checkFreezerTemperature(env) {
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
    console.log(`Freezer temperature: ${currentTemp}°F (threshold: ${FREEZER_MAX_TEMP}°F)`);

    // Check if temperature is above the safe threshold
    const alertKey = 'freezer-temp-alert';
    const isInAlertState = currentTemp > FREEZER_MAX_TEMP;
    
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
      const message = `🚨 FREEZER ALERT: Temperature is ${currentTemp}°F (above safe limit of ${FREEZER_MAX_TEMP}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Alert");
      console.log(`Sent freezer temperature alert: ${currentTemp}°F > ${FREEZER_MAX_TEMP}°F`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentTemp
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ FREEZER RECOVERED: Temperature is now ${currentTemp}°F (back within safe range of ${FREEZER_MAX_TEMP}°F)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "🧊 Freezer Temperature Normal");
      console.log(`Sent freezer recovery notification: ${currentTemp}°F <= ${FREEZER_MAX_TEMP}°F`);
      
      // Clear the alert state
      await cache.delete(cacheKey);
    } else if (isInAlertState) {
      console.log(`Freezer still in alert state: ${currentTemp}°F > ${FREEZER_MAX_TEMP}°F (notification already sent)`);
    } else {
      console.log('Freezer temperature is within safe range');
    }

  } catch (error) {
    console.error('Error checking freezer temperature:', error);
    await sendPushoverNotification(env, `Freezer temperature check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

async function checkHumidityLevel(env) {
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
    console.log(`Humidity level: ${currentHumidity}% (threshold: ${HUMIDITY_MAX_LEVEL}%)`);

    // Check if humidity is above the safe threshold
    const alertKey = 'humidity-level-alert';
    const isInAlertState = currentHumidity > HUMIDITY_MAX_LEVEL;
    
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
      const message = `💧 HUMIDITY ALERT: Level is ${currentHumidity}% (above safe limit of ${HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "💧 Humidity Level Alert");
      console.log(`Sent humidity alert: ${currentHumidity}% > ${HUMIDITY_MAX_LEVEL}%`);
      
      // Cache the alert state with timestamp
      const alertData = {
        active: true,
        startTime: Date.now(),
        value: currentHumidity
      };
      await cache.put(cacheKey, new Response(JSON.stringify(alertData)));
    } else if (!isInAlertState && wasInAlertState) {
      // Alert cleared - send recovery notification
      const message = `✅ HUMIDITY RECOVERED: Level is now ${currentHumidity}% (back within safe range of ${HUMIDITY_MAX_LEVEL}%)\n\nLast reading: ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString()}`;
      
      await sendPushoverNotification(env, message, "💧 Humidity Level Normal");
      console.log(`Sent humidity recovery notification: ${currentHumidity}% <= ${HUMIDITY_MAX_LEVEL}%`);
      
      // Clear the alert state
      await cache.delete(cacheKey);
    } else if (isInAlertState) {
      console.log(`Humidity still in alert state: ${currentHumidity}% > ${HUMIDITY_MAX_LEVEL}% (notification already sent)`);
    } else {
      console.log('Humidity level is within safe range');
    }

  } catch (error) {
    console.error('Error checking humidity level:', error);
    await sendPushoverNotification(env, `Humidity level check failed: ${error.message}`, "Thermweb Monitor Error");
  }
}

async function handleProbeDetailsPage(env, probeId) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response('Authentication not configured', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Get probe data
    const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/probes/${probeId}`;
    const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch probe details: ${response.status}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const data = await response.json();
    
    // Generate HTML
    const html = generateProbeDetailsHTML(data, probeId);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

function generateProbeDetailsHTML(probeData, probeId) {
  const formattedJson = JSON.stringify(probeData, null, 2);
  
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Probe Details: ${probeData.name || probeId} - Spider Proxy</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        h1 {
            color: #333;
            margin: 0;
        }
        .back-btn {
            background-color: #666;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
        }
        .back-btn:hover {
            background-color: #555;
        }
        .probe-summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .summary-item {
            margin: 5px 0;
        }
        .summary-label {
            font-weight: 600;
            color: #555;
        }
        .json-section {
            margin-top: 20px;
        }
        .json-section h3 {
            color: #333;
            margin-bottom: 10px;
        }
        pre {
            background-color: #f1f3f4;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.4;
        }
        code {
            background-color: #f1f3f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${probeData.name || probeId}</h1>
            <a href="/probes" class="back-btn">← Back to Probes</a>
        </div>
        
        <div class="probe-summary">
            <div class="summary-item">
                <span class="summary-label">ID:</span> <code>${probeData.id}</code>
            </div>
            <div class="summary-item">
                <span class="summary-label">Type:</span> ${getProbeTypeLabel(probeData.probetype)}
            </div>
            ${probeData.value !== null && probeData.value !== undefined ? `
            <div class="summary-item">
                <span class="summary-label">Current Value:</span> ${formatProbeValue(probeData)}
            </div>
            ` : ''}
            <div class="summary-item">
                <span class="summary-label">Last Reading:</span> ${probeData.time_last || new Date(probeData.last * 1000).toLocaleString('en-US', {
                  timeZone: 'America/Puerto_Rico',
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit', 
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
            </div>
            <div class="summary-item">
                <span class="summary-label">Status:</span> ${probeData.seen ? '🟢 Active' : '🔴 Inactive'}
            </div>
        </div>
        
        <div class="json-section">
            <h3>Raw API Response</h3>
            <pre><code>${formattedJson}</code></pre>
        </div>
    </div>
</body>
</html>
  `;
}

async function getAlertStates() {
  const cache = caches.default;
  const alertStates = {};
  
  try {
    // Check freezer alert state
    const freezerCacheKey = new Request('https://alerts.cache/freezer-temp-alert');
    const freezerAlert = await cache.match(freezerCacheKey);
    if (freezerAlert) {
      try {
        const cachedText = await freezerAlert.text();
        if (cachedText === 'true') {
          alertStates.freezerAlert = { active: true, startTime: null };
        } else {
          alertStates.freezerAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.freezerAlert = { active: false };
      }
    } else {
      alertStates.freezerAlert = { active: false };
    }
    
    // Check humidity alert state
    const humidityCacheKey = new Request('https://alerts.cache/humidity-level-alert');
    const humidityAlert = await cache.match(humidityCacheKey);
    if (humidityAlert) {
      try {
        const cachedText = await humidityAlert.text();
        if (cachedText === 'true') {
          alertStates.humidityAlert = { active: true, startTime: null };
        } else {
          alertStates.humidityAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.humidityAlert = { active: false };
      }
    } else {
      alertStates.humidityAlert = { active: false };
    }
  } catch (error) {
    console.error('Error getting alert states:', error);
    alertStates.freezerAlert = { active: false };
    alertStates.humidityAlert = { active: false };
  }
  
  return alertStates;
}

function generateAlertsSection(probes, alertStates = {}) {
  const alerts = [];
  
  // Check freezer temperature
  const freezerProbe = probes.find(p => p.id === FREEZER_PROBE_ID);
  if (freezerProbe && freezerProbe.value !== null && freezerProbe.value !== undefined) {
    const isOverLimit = freezerProbe.value > FREEZER_MAX_TEMP;
    const alertState = alertStates.freezerAlert || { active: false };
    
    let alertType = 'ok';
    let message = `Freezer temperature: ${freezerProbe.value}°F (limit: ${FREEZER_MAX_TEMP}°F)`;
    
    if (isOverLimit) {
      alertType = 'error';
      message = `Freezer temperature: ${freezerProbe.value}°F (above ${FREEZER_MAX_TEMP}°F limit)`;
      
      if (alertState.active && alertState.startTime) {
        const duration = Math.floor((Date.now() - alertState.startTime) / (1000 * 60)); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (alertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '🧊',
      message: message,
      probe: freezerProbe.name || 'Freezer Temp'
    });
  }
  
  // Check humidity level  
  const humidityProbe = probes.find(p => p.id === HUMIDITY_PROBE_ID);
  if (humidityProbe && humidityProbe.value !== null && humidityProbe.value !== undefined) {
    const isOverLimit = humidityProbe.value > HUMIDITY_MAX_LEVEL;
    const alertState = alertStates.humidityAlert || { active: false };
    
    let alertType = 'ok';
    let message = `Humidity level: ${humidityProbe.value}% (limit: ${HUMIDITY_MAX_LEVEL}%)`;
    
    if (isOverLimit) {
      alertType = 'error';
      message = `Humidity level: ${humidityProbe.value}% (above ${HUMIDITY_MAX_LEVEL}% limit)`;
      
      if (alertState.active && alertState.startTime) {
        const duration = Math.floor((Date.now() - alertState.startTime) / (1000 * 60)); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (alertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '💧',
      message: message,
      probe: humidityProbe.name || 'Built in humidity'
    });
  }
  
  const hasAlerts = alerts.some(alert => alert.type === 'error');
  const sectionClass = hasAlerts ? 'alerts-section' : 'alerts-section no-alerts';
  const title = hasAlerts ? '⚠️ Active Alerts' : '✅ All Systems Normal';
  
  const alertItems = alerts.map(alert => {
    const alertClass = alert.type === 'error' ? 'alert-item' : 'alert-item ok';
    return `<div class="${alertClass}">${alert.icon} ${alert.message}</div>`;
  }).join('');
  
  return `
    <div class="${sectionClass}">
      <h3>${title}</h3>
      ${alertItems}
    </div>
  `;
}

function getProbeTypeLabel(probetype) {
  const labels = {
    'tf': 'Temperature',
    'rh': 'Humidity',
    '': 'Other'
  };
  return labels[probetype] || probetype || 'Unknown';
}

function formatProbeValue(probeData) {
  if (probeData.value === null || probeData.value === undefined) {
    return '—';
  }
  
  if (probeData.probetype === 'tf') {
    const celsius = (probeData.value - 32) * 5/9;
    return `${probeData.value}°F (${celsius.toFixed(1)}°C)`;
  } else if (probeData.probetype === 'rh') {
    return `${probeData.value}%`;
  } else {
    return probeData.value.toString();
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          },
        });
      }
      
      const url = new URL(request.url);
      
      // Handle /api/devices endpoint
      if (url.pathname === '/api/devices') {
        return handleDevicesAPI(env);
      }
      
      // Handle /api/probes endpoint
      if (url.pathname === '/api/probes') {
        return handleProbesAPI(env);
      }
      
      // Handle /api/probes/{probe_id} endpoint
      if (url.pathname.startsWith('/api/probes/') && url.pathname.length > '/api/probes/'.length) {
        const probeId = url.pathname.slice('/api/probes/'.length);
        return handleProbeValueAPI(env, probeId);
      }
      
      // Handle /probes page
      if (url.pathname === '/probes') {
        return handleProbesPage(env);
      }
      
      // Handle /probes/{probe_id}/details page
      if (url.pathname.startsWith('/probes/') && url.pathname.endsWith('/details')) {
        const probeId = url.pathname.slice('/probes/'.length, -'/details'.length);
        return handleProbeDetailsPage(env, probeId);
      }
      
      const targetUrl = new URL(url.pathname + url.search, TARGET_URL);
      
      
      // Create cache key
      const cacheKey = new Request(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
      });
      
      // Check cache first
      const cache = caches.default;
      let response = await cache.match(cacheKey);
      
      if (!response) {
        // Forward request to target
        const modifiedRequest = new Request(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
        });
        
        response = await fetch(modifiedRequest);
        
        // Cache successful responses
        if (response.ok && request.method === 'GET') {
          const responseToCache = response.clone();
          const cacheHeaders = new Headers(responseToCache.headers);
          cacheHeaders.set('Cache-Control', `max-age=${CACHE_TTL}`);
          
          const responseForCache = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: cacheHeaders,
          });
          
          ctx.waitUntil(cache.put(cacheKey, responseForCache));
        }
      }
      
      // Create new response with CORS headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Rewrite redirect location headers to point to proxy instead of original server
      if (newHeaders.has('location')) {
        const location = newHeaders.get('location');
        if (location.startsWith(TARGET_URL)) {
          const newLocation = location.replace(TARGET_URL, `${url.protocol}//${url.host}`);
          newHeaders.set('location', newLocation);
        }
      }
      
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
      
      return newResponse;
      
    } catch (error) {
      return new Response(`Proxy error: ${error.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
  },

  async scheduled(event, env, ctx) {
    console.log('Cron trigger fired:', event.cron);
    ctx.waitUntil(checkDeviceHealth(env));
  },
};