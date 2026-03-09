const DB_NAME = 'hes-tracker-offline';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const SYNC_QUEUE_STORE = 'syncQueue';
const USERS_STORE = 'users';

/**
 * Open or create the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;

      // Create projects store
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }

      // Create sync queue store
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }

      // Create users store
      if (!db.objectStoreNames.contains(USERS_STORE)) {
        db.createObjectStore(USERS_STORE, { keyPath: 'id' });
      }
    };

    req.onsuccess = () => {
      resolve(req.result);
    };

    req.onerror = () => {
      console.error('Failed to open IndexedDB:', req.error);
      reject(req.error);
    };
  });
}

/**
 * Cache projects locally for offline access
 * @param {Array} projects - Array of project objects
 * @returns {Promise<boolean>}
 */
export async function cacheProjects(projects) {
  try {
    const db = await openDb();
    const tx = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE);

    // Clear existing projects
    await new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Add all projects
    for (const project of projects) {
      await new Promise((resolve, reject) => {
        const req = store.add(project);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    }

    console.log('[OfflineDb] Cached', projects.length, 'projects');
    return true;
  } catch (error) {
    console.error('[OfflineDb] Failed to cache projects:', error);
    return false;
  }
}

/**
 * Load cached projects when offline
 * @returns {Promise<Array>}
 */
export async function getCachedProjects() {
  try {
    const db = await openDb();
    const tx = db.transaction([PROJECTS_STORE], 'readonly');
    const store = tx.objectStore(PROJECTS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        console.log('[OfflineDb] Retrieved', req.result.length, 'cached projects');
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to get cached projects:', error);
    return [];
  }
}

/**
 * Update a single cached project
 * @param {object} project - Project object to cache
 * @returns {Promise<boolean>}
 */
export async function updateCachedProject(project) {
  try {
    const db = await openDb();
    const tx = db.transaction([PROJECTS_STORE], 'readwrite');
    const store = tx.objectStore(PROJECTS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.put(project);
      req.onsuccess = () => {
        console.log('[OfflineDb] Updated cached project:', project.id);
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to update cached project:', error);
    return false;
  }
}

/**
 * Queue a save operation for when we're back online
 * @param {object} saveData - Data to save {projectId, updates, timestamp}
 * @returns {Promise<number>} ID of queued item
 */
export async function queueSave(saveData) {
  try {
    const db = await openDb();
    const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);

    const item = {
      data: saveData,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const req = store.add(item);
      req.onsuccess = () => {
        console.log('[OfflineDb] Queued save:', req.result);
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to queue save:', error);
    throw error;
  }
}

/**
 * Get all queued saves
 * @returns {Promise<Array>}
 */
export async function getQueuedSaves() {
  try {
    const db = await openDb();
    const tx = db.transaction([SYNC_QUEUE_STORE], 'readonly');
    const store = tx.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        console.log('[OfflineDb] Retrieved', req.result.length, 'queued saves');
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to get queued saves:', error);
    return [];
  }
}

/**
 * Remove a specific queued save by ID
 * @param {number} id - ID of queued item
 * @returns {Promise<boolean>}
 */
export async function removeQueuedSave(id) {
  try {
    const db = await openDb();
    const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => {
        console.log('[OfflineDb] Removed queued save:', id);
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to remove queued save:', error);
    return false;
  }
}

/**
 * Clear all queued saves after successful sync
 * @returns {Promise<boolean>}
 */
export async function clearSyncQueue() {
  try {
    const db = await openDb();
    const tx = db.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = tx.objectStore(SYNC_QUEUE_STORE);

    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => {
        console.log('[OfflineDb] Cleared sync queue');
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to clear sync queue:', error);
    return false;
  }
}

/**
 * Cache user data for offline access
 * @param {object} user - User object
 * @returns {Promise<boolean>}
 */
export async function cacheUser(user) {
  try {
    const db = await openDb();
    const tx = db.transaction([USERS_STORE], 'readwrite');
    const store = tx.objectStore(USERS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.put(user);
      req.onsuccess = () => {
        console.log('[OfflineDb] Cached user:', user.id);
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to cache user:', error);
    return false;
  }
}

/**
 * Get cached user data
 * @param {string} userId - User ID
 * @returns {Promise<object|null>}
 */
export async function getCachedUser(userId) {
  try {
    const db = await openDb();
    const tx = db.transaction([USERS_STORE], 'readonly');
    const store = tx.objectStore(USERS_STORE);

    return new Promise((resolve, reject) => {
      const req = store.get(userId);
      req.onsuccess = () => {
        resolve(req.result || null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.error('[OfflineDb] Failed to get cached user:', error);
    return null;
  }
}

/**
 * Check if the app is currently online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Register the service worker for offline support
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[OfflineDb] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    console.log('[OfflineDb] Service Worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[OfflineDb] Service Worker update available');
          // Notify app of update (can show "reload to update" message)
          window.dispatchEvent(new CustomEvent('sw-update-available'));
        }
      });
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'SYNC_COMPLETE') {
        console.log('[OfflineDb] Sync complete:', event.data);
        window.dispatchEvent(new CustomEvent('offline-sync-complete', {
          detail: event.data
        }));
      }
    });

    return registration;
  } catch (error) {
    console.error('[OfflineDb] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Trigger background sync if available
 * @returns {Promise<boolean>}
 */
export async function triggerSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('[OfflineDb] Background Sync not available');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-projects');
    console.log('[OfflineDb] Background sync triggered');
    return true;
  } catch (error) {
    console.error('[OfflineDb] Failed to trigger background sync:', error);
    return false;
  }
}

/**
 * Clear all offline data (projects, sync queue, users)
 * @returns {Promise<boolean>}
 */
export async function clearAllOfflineData() {
  try {
    const db = await openDb();
    const tx = db.transaction(
      [PROJECTS_STORE, SYNC_QUEUE_STORE, USERS_STORE],
      'readwrite'
    );

    const stores = [PROJECTS_STORE, SYNC_QUEUE_STORE, USERS_STORE];
    const promises = stores.map(storeName =>
      new Promise((resolve, reject) => {
        const req = tx.objectStore(storeName).clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    );

    await Promise.all(promises);
    console.log('[OfflineDb] Cleared all offline data');
    return true;
  } catch (error) {
    console.error('[OfflineDb] Failed to clear offline data:', error);
    return false;
  }
}

/**
 * Get database statistics
 * @returns {Promise<object>}
 */
export async function getDbStats() {
  try {
    const db = await openDb();

    const stats = {};
    const stores = [PROJECTS_STORE, SYNC_QUEUE_STORE, USERS_STORE];

    for (const storeName of stores) {
      const tx = db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);

      stats[storeName] = await new Promise((resolve, reject) => {
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return stats;
  } catch (error) {
    console.error('[OfflineDb] Failed to get database stats:', error);
    return null;
  }
}
