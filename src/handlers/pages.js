import { TARGET_URL, DEPTH_PROBE_ID } from '../lib/constants.js';
import { getThresholds } from '../lib/thresholds.js';
import { getAlertStates, generateAlertsSection } from '../monitoring/alerts.js';
import { getProbeTypeLabel, formatProbeValue, formatTimestamp, formatTimeAgo } from '../utils/formatters.js';

export async function handleProbesPage(env) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response('Missing authentication configuration', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Get probes data using internal API
    const { handleProbesAPI } = await import('./api.js');
    const response = await handleProbesAPI(env);

    if (!response.ok) {
      return new Response(`API request failed with status ${response.status}`, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const data = await response.json();
    
    // Fetch individual probe values using internal API
    const { handleSingleProbeAPI } = await import('./api.js');
    const probesWithValues = await Promise.all(
      (data.probes || []).map(async (probe) => {
        try {
          const probeResponse = await handleSingleProbeAPI(env, probe.id);
          
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
    
    // Get device data for real-time device status using internal API
    const { handleDevicesAPI } = await import('./api.js');
    let devicesData = null;
    try {
      const devicesResponse = await handleDevicesAPI(env);
      
      if (devicesResponse.ok) {
        devicesData = await devicesResponse.json();
      }
    } catch (error) {
      console.error('Failed to fetch devices data:', error);
    }
    
    // Get alert states from cache
    const alertStates = await getAlertStates();
    
    // Get thresholds
    const thresholds = await getThresholds(env);
    
    // Generate HTML
    const html = generateProbesHTML(probesWithValues, env, alertStates, thresholds, devicesData);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    return new Response(`Internal error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

export async function handleAdminPage(env, request) {
  try {
    const url = new URL(request.url);
    
    // Handle manual health check trigger
    if (url.searchParams.get('trigger') === 'health') {
      try {
        console.log('Manual health check triggered from admin page');
        const { checkDeviceHealth } = await import('../monitoring/health.js');
        await checkDeviceHealth(env);
        console.log('Manual health check completed');
        
        // For debugging: show what happened instead of redirecting
        if (url.searchParams.get('debug') === '1') {
          const cache = caches.default;
          
          // Test all cache keys
          const testKeys = [
            'https://alerts.cache/device-offline-4c7525046c96',
            'https://alerts.cache/device-offline-44179312cc0f',
            'https://alerts.cache/freezer-temp-alert',
            'https://alerts.cache/humidity-level-alert'
          ];
          
          let debugInfo = 'Health check completed.\n\n';
          debugInfo += `Environment check:\n`;
          debugInfo += `- Has THERM_PORTAL_USER: ${!!env.THERM_PORTAL_USER}\n`;
          debugInfo += `- Has THERM_PORTAL_SESSION: ${!!env.THERM_PORTAL_SESSION}\n\n`;
          
          debugInfo += `Cache results:\n`;
          for (const key of testKeys) {
            const cacheKey = new Request(key);
            const cachedValue = await cache.match(cacheKey);
            const keyName = key.replace('https://alerts.cache/', '');
            
            if (cachedValue) {
              const text = await cachedValue.text();
              debugInfo += `- ${keyName}: ${text}\n`;
            } else {
              debugInfo += `- ${keyName}: No cache found\n`;
            }
          }
          
          // Test writing to cache directly
          try {
            const testData = { test: true, timestamp: Date.now() };
            const testCacheKey = new Request('https://alerts.cache/test-write');
            await cache.put(testCacheKey, new Response(JSON.stringify(testData)));
            
            // Try to read it back
            const readBack = await cache.match(testCacheKey);
            if (readBack) {
              const readText = await readBack.text();
              debugInfo += `\nDirect cache test: SUCCESS - ${readText}`;
            } else {
              debugInfo += `\nDirect cache test: FAILED - could not read back`;
            }
          } catch (error) {
            debugInfo += `\nDirect cache test: ERROR - ${error.message}`;
          }
          
          return new Response(debugInfo, {
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        
        // Redirect back to admin page to show updated cache
        return new Response('', {
          status: 302,
          headers: {
            'Location': '/admin?triggered=1',
          },
        });
      } catch (error) {
        console.error('Error in manual health check:', error);
        return new Response(`Health check failed: ${error.message}`, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain',
          },
        });
      }
    }
    
    const cache = caches.default;
    
    // Known alert cache keys
    const alertCacheKeys = [
      'https://alerts.cache/freezer-temp-alert',
      'https://alerts.cache/humidity-level-alert',
      'https://alerts.cache/device-offline-4c7525046c96',
      'https://alerts.cache/device-offline-44179312cc0f'
    ];
    
    // Fetch all cache values
    const cacheData = {};
    for (const key of alertCacheKeys) {
      const cacheKey = new Request(key);
      const cachedValue = await cache.match(cacheKey);
      
      if (cachedValue) {
        try {
          const text = await cachedValue.text();
          // Try to parse as JSON, fallback to raw text
          try {
            cacheData[key] = JSON.parse(text);
          } catch {
            cacheData[key] = text;
          }
        } catch (error) {
          cacheData[key] = `Error reading cache: ${error.message}`;
        }
      } else {
        cacheData[key] = null;
      }
    }
    
    const triggered = url.searchParams.get('triggered') === '1';
    const html = generateAdminHTML(cacheData, triggered);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    return new Response(`Admin error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

export async function handleDebugPage(env) {
  try {
    const debugInfo = {
      hasCredentials: {
        user: !!env.THERM_PORTAL_USER,
        session: !!env.THERM_PORTAL_SESSION,
        pushoverToken: !!env.PUSHOVER_TOKEN,
        pushoverUser: !!env.PUSHOVER_USER
      },
      credentialLengths: {
        user: env.THERM_PORTAL_USER?.length || 0,
        session: env.THERM_PORTAL_SESSION?.length || 0
      }
    };

    // Test API call
    if (env.THERM_PORTAL_USER && env.THERM_PORTAL_SESSION) {
      try {
        const { TARGET_URL } = await import('../lib/constants.js');
        const apiUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/devices`;
        const cookieHeader = `THERM_PORTAL_USER=${env.THERM_PORTAL_USER}; THERM_PORTAL_SESSION=${env.THERM_PORTAL_SESSION}`;

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Cookie': cookieHeader,
            'User-Agent': 'spider-proxy/1.0-debug',
          },
        });

        debugInfo.apiTest = {
          status: response.status,
          ok: response.ok,
          url: apiUrl
        };

        if (response.ok) {
          const data = await response.json();
          debugInfo.deviceCount = Object.keys(data.devices || {}).length;
          debugInfo.devices = data.devices;
        } else {
          debugInfo.apiError = await response.text();
        }
      } catch (error) {
        debugInfo.apiError = error.message;
      }
    }

    return new Response(`<pre>${JSON.stringify(debugInfo, null, 2)}</pre>`, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    return new Response(`Debug error: ${error.message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function handleSingleProbePage(env, probeId) {
  try {
    // Check for required environment variables
    if (!env.THERM_PORTAL_USER || !env.THERM_PORTAL_SESSION) {
      return new Response('Missing authentication configuration', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
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
      return new Response(`API request failed with status ${response.status}`, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const probeData = await response.json();
    
    // Generate HTML
    const html = generateSingleProbeHTML(probeData, probeId);
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    return new Response(`Internal error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

function generateTankGauge(probes) {
  // Find the depth sensor
  const depthProbe = probes.find(p => p.id === DEPTH_PROBE_ID);
  
  if (!depthProbe || depthProbe.value === null || depthProbe.value === undefined) {
    return ''; // Don't show gauge if no depth data
  }
  
  // Tank parameters: 0.1 = full, 1.52 = empty
  const fullLevel = 0.1;
  const emptyLevel = 1.52;
  const currentDepth = depthProbe.value;
  
  // Calculate tank level percentage (0-100)
  const tankLevel = Math.max(0, Math.min(100, 
    ((emptyLevel - currentDepth) / (emptyLevel - fullLevel)) * 100
  ));
  
  // Determine color based on level
  let gaugeColor = '#28a745'; // Green for good levels
  if (tankLevel < 25) {
    gaugeColor = '#dc3545'; // Red for low levels
  } else if (tankLevel < 50) {
    gaugeColor = '#fd7e14'; // Orange for medium-low levels
  } else if (tankLevel < 75) {
    gaugeColor = '#ffc107'; // Yellow for medium levels
  }
  
  const timestamp = formatTimestamp(depthProbe.last);
  
  return `
    <div class="tank-gauge-section">
      <h3>🛢️ Tank Level Monitor</h3>
      <div class="gauge-container">
        <div class="gauge-info">
          <div class="gauge-label">Tank Level</div>
          <div class="gauge-value">${tankLevel.toFixed(1)}%</div>
          <div class="gauge-reading">Depth: ${currentDepth}</div>
          <div class="gauge-timestamp">Last updated: ${timestamp}</div>
        </div>
        <div class="gauge-visual">
          <div class="gauge-tank">
            <div class="gauge-fill" style="height: ${tankLevel}%; background-color: ${gaugeColor};"></div>
            <div class="gauge-markers">
              <div class="gauge-marker" style="bottom: 75%;"><span>75%</span></div>
              <div class="gauge-marker" style="bottom: 50%;"><span>50%</span></div>
              <div class="gauge-marker" style="bottom: 25%;"><span>25%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateProbesHTML(probes, env, alertStates, thresholds, devicesData) {
  // Generate alerts section
  const alertsSection = generateAlertsSection(probes, alertStates, thresholds, devicesData);
  
  // Generate tank gauge
  const tankGauge = generateTankGauge(probes);
  
  // Group probes by device ID (first part of probe ID before the first hyphen)
  const deviceGroups = {};
  probes.forEach(probe => {
    const deviceId = probe.id.split('-')[0];
    if (!deviceGroups[deviceId]) {
      deviceGroups[deviceId] = [];
    }
    deviceGroups[deviceId].push(probe);
  });

  // Generate device sections
  const deviceSections = Object.entries(deviceGroups).map(([deviceId, deviceProbes]) => {
    const deviceName = getDeviceName(deviceId);
    const probeRows = deviceProbes.map(probe => {
      const formattedValue = formatProbeValue(probe);
      const timestamp = formatTimestamp(probe.last);
      
      // Calculate age of last reading
      const currentTime = Math.floor(Date.now() / 1000);
      const ageInMinutes = Math.floor((currentTime - probe.last) / 60);
      const isActive = ageInMinutes <= 15;
      
      // Format timestamp with inactive time if applicable
      let timestampDisplay = timestamp;
      if (!isActive) {
        timestampDisplay += ` (${formatTimeAgo(ageInMinutes)} ago)`;
      }
      
      return `
        <tr>
          <td><a href="/probes/${probe.id}" class="probe-link">${probe.name || 'Unnamed'}</a></td>
          <td>${getProbeTypeLabel(probe.probetype)}</td>
          <td>${formattedValue}</td>
          <td>${timestampDisplay}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="device-section">
        <h3>${deviceName} <span class="device-id">(${deviceId})</span></h3>
        <table>
          <thead>
            <tr>
              <th>Probe Name</th>
              <th>Type</th>
              <th>Current Value</th>
              <th>Last Reading</th>
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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thermweb Probes</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2c5282;
            margin-bottom: 10px;
            font-size: 2em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background-color: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
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
        .refresh-btn, .fdm-btn, .fdm-tanks-btn {
            background-color: #1976d2;
            color: white;
            border: none;
            padding: 8px 16px;
            margin-left: 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        .refresh-btn:hover, .fdm-btn:hover, .fdm-tanks-btn:hover {
            background-color: #1565c0;
        }
        .refresh-btn {
            margin-left: 0;
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
        .tank-gauge-section {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .tank-gauge-section h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #2c5282;
            font-size: 1.1em;
        }
        .gauge-container {
            display: flex;
            align-items: center;
            gap: 30px;
        }
        .gauge-info {
            flex: 1;
        }
        .gauge-label {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        .gauge-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #2c5282;
            margin-bottom: 5px;
        }
        .gauge-reading {
            font-size: 1em;
            color: #666;
            margin-bottom: 5px;
        }
        .gauge-timestamp {
            font-size: 0.9em;
            color: #999;
        }
        .gauge-visual {
            flex: 0 0 auto;
        }
        .gauge-tank {
            width: 80px;
            height: 200px;
            border: 3px solid #333;
            border-radius: 0 0 10px 10px;
            background-color: #f8f9fa;
            position: relative;
            overflow: hidden;
        }
        .gauge-fill {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            transition: height 0.3s ease, background-color 0.3s ease;
            border-radius: 0 0 7px 7px;
        }
        .gauge-markers {
            position: absolute;
            left: -40px;
            top: 0;
            bottom: 0;
            width: 40px;
        }
        .gauge-marker {
            position: absolute;
            right: 0;
            width: 20px;
            height: 1px;
            background-color: #666;
        }
        .gauge-marker span {
            position: absolute;
            right: 25px;
            top: -8px;
            font-size: 0.8em;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thermweb Probes</h1>
            <div>
                <button class="refresh-btn" onclick="location.reload()">Refresh</button>
                <button class="fdm-btn" onclick="location.href='/tw/open.html?viewname=FDM'">FDM Graph</button>
                <button class="fdm-tanks-btn" onclick="location.href='/tw/open.html?viewname=FDMTanks'">FDM Tanks</button>
            </div>
        </div>
        
        <p>Total probes: <strong>${probes.length}</strong></p>
        
        ${alertsSection}
        
        ${tankGauge}
        
        ${deviceSections}
    </div>
</body>
</html>
  `;
}

function generateSingleProbeHTML(probeData, probeId) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Probe ${probeId}</title>
    <style>
        body {
            font-family: 'Monaco', 'Menlo', monospace;
            margin: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
        }
        h1 {
            font-size: 1.2em;
            color: #333;
        }
        .back-btn {
            background: #007bff;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.9em;
        }
        pre {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
            overflow-x: auto;
            font-size: 14px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Probe: ${probeId}</h1>
            <a href="/probes" class="back-btn">← Back</a>
        </div>
        
        <pre>${JSON.stringify(probeData, null, 2)}</pre>
    </div>
</body>
</html>
  `;
}


function generateAdminHTML(cacheData, triggered = false) {
  const cacheEntries = Object.entries(cacheData).map(([key, value]) => {
    const keyName = key.replace('https://alerts.cache/', '');
    let displayValue;
    let status;
    
    if (value === null) {
      displayValue = '<em>No cache entry</em>';
      status = 'inactive';
    } else if (typeof value === 'object') {
      displayValue = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
      status = value.active ? 'active' : 'inactive';
    } else {
      displayValue = `<code>${value}</code>`;
      status = value === 'true' ? 'active' : 'inactive';
    }
    
    return `
      <tr class="${status}">
        <td><code>${keyName}</code></td>
        <td>${displayValue}</td>
        <td><span class="status-badge status-${status}">${status === 'active' ? '🔴 Active' : '🟢 Clear'}</span></td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Alert Cache Status</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f8f9fa;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #e9ecef;
        }
        h1 {
            color: #2c5282;
            margin: 0;
        }
        .nav-btn {
            background: #007bff;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.9em;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        tr.active {
            background: #fff5f5;
        }
        tr.inactive {
            background: #f0fff4;
        }
        .status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .status-active {
            background: #f8d7da;
            color: #721c24;
        }
        .status-inactive {
            background: #d4edda;
            color: #155724;
        }
        pre {
            margin: 0;
            font-size: 0.8em;
            background: #f8f9fa;
            padding: 8px;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }
        code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', monospace;
            font-size: 0.9em;
        }
        .timestamp {
            font-size: 0.9em;
            color: #6c757d;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Admin - Alert Cache Status</h1>
            <a href="/probes" class="nav-btn">← Back to Probes</a>
        </div>
        
        <div class="timestamp">
            Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/Halifax' })} AST
            ${triggered ? '<span style="color: #28a745; font-weight: bold;"> (Health check triggered manually)</span>' : ''}
        </div>
        
        <div style="margin-bottom: 20px;">
            <a href="/admin?trigger=health" class="nav-btn" style="background: #28a745;">🔍 Trigger Health Check</a>
            <span style="margin-left: 10px; font-size: 0.9em; color: #6c757d;">
                Note: Cloudflare cache persists across deployments, but cron jobs may take time to populate cache data.
            </span>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Cache Key</th>
                    <th>Cached Value</th>
                    <th>Alert Status</th>
                </tr>
            </thead>
            <tbody>
                ${cacheEntries}
            </tbody>
        </table>
    </div>
</body>
</html>
  `;
}

function getDeviceName(deviceId) {
  const deviceNames = {
    '4c7525046c96': 'Storage',
    '44179312cc0f': 'Tanks'
  };
  return deviceNames[deviceId] || `Device ${deviceId}`;
}