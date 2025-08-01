export function getProbeTypeLabel(probetype) {
  const labels = {
    'tf': 'Temperature',
    'rh': 'Humidity',
    '': 'Other'
  };
  return labels[probetype] || probetype || 'Unknown';
}

export function formatProbeValue(probeData) {
  if (probeData.value === null || probeData.value === undefined) {
    return '—';
  }
  
  if (probeData.probetype === 'tf') {
    // Raw value is in Celsius, convert to Fahrenheit for display
    const fahrenheit = (probeData.value * 9/5) + 32;
    return `${probeData.value}°C (${fahrenheit.toFixed(1)}°F)`;
  } else if (probeData.probetype === 'rh') {
    return `${probeData.value}%`;
  } else {
    return probeData.value.toString();
  }
}

export function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('en-US', {
    timeZone: 'America/Puerto_Rico',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit', 
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

export function formatTimeAgo(minutes) {
  if (minutes < 60) {
    return `${minutes}min ago`;
  } else if (minutes < 1440) { // Less than 24 hours
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h ago`;
    } else {
      return `${hours}h ${remainingMinutes}min ago`;
    }
  } else { // 24 hours or more
    const days = Math.floor(minutes / 1440);
    const remainingHours = Math.floor((minutes % 1440) / 60);
    if (remainingHours === 0) {
      return `${days}d ago`;
    } else {
      return `${days}d ${remainingHours}h ago`;
    }
  }
}