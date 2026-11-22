// Service worker: permite instalar la app y abrirla sin conexión.
// La página se pide siempre a la red primero (así cada cambio publicado llega en cuanto hay conexión);
// solo si no hay red se usa la copia guardada.
const CACHE = 'coches-v1';
const SHELL = ['./', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  // Solo archivos de la propia app; Google (sincronización, Gemini) va siempre directo a la red.
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const isPage = req.mode === 'navigate';
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(isPage ? './' : req, copy));
      }
      return res;
    }).catch(() => caches.match(isPage ? './' : req).then(r => r || caches.match('./')))
  );
});
