const CACHE_NAME = 'mm-chem-media-v1';

// Static media & font origins/paths safe to serve Cache-First / Stale-While-Revalidate
function isCacheableAsset(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);

  // Never cache Firebase Auth, Firestore, or dynamic API endpoints
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/__/auth/') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return false;
  }

  // Uploaded media & local images
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/images/')) {
    return true;
  }

  // Cloudinary images & handouts
  if (url.hostname.includes('res.cloudinary.com') && request.destination !== 'video') {
    return true;
  }

  // Google Fonts
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com')
  ) {
    return true;
  }

  // Vite hashed build assets in /assets/
  if (url.pathname.startsWith('/assets/')) {
    return true;
  }

  // Images anywhere
  if (request.destination === 'image') {
    return true;
  }

  return false;
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(['/favicon.svg', '/logo.svg']).catch(() => {})
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheableAsset(request)) return;

  // Cache-first with background refresh for fast repeat loads
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response && (response.status === 200 || response.type === 'opaque')) {
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return cached || Response.error();
      }
    })
  );
});
