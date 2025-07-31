const TARGET_URL = 'http://lab.spiderplant.com';
const CACHE_TTL = 300; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const targetUrl = new URL(url.pathname + url.search, TARGET_URL);
      
      console.log(`Proxy request: ${request.url} -> ${targetUrl.toString()}`);
      
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
          const responseToCache = new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: {
              ...Object.fromEntries(response.headers),
              'Cache-Control': `max-age=${CACHE_TTL}`,
            },
          });
          ctx.waitUntil(cache.put(cacheKey, responseToCache));
        }
      }
      
      // Create new response with CORS headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
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
        },
      });
    }
  },
};