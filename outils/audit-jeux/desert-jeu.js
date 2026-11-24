const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const taille = process.argv[2] || 'pc', age = process.argv[3] || 'moyens', nb = Number(process.argv[4] || 7);
  const { ctx, page, log } = await ouvrir(b, taille, '/aventures/mysteres-desert/', { attente: 3000 });
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(2500);
  t("choix de l'âge au premier lancement", await page.isVisible('#age-bloc')); await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-age.png` });
  await page.click(`[data-age="${age}"]`); await page.waitForTimeout(400);
  const chap = await page.$$eval('#chapitres button', bs => bs.map(x => ({ id: x.dataset.c || x.dataset.id || x.dataset.ch, off: x.disabled })));
  t('7 chapitres affichés', chap.length === 7, JSON.stringify(chap.map(c => c.id)));
  t('seul le 1er chapitre est ouvert au départ', chap[0] && !chap[0].off && chap.slice(1).every(c => c.off), JSON.stringify(chap.map(c => c.off)));
  await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-carte.png` });
  for (let k = 0; k < nb; k++) {
    const id = chap[k].id; const btn = `#chapitres button:nth-child(${k + 1})`;
    const ouvert = await page.$eval(btn, e => !e.disabled).catch(() => false); t(`chapitre ${id} : ouvert (déblocage progressif)`, ouvert); if (!ouvert) break;
    await page.click(btn); await page.waitForTimeout(1500);
    t(`${id} : le chapitre démarre`, (await page.evaluate(() => !!window.__mystere.ch())) && (await page.isVisible('#hud')));
    const indices = await page.evaluate(() => window.__mystere.indices()); t(`${id} : indices à trouver (3-4)`, indices.length >= 3 && indices.length <= 4, indices.length);
    for (let i = 0; i < indices.length; i++) {
      if (i === 1) { await page.click('#aide'); t(`${id} : aide indices`, (await page.evaluate(() => window.__mystere.ch().aides)) >= 1); }
      await page.evaluate(o => window.__mystere.tap(o), indices[i]); await page.waitForTimeout(300);
    }
    t(`${id} : tous les indices trouvés`, (await page.evaluate(() => window.__mystere.ch().trouves)) === indices.length);
    await page.waitForSelector('#enigme:not(.cache)', { timeout: 12000 }).catch(() => {});
    t(`${id} : l'énigme s'affiche`, await page.isVisible('#enigme'));
    if (k === 0) await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-enigme.png` });
    const e = await page.evaluate(() => JSON.parse(JSON.stringify(window.__mystere.enigme()))); const type = e.type;
    const clic = sel => page.click(sel);
    // 1) une mauvaise tentative (sauf mémoire), 2) la bonne solution
    if (type === 'choisir') { const mauvais = e.options.find(o => o !== e.bonne); await clic(`#enigme-zone .choix[data-id="${mauvais}"]`); t(`${id} (choisir) : mauvaise réponse refusée + message`, (await page.evaluate(() => document.getElementById('enigme-msg').textContent.length)) > 0 && (await page.isVisible('#enigme'))); await clic(`#enigme-zone .choix[data-id="${e.bonne}"]`); }
    else if (type === 'ordre') { const faux = [...e.ordre].reverse(); for (const o of faux) await clic(`#enigme-zone .choix[data-id="${o}"]`); await page.waitForTimeout(300); t(`${id} (ordre) : mauvais ordre refusé, on peut recommencer`, (await page.isVisible('#enigme')) && (await page.$$eval('#enigme-zone .choix:not([disabled])', x => x.length)) === e.ordre.length); for (const o of e.ordre) await clic(`#enigme-zone .choix[data-id="${o}"]`); }
    else if (type === 'paires') { const [a, c] = e.paires; await clic(`#enigme-zone .obj[data-id="${a}"]`); await clic(`#enigme-zone .sil[data-id="${c}"]`); t(`${id} (paires) : mauvaise paire refusée`, (await page.evaluate(() => document.getElementById('enigme-msg').textContent.length)) > 0); for (const p of e.paires) { await clic(`#enigme-zone .obj[data-id="${p}"]`); await clic(`#enigme-zone .sil[data-id="${p}"]`); } }
    else if (type === 'memoire') {
      const aToi = () => page.waitForFunction(() => /À toi/.test(document.getElementById('enigme-msg').textContent) && window.__mystere.ch().attente === false, null, { timeout: 30000 }).catch(() => {});
      await aToi();
      const bad = e.suite.find(x => x !== e.suite[0]) || e.suite[0]; const faux = e.suite[0] === bad ? e.symboles && e.symboles.find(x => x !== e.suite[0]) : bad;
      await clic(`#enigme-zone .choix[data-id="${faux || bad}"]`); await page.waitForTimeout(200);
      t(`${id} (mémoire) : erreur → message + on revoit la suite`, (await page.evaluate(() => document.getElementById('enigme-msg').textContent.length)) > 0);
      await page.waitForFunction(() => /Regarde/.test(document.getElementById('enigme-msg').textContent), null, { timeout: 8000 }).catch(() => {});
      await aToi();
      for (const s of e.suite) { await clic(`#enigme-zone .choix[data-id="${s}"]`); await page.waitForTimeout(80); }
    }
    else if (type === 'code') { await clic('#enigme-valider'); t(`${id} (code) : verrou incomplet refusé`, (await page.evaluate(() => document.getElementById('enigme-msg').textContent.length)) > 0);
      for (let i = 0; i < e.ordre.length; i++) { for (let n = 0; n < e.options.length + 1; n++) { const cur = await page.$eval(`.slot[data-s="${i}"]`, el => el.dataset.id || ''); if (cur === e.ordre[i]) break; await clic(`.slot[data-s="${i}"]`); } } await clic('#enigme-valider'); }
    await page.waitForSelector('#tresor:not(.cache)', { timeout: 15000 }).catch(() => {});
    t(`${id} (${type}) : bonne réponse → trésor affiché`, await page.isVisible('#tresor'));
    const tr = await page.evaluate(() => ({ nom: document.getElementById('tresor-nom').textContent, fait: document.getElementById('tresor-fait').textContent, rec: document.getElementById('tresor-recompenses').textContent }));
    t(`${id} : trésor avec nom, fait et récompense`, tr.nom.length > 2 && tr.fait.length > 10 && tr.rec.length > 2, JSON.stringify(tr));
    if (k === 0) await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-tresor.png` });
    console.log('chapitre', id, 'ok', T.ok + '/' + T.tests);
    const vis = await page.isVisible('#tresor-carte'); t(`${id} : bouton « La carte » visible`, vis);
    if (vis) await page.click('#tresor-carte'); else { await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-${id}-bloque.png` }); await page.evaluate(() => { document.getElementById('tresor').classList.add('cache'); document.getElementById('retour').click(); }); }
    await page.waitForTimeout(500); await relever(page, log);
  }
  const av = await page.evaluate(() => JSON.stringify(window.__mystere.etat().etoiles) + window.__mystere.etat().tresors.length);
  await page.reload(); await page.waitForTimeout(2500);
  const ap = await page.evaluate(() => JSON.stringify(window.__mystere.etat().etoiles) + window.__mystere.etat().tresors.length);
  t('progression conservée après réouverture', av === ap, av + ' / ' + ap);
  t('chapitre suivant débloqué après réouverture', (await page.$$eval('#chapitres button:not([disabled])', x => x.length)) >= Math.min(nb + 1, 7));
  await page.click('#btn-tresors'); t("trésors s'ouvrent", await page.isVisible('#tresors')); await page.screenshot({ path: `/tmp/claude-0/aud/desert-${taille}-tresors.png` }); await page.click('#tresors-fermer');
  await page.click('#btn-reglages'); t("réglages s'ouvrent", await page.isVisible('#reglages')); await page.click('#reglages-fermer');
  console.log(JSON.stringify({ jeu: 'desert', taille, age, tests: T.tests, ok: T.ok, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], paroleNavigateur: [...new Set(log.parole)].slice(0, 5) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
