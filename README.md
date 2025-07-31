# spider

An HTTPS proxy for http://lab.spiderplant.com using Cloudflare Workers.

## Overview

This project provides secure HTTPS access to the HTTP-only lab.spiderplant.com website by proxying requests through a Cloudflare Worker deployed at https://spider.dev.pr.

## How it works

1. **Request Processing**: The worker receives HTTPS requests at spider.dev.pr and forwards them to the corresponding HTTP URLs at lab.spiderplant.com
2. **Response Handling**: Returns responses over HTTPS with proper CORS headers for browser compatibility
3. **Redirect Rewriting**: Automatically rewrites redirect location headers to keep users within the HTTPS proxy domain
4. **Caching**: Implements 5-minute caching for GET requests to improve performance
5. **CORS Support**: Handles preflight OPTIONS requests and adds appropriate CORS headers

## Usage

Replace `http://lab.spiderplant.com` with `https://spider.dev.pr` in any URL:

- Original: `http://lab.spiderplant.com/tw/open.html?viewname=FDM`
- Proxied: `https://spider.dev.pr/tw/open.html?viewname=FDM`

## Technical Details

- **Platform**: Cloudflare Workers
- **Cache TTL**: 5 minutes for successful GET requests
- **CORS**: Enabled for all origins with standard headers
- **Redirects**: Automatically rewritten to maintain proxy domain

