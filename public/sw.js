const CACHE_NAME = 'hes-tracker-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png'
  // CDN assets will be cached on first load
];

/**
 * Install event: cache static assets
 * Runs when service worker is first registered
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(error => {
        console.warn('[SW] Some assets failed to cache:', error);
        // Don't fail the install if some assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

/**
 * Activate event: clean up old caches
 * Runs when service worker becomes active
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event: implement caching strategy
 * - Network-first for API calls and dynamic content
 * - Cache-first for static assets
 * - Fallback offline page for HTML requests
 */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip cross-origin requests and non-GET requests
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Supabase API calls: network-first strategy
  if (url.hostname.includes('supabase') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(error => {
          console.log('[SW] Fetch failed, trying cache:', event.request.url);
          // Fall back to cached version if available
          return caches.match(event.request).then(cached => {
            if (cached) {
              return cached;
            }
            // Return offline response for API failures
            return new Response(
              JSON.stringify({ error: 'Offline - cached data unavailable' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'application/json' })
              }
            );
          });
        })
    );
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(error => {
        console.log('[SW] Static asset fetch failed:', event.request.url);

        // Offline fallback for HTML documents
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html').catch(() => {
            return new Response(
              '<h1>Offline</h1><p>This page is not available offline.</p>',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/html' })
              }
            );
          });
        }

        return new Response('Network error', {
          status: 408,
          statusText: 'Request Timeout'
        });
      });
    })
  );
});

/**
 * Background sync event: handle queued saves when back online
 * Triggered automatically when connectivity is restored
 */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-projects') {
    console.log('[SW] Syncing queued project saves...');
    event.waitUntil(syncQueuedSaves());
  }
});

/**
 * Sync queued saves from IndexedDB back to Supabase
 * Reads from sync queue and pushes changes when online
 */
async function syncQueuedSaves() {
  try {
    // Open IndexedDB
    const db = await openDb();
    const tx = db.transaction(['syncQueue', 'projects'], 'readwrite');
    const queueStore = tx.objectStore('syncQueue');
    const projectsStore = tx.objectStore('projects');

    // Get all queued saves
    const queued = await new Promise((resolve, reject) => {
      const req = queueStore.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (queued.length === 0) {
      console.log('[SW] No queued saves to sync');
      return;
    }

    console.log('[SW] Found', queued.length, 'queued saves');

    // Process each queued save
    const results = [];
    for (const item of queued) {
      try {
        // In a real app, this would POST to your API endpoint
        // For now, we'll just update the projects store
        await new Promise((resolve, reject) => {
          const req = projectsStore.put(item.data);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
        results.push({ id: item.id, success: true });
      } catch (error) {
        console.error('[SW] Failed to sync item:', item.id, error);
        results.push({ id: item.id, success: false, error: error.message });
      }
    }

    // Remove successfully synced items
    const successful = results.filter(r => r.success).map(r => r.id);
    for (const id of successful) {
      await new Promise((resolve, reject) => {
        const req = queueStore.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    console.log('[SW] Sync complete:', successful.length, 'items synced');

    // Notify clients of sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        successful: successful.length,
        failed: results.filter(r => !r.success).length
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Retry sync if it fails
  }
}

/**
 * Open IndexedDB connection
 * Used by background sync to access offline data
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hes-tracker-offline', 1);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Message event: handle messages from clients
 * Allows the app to control service worker behavior
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0].postMessage({ success: true });
    }).catch(error => {
      console.error('[SW] Failed to clear cache:', error);
      event.ports[0].postMessage({ success: false, error });
    });
  }
});
