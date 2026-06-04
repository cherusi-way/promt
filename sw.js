/* プロンプト保管庫 — Service Worker
   完全オフライン対応。index.html は CSS/JS をすべてインライン化済みなので、
   このアプリシェル一式をプリキャッシュすれば、初回読み込み後は完全にオフラインで動作する。
   注意: GitHub Pages のサブパス配信に対応するため、すべて相対パスで登録する。 */

const CACHE_VERSION = 'pvault-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png'
];

// インストール時にアプリシェルをプリキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 旧バージョンのキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// フェッチ戦略:
//  - ページ遷移(navigate)は、オフライン時に index.html を返す
//  - それ以外は cache-first（キャッシュ優先、無ければネットワーク取得しキャッシュ）
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // GET 以外（POST等）は素通し
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // 同一オリジンの正常レスポンスのみ追加キャッシュ
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
