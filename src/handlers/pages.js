import { TARGET_URL } from '../lib/constants.js';
import { getThresholds } from '../lib/thresholds.js';
import { getAlertStates, generateAlertsSection } from '../monitoring/alerts.js';
import { getProbeTypeLabel, formatProbeValue, formatTimestamp } from '../utils/formatters.js';

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
      return new Response(`API request failed with status ${response.status}`, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
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
    
    // Get device data for real-time device status
    const devicesUrl = `${TARGET_URL}/api/tw-api.cgi?path=/v1/users/${env.THERM_PORTAL_USER}/devices`;
    const devicesResponse = await fetch(devicesUrl, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'User-Agent': 'spider-proxy/1.0',
      },
    });
    
    let devicesData = null;
    if (devicesResponse.ok) {
      devicesData = await devicesResponse.json();
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

function generateProbesHTML(probes, env, alertStates, thresholds, devicesData) {
  // Generate alerts section
  const alertsSection = generateAlertsSection(probes, alertStates, thresholds, devicesData);
  
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
      const statusIcon = isActive ? '🟢' : '🔴';
      const statusText = isActive ? 'Active' : `Inactive (${ageInMinutes}min ago)`;
      
      return `
        <tr>
          <td><a href="/api/probes/${probe.id}" class="probe-link">${probe.name || 'Unnamed'}</a></td>
          <td>${getProbeTypeLabel(probe.probetype)}</td>
          <td>${formattedValue}</td>
          <td>${timestamp}</td>
          <td>${statusIcon} ${statusText}</td>
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
              <th>Status</th>
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

function generateSingleProbeHTML(probeData, probeId) {
  const formattedJson = JSON.stringify(probeData, null, 2);
  
  // Calculate age of last reading
  const currentTime = Math.floor(Date.now() / 1000);
  const ageInMinutes = Math.floor((currentTime - probeData.last) / 60);
  const isActive = ageInMinutes <= 15;
  const statusIcon = isActive ? '🟢' : '🔴';
  const statusText = isActive ? 'Active' : `Inactive (${ageInMinutes}min ago)`;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${probeData.name || probeId} - Probe Details</title>
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
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2c5282;
            margin-bottom: 20px;
            font-size: 2em;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }
        .back-btn {
            background-color: #6c757d;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            text-decoration: none;
            font-size: 0.9em;
        }
        .back-btn:hover {
            background-color: #5a6268;
            text-decoration: none;
        }
        .probe-summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }
        .summary-item {
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .summary-label {
            font-weight: 600;
            min-width: 140px;
            color: #495057;
        }
        code {
            background-color: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
        }
        .json-section {
            margin-top: 30px;
        }
        .json-section h3 {
            color: #495057;
            margin-bottom: 15px;
        }
        pre {
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            line-height: 1.4;
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
                <span class="summary-label">Last Reading:</span> ${probeData.time_last || formatTimestamp(probeData.last)}
            </div>
            <div class="summary-item">
                <span class="summary-label">Status:</span> ${statusIcon} ${statusText}
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

function getDeviceName(deviceId) {
  const deviceNames = {
    '4c7525046c96': 'Storage',
    '44179312cc0f': 'Tanks'
  };
  return deviceNames[deviceId] || `Device ${deviceId}`;
}