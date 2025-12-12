/**
 * Service Worker for Nuru PWA
 *
 * Implements caching strategies and offline support
 */

const CACHE_VERSION = "v2";
const CACHE_NAME = `nuru-${CACHE_VERSION}`;
const MAX_CACHE_SIZE = 50; // Maximum number of cached items
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  images: "CacheFirst",
  static: "StaleWhileRevalidate",
  api: "NetworkFirst",
  blockchain: "NetworkOnly",
};

// Resources to cache on install
const STATIC_RESOURCES = [
  "/",
  "/manifest.json",
  "/offline.html",
];

// Cache size limits for different types
const CACHE_LIMITS = {
  images: 30,
  static: 50,
  api: 20,
};

/**
 * Install Event - Cache static resources
 */
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static resources");
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

/**
 * Activate Event - Clean up old caches
 */
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Implement caching strategies
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Determine strategy based on request type
  const strategy = getStrategy(url);

  switch (strategy) {
    case "CacheFirst":
      event.respondWith(cacheFirst(request));
      break;
    case "NetworkFirst":
      event.respondWith(networkFirst(request));
      break;
    case "StaleWhileRevalidate":
      event.respondWith(staleWhileRevalidate(request));
      break;
    case "NetworkOnly":
    default:
      event.respondWith(fetch(request));
      break;
  }
});

/**
 * Message Event - Handle messages from the app
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("⏭️ Skipping waiting...");
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    console.log("📦 Caching URLs:", event.data.urls);
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

/**
 * Sync Event - Handle background sync
 */
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync:", event.tag);

  if (event.tag === "sync-offline-queue") {
    event.waitUntil(syncOfflineQueue());
  }
});

/**
 * Push Event - Handle push notifications
 */
self.addEventListener("push", (event) => {
  console.log("🔔 Push notification received");

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "New update available",
    icon: "/icon-192x192.png",
    badge: "/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Nuru", options)
  );
});

/**
 * Notification Click Event - Handle notification clicks
 */
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked:", event.action);

  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window if no existing window
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
  );
});

// ============================================
// Caching Strategies Implementation
// ============================================

/**
 * Cache First Strategy
 * Try cache first, fallback to network
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check cache age
    const cacheTime = cachedResponse.headers.get("sw-cache-time");
    if (cacheTime && Date.now() - parseInt(cacheTime) > MAX_CACHE_AGE) {
      // Cache is too old, fetch fresh data
      caches.delete(request);
    } else {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      const responseWithTime = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: new Headers({
          ...Object.fromEntries(networkResponse.headers.entries()),
          "sw-cache-time": Date.now().toString(),
        }),
      });
      cache.put(request, responseWithTime.clone());
      await trimCache(CACHE_NAME, CACHE_LIMITS.images);
      return responseWithTime;
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache first failed:", error);
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response("Offline", { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cache immediately, update cache in background
 */
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const cache = caches.open(CACHE_NAME);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

/**
 * Determine caching strategy based on URL
 */
function getStrategy(url) {
  // Images
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    return CACHE_STRATEGIES.images;
  }

  // API calls
  if (url.pathname.startsWith("/api/")) {
    return CACHE_STRATEGIES.api;
  }

  // Blockchain RPC calls (always fresh)
  if (
    url.hostname.includes("rpc") ||
    url.hostname.includes("infura") ||
    url.hostname.includes("alchemy") ||
    url.hostname.includes("base")
  ) {
    return CACHE_STRATEGIES.blockchain;
  }

  // Static assets
  if (url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/)) {
    return CACHE_STRATEGIES.static;
  }

  // Default to network first for pages
  return CACHE_STRATEGIES.api;
}

/**
 * Sync offline transaction queue
 */
async function syncOfflineQueue() {
  console.log("🔄 Syncing offline queue...");

  try {
    // Send message to all clients to process queue
    const clients = await self.clients.matchAll();

    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_QUEUE",
      });
    });

    return Promise.resolve();
  } catch (error) {
    console.error("Queue sync failed:", error);
    return Promise.reject(error);
  }
}

/**
 * Trim cache to maximum size
 * Removes oldest entries when cache exceeds limit
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
    console.log(`🗑️ Trimmed ${keysToDelete.length} items from cache`);
  }
}
