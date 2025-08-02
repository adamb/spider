import { CACHE_TTL } from './lib/constants.js';
import { handleDevicesAPI, handleProbesAPI, handleSingleProbeAPI } from './handlers/api.js';
import { handleProbesPage, handleSingleProbePage, handleAdminPage, handleDebugPage } from './handlers/pages.js';
import { checkDeviceHealth } from './monitoring/health.js';

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // API endpoints
    if (url.pathname === '/api/devices') {
      return await handleDevicesAPI(env);
    }
    
    if (url.pathname === '/api/probes') {
      return await handleProbesAPI(env);
    }
    
    if (url.pathname.startsWith('/api/probes/')) {
      const probeId = url.pathname.substring('/api/probes/'.length);
      return await handleSingleProbeAPI(env, probeId);
    }

    // Web pages
    if (url.pathname === '/probes') {
      return await handleProbesPage(env);
    }
    
    if (url.pathname.startsWith('/probes/')) {
      const probeId = url.pathname.substring('/probes/'.length);
      return await handleSingleProbePage(env, probeId);
    }

    // Admin page
    if (url.pathname === '/admin') {
      return await handleAdminPage(env, request);
    }

    // Debug endpoint
    if (url.pathname === '/debug') {
      return await handleDebugPage(env);
    }

    // Proxy all other requests
    return await handleProxyRequest(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    // Handle cron jobs
    await checkDeviceHealth(env);
  }
};

async function handleProxyRequest(request, env, ctx) {
  const url = new URL(request.url);
  const targetUrl = new URL(request.url);
  targetUrl.protocol = 'http:';
  targetUrl.host = 'lab.spiderplant.com';

  try {
    // Check cache for GET requests
    const cache = caches.default;
    let response;
    let cacheKey;
    
    if (request.method === 'GET') {
      cacheKey = new Request(targetUrl.toString(), request);
      response = await cache.match(cacheKey);
      if (response) {
        return response;
      }
    }

    // Forward the request
    const modifiedRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    response = await fetch(modifiedRequest);
    
    if (!response.ok) {
      return response;
    }

    // Clone response for potential caching
    const responseClone = response.clone();
    
    // Modify response headers for CORS
    const modifiedHeaders = new Headers(response.headers);
    modifiedHeaders.set('Access-Control-Allow-Origin', '*');
    modifiedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    modifiedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle redirects by rewriting location headers
    if (response.status >= 300 && response.status < 400) {
      const location = modifiedHeaders.get('location');
      if (location && location.includes('lab.spiderplant.com')) {
        const newLocation = location.replace('http://lab.spiderplant.com', `https://${url.host}`);
        modifiedHeaders.set('location', newLocation);
      }
    }

    const modifiedResponse = new Response(responseClone.body, {
      status: response.status,
      statusText: response.statusText,
      headers: modifiedHeaders,
    });

    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cacheHeaders = new Headers(modifiedResponse.headers);
      cacheHeaders.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
      
      const cacheResponse = new Response(modifiedResponse.body, {
        status: modifiedResponse.status,
        statusText: modifiedResponse.statusText,
        headers: cacheHeaders,
      });
      
      ctx.waitUntil(cache.put(cacheKey, cacheResponse.clone()));
      return cacheResponse;
    }

    return modifiedResponse;

  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}