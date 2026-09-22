// SDSB service worker: shows task reminders sent by the send-reminders
// function, and opens the right task when a reminder is tapped.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'SDSB', body: event.data ? event.data.text() : '' }
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SDSB', {
      body: data.body || '',
      tag: data.tag,
      icon: '/brand/icon-192.png',
      badge: '/brand/icon-192.png',
      data: { url: data.url || '/#/today' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/#/today', self.location.origin).href
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const w of windows) {
        if (new URL(w.url).origin === self.location.origin) {
          await w.focus()
          return w.navigate(url)
        }
      }
      return self.clients.openWindow(url)
    })(),
  )
})
