// public/sw.js
// Service Worker for IziXport Web Push Notifications

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ─── Push event ───────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'IziXport', message: event.data.text(), type: 'system' }
  }

  const { title = 'IziXport', message = '', link = '/', type = 'system' } = data

  const options = {
    body: message,
    icon:  '/logo-192.png',
    badge: '/badge-72.png',
    data:  { url: link },
    actions: [
      { action: 'open',    title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    vibrate:   [200, 100, 200],
    tag:       type,       // groups similar notifications (replaces previous of same type)
    renotify:  true,
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If there's already a window open, focus it and navigate
        for (const client of clients) {
          if ('navigate' in client) {
            client.focus()
            return client.navigate(targetUrl)
          }
        }
        // Otherwise open a new window
        return self.clients.openWindow(targetUrl)
      })
  )
})

// ─── Push subscription change ─────────────────────────────────────────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  // Re-subscribe and send new subscription to server
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/push-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        })
      })
  )
})