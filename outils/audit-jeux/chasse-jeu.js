const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const taille = process.argv[2] || 'pc', age = process.argv[3] || 'moyens';
  const { ctx, page, log } = await ouvrir(b, taille, '/aventures/chasse-aux-mots/', { attente: 3000 });
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(2500);
  t("choix de l'âge au premier lancement", await page.isVisible('#age-bloc')); await page.screenshot({ path: `/tmp/claude-0/aud/chasse-${taille}-age.png` });
  await page.click(`[data-age="${age}"]`); await page.waitForTimeout(300); t('6 lieux affichés', (await page.$$('#lieux button')).length === 6);
  const lieux = await page.$$eval('#lieux button', bs => bs.map(x => x.dataset.l));
  async function jouer(lieu, niv, reel) {
    await page.click(`#lieux button[data-l="${lieu}"]`); await page.waitForTimeout(200);
    const dis = await page.$eval(`#niveaux button[data-n="${niv}"]`, e => e.disabled).catch(() => true);
    if (dis) { t(`${lieu} niv${niv} : niveau ouvert`, false, 'verrouillé'); return; }
    await page.click(`#niveaux button[data-n="${niv}"]`); await page.waitForTimeout(1500);
    t(`${lieu} niv${niv} : la manche démarre`, (await page.evaluate(() => !!window.__chasse.manche())) && (await page.isVisible('#hud')));
    const n = await page.evaluate(() => window.__chasse.manche().cibles.length);
    for (let i = 0; i < n; i++) {
      await page.waitForFunction(k => window.__chasse.manche() && window.__chasse.manche().i === k && document.getElementById('cible') && !document.getElementById('cible').classList.contains('cache'), i, { timeout: 15000 }).catch(() => {});
      const cible = await page.evaluate(() => window.__chasse.cibleId());
      if (i === 0) {
        const autre = await page.evaluate(c => window.__chasse.objets().find(o => o !== c), cible);
        const e0 = await page.evaluate(() => window.__chasse.manche().erreurs);
        await page.evaluate(o => window.__chasse.tap(o), autre);
        t(`${lieu} niv${niv} : mauvais objet compté comme erreur`, (await page.evaluate(() => window.__chasse.manche().erreurs)) === e0 + 1);
      }
      if (i === 1 && n > 2) { await page.click('#aide'); t(`${lieu} niv${niv} : bouton aide actif`, (await page.evaluate(() => window.__chasse.manche().aides)) >= 1); }
      if (reel && i === 0) {
        await page.evaluate(() => window.__chasse.tourner(0)); await page.waitForTimeout(400);
        const p2 = await page.evaluate(c => window.__chasse.ecran(c), cible);
        let avance = false;
        if (p2 && !p2.derriere && p2.x > 0 && p2.y > 0) { if (taille === 'pc') await page.mouse.click(p2.x, p2.y); else await page.touchscreen.tap(p2.x, p2.y); await page.waitForTimeout(400); avance = await page.evaluate(k => window.__chasse.manche().i > k, i); }
        t(`${lieu} niv${niv} : ${taille === 'pc' ? 'clic' : 'toucher'} réel sur l'objet 3D`, avance, avance ? '' : 'non atteint');
        if (!avance) await page.evaluate(c => window.__chasse.tap(c), cible);
      } else await page.evaluate(c => window.__chasse.tap(c), cible);
    }
    await page.waitForSelector('#fin:not(.cache)', { timeout: 8000 }).catch(() => {});
    t(`${lieu} niv${niv} : écran de fin`, await page.isVisible('#fin'));
    const f = await page.evaluate(() => ({ et: document.getElementById('fin-etoiles').textContent, mots: document.querySelectorAll('#fin-mots li').length }));
    t(`${lieu} niv${niv} : étoiles + mots appris affichés`, /⭐/.test(f.et) && f.mots === n, JSON.stringify(f));
    if (lieu === lieux[0] && niv === 1) await page.screenshot({ path: `/tmp/claude-0/aud/chasse-${taille}-fin.png` });
    await page.click('#fin-accueil'); await page.waitForTimeout(300); await relever(page, log);
  }
  const L = taille === 'pc' ? lieux : lieux.slice(0, 2);
  for (const l of L) await jouer(l, 1, l === lieux[0]);
  t('niveau 2 déverrouillé après une victoire', await page.evaluate(() => Object.values(window.__chasse.etat().etoiles).some(a => a[0] > 0)));
  for (const n of taille === 'pc' ? [2, 3, 4, 5] : [2]) await jouer(lieux[0], n, false);
  const av = await page.evaluate(() => JSON.stringify(window.__chasse.etat().etoiles) + window.__chasse.etat().trouves.length);
  await page.reload(); await page.waitForTimeout(2500);
  const ap = await page.evaluate(() => JSON.stringify(window.__chasse.etat().etoiles) + window.__chasse.etat().trouves.length);
  t('progression conservée après réouverture', av === ap, av + ' / ' + ap);
  t('âge conservé', await page.evaluate(a => window.__chasse.etat().age === a, age));
  await page.click('#btn-collection'); t("collection s'ouvre", await page.isVisible('#collection')); await page.screenshot({ path: `/tmp/claude-0/aud/chasse-${taille}-collection.png` }); await page.click('#collection-fermer');
  await page.click('#btn-reglages'); t("réglages s'ouvrent", await page.isVisible('#reglages')); await page.click('#reglages-fermer');
  console.log(JSON.stringify({ jeu: 'chasse', taille, age, tests: T.tests, ok: T.ok, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], paroleNavigateur: [...new Set(log.parole)].slice(0, 5) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
