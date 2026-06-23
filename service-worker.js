const CACHE_NAME = 'chaeum-v1';
const STATIC_FILES = [
  '/student.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — Supabase API는 항상 네트워크 우선, HTML만 캐시 폴백
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API 요청은 캐시 안 함
  if (url.hostname.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // HTML 파일만 캐시 업데이트
        if (e.request.destination === 'document') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
