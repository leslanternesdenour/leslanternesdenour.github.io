// Parcours COMPLET du portail du Monde de Nour (ancienne « ouverture magique » aux lanternes, RESTAURÉE) dans un vrai navigateur, contre la
// préproduction locale AVEC ÉMULATEUR : parent → compte familial → profil enfant → portail (lanternes une à une, porte, voix, bouton) →
// entrée directe dans le monde → progression conservée → déconnexion / nouvelle connexion → autre enfant → retour d'un mini-jeu.
// Ordinateur ET téléphone. Aucune voix validée n'est en service : un clip d'ESSAI (la prise rejetée, jamais publiée) est servi uniquement
// dans le navigateur de test pour vérifier la synchronisation ; le scénario « sans voix » vérifie le comportement réel du site.
// Démarrer : node outils/construire.mjs && LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs 8795
// Puis : node outils/tests/portail.mjs http://localhost:8795     (script complet : bash outils/tests/portail.sh)
import { createRequire } from 'module'; import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8795';
const THREE = ['/home/user/node_modules/three', new URL('../../node_modules/three', import.meta.url).pathname].find(d => fs.existsSync(d));
const CLIP_ESSAI = new URL('../voix/lots/lot21/monde-accueil-portail-prise1.mp3', import.meta.url).pathname;
let ok = 0, ko = 0; const res = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const lancement = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] };
if (fs.existsSync('/usr/bin/google-chrome')) lancement.executablePath = '/usr/bin/google-chrome';
let nav = null;      // lancé au premier besoin : le scénario « lecture automatique refusée » tourne AVANT, dans un navigateur à part
const erreurs = [];
const BRUIT = /Transition was aborted because of invalid state/;
const COUPE = 1.12, FIN_VOIX = 3.26;

async function routes(ctx, avecVoix) {
  await ctx.route(/fonts\.(googleapis|gstatic)|ytimg|youtube|islamic\.network|alquran|googleusercontent/, r => r.abort());
  if (THREE) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  if (avecVoix) {   // clip d'ESSAI, uniquement dans ce navigateur de test (le site réel n'a aucune voix en service)
    await ctx.route(/voix\/accueil-portail\.json/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ fichier: 'essai-accueil.mp3', coupe: COUPE, finVoix: FIN_VOIX, duree: 3.631 }) }));
    await ctx.route(/voix\/essai-accueil\.mp3/, r => r.fulfill({ path: CLIP_ESSAI, contentType: 'audio/mpeg' }));
  }
}
async function contexte(mobile, avecVoix = true) {
  nav = nav || await chromium.launch(lancement);
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { viewport: { width: 1180, height: 780 }, locale: 'fr-FR' });
  await routes(ctx, avecVoix);
  // L'introduction du SITE (page d'accueil) est coupée ; le portail, lui, n'est JAMAIS contourné ici.
  await ctx.addInitScript(() => {
    try { localStorage.getItem('lanternes_intro') || localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); } catch (e) {}
    window.__voix = []; window.__lectures = 0; const p = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (/essai-accueil|accueil-portail/.test(this.src)) { window.__voix.push(this); window.__lectures++; window.__tPlay = performance.now(); } return p.apply(this, arguments); };
  });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  page.on('pageerror', x => { if (!BRUIT.test(x.message)) erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message); });
  return { ctx, page };
}
const visible = (p, s) => p.locator(s).isVisible();
const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
const attendreEtat = async (p, re, ms = 4000) => { try { await p.waitForFunction(r => new RegExp(r).test(document.getElementById('etat').textContent), re.source, { timeout: ms }); return true; } catch (e) { return false; } };
const api = (p, chemin) => p.evaluate(async c => { const r = await fetch(c, { credentials: 'same-origin' }); return { s: r.status, j: await r.json().catch(() => null) }; }, chemin);

