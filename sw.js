const CACHE='u39-area-fria-concept-v29-lavagem-j3902-responsive';

const SHELL=[
  './',
  './index.html',
  './styles.css?v=28',
  './app.js?v=28',
  './manifest.json',
  './equalizacao-j3902-e3907.html?v=28',
  './Lavagem-J3902-CIC-V2-Refinada.html?v=29',
  './parada-esgotamento-dea-u39.html?v=28',
  './parada-u39-fo39143-ci3907.html?v=28',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

const J3902_CARD=`
          <div id="lavagem-j3902-card"
               class="integrated-maneuver-card"
               style="border:1px solid #3c7087;background:linear-gradient(180deg,#0d2938,#081722)">
            <div class="integrated-maneuver-copy">
              <div class="integrated-maneuver-kicker" style="color:#8edfff">
                🧼 MANOBRA INTEGRADA • J-3902 • TURBINA • HBF
              </div>
              <b class="integrated-maneuver-title">Lavagem da Turbina J-3902 • CIC</b>
              <p class="integrated-maneuver-desc">
                39–40 kgf/cm² • rotação ≈5000 RPM • redução 1 °C/min • margem ≥10 °C sobre saturação • pressão da 1ª roda • amostragem a cada 15 min.
              </p>
            </div>
            <a class="btn primary integrated-maneuver-btn"
               href="./Lavagem-J3902-CIC-V2-Refinada.html?v=29">
              🧼 Treinar lavagem
            </a>
          </div>`;

function injectLavagemJ3902(html){
  // Evita duplicação caso o card já tenha sido gravado diretamente no index no futuro.
  if(html.includes('id="lavagem-j3902-card"')) return html;

  // V28 atual: insere IMEDIATAMENTE após o card da Equalização,
  // já dentro de .integrated-maneuvers-list.
  const equalizacaoCard = /(<div class="integrated-maneuver-card maneuver-equalizacao">[\s\S]*?<a class="btn primary integrated-maneuver-btn" href="\.\/equalizacao-j3902-e3907\.html\?v=28">▶ Abrir treinamento<\/a>\s*<\/div>)/;

  if(equalizacaoCard.test(html)){
    return html.replace(equalizacaoCard, '$1\n\n' + J3902_CARD);
  }

  // Compatibilidade caso a query string seja alterada em outra publicação.
  const equalizacaoGeneric = /(<div class="integrated-maneuver-card maneuver-equalizacao">[\s\S]*?<a class="btn primary integrated-maneuver-btn" href="\.\/equalizacao-j3902-e3907\.html\?v=\d+">▶ Abrir treinamento<\/a>\s*<\/div>)/;

  if(equalizacaoGeneric.test(html)){
    return html.replace(equalizacaoGeneric, '$1\n\n' + J3902_CARD);
  }

  // Não usa fallback acima da seção.
  // Se a estrutura esperada não existir, devolve o HTML intacto.
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
  if(event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if(url.origin !== self.location.origin) return;

  const isHome =
    event.request.mode === 'navigate' &&
    (
      url.pathname.endsWith('/U39-Area-Fria-ConcePT/') ||
      url.pathname.endsWith('/U39-Area-Fria-ConcePT/index.html')
    );

  if(isHome){
    event.respondWith((async()=>{
      try{
        const response = await fetch(event.request,{cache:'no-store'});
        if(!response.ok) return response;

        const html = await response.text();
        const modified = new Response(injectLavagemJ3902(html),{
          status:response.status,
          statusText:response.statusText,
          headers:response.headers
        });

        caches.open(CACHE).then(c=>c.put(event.request,modified.clone())).catch(()=>{});
        return modified;
      }catch(e){
        const cached = await caches.match(event.request);
        if(!cached) return caches.match('./index.html');

        const html = await cached.text();
        return new Response(injectLavagemJ3902(html),{
          status:cached.status,
          statusText:cached.statusText,
          headers:cached.headers
        });
      }
    })());
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||caches.match('./index.html')))
  );
});
