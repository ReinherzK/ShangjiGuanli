// 离线缓存：应用外壳缓存优先，后台更新。修改代码后把 VERSION 加 1。
const VERSION = 'crm-v6';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'config.js',
  'js/auth.js',
  'js/store.js',
  'js/app.js',
  'manifest.webmanifest',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // 只处理本站 GET 请求；微软登录 / Graph / OneDrive 下载一律直连网络
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 登录回调（带 ?code=）不走缓存
  if (url.search.includes('code=') || url.search.includes('error=')) return;

  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const key = e.request.mode === 'navigate' ? './' : e.request;
      const cached = await cache.match(key, { ignoreSearch: e.request.mode === 'navigate' });
      const network = fetch(e.request)
        .then((res) => {
          if (res.ok && e.request.mode !== 'navigate') cache.put(e.request, res.clone());
          if (res.ok && e.request.mode === 'navigate') cache.put('./', res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
