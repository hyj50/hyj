const CACHE_NAME = 'chaeum-v2';
const STATIC_FILES = [
  '/student.html',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/splash.jpg',
  '/splash.mp3'
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

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase API는 캐시 안 함
  if (url.hostname.includes('supabase.co')) return;

  // Supabase Storage 사진은 캐시 저장 (오프라인 지원)
  if (url.hostname.includes('supabase.co') === false && url.pathname.includes('/storage/v1/object/public/')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // 나머지: 네트워크 우선, 실패시 캐시
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // HTML, 이미지, 음악 파일 캐시 업데이트
        if (
          e.request.destination === 'document' ||
          e.request.destination === 'image' ||
          e.request.destination === 'audio'
        ) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
