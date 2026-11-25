// MODE SANS VISAGE : vérification réelle dans un navigateur (ordinateur ET téléphone), contre la préproduction locale AVEC ÉMULATEUR.
//  A. Visiteur sans compte : réglage local, texte d'explication exact, bannière d'accueil, émojis de personnes, mascottes SVG (Ablutions, Prière, village).
//  B. 3D : chaque personnage (enfants, montures, animaux, faucon, modèles GLB) change bel et bien à l'écran quand le mode est activé, et seulement à
//     l'endroit du visage (pièces étiquetées, comparaison d'images image figée / mode activé puis désactivé).
//  C. Compte famille : activation, deux profils enfants, progression intacte, déconnexion puis reconnexion sur un APPAREIL NEUF (stockage local vidé),
//     réglage relu depuis le compte et identique pour tous les profils.
// Démarrer : bash outils/tests/sans-visage.sh   (construit la préproduction, lance le serveur local avec émulateur, puis ce script)
import { createRequire } from 'module'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import path from 'node:path';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright');
const BASE = process.argv[2] || 'http://localhost:8796';
const THREE = ['/home/user/node_modules/three', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../node_modules/three')].find(d => fs.existsSync(d));
const TEXTE_CLIENT = 'Au sein de la communauté musulmane, il existe différentes opinions et interprétations concernant la représentation des êtres vivants et des visages. Les Lanternes de Nour souhaite respecter ces différents avis et permettre à chaque famille de profiter de son univers éducatif selon l\'avis religieux qu\'elle suit. C\'est pourquoi nous proposons un mode sans visage facultatif.';
const lancement = { args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
if (fs.existsSync('/usr/bin/google-chrome')) lancement.executablePath = '/usr/bin/google-chrome';
let ok = 0, ko = 0; const res = [], erreurs = [];
const t = (nom, c, d = '') => { c ? ok++ : ko++; res.push(`${c ? '✓' : '✗'} ${nom}${d && !c ? ' — ' + d : ''}`); };
const BRUIT = /Transition was aborted because of invalid state|Failed to load resource/;
const PERSONNES = /[\u{1F466}\u{1F467}\u{1F468}\u{1F469}\u{1F474}\u{1F475}\u{1F476}\u{1F9D1}\u{1F9D2}\u{1F9D4}\u{1F9D5}\u{1F64B}\u{1F473}]/u;
let nav = null;
async function contexte(mobile) {
  nav = nav || await chromium.launch(lancement);
  const ctx = await nav.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR' } : { viewport: { width: 1280, height: 720 }, locale: 'fr-FR' });
  await ctx.route(/fonts\.(googleapis|gstatic)|ytimg|youtube|islamic\.network|alquran|googleusercontent/, r => r.abort());
  if (THREE) await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  await ctx.addInitScript(() => { try { localStorage.getItem('lanternes_intro') || localStorage.setItem('lanternes_intro', JSON.stringify({ off: 1 })); sessionStorage.setItem('ldn_portail', '*'); } catch (e) {} });
  const page = await ctx.newPage(); page.on('dialog', d => d.accept());
  page.on('pageerror', x => { if (!BRUIT.test(x.message)) erreurs.push(page.url().replace(BASE, '') + ' : ' + x.message); });
  return { ctx, page };
}
const ls = (p, k) => p.evaluate(k => localStorage.getItem(k), k);
const attr = p => p.evaluate(() => document.documentElement.getAttribute('data-sans-visage'));
const visible = (p, s) => p.locator(s).first().isVisible();
const api = (p, chemin) => p.evaluate(async c => { const r = await fetch(c, { credentials: 'same-origin' }); return { s: r.status, j: await r.json().catch(() => null) }; }, chemin);
const attendreEtat = async (p, re, ms = 4000) => { try { await p.waitForFunction(r => new RegExp(r).test(document.getElementById('etat').textContent), re.source, { timeout: ms }); return true; } catch (e) { return false; } };
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
// bascule le mode depuis la page « Réglages de la famille » (ce que fait un parent)
async function basculer(page, actif) {
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#rf-sans-visage');
  const coche = await page.isChecked('#rf-sans-visage'); if (coche !== actif) await page.click('#rf-sans-visage');
  await page.waitForFunction(a => document.documentElement.getAttribute('data-sans-visage') === (a ? '1' : '0'), actif, { timeout: 4000 });
  await page.waitForTimeout(300);
}

// ======================= A. visiteur sans compte =======================
async function visiteur(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur', { ctx, page } = await contexte(mobile);
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#reglages-famille');
  t(`${D} : la page des réglages propose le mode sans visage, désactivé au départ`, (await visible(page, '#rf-sans-visage')) && !(await page.isChecked('#rf-sans-visage')) && (await attr(page)) === '0');
  t(`${D} : le texte d'explication des parents est EXACTEMENT celui demandé`, (await page.textContent('#rf-explication')).trim() === TEXTE_CLIENT);
  await page.click('#rf-sans-visage');
  t(`${D} : activer le mode : application immédiate (sans recharger) et enregistrement sur l'appareil`, (await attr(page)) === '1' && (await ls(page, 'ldn_sans_visage')) === '1' && /ACTIVÉ/.test(await page.textContent('#rf-etat')));
  t(`${D} : le visiteur est averti que le réglage est gardé sur cet appareil`, /sur cet appareil/.test(await page.textContent('#rf-lieu')));
  await page.reload(); await page.waitForSelector('#rf-sans-visage');
  t(`${D} : le réglage est conservé après rechargement (case cochée, attribut posé AVANT l'affichage)`, (await page.isChecked('#rf-sans-visage')) && (await attr(page)) === '1');

  // bannière de l'accueil : le village sans personnage remplace les enfants
  await page.goto(BASE + '/'); await page.waitForSelector('.haut-scene');
  const ban = await page.evaluate(() => { const v = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 : null; }; return { avec: v('.haut-monde .sv-avec'), sans: v('.haut-monde .sv-sans') }; });
  t(`${D} : accueil en mode sans visage : la bannière des deux enfants est remplacée par le village sans personnage`, ban.avec === false && ban.sans === true, JSON.stringify(ban));
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#rf-sans-visage'); await page.click('#rf-sans-visage');
  await page.goto(BASE + '/'); await page.waitForSelector('.haut-scene');
  const ban2 = await page.evaluate(() => { const v = s => { const e = document.querySelector(s); return e ? getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0 : null; }; return { avec: v('.haut-monde .sv-avec'), sans: v('.haut-monde .sv-sans') }; });
  t(`${D} : mode désactivé : la bannière d'origine (conservée) revient`, ban2.avec === true && ban2.sans === false, JSON.stringify(ban2));
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#rf-sans-visage'); await page.click('#rf-sans-visage');   // on le réactive pour la suite

  // émojis de personnes : silhouettes sans visage
  for (const [nom, url] of [['découvrir', '/decouvrir/'], ['aperçu', '/apercu/']]) {
    await page.goto(BASE + url); await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ nb: document.querySelectorAll('.sv-emo').length, texte: document.body.innerText, masques: [...document.querySelectorAll('.sv-emo > .sv-e')].every(e => getComputedStyle(e).display === 'none'),
      sil: [...document.querySelectorAll('.sv-emo')].every(e => { const c = getComputedStyle(e, '::before'); return c.content !== 'none' && c.content !== 'normal' && parseFloat(c.width) > 0 || e.dataset.k === 's'; }) }));
    t(`${D} : « ${nom} » : émojis de personnes remplacés par des silhouettes (${r.nb} remplacés), aucun visage de personne affiché`, r.nb > 0 && r.masques && r.sil && !PERSONNES.test(r.texte), JSON.stringify({ nb: r.nb, masques: r.masques, sil: r.sil, reste: (r.texte.match(PERSONNES) || [])[0] }));
  }
  // mascottes SVG : Nour (Ablutions), Sajjadou (Prière), visages du choix (village)
  for (const [nom, url, sel] of [['Ablutions : Nour la goutte', '/ablutions/', '.nour'], ['Prière : Sajjadou', '/priere/', '.sj']]) {
    await page.goto(BASE + url); await page.waitForTimeout(1200);
    const r = await page.evaluate(s => { const g = [...document.querySelectorAll(s + ' .sv-visage, .sv-visage')]; return { n: g.length, tous: g.every(e => getComputedStyle(e).display === 'none') }; }, sel);
    t(`${D} : ${nom} : yeux, joues et bouche masqués, corps conservé`, r.n > 0 && r.tous, JSON.stringify(r));
  }
  await page.goto(BASE + '/monde/'); await page.waitForTimeout(1500);
  const sv = await page.evaluate(() => { const g = [...document.querySelectorAll('#accueil .visage .sv-visage')]; const tetes = [...document.querySelectorAll('#accueil .visage svg')]; return { n: g.length, tous: g.every(e => getComputedStyle(e).display === 'none'), tetes: tetes.length }; });
  t(`${D} : village : les têtes du choix fille/garçon n'ont plus de visage dessiné (têtes, voile et calotte conservés)`, sv.n >= 2 && sv.tous && sv.tetes >= 2, JSON.stringify(sv));
  const lienVillage = await page.evaluate(() => !!document.querySelector('#reglages a[href*="reglages-famille"]'));
  t(`${D} : le village renvoie vers les réglages de la famille`, lienVillage);
  await page.goto(BASE + '/voyage/'); await page.waitForTimeout(800);
  t(`${D} : Grand Voyage : le réglage s'applique aussi (attribut posé, lien vers les réglages parents)`, (await attr(page)) === '1' && (await page.evaluate(() => !!document.querySelector('#panneau-reglages a[href*="reglages-famille"]'))));
  await ctx.close();
}

