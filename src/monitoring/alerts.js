import { FREEZER_PROBE_ID, HUMIDITY_PROBE_ID, DEFAULT_THRESHOLDS } from '../lib/constants.js';

export async function getAlertStates() {
  const cache = caches.default;
  const alertStates = {};
  
  try {
    // Check freezer alert state
    const freezerCacheKey = new Request('https://alerts.cache/freezer-temp-alert');
    const freezerAlert = await cache.match(freezerCacheKey);
    if (freezerAlert) {
      try {
        const cachedText = await freezerAlert.text();
        if (cachedText === 'true') {
          alertStates.freezerAlert = { active: true, startTime: null };
        } else {
          alertStates.freezerAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.freezerAlert = { active: false };
      }
    } else {
      alertStates.freezerAlert = { active: false };
    }
    
    // Check humidity alert state
    const humidityCacheKey = new Request('https://alerts.cache/humidity-level-alert');
    const humidityAlert = await cache.match(humidityCacheKey);
    if (humidityAlert) {
      try {
        const cachedText = await humidityAlert.text();
        if (cachedText === 'true') {
          alertStates.humidityAlert = { active: true, startTime: null };
        } else {
          alertStates.humidityAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.humidityAlert = { active: false };
      }
    } else {
      alertStates.humidityAlert = { active: false };
    }
    
    // Check device offline alert states
    alertStates.deviceOffline = {};
    
    // Check for known device IDs (Storage and Tanks)
    const knownDevices = ['4c7525046c96', '44179312cc0f'];
    
    for (const deviceId of knownDevices) {
      const deviceCacheKey = new Request(`https://alerts.cache/device-offline-${deviceId}`);
      const deviceAlert = await cache.match(deviceCacheKey);
      
      if (deviceAlert) {
        try {
          const cachedText = await deviceAlert.text();
          if (cachedText === 'true') {
            alertStates.deviceOffline[deviceId] = { active: true, startTime: null };
          } else {
            alertStates.deviceOffline[deviceId] = JSON.parse(cachedText);
          }
        } catch (error) {
          alertStates.deviceOffline[deviceId] = { active: false };
        }
      } else {
        alertStates.deviceOffline[deviceId] = { active: false };
      }
    }
    
  } catch (error) {
    console.error('Error getting alert states:', error);
    alertStates.freezerAlert = { active: false };
    alertStates.humidityAlert = { active: false };
    alertStates.deviceOffline = {};
  }
  
  return alertStates;
}

export function generateAlertsSection(probes, alertStates = {}, thresholds = DEFAULT_THRESHOLDS) {
  const alerts = [];
  
  // Check freezer temperature
  const freezerProbe = probes.find(p => p.id === FREEZER_PROBE_ID);
  if (freezerProbe && freezerProbe.value !== null && freezerProbe.value !== undefined) {
    const tempC = freezerProbe.value; // Raw value is in Celsius
    const tempF = (tempC * 9/5) + 32; // Convert to Fahrenheit for display
    const thresholdF = (thresholds.FREEZER_MAX_TEMP * 9/5) + 32; // Convert threshold to F for display
    const isOverLimit = tempC > thresholds.FREEZER_MAX_TEMP; // Compare in Celsius
    const alertState = alertStates.freezerAlert || { active: false };
    
    let alertType = 'ok';
    let message = `Freezer temperature: ${tempC}°C (${tempF.toFixed(1)}°F, limit: ${thresholds.FREEZER_MAX_TEMP}°C/${thresholdF.toFixed(1)}°F)`;
    
    if (isOverLimit) {
      alertType = 'error';
      message = `Freezer temperature: ${tempC}°C (${tempF.toFixed(1)}°F) - above ${thresholds.FREEZER_MAX_TEMP}°C limit`;
      
      if (alertState.active && alertState.startTime) {
        const duration = Math.floor((Date.now() - alertState.startTime) / (1000 * 60)); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (alertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '🧊',
      message: message,
      probe: freezerProbe.name || 'Freezer Temp'
    });
  }
  
  // Check humidity level  
  const humidityProbe = probes.find(p => p.id === HUMIDITY_PROBE_ID);
  if (humidityProbe && humidityProbe.value !== null && humidityProbe.value !== undefined) {
    const isOverLimit = humidityProbe.value > thresholds.HUMIDITY_MAX_LEVEL;
    const alertState = alertStates.humidityAlert || { active: false };
    
    let alertType = 'ok';
    let message = `Humidity level: ${humidityProbe.value}% (limit: ${thresholds.HUMIDITY_MAX_LEVEL}%)`;
    
    if (isOverLimit) {
      alertType = 'error';
      message = `Humidity level: ${humidityProbe.value}% (above ${thresholds.HUMIDITY_MAX_LEVEL}% limit)`;
      
      if (alertState.active && alertState.startTime) {
        const duration = Math.floor((Date.now() - alertState.startTime) / (1000 * 60)); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (alertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '💧',
      message: message,
      probe: humidityProbe.name || 'Built in humidity'
    });
  }
  
  // Check device offline states
  const deviceOfflineStates = alertStates.deviceOffline || {};
  const deviceNames = {
    '4c7525046c96': 'Storage',
    '44179312cc0f': 'Tanks'
  };
  
  for (const [deviceId, deviceName] of Object.entries(deviceNames)) {
    const alertState = deviceOfflineStates[deviceId] || { active: false };
    
    let alertType = 'ok';
    let message = `${deviceName} device: Online`;
    
    if (alertState.active) {
      alertType = 'error';
      message = `${deviceName} device: Offline`;
      
      if (alertState.startTime) {
        const duration = Math.floor((Date.now() - alertState.startTime) / (1000 * 60)); // minutes
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 OFFLINE: ${durationText}`;
      } else {
        message += ' 🚨 OFFLINE';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '📡',
      message: message,
      probe: `${deviceName} Device`
    });
  }
  
  const hasAlerts = alerts.some(alert => alert.type === 'error');
  const sectionClass = hasAlerts ? 'alerts-section' : 'alerts-section no-alerts';
  const title = hasAlerts ? '⚠️ Active Alerts' : '✅ All Systems Normal';
  
  const alertItems = alerts.map(alert => {
    const alertClass = alert.type === 'error' ? 'alert-item' : 'alert-item ok';
    return `<div class="${alertClass}">${alert.icon} ${alert.message}</div>`;
  }).join('');
  
  return `
    <div class="${sectionClass}">
      <h3>${title}</h3>
      ${alertItems}
    </div>
  `;
}