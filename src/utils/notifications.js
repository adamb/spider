export async function sendPushoverNotification(env, message, title = "Device Alert") {
  try {
    if (!env.PUSHOVER_TOKEN || !env.PUSHOVER_USER) {
      console.error('Missing Pushover credentials');
      return false;
    }

    const response = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: env.PUSHOVER_TOKEN,
        user: env.PUSHOVER_USER,
        message: message,
        title: title,
        priority: 1, // High priority
      }),
    });

    const result = await response.json();
    if (response.ok && result.status === 1) {
      console.log('Pushover notification sent successfully');
      return true;
    } else {
      console.error('Pushover notification failed:', result);
      return false;
    }
  } catch (error) {
    console.error('Error sending Pushover notification:', error);
    return false;
  }
}