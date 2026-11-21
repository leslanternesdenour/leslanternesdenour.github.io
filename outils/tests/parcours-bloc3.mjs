// BLOC 3 — parcours dans Chrome (ordinateur et téléphone) contre la préproduction locale AVEC ÉMULATEUR et le PACK PRIVÉ simulé :
// zones Premium du Voyage, Chasse aux mots, aperçu Créateur « voir comme », révocation, expiration, absence de fuite en cache.
// bash outils/tests/parcours-bloc3.sh   (le pack privé est lu depuis LDN_PREMIUM_DIR, jamais copié dans le dépôt)
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8793', MDP_CREATEUR = process.env.LDN_EMUL_MDP_CREATEUR || 'createur-local-123';
const EXTERNE = /fonts\.(googleapis|gstatic)|ytimg|youtube|jsdelivr|gstatic|islamic\.network|alquran|googleusercontent/;
let ok = 0, ko = 0; const res = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const nav = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const erreurs = [], reseau = [], BRUIT = /Transition was aborted/;
async function contexte(mobile) {
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { viewport: { width: 1280, height: 800 }, locale: 'fr-FR' });
  await ctx.route(EXTERNE, r => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); localStorage.setItem('ldn_ouverture_vue', '1'); } catch (e) {} });
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  page.on('pageerror', x => BRUIT.test(x.message) || erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message));
  page.on('response', r => { if (r.status() >= 400) reseau.push(r.status() + ' ' + r.url().replace(BASE, '')); });
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) erreurs.push('CSP ' + m.text().slice(0, 160)); });
  return { ctx, page };
}
const api = (p, chemin, o = {}) => p.evaluate(async ([c, o]) => { const r = await fetch(c, { method: o.m || 'GET', headers: o.m ? { 'X-LDN': '1', 'Content-Type': 'application/json' } : {}, body: o.b ? JSON.stringify(o.b) : undefined });
  return { s: r.status, cc: r.headers.get('cache-control'), j: await r.json().catch(() => null) }; }, [chemin, o]);
