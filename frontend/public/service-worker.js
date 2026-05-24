// service-worker.js (Enhanced with Push Notifications)

const CACHE_NAME = 'planner-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// نصب Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Service Worker: Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// فعال‌سازی Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// مدیریت Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('/api/') || event.request.url.includes('localhost:8000')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => {
          return new Response(
            JSON.stringify({ 
              error: 'شما آفلاین هستید. لطفاً اتصال اینترنت خود را بررسی کنید.' 
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        return new Response(
          '<!DOCTYPE html><html><body style="font-family: Vazirmatn, sans-serif; direction: rtl; text-align: center; padding: 50px;"><h1>شما آفلاین هستید</h1><p>لطفاً اتصال اینترنت خود را بررسی کنید.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
  );
});

// ===== Push Notification Handler =====

// دریافت Push Notification از سرور
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData = {
    title: 'یادآوری تسک',
    body: 'زمان شروع یکی از تسک‌هاست!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'task-reminder',
    requireInteraction: true,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        ...pushData
      };
    } catch (e) {
      console.error('Failed to parse push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      dir: 'rtl',
      lang: 'fa'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
});

self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'sync-reminders') {
    event.waitUntil(
      fetch('/api/sync-reminders')
        .then(response => response.json())
        .then(data => {
          console.log('Reminders synced:', data);
        })
        .catch(error => {
          console.error('Sync failed:', error);
        })
    );
  }
});

self.addEventListener('periodicsync', (event) => {
  console.log('Service Worker: Periodic sync triggered');
  
  if (event.tag === 'check-reminders') {
    event.waitUntil(
      checkAndScheduleReminders()
    );
  }
});

async function checkAndScheduleReminders() {
  try {
    const response = await fetch('/api/upcoming-reminders');
    const reminders = await response.json();
    
    reminders.forEach(reminder => {
      const timeUntilReminder = new Date(reminder.time).getTime() - Date.now();
      
      if (timeUntilReminder > 0 && timeUntilReminder < 30 * 60 * 1000) { // تا 30 دقیقه
        setTimeout(() => {
          self.registration.showNotification(
            `⏰ یادآوری: ${reminder.taskName}`,
            {
              body: `${reminder.startTime} - ${reminder.endTime}\n30 دقیقه دیگه شروع میشه!\n📋 ${reminder.planTitle}`,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              vibrate: [200, 100, 200],
              tag: `task-${reminder.taskId}`,
              requireInteraction: true,
              data: reminder,
              dir: 'rtl',
              lang: 'fa'
            }
          );
        }, timeUntilReminder);
      }
    });
  } catch (error) {
    console.error('Failed to check reminders:', error);
  }
}

// Message Handler (برای ارتباط با اپلیکیشن)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { taskData } = event.data;
    
    console.log('Scheduling notification for:', taskData);
  }
});