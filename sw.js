const V='pv-8';
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(['./','./index.html','./sw.js'])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(ca=>ca.put(e.request,c))}return res})).catch(()=>caches.match('./index.html')))});
