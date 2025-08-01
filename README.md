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

#### Get Probe Value
```bash
curl https://spider.dev.pr/api/probes/4c7525046c96-101252130008001E
```

Returns current value and details for a specific probe:
```json
{
  "id": "4c7525046c96-101252130008001E",
  "name": "Freezer Temp",
  "probetype": "tf",
  "last": 1753993639,
  "seen": true,
  "time_last": "2025-07-31T16:27:19",
  "value": -18.44
}
```

**Field Definitions:**
- `last`: Unix timestamp of when the device/probe last reported data
- `probetype`: Sensor type ("rh" = humidity, "tf" = temperature, "" = other)
- `seen`: Boolean indicating if the probe is currently active/visible
- `time_last`: Human-readable timestamp of last reading (ISO format)
- `value`: Current sensor reading (temperature in Celsius, humidity %, etc.)

### Web Dashboard
Visit `https://spider.dev.pr/probes` for a real-time web dashboard that displays:

- **Probe Status**: All sensor probes grouped by device with current readings
- **Alert Monitoring**: Active alerts section showing:
  - 🧊 Freezer temperature alerts (threshold: -10°F)
  - 💧 Humidity level alerts (threshold: 55%)
  - 📡 Device offline alerts (timeout: 30 minutes)
- **Duration Tracking**: Shows how long alert conditions have been active
- **Timezone Support**: All timestamps displayed in Atlantic Standard Time (AST)

## Automated Monitoring

The system includes automated monitoring with Pushover notifications:

### Cron Schedule
- **Frequency**: Every 15 minutes
- **Checks**: Device health, freezer temperature, humidity levels

### Alert Types
1. **Device Offline**: Triggered when devices haven't reported for >30 minutes
   - `🔴 DEVICE OFFLINE: Storage (45min offline, last seen: ...)`
   - `✅ DEVICE RECOVERED: Storage is back online`

2. **Freezer Temperature**: Triggered when temperature exceeds -10°F
   - `🚨 FREEZER ALERT: Temperature is -8°F (above safe limit of -10°F)`
   - `✅ FREEZER RECOVERED: Temperature is now -12°F`

3. **Humidity Level**: Triggered when humidity exceeds 55%
   - `💧 HUMIDITY ALERT: Level is 58% (above safe limit of 55%)`
   - `✅ HUMIDITY RECOVERED: Level is now 52%`

### Smart Caching
- **Alert State Tracking**: Prevents notification spam by caching alert states
- **Duration Monitoring**: Tracks how long conditions have been in alert state
- **Recovery Notifications**: Sends alerts when conditions return to normal

## Technical Details

- **Platform**: Cloudflare Workers
- **Cache TTL**: 5 minutes for successful GET requests
- **CORS**: Enabled for all origins with standard headers
- **Redirects**: Automatically rewritten to maintain proxy domain
- **Authentication**: API endpoints use environment variables for secure credential storage
- **Alert Caching**: Uses Cloudflare Cache API for persistent alert state storage

## Setup

### Environment Variables
The system requires several credentials stored as Cloudflare Worker secrets:

#### API Authentication
```bash
wrangler secret put THERM_PORTAL_USER
wrangler secret put THERM_PORTAL_SESSION
```

#### Pushover Notifications
```bash
wrangler secret put PUSHOVER_TOKEN
wrangler secret put PUSHOVER_USER
```

All credentials are stored securely and not included in the repository.

### KV Storage Configuration

The system uses Cloudflare KV storage to manage configurable alert thresholds:

#### Creating the KV Namespace
```bash
# Create production KV namespace
wrangler kv namespace create "THRESHOLDS"

# Create preview KV namespace for development
wrangler kv namespace create "THRESHOLDS" --preview
```

Update the KV namespace IDs in `wrangler.toml` with the values returned from the commands above.

**Note**: The KV namespace has already been created and configured for this project.

#### Setting Thresholds
You can adjust alert thresholds without code changes by updating KV values:

```bash
# Set freezer temperature threshold (Celsius)
wrangler kv key put --binding=THRESHOLDS "FREEZER_MAX_TEMP" "-5" --preview false

# Set humidity level threshold (percentage)
wrangler kv key put --binding=THRESHOLDS "HUMIDITY_MAX_LEVEL" "55" --preview false

# Set device offline timeout (seconds)
wrangler kv key put --binding=THRESHOLDS "DEVICE_TIMEOUT" "1800" --preview false
```

#### Viewing Current Thresholds
```bash
# List all threshold keys
wrangler kv key list --binding=THRESHOLDS --preview false

# Get a specific threshold value
wrangler kv key get --binding=THRESHOLDS "FREEZER_MAX_TEMP" --preview false
```

#### Current Configuration
The following thresholds are currently configured in KV storage:
- **Freezer Temperature**: -5°C (23°F)
- **Humidity Level**: 55%
- **Device Timeout**: 1800 seconds (30 minutes)

#### How Threshold Changes Work

**Immediate Effects:**
- Dashboard alerts update instantly when you change KV thresholds
- Alert conditions are evaluated in real-time using current KV values

**Delayed Effects (Cron-based):**
- **Pushover notifications**: Sent when cron job detects new alert conditions (every 15 minutes)
- **Duration tracking**: Starts when cron job caches a new alert state with timestamp
- **Recovery notifications**: Sent when cron job detects alert conditions have cleared

**Example Timeline:**
1. Change threshold from -10°C to -5°C via KV
2. Dashboard immediately shows alert (temperature now exceeds new threshold)
3. Wait up to 15 minutes for next cron execution
4. Cron detects new alert condition → sends Pushover → starts duration tracking
5. Dashboard now shows "🚨 ALERT: Xm" with elapsed time

#### Default Fallback Values
If KV values are not available, the system uses these built-in defaults:
- **Freezer Temperature**: -5°C (23°F)
- **Humidity Level**: 55%
- **Device Timeout**: 1800 seconds (30 minutes)

## Prerequisites

### Pushover Account
To receive monitoring alerts, you need a Pushover account:

1. Sign up at [pushover.net](https://pushover.net)
2. Create an application to get your API token
3. Note your user key from your account dashboard
4. Configure the `PUSHOVER_TOKEN` and `PUSHOVER_USER` environment variables (see Setup section above)

Without Pushover credentials, the monitoring system will log errors but continue functioning for web dashboard and API access.

## Contributing

### Development Workflow
1. Make changes to the code
2. Test locally if possible
3. Push to the `main` branch on GitHub
4. Cloudflare automatically deploys changes to https://spider.dev.pr

No manual deployment steps are required - the system uses GitHub integration for continuous deployment.

