/* 테라포밍 마스 보드 - 오프라인 서비스워커
   앱이 완전 자기완결형이라, 한 번 방문하면 모든 파일을 캐시해 오프라인에서도 실행됩니다.
   (파일명에 의존하지 않도록 요청되는 자원을 런타임에 캐시) */
const CACHE = 'tm-board-v1';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET') return;

    // 캐시 우선 + 백그라운드 갱신 (stale-while-revalidate)
    e.respondWith(
        caches.open(CACHE).then(async (cache) => {
            const cached = await cache.match(req);
            const network = fetch(req).then((res) => {
                if (res && res.status === 200 && (res.type === 'basic' || res.type === 'default')) {
                    cache.put(req, res.clone());
                }
                return res;
            }).catch(() => cached);
            return cached || network;
        })
    );
});
