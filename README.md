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

### Web Proxy
Replace `http://lab.spiderplant.com` with `https://spider.dev.pr` in any URL:

- Original: `http://lab.spiderplant.com/tw/open.html?viewname=FDM`
- Proxied: `https://spider.dev.pr/tw/open.html?viewname=FDM`

### API Endpoints
The proxy provides authenticated API endpoints that automatically handle authentication:

#### Get Devices
```bash
curl https://spider.dev.pr/api/devices
```

Returns device information including last report timestamps:
```json
{
  "devices": {
    "4c7525046c96": {
      "id": "4c7525046c96", 
      "name": "Storage",
      "last": 1753992739
    },
    "44179312cc0f": {
      "id": "44179312cc0f",
      "name": "Tanks", 
      "last": 1753992707
    }
  }
}
```

#### Get Probes
```bash
curl https://spider.dev.pr/api/probes
```

Returns detailed sensor probe information:
```json
{
  "probes": [
    {
      "id": "44179312cc0f-0e3890a2d556_rh",
      "name": "Humidity",
      "probetype": "rh",
      "last": 1753993606,
      "seen": false
    },
    {
      "id": "4c7525046c96-101252130008001E",
      "name": "Freezer Temp",
      "probetype": "tf",
      "last": 1753993639,
      "seen": false
    }
  ]
}
```

**Field Definitions:**
- `last`: Unix timestamp of when the device/probe last reported data
- `probetype`: Sensor type ("rh" = humidity, "tf" = temperature, "" = other)
- `seen`: Boolean indicating if the probe is currently active/visible

## Technical Details

- **Platform**: Cloudflare Workers
- **Cache TTL**: 5 minutes for successful GET requests
- **CORS**: Enabled for all origins with standard headers
- **Redirects**: Automatically rewritten to maintain proxy domain
- **Authentication**: API endpoints use environment variables for secure credential storage

## Setup

### Environment Variables
The API endpoints require authentication credentials stored as Cloudflare Worker secrets:

```bash
wrangler secret put THERM_PORTAL_USER
wrangler secret put THERM_PORTAL_SESSION
```

These are stored securely and not included in the repository.

