
// This service worker handles incoming push notifications when the app is in the background.
// It's intentionally kept minimal.
// In a real production app, you might import and initialize Firebase here to handle data messages,
// but for simple notifications, this is sufficient.

// Listen for push events

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }
  const pushData = event.data.json();

  const title = pushData.notification.title || 'New Notification';
  const options = {
    body: pushData.notification.body || 'Something new happened!',
    icon: pushData.notification.icon || '/icon-192x192.png', // Default icon
    badge: '/badge-72x72.png', // Default badge
    data: {
      url: pushData.data?.url || '/' // URL to open on click
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for notification click events
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
