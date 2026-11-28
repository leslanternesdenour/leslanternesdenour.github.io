const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
const taille = process.argv[2] || 'pc';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const { ctx, page, log } = await ouvrir(b, taille, '/ablutions/jeu3d/', { attente: 4000 });
  { const clic = page.click.bind(page); page.click = (sel, o) => clic(sel, { force: true, ...(o || {}) }); }   // les boutons pulsent (animation) : Playwright les croit « instables »
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(4000);
  t('chargement terminé, écran d\'accueil des modes', (await page.isVisible('#accueil')) && !(await page.isVisible('#chargement')));
  await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-accueil.png` });
  await page.click('[data-genre="fille"]'); t('choix fille pris en compte', await page.$eval('[data-genre="fille"]', e => e.classList.contains('oui')));
  await page.click('[data-genre="garcon"]'); t('choix garçon pris en compte', await page.$eval('[data-genre="garcon"]', e => e.classList.contains('oui')));
  const ETAPES = await page.evaluate(() => window.__abl.ETAPES.map(e => ({ t: e.t, k: e.k, parts: e.parties.length })));
  t('9 étapes dans le jeu 3D', ETAPES.length === 9, ETAPES.length);
  // ---------- APPRENDRE ----------
  await page.click('.mode[data-mode="apprendre"]'); await page.waitForTimeout(800);
  await page.evaluate(() => window.__abl.asseoir(1)); await page.waitForTimeout(1500);   // le jeu attend qu'on choisisse un robinet : sans cela il reste sur « Touche un cercle dore » (cas P1-1 du TODO : artefact du test, pas un bug du jeu)
  for (let i = 0; i < 9; i++) {
    await page.waitForSelector('#actions .geste', { timeout: 90000 }).catch(() => {});
    const titre = await page.textContent('#titre-etape'); t(`apprendre étape ${i + 1} : titre « ${ETAPES[i].t} »`, titre.includes(ETAPES[i].t), titre);
    if (i === 0) await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-etape1.png` });
    const n = (await page.$$('#actions .geste')).length; t(`apprendre étape ${i + 1} : ${ETAPES[i].parts} geste(s) proposé(s)`, n === ETAPES[i].parts, n);
    if (ETAPES[i].k === 'bras' || ETAPES[i].k === 'pieds') { // la gauche avant la droite doit être refusée avec un conseil
      await page.click('#actions .geste:nth-of-type(2)'); await page.waitForTimeout(400);
      t(`apprendre ${ETAPES[i].k} : « la droite d'abord » (conseil, rien de compté faux)`, /droite/i.test(await page.textContent('#bulle')), (await page.textContent('#bulle')).slice(0, 80));
    }
    for (let j = 0; j < n; j++) {
      await page.waitForFunction(() => { const g = document.querySelectorAll('#actions .geste'); return g.length && ![...g].some(x => x.disabled); }, null, { timeout: 60000 }).catch(() => {});
      await page.click(`#actions .geste:nth-of-type(${j + 1})`);
      await page.waitForFunction(() => { const g = document.querySelectorAll('#actions .geste'); return g.length && ![...g].some(x => x.disabled); }, null, { timeout: 60000 }).catch(() => {});
    }
    const suiv = await page.waitForSelector('#actions .suivant', { timeout: 15000 }).catch(() => null);
    t(`apprendre étape ${i + 1} : bouton suivant après les gestes`, !!suiv);
    if (i === 4) { const etat = await page.evaluate(() => ({ panneau: document.getElementById('panneau').className, bulle: document.getElementById('bulle').innerHTML.slice(0, 120), vis: document.getElementById('bulle').offsetWidth + 'x' + document.getElementById('bulle').offsetHeight, actions: document.getElementById('actions').innerHTML.slice(0, 160) })); console.log('ÉTAT étape 5:', JSON.stringify(etat)); await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-etape5.png` }); const vis = await page.isVisible('#bulle'); t('apprendre : bulle visible à l\'étape 5', vis, JSON.stringify(etat).slice(0, 200)); if (vis) { await page.click('#bulle'); await page.waitForTimeout(300); } }
    if (suiv) { await page.waitForTimeout(300); await suiv.click({ force: true }); await page.waitForTimeout(500); }
  }
  await page.waitForSelector('#fin:not(.cache)', { timeout: 15000 }).catch(() => {});
  t('apprendre : écran de fin « Machâ\'Allah »', (await page.isVisible('#fin')) && /Mach/.test(await page.textContent('#fin-titre')));
  await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-fin-apprendre.png` });
  await relever(page, log);
  // ---------- S'ENTRAÎNER ----------
  await page.click('#fin-boutons button:has-text("entraîne")'); await page.waitForTimeout(1500);
  for (let k = 0; k < 9; k++) {
    await page.waitForSelector('#actions .etape:not([disabled])', { timeout: 30000 }).catch(() => {});
    if (k === 0) { // un mauvais choix : indice, pas de blocage
      const faux = await page.$$eval('#actions .etape', bs => bs.map(x => x.textContent)); const bad = faux.find(x => !x.includes(ETAPES[0].t));
      await page.click(`#actions .etape:has-text("${bad.replace(/^\S+\s*/, '').trim().split(' ')[0]}")`).catch(() => {}); await page.waitForTimeout(400);
      t('entraîner : mauvaise étape → indice (sans blocage)', /indice/i.test(await page.textContent('#bulle')), (await page.textContent('#bulle')).slice(0, 80));
    }
    await page.click(`#actions .etape:not([disabled]):has-text("${ETAPES[k].t}")`);
    await page.waitForSelector('#actions .geste', { timeout: 20000 }).catch(() => {});
    const n = (await page.$$('#actions .geste')).length;
    for (let j = 0; j < n; j++) { await page.waitForFunction(() => { const g = document.querySelectorAll('#actions .geste'); return g.length && ![...g].some(x => x.disabled); }, null, { timeout: 60000 }).catch(() => {}); await page.click(`#actions .geste:nth-of-type(${j + 1})`); await page.waitForFunction(() => { const g = document.querySelectorAll('#actions .geste'); return g.length && ![...g].some(x => x.disabled); }, null, { timeout: 60000 }).catch(() => {}); }
    const s = await page.waitForSelector('#actions .suivant', { timeout: 10000 }).catch(() => null); t(`entraîner étape ${k + 1} (${ETAPES[k].k}) : bouton « J'ai fini »`, !!s); if (s) { await page.waitForTimeout(250); await s.click({ force: true }); await page.waitForTimeout(400); }
  }
  await page.waitForSelector('#fin:not(.cache)', { timeout: 15000 }).catch(() => {});
  t('entraîner : écran de fin avec bilan des indices', (await page.isVisible('#fin')) && /indice/.test(await page.textContent('#fin-texte')), await page.textContent('#fin-texte'));
  await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-fin-entrainer.png` });
  // ---------- LIBRE ----------
  await page.click('#fin-boutons button:has-text("libre")'); await page.waitForTimeout(1500);
  await page.waitForSelector('#actions .geste', { timeout: 30000 }).catch(() => {});
  const nl = (await page.$$('#actions .geste')).length; const attendu = ETAPES.reduce((a, e) => a + e.parts, 0); t('libre : tous les gestes proposés (' + attendu + ', un par geste de chaque étape)', nl === attendu, nl);
  for (const j of [1, 6, 11]) { await page.waitForFunction(() => !window.__abl.gestes().enCours(), null, { timeout: 60000 }).catch(() => {}); await page.click(`#actions .geste:nth-of-type(${j})`); await page.waitForTimeout(500); }
  await page.waitForFunction(() => !window.__abl.gestes().enCours(), null, { timeout: 60000 }).catch(() => {});
  await page.screenshot({ path: `/tmp/claude-0/aud/abl3d-${taille}-libre.png` });
  // menu, son, retour, sauvegarde
  await page.click('#btn-menu'); t('menu en jeu s\'ouvre', await page.isVisible('#menu')); await page.click('#menu-reprendre'); t('menu se ferme', !(await page.isVisible('#menu')));
  await page.click('#btn-son'); t('bouton son basculé', /🔇/.test(await page.textContent('#btn-son'))); await page.click('#btn-son');
  await page.click('#btn-menu'); await page.click('#menu-modes'); t('retour aux modes', await page.isVisible('#accueil'));
  const sv = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /ablu/i.test(k)))); await page.reload(); await page.waitForTimeout(3500);
  const sv2 = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /ablu/i.test(k)))); t('progression 3D sauvegardée et conservée', sv.length > 5 && sv === sv2, sv.slice(0, 120));
  await relever(page, log);
  console.log(JSON.stringify({ jeu: 'ablutions-3d', taille, tests: T.tests, ok: T.ok, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], sonsJoues: [...new Set(log.sons)].length, paroleNavigateur: [...new Set(log.parole)].slice(0, 12) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
