// Service Worker - Disabled to prevent caching issues
// This ensures users always get the latest version

const CACHE_NAME = 'reride-cache-v10-spinny-fresh';

// Install event - Skip caching, just activate immediately
self.addEventListener('install', (event) => {
  // Force immediate activation
  self.skipWaiting();
  console.log('Service Worker: Installing (no caching)');
});

// Activate event - Delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Delete ALL caches to force fresh content
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control immediately
      self.clients.claim()
    ])
  );
  console.log('Service Worker: Activated - All caches cleared');
});

// Fetch event - ALWAYS fetch from network (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, {
      cache: 'no-store'
    }).catch((error) => {
      console.error('Fetch failed:', error);
      return new Response('Network error', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    })
  );
});