const ZONE = '/api/premium/voyage/camp/contenu.json', MAISON = '/api/premium/maisons/mots/';
async function inscrire(page, email, mdp = 'motdepasse-1') {
  await page.goto(BASE + '/compte/'); await page.click('#o-inscription'); await page.waitForSelector('#f-inscription:not(.cache)');
  await page.fill('#i-email', email); await page.fill('#i-mdp', mdp); await page.fill('#i-mdp2', mdp);
  await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf');
  await page.click('#f-inscription button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 });
}
async function connecter(page, email, mdp) {
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#f-connexion:not(.cache)');
  await page.fill('#c-email', email); await page.fill('#c-mdp', mdp); await page.click('#f-connexion button[type=submit]');
  await page.waitForSelector('#v-espace:not(.cache), #f-consent:not(.cache)', { timeout: 5000 });
  if (await page.locator('#f-consent').isVisible()) { await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf'); await page.click('#f-consent button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 5000 }); }
}
const etatTxt = p => p.locator('#etat').textContent();
async function verifierEmail(page) { await page.click('#verif-simuler'); await page.waitForFunction(() => /SIMULATION/.test(document.getElementById('etat').textContent), null, { timeout: 4000 }); await page.click('#verif-fait'); await page.waitForSelector('#e-verif.cache', { state: 'attached', timeout: 4000 }); }
const horsCache = async p => p.evaluate(async () => { const r = []; for (const n of await caches.keys()) for (const q of await (await caches.open(n)).keys()) r.push(new URL(q.url).pathname); return r; });
// joue une partie complète de « Les paires » puis « Le bon mot » dans une page de la maison (ou son cadre)
async function jouer(f, motsFr, mobile, etiquette) {
  await f.waitForSelector('#e-menu:not(.cache)', { timeout: 8000 });
  t(`${etiquette} : le menu de la maison s'affiche`, true);
  await f.click('#vers-paires'); await f.waitForSelector('#grille .carte');
  const ids = await f.$$eval('#grille .carte', cs => cs.map(c => c.dataset.id)), uniques = [...new Set(ids)];
  t(`${etiquette} : la grille contient des paires image/mot`, ids.length === uniques.length * 2 && uniques.length >= 3, ids.length + ' cartes');
  for (const id of uniques) {
    await f.locator(`#grille .carte[data-id="${id}"][data-type=image]:not(.trouvee)`).click(); await f.locator(`#grille .carte[data-id="${id}"][data-type=mot]:not(.trouvee)`).click();
    await f.waitForSelector('#fiche:not(.cache)', { timeout: 3000 }); await f.click('#f-ok'); await f.waitForSelector('#fiche.cache', { state: 'attached' });
  }
  await f.waitForSelector('#e-bravo:not(.cache)', { timeout: 6000 }); t(`${etiquette} : « Les paires » se termine par un bravo avec des étoiles`, /⭐/.test(await f.textContent('#b-etoiles')));
  await f.click('#retour-menu'); await f.click('#vers-bonmot'); await f.waitForSelector('#reponses button');
  for (let i = 0; i < 6; i++) {
    const fr = await f.textContent('#q-fr'), bon = motsFr[fr.trim()]; if (!bon) { t(etiquette + ' : mot inconnu ' + fr, false); break; }
    await f.click(`#reponses button[data-id="${bon}"]`);
    await f.waitForSelector('#fiche:not(.cache)', { timeout: 3000 }); await f.click('#f-ok');
    if (i < 5) await f.waitForFunction(() => !document.getElementById('fiche') || document.getElementById('fiche').classList.contains('cache'));
  }
  await f.waitForSelector('#e-bravo:not(.cache)', { timeout: 6000 }); t(`${etiquette} : « Le bon mot » se termine par un bravo`, true);
  await f.click('#retour-menu'); await f.click('#vers-carnet'); await f.waitForSelector('#liste-mots li');
  const appris = await f.locator('#liste-mots li:not(.cache-mot)').count(); t(`${etiquette} : le carnet montre les mots trouvés`, appris >= 4, appris + ' mots');
  const mots = await f.locator('#liste-mots .arabe').allTextContents(); t(`${etiquette} : l'arabe vérifié est affiché en vocalisé, de droite à gauche`, mots.length > 0 && mots.every(m => /[ً-ْ]/.test(m)) && await f.locator('#liste-mots .arabe[dir=rtl]').count() > 0);
}

try {
// ===== A. Comptes : gratuit, Premium (invitation), Créateur =====
const ID = Date.now().toString(36);
const gratuit = `gratuit.${ID}@local.test`, proche = `proche.${ID}@local.test`;
let motsFr = {};
{ // anonyme
  const { ctx, page } = await contexte(true); await page.goto(BASE + '/');
  const z = await api(page, ZONE), m = await api(page, MAISON), v = await api(page, '/api/premium/voyage/village/contenu.json');
  t('Anonyme : zone Premium du Voyage refusée (401)', z.s === 401); t('Anonyme : « Chasse aux mots » refusée (401)', m.s === 401);
  t('Anonyme : réponse de refus jamais mise en cache', /no-store/.test(z.cc || ''), z.cc);
  t('Anonyme : la page /apercu/ est refusée', (await page.goto(BASE + '/apercu/'), await page.waitForSelector('#v-refus:not(.cache)', { timeout: 4000 }).then(() => true, () => false)));
  await ctx.close();
}
{ // gratuit
  const { ctx, page } = await contexte(true); await inscrire(page, gratuit);
  t('Gratuit : zone Premium refusée (403)', (await api(page, ZONE)).s === 403); t('Gratuit : « Chasse aux mots » refusée (403)', (await api(page, MAISON)).s === 403);
  const cat = await api(page, '/api/catalogue'); t('Gratuit : le catalogue indique les zones avancées fermées, le village ouvert', cat.j.catalogue.voyage.camp.ouvert === false && cat.j.catalogue.voyage.village.ouvert === true);
  t('Gratuit : le cookie « voir comme » est sans effet', (await page.context().addCookies([{ name: 'ldn_vue', value: 'premium', url: BASE }]), (await api(page, ZONE)).s === 403));
  await page.goto(BASE + '/apercu/'); t('Gratuit : /apercu/ est refusé', await page.waitForSelector('#v-refus:not(.cache)', { timeout: 4000 }).then(() => true, () => false));
  t('Gratuit : l\'API d\'inventaire privé est refusée', (await api(page, '/api/admin/premium')).s === 403);
  await ctx.close();
}
var ctxC = await contexte(false), C = ctxC.page; // Créateur, ordinateur
await connecter(C, 'createur@local.test', MDP_CREATEUR);
{
  t('Créateur : zone Premium autorisée (200)', (await api(C, ZONE)).s === 200);
  const z = await api(C, ZONE); t('Créateur : contenu servi avec Cache-Control private, no-store', /private, no-store/.test(z.cc || ''), z.cc);
  t('Créateur : le pack contient les textes (format ldn-pack-voyage-1)', z.j && z.j.format === 'ldn-pack-voyage-1' && Object.keys(z.j.points || {}).length > 0);
  const m = await api(C, '/api/premium/maisons/mots/mots.json'); t('Créateur : mots vérifiés servis par le serveur', m.s === 200 && m.j.mots.length >= 8, m.j && m.j.mots.length + ' mots');
  motsFr = Object.fromEntries(m.j.mots.map(x => [x.fr, x.id]));
  t('Mots : chaque mot arabe est accompagné de sa lecture et de son sens', m.j.mots.every(x => x.ar && x.dit && x.fr && x.phrase));
  t('Mots : aucune synthèse vocale arabe (pas de speechSynthesis/voix arabe dans la maison)', !/speechSynthesis|SpeechSynthesisUtterance/.test(await (await C.request.get(BASE + '/api/premium/maisons/mots/jeu.js')).text()));
}
// ===== B. Aperçu Créateur : modes =====
{
  await C.goto(BASE + '/apercu/'); await C.waitForSelector('#v-apercu:not(.cache)', { timeout: 6000 }); await C.waitForSelector('#t-contenus tr[data-contenu]');
  t('Aperçu : liste des maisons, zones et missions avec leur état publié / non publié', await C.locator('#t-contenus tr[data-contenu]').count() >= 17);
  const etatMots = await C.locator('tr[data-contenu="maisons/mots"] .etat-pub').textContent(); t('Aperçu : « Chasse aux mots » est marquée Non publiée', /Non publié/.test(etatMots), etatMots);
  t('Aperçu : le stockage privé contient bien la maison', /\d+ fichier/.test(await C.locator('tr[data-contenu="maisons/mots"] td').nth(3).textContent()));
  const ouvert = s => C.locator(`tr[data-contenu="${s}"] td`).nth(2).textContent();
  t('Mode Créateur : tout est ouvert', /ouvert/.test(await ouvert('voyage/camp')) && /ouvert/.test(await ouvert('maisons/mots')));
  for (const [mode, camp, village, mots] of [['visiteur', false, true, false], ['gratuit', false, true, false], ['premium', true, true, false], ['famille', true, true, false]]) {
    await C.click(`#modes button[data-vue="${mode}"]`); await C.waitForFunction(m => document.getElementById('vue-actuelle').textContent.toLowerCase().includes(m), mode === 'visiteur' ? 'visiteur' : mode);
    await C.waitForTimeout(300);
    const [a, b, c] = [await ouvert('voyage/camp'), await ouvert('voyage/village'), await ouvert('maisons/mots')];
    t(`Mode ${mode} : zone Premium ${camp ? 'ouverte' : 'fermée'}, village ouvert, maison non publiée fermée`, /✓/.test(a) === camp && /✓/.test(b) === village && /✓/.test(c) === mots, [a, b, c].join(' | '));
    const z = await api(C, ZONE); t(`Mode ${mode} : le serveur répond ${camp ? 200 : (mode === 'visiteur' ? 401 : 403)} à la zone Premium`, z.s === (camp ? 200 : (mode === 'visiteur' ? 401 : 403)), String(z.s));
    t(`Mode ${mode} : le vrai compte Créateur n'est pas modifié (l'administration reste accessible)`, (await api(C, '/api/admin/premium')).s === 200);
  }
  if (process.env.CAPTURES) await C.screenshot({ path: '/tmp/apercu-bureau.png', fullPage: true });
  await C.click('#modes button[data-vue=""]'); await C.waitForTimeout(300); t('Retour au mode Créateur', (await api(C, ZONE)).s === 200 && /ouvert/.test(await ouvert('maisons/mots')));
  // le village affiche la maison selon le mode
  await C.goto(BASE + '/monde/'); await C.waitForTimeout(1200);
}
// ===== C. Chasse aux mots : jouer en Créateur (aperçu), sur ordinateur =====
{
  await C.goto(BASE + '/apercu/'); await C.waitForSelector('tr[data-contenu="maisons/mots"] button');
  await C.click('tr[data-contenu="maisons/mots"] button'); const cadre = C.frameLocator('iframe.telephone'); await C.waitForSelector('iframe.telephone');
  const frame = C.frames().find(f => f.url().includes('/api/premium/maisons/mots/')); t('Aperçu : la maison s\'ouvre dans un cadre « téléphone »', !!frame);
  if (frame) { t('Aperçu : bandeau « APERÇU CRÉATEUR — non publiée » affiché', await frame.waitForSelector('#bandeau-apercu:not(.cache)', { timeout: 6000 }).then(() => true, () => false)); await jouer(frame, motsFr, true, 'Aperçu (cadre)'); }
  await C.goto(BASE + MAISON); await jouer(C, motsFr, false, 'Ordinateur 1280 px');
  t('Ordinateur : aucun défilement horizontal', (await C.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
}
// ===== D. Compte Premium (invitation du Créateur) =====
{ const M = await contexte(true); await connecter(M.page, 'createur@local.test', MDP_CREATEUR); await M.page.goto(BASE + '/apercu/'); await M.page.waitForSelector('#t-contenus tr[data-contenu]');
  t('Téléphone 390 px : /apercu/ sans défilement horizontal', (await M.page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1, String(await M.page.evaluate(() => document.documentElement.scrollWidth - innerWidth)));
  if (process.env.CAPTURES) await M.page.screenshot({ path: '/tmp/apercu-mobile.png', fullPage: true });
  await M.page.click('#modes button[data-vue="gratuit"]'); await M.page.waitForTimeout(400); t('Téléphone : bascule en mode Gratuit', /compte Gratuit/.test(await M.page.textContent('#vue-actuelle')));
  await M.page.click('#modes button[data-vue=""]'); await M.ctx.close(); }
var P = await contexte(true);
{
  await inscrire(P.page, proche); await verifierEmail(P.page);
  await C.goto(BASE + '/admin/'); // ré-authentification récente déjà faite à la connexion
  const inv = await api(C, '/api/admin/invitations', { m: 'POST', b: { email: proche, niveau: 'premium', dureeJours: 30 } }); t('Créateur : invitation Premium créée', inv.s === 200 || inv.s === 201, JSON.stringify(inv.j));
  const code = decodeURIComponent(inv.j.lien.split('invite=')[1]);
  t('Invitation activée par le proche', (await api(P.page, '/api/invitations/activer', { m: 'POST', b: { code } })).s === 200);
  t('Premium : zone Premium autorisée (200)', (await api(P.page, ZONE)).s === 200);
  t('Premium : « Chasse aux mots » (non publiée) reste fermée (403)', (await api(P.page, MAISON)).s === 403);
  const cat = await api(P.page, '/api/catalogue'); t('Premium : le catalogue ne montre aucune maison non publiée comme ouverte', cat.j.catalogue.maisons.mots.ouvert === false && cat.j.catalogue.maisons.mots.publie === false);
  // le Créateur publie la maison en Premium depuis l'aperçu
  await C.goto(BASE + '/apercu/'); await C.waitForSelector('tr[data-contenu="maisons/mots"] select');
  await C.selectOption('tr[data-contenu="maisons/mots"] select', 'premium'); await C.waitForFunction(() => /Publié · Premium/.test(document.querySelector('tr[data-contenu="maisons/mots"] .etat-pub').textContent));
  t('Aperçu : publication de la maison en Premium', true);
  t('Premium : la maison publiée s\'ouvre (200)', (await api(P.page, MAISON)).s === 200);
  await P.page.goto(BASE + MAISON); await jouer(P.page, motsFr, true, 'Téléphone 390 px (Premium)');
  t('Téléphone : aucun défilement horizontal', (await P.page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  t('Téléphone : pas de bandeau Créateur pour une maison publiée', await P.page.locator('#bandeau-apercu.cache').count() === 1);
  // aucune fuite en cache
  const c1 = await horsCache(P.page); t('Aucune réponse Premium dans Cache Storage (compte Premium)', !c1.some(u => /^\/api\/|\/premium\//.test(u)), c1.join(','));
  const cc = (await api(P.page, MAISON)).cc; t('En-tête privé de la maison : private, no-store', /private, no-store/.test(cc || ''), cc);
  // le pack ne passe pas par les pages publiques
  for (const u of ['/voyage/camp/contenu.json', '/maisons/mots/index.html', '/maisons/mots/mots.json', '/premium/voyage/camp/contenu.json'])
    t('Public : ' + u + ' n\'existe pas (404)', (await P.page.request.get(BASE + u)).status() === 404);
  // gratuit : la maison publiée reste fermée
  await C.goto(BASE + '/apercu/');
  // révocation du Premium
  const acces = (await api(C, '/api/admin/acces')).j.acces.find(a => a.email === proche || a.emailMasque !== undefined || true);
  const liste = (await api(C, '/api/admin/acces')).j.acces; const monAcces = liste.find(a => JSON.stringify(a).includes(proche.split('@')[0])) || liste[liste.length - 1];
  t('Créateur : révocation de l\'accès du proche', (await api(C, `/api/admin/acces/${monAcces.id}/revoquer`, { m: 'POST' })).s === 200);
  t('Révocation : zone Premium aussitôt refusée (403)', (await api(P.page, ZONE)).s === 403);
  t('Révocation : maison publiée Premium aussitôt refusée (403)', (await api(P.page, MAISON)).s === 403);
  await P.page.goto(BASE + MAISON); await P.page.waitForTimeout(800);
  t('Révocation : la page de la maison ne s\'affiche plus', !(await P.page.locator('#e-menu:not(.cache)').count()), await P.page.title());
  const c2 = await horsCache(P.page); t('Après révocation : toujours rien de Premium en cache', !c2.some(u => /^\/api\/|\/premium\//.test(u)));
  // retrait de la maison (non publiée à nouveau)
  await C.goto(BASE + '/apercu/'); await C.waitForSelector('tr[data-contenu="maisons/mots"] select'); await C.selectOption('tr[data-contenu="maisons/mots"] select', 'apercu');
  await C.waitForFunction(() => /Non publié/.test(document.querySelector('tr[data-contenu="maisons/mots"] .etat-pub').textContent)); t('Aperçu : maison retirée de la publication', true);
  // expiration : nouvelle invitation de 1 jour, puis horloge simulée +2 jours
  const inv2 = await api(C, '/api/admin/invitations', { m: 'POST', b: { email: proche, niveau: 'premium', dureeJours: 1 } });
  if (inv2.s === 200 || inv2.s === 201) {
    t('Nouvelle invitation d\'1 jour activée', (await api(P.page, '/api/invitations/activer', { m: 'POST', b: { code: decodeURIComponent(inv2.j.lien.split('invite=')[1]) } })).s === 200);
    t('Avant expiration : zone Premium autorisée', (await api(P.page, ZONE)).s === 200);
    await api(P.page, '/api/_emulateur/horloge', { m: 'POST', b: { jours: 2 } });
    await P.page.goto(BASE + '/compte/'); await connecter(P.page, proche, 'motdepasse-1').catch(() => {});
    t('Après expiration (horloge simulée +2 jours) : zone Premium refusée', (await api(P.page, ZONE)).s === 403);
  } else t('Nouvelle invitation après révocation', false, inv2.s + ' ' + JSON.stringify(inv2.j));
}
} catch (e) { t('Parcours interrompu', false, e.message.split('\n')[0]); }
if (process.env.DIAG) console.log('RÉSEAU', reseau.slice(-15).join('\n  '), '\nERREURS', erreurs.slice(-5));
t('Aucune erreur JavaScript ni violation CSP pendant tous les parcours', erreurs.length === 0, erreurs.slice(0, 4).join(' / '));
await nav.close();
console.log(res.join('\n')); console.log(`\n${ok} réussis, ${ko} échoués`); process.exit(ko ? 1 : 0);
