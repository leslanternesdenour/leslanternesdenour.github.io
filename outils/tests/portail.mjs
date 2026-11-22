// Parcours COMPLET du portail du Monde de Nour dans un vrai navigateur, contre la préproduction locale AVEC ÉMULATEUR :
// parent → compte familial → profil enfant → portail (voix + portes synchronisées) → entrée directe dans le monde → progression
// conservée → déconnexion / nouvelle connexion → autre enfant → retour d'un mini-jeu. Ordinateur ET téléphone.
// Démarrer : node outils/construire.mjs && LDN_EMULATEUR=1 LDN_EMUL_MDP_CREATEUR=createur-local-123 node outils/serveur-preprod.mjs 8795
// Puis : node outils/tests/portail.mjs http://localhost:8795     (script complet : bash outils/tests/portail.sh)
import { createRequire } from 'module'; import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8795';
const THREE = ['/home/user/node_modules/three', new URL('../../node_modules/three', import.meta.url).pathname].find(d => fs.existsSync(d));
let ok = 0, ko = 0; const res = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const lancement = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] };
if (fs.existsSync('/usr/bin/google-chrome')) lancement.executablePath = '/usr/bin/google-chrome';
let nav = null;      // lancé au premier besoin : le scénario « lecture automatique refusée » tourne AVANT, dans un navigateur à part
const erreurs = [];
const BRUIT = /Transition was aborted because of invalid state/;

async function contexte(mobile) {
  nav = nav || await chromium.launch(lancement);
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { viewport: { width: 1180, height: 780 }, locale: 'fr-FR' });
  await ctx.route(/fonts\.(googleapis|gstatic)|ytimg|youtube|islamic\.network|alquran|googleusercontent/, r => r.abort());
  if (THREE) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  // L'introduction du SITE (page d'accueil) est coupée ; le portail, lui, n'est JAMAIS contourné ici. Les lectures audio sont enregistrées.
  await ctx.addInitScript(() => {
    try { localStorage.getItem('lanternes_intro') || localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); } catch (e) {}
    window.__voix = []; const p = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { if (/accueil-portail/.test(this.src)) { window.__voix.push(this); window.__lectures = (window.__lectures || 0) + 1; } return p.apply(this, arguments); };
  });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept());
  page.on('pageerror', x => { if (!BRUIT.test(x.message)) erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message); });
  return { ctx, page };
}
const visible = (p, s) => p.locator(s).isVisible();
const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
const etat = p => p.locator('#etat').textContent();
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

