import { TARGET_URL } from '../lib/constants.js';

export async function handleDevicesAPI(env) {
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

export async function handleProbesAPI(env) {
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

export async function handleSingleProbeAPI(env, probeId) {
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