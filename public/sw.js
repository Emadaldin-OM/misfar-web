// sw.js  –  Misfar V2 Service Worker (PWA offline support)
const CACHE_NAME = 'misfar-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install: cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Always go network for API calls and POST requests
  if (url.pathname.startsWith('/api') || e.request.method !== 'GET') {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ success: false, offline: true, message: 'You are offline.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for static files
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Background sync for queued offline actions
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-reviews') {
    e.waitUntil(syncQueuedReviews());
  }
});

async function syncQueuedReviews() {
  const db = await openDB();
  const queue = await getAllFromStore(db, 'offline_queue');
  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: JSON.stringify(item.body),
      });
      if (res.ok) await deleteFromStore(db, 'offline_queue', item.id);
    } catch { /* will retry on next sync */ }
  }
}

// Minimal IndexedDB helpers for sync queue
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('misfar_offline', 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true });
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = reject;
  });
}
function getAllFromStore(db, store) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => res(req.result);
    req.onerror   = rej;
  });
}
function deleteFromStore(db, store, id) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = res;
    req.onerror   = rej;
  });
}