// ----- le portail dans la page /monde/ -----
async function etatPortail(page) { return page.evaluate(() => ({ actif: !!(window.__portail && window.__portail.actif), dom: !!document.getElementById('portail'), classes: (document.getElementById('portail') || {}).className || '' })); }
async function attendrePortailPret(page, ms = 14000) { try { await page.waitForFunction(() => window.__portail && window.__portail.etat === 'pret', null, { timeout: ms }); return true; } catch (e) { return false; } }
async function attendreVillage(page, ms = 40000) { try { await page.waitForFunction(() => { const h = document.getElementById('hud'); return h && !h.classList.contains('cache'); }, null, { timeout: ms }); return true; } catch (e) { return false; } }
// Échantillonne voix et portes ensemble : la porte doit suivre la voix à quelques pour cent près.
async function mesurerSynchro(page) {
  return page.evaluate(async () => {
    const cues = await (await fetch('voix/accueil-portail.json')).json(), L = window.PortailLogique, mesures = [];
    const a = window.__voix[0]; if (!a) return { mesures: [], cues };
    const fin = performance.now() + 7000;
    while (performance.now() < fin && !(a.ended)) {
      const tt = a.currentTime, p = parseFloat(document.getElementById('portail').style.getPropertyValue('--portes')) || 0;
      if (tt > 0.05) mesures.push({ t: +tt.toFixed(2), portes: p, attendu: L.etatSynchro(tt, cues).portes, fr: document.getElementById('portail').classList.contains('fr'), ar: document.getElementById('portail').classList.contains('ar') });
      await new Promise(r => setTimeout(r, 120));
    }
    return { mesures, cues };
  });
}
async function entrerParPortail(page, nom) {            // du clic « Entrer dans le monde » jusqu'au village affiché
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

  // ===== 2. « Entrer dans le monde » : le portail apparaît, voix automatique, portes synchronisées =====
  await page.click('#entrer'); await page.waitForURL(/\/monde\//, { timeout: 8000 });
  await page.waitForFunction(() => window.__portail, null, { timeout: 8000 });
  const e0 = await etatPortail(page);
  t(`${D} : après le choix de l'enfant, le portail s'affiche`, e0.actif && e0.dom);
  t(`${D} : le portail montre le prénom de l'enfant qui entre`, /Lina/.test(await page.locator('#p-enfant').textContent().catch(() => '')));
  await page.waitForFunction(() => /arrive/.test((document.getElementById('portail') || {}).className || ''), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  t(`${D} : portes fermées au début (apparition progressive)`, (parseFloat(await page.evaluate(() => document.getElementById('portail').style.getPropertyValue('--portes'))) || 0) < 0.05);
  await page.waitForFunction(() => window.__lectures >= 1, null, { timeout: 9000 }).catch(() => {});
  t(`${D} : la voix se déclenche automatiquement`, (await page.evaluate(() => window.__lectures || 0)) >= 1);
  const m = await mesurerSynchro(page);
  const ecarts = m.mesures.map(x => Math.abs(x.portes - x.attendu));
  t(`${D} : portes synchronisées sur la voix (${m.mesures.length} mesures, écart max ${Math.max(0, ...ecarts).toFixed(3)})`, m.mesures.length >= 8 && Math.max(0, ...ecarts) <= 0.1);
  t(`${D} : « مَرْحَبًا » s'affiche avec le premier mot, « Bienvenue dans le Monde de Nour » quand la voix passe au français`,
    m.mesures.some(x => x.ar && !x.fr && x.t < m.cues.coupe) && m.mesures.filter(x => x.t >= m.cues.coupe + 0.1).every(x => x.fr));
  t(`${D} : la porte s'ouvre progressivement (jamais d'un coup)`, m.mesures.length > 4 && m.mesures.every((x, i) => i === 0 || x.portes >= m.mesures[i - 1].portes - 1e-6) && m.mesures.some(x => x.portes > 0.3 && x.portes < 0.8));
  const pret = await attendrePortailPret(page); t(`${D} : le bouton « Entrer dans le Monde de Nour » apparaît à la fin de la voix`, pret && (await visible(page, '#p-entrer')));
  t(`${D} : portes entièrement ouvertes au bouton`, (parseFloat(await page.evaluate(() => document.getElementById('portail').style.getPropertyValue('--portes'))) || 0) > 0.99);
  const lectures = await page.evaluate(() => window.__lectures);
  t(`${D} : une seule lecture de la voix (aucune répétition involontaire) : ${lectures}`, lectures === 1);
  t(`${D} : aucune musique pendant le portail`, await page.evaluate(() => [...document.querySelectorAll('audio')].length === 0 && !/nasheed/.test(performance.getEntriesByType('resource').map(r => r.name).join(' '))));
  await page.click('#p-reecouter'); await page.waitForTimeout(500);
  t(`${D} : « Réécouter l'accueil » relance la voix (2e lecture, demandée)`, (await page.evaluate(() => window.__lectures)) === 2 && (parseFloat(await page.evaluate(() => document.getElementById('portail').style.getPropertyValue('--portes'))) || 0) > 0.99);
  await page.waitForTimeout(3700);
  await page.click('#p-entrer', { force: true });
  await page.waitForTimeout(300);
  t(`${D} : transition d'entrée en cours (le portail ne bloque plus)`, (await etatPortail(page)).actif === false);

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
  // Grand Voyage : pièces, objets, missions, niveau, zones et mots découverts (la position et le chameau sont volatils, jamais synchronisés)
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

async function visiteur(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur';
  const { ctx, page } = await contexte(mobile);
  await page.goto(BASE + '/monde/');
  t(`${D} (visiteur sans compte) : le portail s'affiche aussi à la première entrée`, await page.waitForFunction(() => window.__portail && window.__portail.actif, null, { timeout: 8000 }).then(() => true).catch(() => false));
  await entrerParPortail(page, D + ' visiteur');
  await page.waitForFunction(() => { const a = document.getElementById('accueil'); return a && !a.classList.contains('cache'); }, null, { timeout: 40000 }).catch(() => {});
  t(`${D} (visiteur) : après le portail, l'écran « Qui joue ? » s'affiche`, await visible(page, '#accueil'));
  await ctx.close();
}

// Lecture automatique REFUSÉE par le navigateur (réglage par défaut des navigateurs) : message, premier toucher, une seule lecture.
async function autoplayRefuse() {
  const { executablePath, ...sansChemin } = lancement;      // Chromium fourni : applique la vraie politique de refus de la lecture automatique
  const b2 = await chromium.launch({ ...sansChemin, args: sansChemin.args.filter(a => !/autoplay/.test(a)) });
  const ctx = await b2.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (THREE) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
  const page = await ctx.newPage();
  await page.goto(BASE + '/monde/');
  await page.waitForTimeout(3000);     // attente PASSIVE : interroger la page pendant le chargement lui donnerait une « interaction utilisateur » (Playwright) et autoriserait la lecture
  const bloque = await page.evaluate(() => ({ voix: window.__portail.voix, cls: document.getElementById('portail').className, aide: getComputedStyle(document.getElementById('p-aide')).opacity }));
  t('Autoplay refusé par le navigateur : le portail le détecte et invite à toucher l\'écran', bloque.voix === 'bloquee' && /bloque/.test(bloque.cls) && parseFloat(bloque.aide) > 0.5, JSON.stringify(bloque));
  t('Autoplay refusé : les portes attendent la voix (fermées)', (parseFloat(await page.evaluate(() => document.getElementById('portail').style.getPropertyValue('--portes'))) || 0) < 0.05);
  await page.tap('body', { position: { x: 195, y: 420 } }); await page.waitForTimeout(900);
  t('Autoplay refusé : un premier toucher active la voix', (await page.evaluate(() => window.__portail.voix)) === 'joue');
  await page.waitForTimeout(3800);
  t('Autoplay refusé : puis la séquence se termine normalement', (await page.evaluate(() => window.__portail.etat)) === 'pret');
  await ctx.close(); await b2.close();
}

await autoplayRefuse();
for (const mobile of [false, true]) { await parcours(mobile); await visiteur(mobile); }
t('Aucune erreur JavaScript pendant tout le parcours', erreurs.length === 0, erreurs.slice(0, 3).join(' | '));
await nav.close();
console.log(res.join('\n')); console.log(`\n${ok} vérifications réussies, ${ko} en échec.`);
process.exit(ko ? 1 : 0);