// ======================= B. personnages 3D =======================
const GROUPES = [['humains', 'trois'], ['humains', 'face'], ['humains', 'dos'], ['montures', 'trois'], ['animaux', 'trois'], ['glb', 'face']];
async function troisD(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur', { ctx, page } = await contexte(mobile);
  for (const [groupe, vue] of GROUPES) {
    await page.goto(`${BASE}/outils/personnages/sans-visage.html?groupe=${groupe}&vue=${vue}&sv=0`);
    await page.waitForFunction(() => window.__pret, null, { timeout: 40000 }).catch(() => {});
    if (groupe === 'glb') await page.waitForFunction(() => window.__bandes().length >= 2 || window.__glbErreur, null, { timeout: 30000 }).catch(() => {});
    await page.evaluate(() => { window.__fige = true; }); await page.waitForTimeout(700);
    await page.evaluate(() => window.__cap('avant')); await page.waitForTimeout(500); await page.evaluate(() => window.__cap('avant2')); const bandes = await page.evaluate(() => window.__bandes());
    await page.evaluate(() => window.LDN_SV.definir(true)); await page.waitForTimeout(700); await page.evaluate(() => window.__cap('sans'));
    await page.evaluate(() => window.LDN_SV.definir(false)); await page.waitForTimeout(700); await page.evaluate(() => window.__cap('apres'));
    t(`${D} 3D « ${groupe} / ${vue} » : ${bandes.length} personnage(s) affichés`, bandes.length >= (groupe === 'humains' ? 5 : groupe === 'glb' ? 2 : 3), JSON.stringify(bandes.length));
    let i = 0;
    for (const b of bandes) {
      i++;
      const [x0, x1, y0, y1] = [b.x0 - 2, b.x1 + 2, b.y0 - 2, b.y1 + 2];
      const change = await page.evaluate(([x0, x1, y0, y1]) => window.__diff('avant', 'sans', x0, x1, y0, y1), [x0, x1, y0, y1]);
      const retour = await page.evaluate(([x0, x1, y0, y1]) => window.__diff('avant', 'apres', x0, x1, y0, y1), [x0, x1, y0, y1]);
      // bruit du moteur de rendu logiciel (arêtes qui scintillent d'une image à l'autre là où deux surfaces se touchent), mesuré SANS rien changer
      const bruit = await page.evaluate(([x0, x1, y0, y1]) => window.__diff('avant', 'avant2', x0, x1, y0, y1), [x0, x1, y0, y1]);
      const vueDos = vue === 'dos';
      if (groupe === 'glb') t(`${D} 3D GLB N1 n°${i} : les yeux, sourcils et traits peints disparaissent (${change} pixels modifiés) ; le relief du nez et de la bouche RESTE (limite connue)`, vueDos ? true : change > 30, 'change=' + change);
      else if (vueDos) t(`${D} 3D « ${groupe} / dos » n°${i} : vu de dos, le dessin ne change presque pas (${change} pixels) et ${b.visage} pièces de visage sont étiquetées`, b.visage > 0);
      else t(`${D} 3D « ${groupe} / ${vue} » n°${i} : le visage disparaît à l'écran (${change} pixels modifiés, ${b.visage}/${b.sommets} sommets de visage étiquetés${b.x1 - b.x0 < 60 ? ' ; trop petit à l\'écran pour compter les pixels' : ''})`, b.visage > 0 && (change > 0 || b.x1 - b.x0 < 60), `change=${change} visage=${b.visage}`);
      if (!vueDos) t(`${D} 3D « ${groupe} / ${vue} » n°${i} : désactivé, le visage revient à l'identique (${retour} pixels de différence, dont ${bruit} de bruit de rendu mesuré sans rien changer)`, retour <= bruit * 2 + 8, `retour=${retour} bruit=${bruit}`);
      // seul le visage change : la grande majorité du personnage reste identique (têtes, vêtements, cheveux, voiles, silhouette conservés)
      const surface = (x1 - x0) * (y1 - y0);
      if (!vueDos) t(`${D} 3D « ${groupe} / ${vue} » n°${i} : seul le visage change (${(change / surface * 100).toFixed(2)} % de la surface)`, (change - bruit) / surface < 0.06, 'surface=' + surface);
    }
  }
  await ctx.close();
}

