/* Service worker du calendrier du Ramadan (PWA) — version 6.
   Règles de sécurité (comptes, abonnements, accès offerts révocables) :
   - Seuls les fichiers PUBLICS et GRATUITS du site sont gardés pour le hors-ligne.
   - Jamais en cache : /api/ (dont /api/premium/), /admin/, /apercu/, /compte/, /premium/, les requêtes authentifiées, les réponses marquées
     « private » ou « no-store », les réponses d'erreur (401, 403…), les autres sites.
   - Purge : sur message { type: 'purger' } (déconnexion, changement de compte, changement de droits) et
     automatiquement dès qu'une réponse 401 ou 403 passe (accès révoqué ou expiré). */
const VERSION = 'v6';
const COQUILLE = 'lanternes-' + VERSION;            // l'application du calendrier (toujours gratuite)
const DYNAMIQUE = 'lanternes-dyn-' + VERSION;       // autres fichiers publics vus en ligne
const FICHIERS = ['./', 'index.html', 'style.css?v=5', 'data.js?v=4', 'app.js?v=5', 'manifest.webmanifest',
  'icone.svg', 'icone-180.png', 'icone-192.png', 'icone-512.png'];
const JAMAIS = /^\/(api|admin|apercu|compte|premium)(\/|$)/;

self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(COQUILLE).then(c => c.addAll(FICHIERS))); });

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== COQUILLE && x !== DYNAMIQUE).map(x => caches.delete(x))))
    .then(() => self.clients.claim())
));

function purger() { return caches.delete(DYNAMIQUE); }

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'purger') e.waitUntil(purger().then(() => { if (e.source) e.source.postMessage({ type: 'purge-faite' }); }));
});

function cachable(requete, reponse) {
  const url = new URL(requete.url);
  if (url.origin !== location.origin || JAMAIS.test(url.pathname)) return false;
  if (requete.headers.has('Authorization')) return false;
  if (!reponse || reponse.status !== 200 || reponse.type !== 'basic') return false;
  const cc = (reponse.headers.get('Cache-Control') || '').toLowerCase();
  return !/no-store|private/.test(cc);
}

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;                                   // autres sites : le navigateur s'en occupe
  if (JAMAIS.test(url.pathname)) {                                               // jamais en cache, mais on surveille les refus
    e.respondWith(fetch(r).then(rep => { if (rep.status === 401 || rep.status === 403) e.waitUntil(purger()); return rep; }));
    return;
  }
  e.respondWith(fetch(r).then(rep => {
    if (rep.status === 401 || rep.status === 403) e.waitUntil(purger());
    else if (cachable(r, rep)) {
      const copie = rep.clone();
      const nom = FICHIERS.some(f => url.pathname.endsWith('/calendrier/' + f.split('?')[0]) || (f === './' && url.pathname.endsWith('/calendrier/'))) ? COQUILLE : DYNAMIQUE;
      e.waitUntil(caches.open(nom).then(c => c.put(r, copie)));
    }
    return rep;
  }).catch(() => caches.match(r)));
});