async function inscrire(page, email, mdp) {
  await page.goto(BASE + '/compte/'); await page.click('#o-inscription'); await page.waitForSelector('#f-inscription:not(.cache)');
  await page.fill('#i-email', email); await page.fill('#i-mdp', mdp); await page.fill('#i-mdp2', mdp);
  await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf');
  await page.click('#f-inscription button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 6000 });
}
async function connecter(page, email, mdp) {
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#f-connexion:not(.cache)');
  await page.fill('#c-email', email); await page.fill('#c-mdp', mdp); await page.click('#f-connexion button[type=submit]');
  await page.waitForSelector('#v-espace:not(.cache), #f-consent:not(.cache)', { timeout: 6000 });
  if (await visible(page, '#f-consent')) { await page.check('#i-parent'); await page.check('#i-cgu'); await page.check('#i-conf'); await page.click('#f-consent button[type=submit]'); await page.waitForSelector('#v-espace:not(.cache)', { timeout: 6000 }); }
}
async function devenirFamille(page) {
  await page.click('#verif-simuler'); await attendreEtat(page, /SIMULATION/); await page.click('#verif-fait'); await page.waitForSelector('#e-verif.cache', { state: 'attached', timeout: 6000 });
  await page.goto(BASE + '/tarifs/'); await page.click('button[data-formule=famille_annuel]'); await page.waitForSelector('#p-form:not(.cache)');
  await page.check('#p-cgv'); await page.check('#p-exec'); await page.click('#p-form button[type=submit]');
  await page.waitForURL(/_emulateur\/paiement/, { timeout: 6000 }); await page.click('#payer'); await page.waitForURL(/compte\/\?paiement=ok/, { timeout: 6000 }); await page.waitForSelector('#v-espace:not(.cache)');
}
async function ajouterEnfant(page, surnom, avatar, tranche) {
  if (!(await visible(page, '#f-enfant'))) await page.click('#enf-ajouter');
  await page.fill('#enf-surnom', surnom); await page.selectOption('#enf-avatar', avatar); await page.selectOption('#enf-tranche', tranche); await page.click('#f-enfant button[type=submit]');
  await page.waitForFunction(s => [...document.querySelectorAll('#enf-liste .nom')].some(n => n.firstChild.textContent === s), surnom, { timeout: 5000 });
}
const choisir = async (page, surnom) => { await page.locator('#enf-liste .enfant', { hasText: surnom }).locator('button').first().click(); await attendreEtat(page, new RegExp(surnom + ' joue')); };

// ----- le portail (ancienne ouverture aux lanternes) dans la page /monde/ -----
async function etatPortail(page) { return page.evaluate(() => ({ actif: !!(window.__portail && window.__portail.actif), dom: !!document.getElementById('ouverture'), classes: (document.getElementById('ouverture') || {}).className || '' })); }
async function attendrePortailPret(page, ms = 16000) { try { await page.waitForFunction(() => window.__portail && window.__portail.etat === 'pret', null, { timeout: ms }); return true; } catch (e) { return false; } }
async function attendreVillage(page, ms = 40000) { try { await page.waitForFunction(() => { const h = document.getElementById('hud'); return h && !h.classList.contains('cache'); }, null, { timeout: ms }); return true; } catch (e) { return false; } }
// Observe, dans la page, l'ordre et l'instant d'allumage de chaque lanterne, l'ouverture de la porte, le salut et les légendes.
async function espionner(page) {
  await page.evaluate(() => {
    const o = document.getElementById('ouverture'); window.__j = { lanternes: [], ouverte: null, salue: null, joue: null, fr: null, ar: null };
    o.querySelectorAll('.ouv-l').forEach((e, i) => new MutationObserver(() => { if (e.classList.contains('allumee') && !window.__j.lanternes.some(x => x.i === i)) window.__j.lanternes.push({ i, t: performance.now() }); }).observe(e, { attributes: true }));
    const maj = () => { const c = o.classList, n = performance.now(); if (c.contains('joue') && !window.__j.joue) window.__j.joue = n; if (c.contains('ouverte') && !window.__j.ouverte) window.__j.ouverte = n; if (c.contains('salue') && !window.__j.salue) window.__j.salue = n; if (c.contains('ar') && !window.__j.ar) window.__j.ar = n; if (c.contains('fr') && !window.__j.fr) window.__j.fr = n; };
    new MutationObserver(maj).observe(o, { attributes: true, attributeFilter: ['class'] }); maj();
  });
}
async function verifierSequence(page, D) {
  const j = await page.evaluate(() => window.__j), ordre = [...j.lanternes].sort((a, b) => a.t - b.t), ecarts = ordre.slice(1).map((x, k) => Math.round(x.t - ordre[k].t));
  t(`${D} : les 7 lanternes s'allument UNE À UNE, du centre vers les côtés`, JSON.stringify(ordre.map(x => x.i)) === '[3,2,4,1,5,0,6]', JSON.stringify(ordre.map(x => x.i)));
  t(`${D} : rythme d'origine, une lanterne toutes les 260 ms (écarts ${ecarts.join('/')})`, ecarts.length === 6 && ecarts.every(e => e >= 200 && e <= 340));
  const dLanterne = j.ouverte - j.lanternes[0].t;
  t(`${D} : la porte s'ouvre après les lanternes (${Math.round(dLanterne)} ms après la première)`, j.ouverte > ordre[ordre.length - 1].t && dLanterne > 1700 && dLanterne < 2700);
  t(`${D} : le salut apparaît quand la porte s'ouvre (${Math.round(j.salue - j.ouverte)} ms après)`, j.salue > j.ouverte && j.salue - j.ouverte < 900);
  return j;
}
async function entrerParPortail(page, nom) {            // du portail au village : attend le bouton puis entre
  await page.waitForFunction(() => window.__portail !== undefined, null, { timeout: 8000 });
  const pret = await attendrePortailPret(page);
  t(`${nom} : le portail arrive au bouton « Entrer dans le Monde de Nour »`, pret);
  if (pret) await page.click('#p-entrer', { force: true });
  return pret;
}

async function parcours(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur', MDP = 'motdepasse-P1';
  const email = `portail.${mobile ? 'tel' : 'pc'}.${Date.now()}@local.test`;
  const { ctx, page } = await contexte(mobile);

  // ===== 1. Parent : compte familial, deux enfants =====
  await inscrire(page, email, MDP); await devenirFamille(page);
  t(`${D} : parent connecté, formule Famille (paiement simulé)`, /Famille/.test(await page.locator('#e-statut').textContent()));
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  await ajouterEnfant(page, 'Lina', 'fille', '3-5'); await ajouterEnfant(page, 'Yanis', 'garcon', '6-10');
  await choisir(page, 'Lina');
  const lina = JSON.parse(await ls(page, 'ldn_profil_actif') || 'null');
  t(`${D} : profil enfant Lina actif (synchronisé)`, lina && lina.surnom === 'Lina' && lina.synchro === true && lina.tranche === '3-5');
  const idLina = lina && lina.id;
  const liste1 = await api(page, '/api/enfants');

  // ===== 2. « Entrer dans le monde » : le portail aux lanternes =====
  await page.click('#entrer'); await page.waitForURL(/\/monde\//, { timeout: 8000 });
  await page.waitForFunction(() => window.__portail && document.getElementById('ouverture'), null, { timeout: 8000 });
  await espionner(page);
  const e0 = await etatPortail(page);
  t(`${D} : après le choix de l'enfant, le portail s'affiche`, e0.actif && e0.dom);
  t(`${D} : toutes les lanternes sont éteintes et la porte fermée au début`, await page.evaluate(() => document.querySelectorAll('.ouv-l.allumee').length === 0 && !document.getElementById('ouverture').classList.contains('ouverte')));
  await page.waitForFunction(() => window.__j && window.__j.salue, null, { timeout: 12000 }).catch(() => {});
  await verifierSequence(page, D);
  t(`${D} : le portail montre le prénom de l'enfant qui entre`, /Lina/.test(await page.locator('#p-enfant').textContent().catch(() => '')));
  await page.waitForFunction(() => window.__lectures >= 1, null, { timeout: 5000 }).catch(() => {});
  const dPlay = await page.evaluate(() => Math.round(window.__tPlay - window.__j.salue));
  t(`${D} : la voix se déclenche automatiquement avec la bienvenue (${dPlay} ms d'écart avec le salut)`, await page.evaluate(() => window.__lectures >= 1 && Math.abs(window.__tPlay - window.__j.salue) < 400));
  t(`${D} : « مَرْحَبًا » apparaît avec la voix`, await page.evaluate(() => !!window.__j.ar && Math.abs(window.__j.ar - window.__tPlay) < 500));
  await page.waitForFunction(() => window.__j.fr, null, { timeout: 6000 }).catch(() => {});
  const dFr = await page.evaluate(() => Math.round(window.__j.fr - window.__tPlay));
  t(`${D} : « Bienvenue dans le Monde de Nour » apparaît quand la voix passe au français (${dFr} ms après le début, attendu ~${Math.round(COUPE * 1000)})`, dFr > COUPE * 1000 - 350 && dFr < COUPE * 1000 + 450);
  const pret = await attendrePortailPret(page); t(`${D} : le bouton « Entrer dans le Monde de Nour » apparaît à la fin de la voix`, pret && (await visible(page, '#p-entrer')));
  const lect1 = await page.evaluate(() => window.__lectures);
  t(`${D} : une seule lecture automatique de la voix (aucune répétition involontaire) : ${lect1}`, lect1 === 1);
  t(`${D} : aucune musique pendant le portail`, await page.evaluate(() => !/nasheed/.test(performance.getEntriesByType('resource').map(r => r.name).join(' '))));
  await page.click('#p-reecouter'); await page.waitForTimeout(500);
  t(`${D} : « Réécouter l'accueil » relance la voix (2e lecture, demandée)`, (await page.evaluate(() => window.__lectures)) === 2);
  await page.waitForTimeout(3700);
  await page.click('#p-entrer', { force: true });
  await page.waitForTimeout(300);
  const eS = await etatPortail(page);
  t(`${D} : sortie en cours (fondu et zoom d'origine), le portail ne bloque plus`, eS.actif === false && /fin/.test(eS.classes));

  // ===== 3. Entrée directe dans SON village, sans « Qui joue ? » =====
  const village = await attendreVillage(page);
  t(`${D} : le village de Lina s'affiche directement (aucun écran « Qui joue ? »)`, village && !(await visible(page, '#accueil')));
  await page.waitForTimeout(1900);
  t(`${D} : le portail est retiré de la page après la transition`, !(await etatPortail(page)).dom);
  const mondeLina = JSON.parse(await ls(page, 'monde') || '{}');
  t(`${D} : âge et personnage viennent du profil (3-5 ans → petits, fille)`, mondeLina.age === 'petits' && mondeLina.personnage && mondeLina.personnage.genre === 'fille', JSON.stringify([mondeLina.age, mondeLina.personnage]));
  t(`${D} : le village affiche l'enfant qui joue`, /Lina/.test(await page.locator('#qui-joue').textContent().catch(() => '')));

  // ===== 4. Progression : jouer, changer de page, retour d'un mini-jeu (pas de portail) =====
  await page.evaluate(() => localStorage.setItem('ablutions', JSON.stringify({ g1: 3, g2: 3, learned: 1, vu: 1 })));
  await page.evaluate(() => localStorage.setItem('monde_voyage', JSON.stringify({ v: 1, zones: ['camp', 'oasis'], lus: ['m1', 'm2', 'm3'], pieces: 120, objets: ['lanterne', 'tapis'], missions: { m1: true, m2: true }, niveau: 3 })));
  await page.evaluate(() => dispatchEvent(new Event('ldn:fin-activite'))); await page.waitForTimeout(900);
  await page.goto(BASE + '/ablutions/'); await page.waitForTimeout(400);
  await page.goto(BASE + '/monde/'); await page.waitForTimeout(1200);
  const eR = await etatPortail(page);
  t(`${D} : retour d'un mini-jeu → pas de portail (même session)`, !eR.actif && !eR.dom);
  t(`${D} : retour d'un mini-jeu → l'enfant retrouve directement son village`, await attendreVillage(page) && !(await visible(page, '#accueil')));
  const etoiles1 = parseInt(await page.locator('#nb-etoiles').textContent(), 10);
  t(`${D} : les étoiles gagnées sont affichées dans le village (${etoiles1})`, etoiles1 > 0);
  await page.reload(); await page.waitForTimeout(1200);
  t(`${D} : rechargement de la page → pas de portail`, !(await etatPortail(page)).actif);

  // ===== 5. Déconnexion, nouvelle connexion, autre appareil : la progression revient du compte, rien n'est recréé =====
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  await page.click('#deconnexion'); await page.waitForSelector('#v-acces:not(.cache)', { timeout: 6000 });
  t(`${D} : déconnexion → plus de profil actif sur l'appareil`, (await ls(page, 'ldn_profil_actif')) === null);
  await page.evaluate(() => localStorage.clear());     // comme un nouvel appareil : plus aucune donnée locale
  await connecter(page, email, MDP); await page.waitForSelector('#v-enfants:not(.cache)');
  await choisir(page, 'Lina');
  const ablu = JSON.parse(await ls(page, 'ablutions') || 'null');
  t(`${D} : nouvelle connexion → la progression de Lina est récupérée depuis le compte`, ablu && ablu.g1 === 3 && ablu.g2 === 3, JSON.stringify(ablu));
  const voyage = JSON.parse(await ls(page, 'monde_voyage') || 'null');
  t(`${D} : nouvelle connexion → pièces, objets, missions, niveau et zones du Grand Voyage sont récupérés`, voyage && voyage.pieces === 120 && voyage.niveau === 3 && voyage.objets.join() === 'lanterne,tapis' && voyage.missions.m2 === true && voyage.zones.join() === 'camp,oasis' && voyage.lus.length === 3, JSON.stringify(voyage));
  const liste2 = await api(page, '/api/enfants');
  t(`${D} : les profils n'ont pas été recréés (mêmes ${liste1.j.enfants.length} enfants, même identifiant)`, liste2.j.enfants.length === liste1.j.enfants.length && liste2.j.enfants.some(e => e.id === idLina));
  await page.click('#entrer'); await page.waitForURL(/\/monde\//, { timeout: 8000 });
  await page.waitForFunction(() => window.__portail, null, { timeout: 8000 });
  t(`${D} : nouvelle connexion → le portail revient`, (await etatPortail(page)).actif);
  await entrerParPortail(page, D + ' (nouvelle session)');
  t(`${D} : après la reconnexion, village direct avec ses étoiles et son personnage`, await attendreVillage(page) && !(await visible(page, '#accueil')) && parseInt(await page.locator('#nb-etoiles').textContent(), 10) === etoiles1);
  const mondeL2 = JSON.parse(await ls(page, 'monde') || '{}');
  t(`${D} : le personnage choisi n'a pas été réinitialisé`, mondeL2.personnage && mondeL2.personnage.genre === 'fille');

  // ===== 6. Autre enfant : nouvelle session de jeu, son propre village, rien de Lina =====
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)');
  await choisir(page, 'Yanis');
  t(`${D} : Yanis repart avec sa propre progression (pas celle de Lina)`, (await ls(page, 'ablutions')) === null);
  await page.click('#entrer'); await page.waitForURL(/\/monde\//, { timeout: 8000 });
  await page.waitForFunction(() => window.__portail, null, { timeout: 8000 });
  t(`${D} : un autre enfant = nouvelle session, le portail s'affiche`, (await etatPortail(page)).actif);
  await entrerParPortail(page, D + ' Yanis');
  await attendreVillage(page);
  const mondeY = JSON.parse(await ls(page, 'monde') || '{}');
  t(`${D} : profil de Yanis → 6-10 ans (grands), garçon`, mondeY.age === 'grands' && mondeY.personnage && mondeY.personnage.genre === 'garcon', JSON.stringify([mondeY.age, mondeY.personnage]));
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)'); await choisir(page, 'Lina');
  t(`${D} : on retrouve Lina avec ses progrès`, JSON.parse(await ls(page, 'ablutions') || '{}').g2 === 3);
  await ctx.close();
}

// Le site RÉEL : aucune voix validée en service → la séquence se déroule en silence, légendes et bouton compris.
async function visiteurSansVoix(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur';
  const { ctx, page } = await contexte(mobile, false);
  await page.goto(BASE + '/monde/');
  t(`${D} (visiteur sans compte, sans voix en service) : le portail s'affiche aussi à la première entrée`, await page.waitForFunction(() => window.__portail && window.__portail.actif && document.getElementById('ouverture'), null, { timeout: 8000 }).then(() => true).catch(() => false));
  await espionner(page);
  await page.waitForFunction(() => window.__j && window.__j.salue, null, { timeout: 12000 }).catch(() => {});
  await verifierSequence(page, D + ' (sans voix)');
  t(`${D} (sans voix) : aucune lecture audio, bouton « Réécouter » absent`, (await page.evaluate(() => window.__lectures)) === 0 && !(await visible(page, '#p-reecouter')));
  t(`${D} (sans voix) : les légendes s'affichent quand même (مَرْحَبًا puis la phrase française)`, await page.waitForFunction(() => document.getElementById('ouverture').classList.contains('fr'), null, { timeout: 8000 }).then(() => true).catch(() => false));
  await entrerParPortail(page, D + ' (sans voix)');
  await page.waitForFunction(() => { const a = document.getElementById('accueil'); return a && !a.classList.contains('cache'); }, null, { timeout: 40000 }).catch(() => {});
  t(`${D} (visiteur) : après le portail, l'écran « Qui joue ? » s'affiche`, await visible(page, '#accueil'));
  await ctx.close();
}

// Lecture automatique REFUSÉE par le navigateur : comme dans l'ancienne version, l'enfant TOUCHE LA PORTE ; la séquence et la voix démarrent alors ensemble.
async function autoplayRefuse() {
  const { executablePath, ...sansChemin } = lancement;      // Chromium fourni : applique la vraie politique de refus de la lecture automatique
  const b2 = await chromium.launch({ ...sansChemin, args: sansChemin.args.filter(a => !/autoplay/.test(a)) });
  const ctx = await b2.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await routes(ctx, true);
  await ctx.addInitScript(() => { window.__lectures = 0; const p = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { if (/essai-accueil/.test(this.src)) window.__lectures++; return p.apply(this, arguments); }; });
  const page = await ctx.newPage();
  await page.goto(BASE + '/monde/');
  await page.waitForTimeout(3000);     // attente PASSIVE : interroger la page pendant le chargement lui donnerait une « interaction utilisateur » (Playwright) et autoriserait la lecture
  const avant = await page.evaluate(() => ({ voix: window.__portail.voix, lanternes: document.querySelectorAll('.ouv-l.allumee').length, cls: document.getElementById('ouverture').className, invite: getComputedStyle(document.getElementById('ouv-invite')).display }));
  t('Autoplay refusé : l\'invitation « ✨ Touche la porte pour entrer ✨ » de l\'ancienne version est affichée', avant.invite !== 'none' && avant.voix === 'toucher', JSON.stringify(avant));
  t('Autoplay refusé : rien ne démarre tout seul (lanternes éteintes, aucune voix)', avant.lanternes === 0 && (await page.evaluate(() => window.__lectures)) === 0);
  await page.tap('#ouv-porte'); await espionner(page);
  await page.waitForFunction(() => window.__lectures >= 1, null, { timeout: 8000 }).catch(() => {});
  t('Autoplay refusé : un toucher sur la porte lance la séquence ET la voix (une seule lecture)', (await page.evaluate(() => window.__lectures)) === 1 && (await page.evaluate(() => document.querySelectorAll('.ouv-l.allumee').length)) >= 1);
  t('Autoplay refusé : puis la séquence se termine normalement (bouton « Entrer »)', await attendrePortailPret(page));
  await ctx.close(); await b2.close();
}

await autoplayRefuse();
for (const mobile of [false, true]) { await parcours(mobile); await visiteurSansVoix(mobile); }
t('Aucune erreur JavaScript pendant tout le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
if (nav) await nav.close();
console.log(res.join('\n')); console.log(`\n${ok} vérifications réussies, ${ko} en échec.`);
process.exit(ko ? 1 : 0);
