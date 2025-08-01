export const TARGET_URL = 'http://lab.spiderplant.com';
export const CACHE_TTL = 300; // 5 minutes
export const DEVICE_TIMEOUT = 15 * 60; // 15 minutes - consider device offline if no report
export const FREEZER_PROBE_ID = '4c7525046c96-101252130008001E';
export const HUMIDITY_PROBE_ID = '4c7525046c96-0e76b286d29e_rh';

// Default threshold values (used as fallbacks)
export const DEFAULT_THRESHOLDS = {
  FREEZER_MAX_TEMP: -5, // Maximum safe freezer temperature in Celsius
  HUMIDITY_MAX_LEVEL: 55, // Maximum safe humidity percentage
  DEVICE_TIMEOUT: 15 * 60 // 15 minutes in seconds
};