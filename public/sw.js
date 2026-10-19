// Service Worker for TourBiller Background Dispatch Alerts

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle notification click to focus or open the specific tour
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/live-tracking';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If a tab is already open, focus it and navigate
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client && targetUrl) {
                        return client.navigate(targetUrl);
                    }
                    return client;
                }
            }
            // Otherwise open a new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});

// Handle background push events if Web Push is triggered from backend
self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
        const payload = event.data.json();
        const title = payload.title || '🚨 Dispatch Emergency Alert';
        const options = {
            body: payload.body || 'Immediate action required on tour.',
            icon: '/logo-icon.png',
            badge: '/logo-icon.png',
            vibrate: [300, 100, 300, 100, 600],
            requireInteraction: true,
            data: { url: payload.url || '/live-tracking' },
        };
        event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
        console.error('Error handling push event:', e);
    }
});