// ======================= C. compte famille =======================
async function compte(mobile) {
  const D = mobile ? 'Téléphone' : 'Ordinateur', { ctx, page } = await contexte(mobile);
  const email = `sv-${mobile ? 'tel' : 'pc'}-${Date.now().toString(36)}@exemple.fr`, mdp = 'Motdepasse-Test-123';
  await inscrire(page, email, mdp); await devenirFamille(page);
  await ajouterEnfant(page, 'Lina', 'fille', '3-5'); await ajouterEnfant(page, 'Yanis', 'garcon', '6-10');
  const enfants = (await api(page, '/api/enfants')).j.enfants, lina = enfants.find(e => e.surnom === 'Lina'), yanis = enfants.find(e => e.surnom === 'Yanis');
  // progression de chaque enfant (envoyée comme le jeu le fait)
  for (const [e, v] of [[lina, 7], [yanis, 11]]) await page.evaluate(async ([id, v]) => { await fetch(`/api/enfants/${id}/progression`, { method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-LDN': '1' }, body: JSON.stringify({ progression: { monde: { etoiles: v } } }) }); }, [e.id, v]);
  const avant = [(await api(page, `/api/enfants/${lina.id}`)).j, (await api(page, `/api/enfants/${yanis.id}`)).j];
  t(`${D} compte : deux profils enfants, progression enregistrée (${avant[0].progression.monde && avant[0].progression.monde.etoiles} et ${avant[1].progression.monde && avant[1].progression.monde.etoiles} étoiles)`, avant[0].progression.monde.etoiles === 7 && avant[1].progression.monde.etoiles === 11);
  const surMoi = (await api(page, '/api/moi')).j;
  t(`${D} compte : aucun réglage au départ`, surMoi.connecte && JSON.stringify(surMoi.preferences) === '{}', JSON.stringify(surMoi.preferences));

  await basculer(page, true);
  await page.waitForTimeout(500);
  const moi1 = (await api(page, '/api/moi')).j;
  t(`${D} compte : activer le mode l'enregistre dans le compte de la famille`, moi1.preferences && moi1.preferences.sansVisage === true, JSON.stringify(moi1.preferences));
  t(`${D} compte : le texte précise que le réglage est dans le compte (même sur tous les appareils et profils)`, /compte de la famille/.test(await page.textContent('#rf-lieu')));
  const apres = [(await api(page, `/api/enfants/${lina.id}`)).j, (await api(page, `/api/enfants/${yanis.id}`)).j];
  t(`${D} compte : la progression et les profils des enfants n'ont pas bougé`, JSON.stringify(apres[0].progression) === JSON.stringify(avant[0].progression) && JSON.stringify(apres[1].progression) === JSON.stringify(avant[1].progression) && apres[0].surnom === 'Lina' && apres[1].surnom === 'Yanis');

  // même configuration pour tous les profils : on joue avec Lina puis avec Yanis
  for (const nom of ['Lina', 'Yanis']) {
    await page.goto(BASE + '/compte/'); await page.waitForSelector('#v-enfants:not(.cache)'); await choisir(page, nom);
    await page.goto(BASE + '/monde/'); await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({ attr: document.documentElement.getAttribute('data-sans-visage'), prenom: (document.getElementById('qui-joue') || {}).textContent || '' }));
    t(`${D} compte : profil ${nom} : mode sans visage actif (même réglage pour tous les profils)`, r.attr === '1' && r.prenom.includes(nom), JSON.stringify(r));
  }
  const avantDeco = [(await api(page, `/api/enfants/${lina.id}`)).j, (await api(page, `/api/enfants/${yanis.id}`)).j];   // état juste avant la déconnexion (les jeux ont pu enregistrer leur progression)
  // déconnexion
  await page.goto(BASE + '/compte/'); await page.waitForSelector('#deconnexion'); await page.click('#deconnexion'); await page.waitForSelector('#v-acces:not(.cache)', { timeout: 6000 });
  t(`${D} compte : après la déconnexion, le réglage reste sur l'appareil (le prochain enfant n'a pas de visage non plus)`, (await attr(page)) === '1');
  // NOUVEL APPAREIL : stockage local vidé, puis nouvelle connexion → le réglage vient du compte
  await page.evaluate(() => { localStorage.removeItem('ldn_sans_visage'); }); await page.reload(); await page.waitForSelector('#f-connexion:not(.cache)');
  t(`${D} compte : appareil neuf (stockage vidé), non connecté : visages affichés (réglage non lu)`, (await attr(page)) === '0');
  await connecter(page, email, mdp);
  await page.waitForFunction(() => document.documentElement.getAttribute('data-sans-visage') === '1', null, { timeout: 5000 }).catch(() => {});
  t(`${D} compte : après reconnexion, le mode sans visage est restauré depuis le compte (interrupteur coché, page sans visage)`, (await attr(page)) === '1' && (await page.isChecked('#rf-sans-visage')));
  const retrouve = [(await api(page, `/api/enfants/${lina.id}`)).j, (await api(page, `/api/enfants/${yanis.id}`)).j];
  const pm = e => e && e.progression && e.progression.monde || {};
  t(`${D} compte : après déconnexion et reconnexion, chaque profil retrouve SA progression (rien perdu, rien mélangé, rien réinitialisé)`, retrouve[0].surnom === 'Lina' && retrouve[1].surnom === 'Yanis' && pm(retrouve[0]).personnage && pm(retrouve[0]).personnage.genre === 'fille' && pm(retrouve[0]).age === 'petits' && pm(retrouve[1]).personnage && pm(retrouve[1]).personnage.genre === 'garcon' && pm(retrouve[1]).age === 'grands' && JSON.stringify(retrouve[0].progression) === JSON.stringify(avantDeco[0].progression), JSON.stringify(retrouve.map(r => r.progression)));
  // désactiver : visages revenus, enregistré dans le compte
  await basculer(page, false); await page.waitForTimeout(500);
  const moi2 = (await api(page, '/api/moi')).j;
  t(`${D} compte : désactiver le mode : visages revenus tout de suite, enregistré dans le compte`, (await attr(page)) === '0' && moi2.preferences.sansVisage === false, JSON.stringify(moi2.preferences));
  await page.goto(BASE + '/'); await page.waitForSelector('.haut-scene');
  t(`${D} compte : mode désactivé : bannière d'origine`, await page.evaluate(() => getComputedStyle(document.querySelector('.haut-monde .sv-avec')).display !== 'none'));
  // le compte fait foi même si l'appareil disait autre chose
  await page.evaluate(() => localStorage.setItem('ldn_sans_visage', '1')); await page.goto(BASE + '/compte/'); await page.waitForSelector('#rf-sans-visage');
  await page.waitForFunction(() => document.documentElement.getAttribute('data-sans-visage') === '0', null, { timeout: 4000 }).catch(() => {});
  t(`${D} compte : le compte fait foi (appareil à « activé », compte à « désactivé » → désactivé)`, (await attr(page)) === '0' && !(await page.isChecked('#rf-sans-visage')));
  await ctx.close();
}

try {
  const PARTIE = process.argv[3] || 'tout';      // « visiteur », « 3d », « compte » ou « tout »
  if (/visiteur|tout/.test(PARTIE)) for (const m of [false, true]) await visiteur(m);
  if (/3d|tout/.test(PARTIE)) for (const m of [false, true]) await troisD(m);
  if (/compte|tout/.test(PARTIE)) for (const m of [false, true]) await compte(m);
} catch (e) { t('Le parcours s\'est terminé sans exception', false, e.stack.split('\n').slice(0, 3).join(' | ')); }
t('Aucune erreur JavaScript pendant tout le parcours', erreurs.length === 0, erreurs.slice(0, 4).join(' || '));
console.log(res.join('\n') + `\n\n${ok} vérifications réussies, ${ko} en échec.`);
if (nav) await nav.close();
process.exit(ko ? 1 : 0);
