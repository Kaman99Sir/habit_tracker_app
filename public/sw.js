self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const title = data.title || 'Habitual Reminder';
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      actions: [
        { action: 'complete', title: 'Mark Done' },
        { action: 'snooze', title: 'Snooze 10m' },
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'complete') {
    // We would ideally call the API here directly, but SW doesn't have the user token easily if it's httpOnly without credentials.
    // Actually, credentials: 'include' works if we use fetch.
    event.waitUntil(
      fetch('/api/habits/complete-from-push', { method: 'POST' }) // Placeholder for actual quick action API
        .catch(err => console.error(err))
    );
  } else {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});
