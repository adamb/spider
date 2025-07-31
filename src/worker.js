const TARGET_URL = 'http://lab.spiderplant.com';
const CACHE_TTL = 300; // 5 minutes

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
      const targetUrl = new URL(url.pathname + url.search, TARGET_URL);
      
      console.log(`Proxy request: ${request.url} -> ${targetUrl.toString()}`);
      console.log(`Request headers:`, Object.fromEntries(request.headers));
      console.log(`User-Agent:`, request.headers.get('User-Agent'));
      
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
          console.log(`Rewriting redirect: ${location} -> ${newLocation}`);
        }
      }
      
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
      
      return newResponse;
      
    } catch (error) {
      console.error('Proxy error:', error);
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
};