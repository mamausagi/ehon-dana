// えほんだな service worker
// シェル＋同梱絵本(books/)をキャッシュ。絵本データ本体はIndexedDB。
// デプロイ時は CACHE の版数を必ずバンプすること（deploy-appスキルが自動）
const CACHE = "ehon-dana-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("./index.html")));
    return;
  }
  // 同梱絵本(books/)はオフラインでも読めるよう、取得できたらキャッシュ
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && (url.pathname.includes("/books/") || SHELL.some(p => url.pathname.endsWith(p.replace("./", "/"))))) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => hit))
  );
});
