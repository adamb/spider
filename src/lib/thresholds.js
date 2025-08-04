import { DEFAULT_THRESHOLDS } from './constants.js';

export async function getThresholds(env) {
  const thresholds = { ...DEFAULT_THRESHOLDS };
  
  try {
    if (env.THRESHOLDS) {
      // Try to get values from KV, fall back to defaults if not found
      const freezerTemp = await env.THRESHOLDS.get('FREEZER_MAX_TEMP');
      const humidityLevel = await env.THRESHOLDS.get('HUMIDITY_MAX_LEVEL');
      const depthLevel = await env.THRESHOLDS.get('DEPTH_MAX_LEVEL');
      const deviceTimeout = await env.THRESHOLDS.get('DEVICE_TIMEOUT');
      
      if (freezerTemp !== null) {
        thresholds.FREEZER_MAX_TEMP = parseFloat(freezerTemp);
      }
      if (humidityLevel !== null) {
        thresholds.HUMIDITY_MAX_LEVEL = parseFloat(humidityLevel);
      }
      if (depthLevel !== null) {
        thresholds.DEPTH_MAX_LEVEL = parseFloat(depthLevel);
      }
      if (deviceTimeout !== null) {
        thresholds.DEVICE_TIMEOUT = parseInt(deviceTimeout);
      }
    }
  } catch (error) {
    console.error('Error reading thresholds from KV:', error);
    // Will use default values
  }
  
  return thresholds;
}