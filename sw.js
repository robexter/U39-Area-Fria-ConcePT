const CACHE='u39-area-fria-concept-v28-lavagem-j3902';

const SHELL=[
  './',
  './index.html',
  './styles.css?v=27',
  './app.js?v=27',
  './manifest.json',
  './equalizacao-j3902-e3907.html?v=27',
  './Lavagem-J3902-CIC-V2-Refinada.html?v=28',
  './parada-esgotamento-dea-u39.html?v=27',
  './parada-u39-fo39143-ci3907.html?v=27',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

const J3902_CARD=`
          <div id="lavagem-j3902-card" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;border:1px solid #3c7087;border-radius:16px;background:linear-gradient(180deg,#0d2938,#081722)">
            <div>
              <div style="font-size:11px;font-weight:900;letter-spacing:.08em;color:#8edfff;margin-bottom:5px">🧼 MANOBRA INTEGRADA • J-3902 • TURBINA • HBF</div>
              <b style="font-size:18px">Lavagem da Turbina J-3902 • CIC</b>
              <p style="margin:6px 0 0;color:#9fb7c8;line-height:1.45">39–40 kgf/cm² • rotação ≈5000 RPM • redução 1 °C/min • margem ≥10 °C sobre saturação • pressão da 1ª roda • amostragem a cada 15 min.</p>
            </div>
            <a class="btn primary" href="./Lavagem-J3902-CIC-V2-Refinada.html?v=28" style="text-decoration:none;white-space:nowrap">🧼 Treinar lavagem</a>
          </div>
          <div style="height:12px"></div>`;

function injectLavagemJ3902(html){
  if(html.includes('id="lavagem-j3902-card"')) return html;

  const anchor=`<a class="btn primary" href="./equalizacao-j3902-e3907.html?v=27" style="text-decoration:none;white-space:nowrap">▶ Abrir treinamento</a>
          </div>
          <div style="height:12px"></div>`;

  if(html.includes(anchor)){
    return html.replace(anchor,anchor+'\n'+J3902_CARD);
  }

  const fallback='<section class="panel" id="integratedManeuvers">';
  if(html.includes(fallback)){
    return html.replace(fallback,fallback+'\n'+J3902_CARD);
  }
  return html;
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isHome =
    event.request.mode === 'navigate' &&
    (
      url.pathname.endsWith('/U39-Area-Fria-ConcePT/') ||
      url.pathname.endsWith('/U39-Area-Fria-ConcePT/index.html')
    );

  if(isHome){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .then(async response=>{
          if(!response.ok) return response;
          const text=await response.text();
          const modified=new Response(injectLavagemJ3902(text),{
            status:response.status,
            statusText:response.statusText,
            headers:response.headers
          });
          caches.open(CACHE).then(cache=>cache.put(event.request,modified.clone())).catch(()=>{});
          return modified;
        })
        .catch(()=>caches.match(event.request).then(async cached=>{
          if(!cached) return caches.match('./index.html');
          const text=await cached.text();
          return new Response(injectLavagemJ3902(text),{
            status:cached.status,
            statusText:cached.statusText,
            headers:cached.headers
          });
        }))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('./index.html'))
      )
  );
});
