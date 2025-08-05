import { FREEZER_PROBE_ID, HUMIDITY_PROBE_ID, DEPTH_PROBE_ID, DEFAULT_THRESHOLDS } from '../lib/constants.js';

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
    
    // Check depth alert states (empty and full)
    const depthEmptyCacheKey = new Request('https://alerts.cache/depth-empty-alert');
    const depthEmptyAlert = await cache.match(depthEmptyCacheKey);
    if (depthEmptyAlert) {
      try {
        const cachedText = await depthEmptyAlert.text();
        if (cachedText === 'true') {
          alertStates.depthEmptyAlert = { active: true, startTime: null };
        } else {
          alertStates.depthEmptyAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.depthEmptyAlert = { active: false };
      }
    } else {
      alertStates.depthEmptyAlert = { active: false };
    }
    
    const depthFullCacheKey = new Request('https://alerts.cache/depth-full-alert');
    const depthFullAlert = await cache.match(depthFullCacheKey);
    if (depthFullAlert) {
      try {
        const cachedText = await depthFullAlert.text();
        if (cachedText === 'true') {
          alertStates.depthFullAlert = { active: true, startTime: null };
        } else {
          alertStates.depthFullAlert = JSON.parse(cachedText);
        }
      } catch (error) {
        alertStates.depthFullAlert = { active: false };
      }
    } else {
      alertStates.depthFullAlert = { active: false };
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
    alertStates.depthEmptyAlert = { active: false };
    alertStates.depthFullAlert = { active: false };
    alertStates.deviceOffline = {};
  }
  
  return alertStates;
}

export function generateAlertsSection(probes, alertStates = {}, thresholds = DEFAULT_THRESHOLDS, devicesData = null) {
  const alerts = [];
  
  // Check freezer temperature
  const freezerProbe = probes.find(p => p.id === FREEZER_PROBE_ID);
  if (freezerProbe && freezerProbe.value !== null && freezerProbe.value !== undefined) {
    const tempC = freezerProbe.value; // Raw value is in Celsius
    const isOverLimit = tempC > thresholds.FREEZER_MAX_TEMP; // Compare in Celsius
    const alertState = alertStates.freezerAlert || { active: false };
    
    let alertType = 'ok';
    let message = `Freezer temperature: ${tempC}°C (limit: ${thresholds.FREEZER_MAX_TEMP}°C)`;
    
    if (isOverLimit) {
      alertType = 'error';
      message = `Freezer temperature: ${tempC}°C - above ${thresholds.FREEZER_MAX_TEMP}°C limit`;
      
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
  
  // Check depth levels (both empty and full)
  const depthProbe = probes.find(p => p.id === DEPTH_PROBE_ID);
  if (depthProbe && depthProbe.value !== null && depthProbe.value !== undefined) {
    const currentDepth = depthProbe.value;
    const isTooEmpty = currentDepth > thresholds.DEPTH_MAX_LEVEL;
    const isTooFull = currentDepth < thresholds.DEPTH_MIN_LEVEL;
    const emptyAlertState = alertStates.depthEmptyAlert || { active: false };
    const fullAlertState = alertStates.depthFullAlert || { active: false };
    
    // Calculate tank percentage for display
    const fullLevel = 0.1;
    const emptyLevel = 1.52;
    const tankPercent = Math.max(0, Math.min(100, 
      ((emptyLevel - currentDepth) / (emptyLevel - fullLevel)) * 100
    ));
    
    let alertType = 'ok';
    let message = `Tank level: ${tankPercent.toFixed(1)}% (depth: ${currentDepth})`;
    
    if (isTooEmpty) {
      alertType = 'error';
      message = `Tank level: ${tankPercent.toFixed(1)}% (EMPTY - depth ${currentDepth} > ${thresholds.DEPTH_MAX_LEVEL})`;
      
      if (emptyAlertState.active && emptyAlertState.startTime) {
        const duration = Math.floor((Date.now() - emptyAlertState.startTime) / (1000 * 60));
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (emptyAlertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    } else if (isTooFull) {
      alertType = 'error';
      message = `Tank level: ${tankPercent.toFixed(1)}% (FULL - depth ${currentDepth} < ${thresholds.DEPTH_MIN_LEVEL})`;
      
      if (fullAlertState.active && fullAlertState.startTime) {
        const duration = Math.floor((Date.now() - fullAlertState.startTime) / (1000 * 60));
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${minutes}m`;
        } else {
          durationText = `${minutes}m`;
        }
        
        message += ` 🚨 ALERT: ${durationText}`;
      } else if (fullAlertState.active) {
        message += ' 🚨 ALERT SENT';
      }
    }
    
    alerts.push({
      type: alertType,
      icon: '🛢️',
      message: message,
      probe: depthProbe.name || 'Tank Level'
    });
  }
  
  // Check device offline states using real-time data
  const deviceNames = {
    '4c7525046c96': 'Storage',
    '44179312cc0f': 'Tanks'
  };
  
  for (const [deviceId, deviceName] of Object.entries(deviceNames)) {
    let alertType = 'ok';
    let message = `${deviceName} device: Online`;
    
    // Check real-time device status if device data is available
    if (devicesData && devicesData.devices && devicesData.devices[deviceId]) {
      const device = devicesData.devices[deviceId];
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastReport = currentTime - device.last;
      const isOffline = timeSinceLastReport > thresholds.DEVICE_TIMEOUT;
      
      if (isOffline) {
        alertType = 'error';
        const minutesOffline = Math.floor(timeSinceLastReport / 60);
        const hours = Math.floor(minutesOffline / 60);
        const remainingMinutes = minutesOffline % 60;
        
        let durationText = '';
        if (hours > 0) {
          durationText = `${hours}h ${remainingMinutes}m`;
        } else {
          durationText = `${minutesOffline}m`;
        }
        
        message = `${deviceName} device: Offline 🚨 ${durationText} ago`;
      }
    } else {
      // Fall back to cached alert state if device data not available
      const alertState = (alertStates.deviceOffline && alertStates.deviceOffline[deviceId]) || { active: false };
      
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