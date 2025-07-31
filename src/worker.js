const TARGET_URL = 'http://lab.spiderplant.com';
const CACHE_TTL = 300; // 5 minutes
const DEVICE_TIMEOUT = 30 * 60; // 30 minutes - consider device offline if no report

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

  } catch (error) {
    console.error('Error in device health check:', error);
    await sendPushoverNotification(env, `Device health check failed: ${error.message}`, "Thermweb Monitor Error");
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