// 시율이 하루 — 감싸는 페이지를 폰에 저장해 두고, 다시 열 때 인터넷을 기다리지 않고 바로 띄운다.
// (아이폰은 한동안 쓰지 않으면 앱을 내렸다가, 다시 열 때 이 페이지를 인터넷에서 새로 받는다.
//  그 2~3초 동안 예전 화면('불러오는 중')이 보이던 것을 없앤다)
// 받는 방식: 저장해 둔 것을 먼저 보여 주고, 뒤에서 새 버전을 받아 다음 실행부터 쓴다.
// 구글 앱(script.google.com)은 다른 주소라 여기서 건드리지 않는다. 이 파일엔 앱 주소가 없다.
const CACHE = 'siyul-wrap-v1';
const PAGE = './';
const FILES = [PAGE, './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 새 버전 받아 저장 (실패하면 저장해 둔 것을 그대로 쓴다)
function update(key) {
  return fetch(key, { cache: 'no-cache' }).then((res) => {
    if (res.ok) caches.open(CACHE).then((c) => c.put(key, res.clone()));
    return res;
  });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  const scope = new URL(PAGE, self.registration.scope).pathname;
  // 페이지 열기 (?k=앱ID#… 가 붙어 있어도 같은 페이지)
  if (e.request.mode === 'navigate' && (url.pathname === scope || url.pathname === scope + 'index.html')) {
    e.respondWith(caches.match(PAGE).then((hit) => {
      const fresh = update(PAGE);
      if (hit) { e.waitUntil(fresh.catch(() => {})); return hit; }
      return fresh;
    }));
    return;
  }
  if (url.pathname === scope + 'apple-touch-icon.png') {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});
