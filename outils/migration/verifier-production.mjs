// Vérification d'un site PUBLIÉ (production ou préproduction), à lancer juste après la bascule DNS :
//   node outils/migration/verifier-production.mjs https://leslanternesdenour.fr --mode production [--commit <sha>] [--navigateur]
//   node outils/migration/verifier-production.mjs https://lanternes-de-nour.pages.dev --mode preproduction --navigateur
// Aucune écriture, aucun compte créé : uniquement des lectures. Sortie : ✓/✗ par vérification ; code 1 s'il reste un échec.
// --navigateur : joue le portail, les voix et un jeu dans un vrai Chrome (Playwright) ; sans cette option, vérifications HTTP seulement.
import { createRequire } from 'module';
const args = process.argv.slice(2), BASE = (args.find(a => /^https?:/.test(a)) || 'https://leslanternesdenour.fr').replace(/\/$/, '');
const MODE = (args[args.indexOf('--mode') + 1]) || 'production', COMMIT = args.includes('--commit') ? args[args.indexOf('--commit') + 1] : null, NAV = args.includes('--navigateur');
const PROD = MODE === 'production';
let ok = 0, ko = 0; const t = (nom, c, d = '') => { c ? ok++ : ko++; console.log(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const get = async (chemin, o = {}) => { try { const r = await fetch(BASE + chemin, { redirect: 'manual', ...o }); return r; } catch (e) { return { status: 0, headers: new Map(), erreur: e.message, text: async () => '', json: async () => null }; } };
const PAGES = ['/', '/compte/', '/tarifs/', '/conditions/', '/admin/', '/apercu/', '/calendrier/', '/ablutions/', '/priere/', '/voyage/', '/monde/', '/decouvrir/', '/univers/', '/transfert/', '/ablutions/jeu3d/', '/priere/jeu3d/'];

// ----- 1. HTTPS, redirections -----
{
  const r = await get('/'); t('HTTPS : la page d\'accueil répond (certificat valide)', r.status === 200, `HTTP ${r.status} ${r.erreur || ''}`);
  const http = await fetch(BASE.replace(/^https:/, 'http:') + '/', { redirect: 'manual' }).catch(e => ({ status: 0 }));
  if (http.status === 0) console.log('∅ HTTP → HTTPS : non vérifiable depuis ce réseau (connexion en clair bloquée) : à contrôler à la main avec http://' + new URL(BASE).host);
  else t('HTTP → HTTPS : redirection automatique', [301, 302, 307, 308].includes(http.status) && /^https:/.test(http.headers.get ? (http.headers.get('location') || '') : ''), `HTTP ${http.status}`);
  if (PROD) {
    const www = await fetch(BASE.replace('://', '://www.') + '/', { redirect: 'manual' }).catch(e => ({ status: 0 }));
    t('www : répond ou redirige vers le domaine principal', [200, 301, 302, 307, 308].includes(www.status), `HTTP ${www.status}`);
  }
  const h = r.headers; const srv = (h.get && (h.get('server') || '')) || '';
  t(`Hébergeur : Cloudflare${PROD ? ' (plus GitHub Pages)' : ''}`, /cloudflare/i.test(srv) && !/github/i.test(srv), srv);
}
// ----- 2. Version déployée -----
{
  const r = await get('/version.json'); let v = null; try { v = await r.json(); } catch (e) {}
  t('version.json : présent', !!v && !!v.commit, `HTTP ${r.status}`);
  if (v) { t(`Branche déployée : ${PROD ? 'main' : 'preproduction'}`, v.branche === (PROD ? 'main' : 'preproduction'), v.branche); if (COMMIT) t('Commit déployé = commit attendu', v.commit.startsWith(COMMIT), v.commit); }
}
// ----- 3. Pages -----
for (const p of PAGES) { const r = await get(p); const redir = r.status >= 300 && r.status < 400; let st = r.status; if (redir) { const l = r.headers.get('location') || ''; const r2 = await get(new URL(l, BASE + p).pathname); st = r2.status; }
  t(`Page ${p} : 200`, st === 200, `HTTP ${r.status}`); }
{
  const r = await get('/'), h = r.headers.get('x-robots-tag') || '';
  t(PROD ? 'Accueil indexable (pas de noindex)' : 'Préproduction : noindex posé', PROD ? !/noindex/i.test(h) : /noindex/i.test(h), h);
  const rb = await (await get('/robots.txt')).text(); t(PROD ? 'robots.txt autorise le site' : 'robots.txt interdit tout (préproduction)', PROD ? /^Allow: \/$/m.test(rb) && !/^Disallow:\s*\/\s*$/m.test(rb) : /^Disallow:\s*\/\s*$/m.test(rb));
  if (PROD) { const sm = await get('/sitemap.xml'); t('sitemap.xml présent', sm.status === 200); }
  for (const p of ['/compte/', '/admin/', '/apercu/']) { const x = await get(p); t(`${p} : jamais indexée (noindex)`, /noindex/i.test(x.headers.get('x-robots-tag') || ''), x.headers.get('x-robots-tag')); }
  const hh = r.headers; for (const e of ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy']) t(`En-tête de sécurité : ${e}`, !!hh.get(e));
  t('Aucun outil interne publié (/outils/)', PROD ? (await get('/outils/ecoute-voix.html')).status === 404 : true);
  for (const f of ['/docs/', '/serveur/api.js', '/functions/api/sante.js', '/firestore.rules', '/wrangler.toml', '/.git/config', '/package.json']) { const x = await get(f); t(`Fichier interne non publié : ${f}`, x.status === 404 || x.status === 403, `HTTP ${x.status}`); }
}
// ----- 4. API et sécurité des sessions -----
{
  const s = await get('/api/sante'); let j = null; try { j = await s.json(); } catch (e) {}
  t('API : /api/sante répond (fonctions serveur actives)', s.status === 200 && j && j.ok === true, `HTTP ${s.status}`);
  if (j) { t(`API : environnement « ${PROD ? 'production' : 'preproduction'} »`, j.environnement === (PROD ? 'production' : 'preproduction'), j.environnement); if (PROD) t('API : aucun détail de configuration exposé en production', !('configuration' in j)); else if (j.configuration) t('Préproduction : sessions et Firebase configurés', j.configuration.sessions === true && j.configuration.firebaseProjet === true && j.configuration.firebaseCompteDeService === true); }
  t('Sécurité : /api/session sans connexion → 401', (await get('/api/session')).status === 401);
  t('Sécurité : /api/moi anonyme → visiteur (aucune fuite)', await (await get('/api/moi')).json().then(x => x && x.connecte === false).catch(() => false));
  t('Sécurité : /api/admin/resume sans connexion → 401', (await get('/api/admin/resume')).status === 401);
  t('Sécurité : contenu Premium sans connexion → 401', (await get('/api/premium/voyage/camp/zone.json')).status === 401);
  const e = await get('/api/session', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://exemple.invalide', 'X-LDN': '1' }, body: '{}' });
  t('Sécurité : une requête d\'écriture venue d\'un autre site est refusée (403)', e.status === 403, `HTTP ${e.status}`);
  const c = await get('/api/catalogue'); const cat = await c.json().catch(() => null); t('Catalogue des maisons et des zones : servi', c.status === 200 && !!(cat && cat.catalogue && cat.catalogue.maisons), `HTTP ${c.status}`);
  t('Aucun contenu Premium dans le catalogue public (zones et maisons Premium fermées)', !!cat && Object.values(cat.catalogue.maisons).every(m => m.niveau === 'libre' || m.ouvert === false));
}
// ----- 5. Voix, audio, modèles : tous les fichiers référencés répondent -----
{
  let manquants = [], total = 0;
  for (const jeu of ['ablutions', 'priere', 'calendrier']) {
    const r = await get(`/${jeu}/voix/voix.json`); const v = await r.json().catch(() => null); t(`Voix ${jeu} : voix.json servi`, !!v, `HTTP ${r.status}`); if (!v) continue;
    const fichiers = [...new Set(Object.values(v).map(x => x[0]))];
    for (let i = 0; i < fichiers.length; i += 12) await Promise.all(fichiers.slice(i, i + 12).map(async f => { total++; const x = await fetch(new URL(`/${jeu}/voix/${f}`, BASE), { method: 'HEAD' }).catch(() => ({ status: 0 })); if (x.status !== 200) manquants.push(jeu + ':' + f + ' ' + x.status); }));
  }
  t(`Fichiers audio des trois jeux : ${total} fichiers servis`, manquants.length === 0 && total > 200, manquants.slice(0, 3).join(' | '));
  for (const f of ['/monde/voix/accueil-portail.mp3', '/monde/voix/accueil-portail.json', '/monde/socle/portail.js']) t(`Portail : ${f}`, (await get(f)).status === 200);
  for (const f of ['/personnages3d/modeles/garcon_N1.glb', '/personnages3d/modeles/fille_N1.glb']) { const x = await get(f); t(`Modèle 3D : ${f}`, x.status === 200, `HTTP ${x.status}`); }
}
// ----- 6. Navigateur réel (optionnel) -----
if (NAV) {
  const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  for (const [D, vp, mob] of [['Ordinateur', { width: 1180, height: 780 }, false], ['Téléphone', { width: 390, height: 844 }, true]]) {
    const ctx = await b.newContext(mob ? { viewport: vp, isMobile: true, hasTouch: true } : { viewport: vp });
    await ctx.addInitScript(() => { window.__lect = 0; const o = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (/accueil-portail/.test(this.src)) window.__lect++; return o.apply(this, arguments); }; try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); } catch (e) {} });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 90)));
    await p.goto(BASE + '/monde/', { waitUntil: 'domcontentloaded' }); await p.waitForFunction(() => window.__portail && window.__portail.actif, null, { timeout: 12000 }).catch(() => {});
    t(`${D} : le portail du Monde de Nour s'affiche`, await p.evaluate(() => !!document.getElementById('portail')));
    await p.waitForFunction(() => window.__lect >= 1, null, { timeout: 9000 }).catch(() => {}); t(`${D} : la voix d'accueil se déclenche (une seule lecture)`, (await p.evaluate(() => window.__lect)) === 1);
    const pret = await p.waitForFunction(() => window.__portail.etat === 'pret', null, { timeout: 14000 }).then(() => true).catch(() => false); t(`${D} : bouton « Entrer dans le Monde de Nour »`, pret);
    if (pret) await p.click('#p-entrer', { force: true });
    await p.waitForFunction(() => { const a = document.getElementById('accueil'), h = document.getElementById('hud'); return (a && !a.classList.contains('cache')) || (h && !h.classList.contains('cache')); }, null, { timeout: 45000 }).catch(() => {});
    t(`${D} : le village s'ouvre après le portail (3D)`, await p.evaluate(() => { const a = document.getElementById('accueil'), h = document.getElementById('hud'); return (a && !a.classList.contains('cache')) || (h && !h.classList.contains('cache')); }));
    for (const [nom, url] of [['Ablutions', '/ablutions/'], ['Prière', '/priere/'], ['Calendrier Ramadan', '/calendrier/']]) { await p.goto(BASE + url, { waitUntil: 'networkidle' }).catch(() => {}); t(`${D} : ${nom} s'affiche`, (await p.evaluate(() => document.body.innerText.length)) > 200); }
    t(`${D} : aucune erreur JavaScript`, errs.length === 0, errs.join(' | ')); await ctx.close();
  }
  await b.close();
}
console.log(`\n${ok} vérifications réussies, ${ko} en échec (${BASE}, mode ${MODE}).`); process.exit(ko ? 1 : 0);
