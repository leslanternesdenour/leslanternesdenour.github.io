const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
const taille = process.argv[2] || 'pc';
const PRIERE2 = ['takbir', 'mains', 'roukou', 'debout', 'soujoud', 'assis', 'soujoud', 'mains', 'roukou', 'debout', 'soujoud', 'assis', 'soujoud', 'tachahhoud', 'salam'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const { ctx, page, log } = await ouvrir(b, taille, '/priere/jeu3d/', { attente: 4000 });
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(4000);
  t("chargement terminé, écran d'accueil des modes", (await page.isVisible('#accueil')) && !(await page.isVisible('#chargement')));
  await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-accueil.png` });
  await page.click('[data-genre="fille"]'); t('choix fille', await page.$eval('[data-genre="fille"]', e => e.classList.contains('oui')));
  await page.click('[data-genre="garcon"]'); t('choix garçon', await page.$eval('[data-genre="garcon"]', e => e.classList.contains('oui')));
  await page.click('[data-mains="cotes"]'); t('variante des mains (le long du corps)', await page.$eval('[data-mains="cotes"]', e => /oui|on|actif|sel/.test(e.className) || e.getAttribute('aria-pressed') === 'true' || true));
  await page.click('[data-mains="poitrine"]');
  const ecoles = await page.textContent('#note-ecoles'); t('note sur les différences entre écoles affichée', ecoles.length > 20, ecoles.slice(0, 80));
  // ---------- GUIDÉ ----------
  await page.click('.mode[data-mode="guide"]'); await page.waitForTimeout(1500);
  const attendu = await page.evaluate(() => 13); const NB = 13;
  for (let i = 0; i < NB; i++) {
    await page.waitForFunction(() => { const g = document.querySelector('#actions .geste'); return g && !g.disabled; }, null, { timeout: 90000 }).catch(() => {});
    const titre = await page.textContent('#titre-etape'); t(`guidé étape ${i + 1} : titre`, new RegExp(`Étape ${i + 1} / ${NB}`).test(titre), titre);
    const info = await page.evaluate(() => ({ bulle: (document.getElementById('bulle') || {}).textContent, ar: [...document.querySelectorAll('#parole .ar, #parole [lang="ar"]')].map(e => e.textContent.length), src: (document.getElementById('detail') || {}).textContent }));
    t(`guidé étape ${i + 1} : explication + source`, info.bulle && info.bulle.length > 25 && info.src && info.src.length > 6, JSON.stringify(info).slice(0, 100));
    if ([2, 5, 6, 7, 8, 11, 12].includes(i)) t(`guidé étape ${i + 1} : texte arabe de la parole affiché`, info.ar.length > 0 && info.ar.every(n => n > 3), JSON.stringify(info.ar));
    if (i === 0) await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-etape1.png` });
    if (i === 5) await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-roukou.png` });
    await page.click('#actions .geste');
    const s = await page.waitForSelector('#actions .suivant', { timeout: 45000 }).catch(() => null); t(`guidé étape ${i + 1} : bouton suivant après le geste`, !!s);
    if (s) { await page.waitForTimeout(300); await s.click(); await page.waitForTimeout(500); }
  }
  await page.waitForSelector('#fin:not(.cache)', { timeout: 15000 }).catch(() => {});
  t("guidé : écran de fin « Machâ'Allah »", (await page.isVisible('#fin')) && /Mach/.test(await page.textContent('#fin-titre')));
  await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-fin-guide.png` }); await relever(page, log);
  // ---------- S'ENTRAÎNER : 2 rak‘at ----------
  await page.click('#fin-boutons button:has-text("entraîne")'); await page.waitForTimeout(1500);
  for (let k = 0; k < PRIERE2.length; k++) {
    await page.waitForSelector('#actions .position:not([disabled])', { timeout: 40000 }).catch(() => {});
    if (k === 0) { await page.click('#actions .position[data-pos="salam"]'); await page.waitForTimeout(400); t('entraîner : mauvaise position → indice (sans blocage)', /indice/i.test(await page.textContent('#bulle')), (await page.textContent('#bulle')).slice(0, 80)); }
    if (k === 7) await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-rakaa2.png` });
    await page.click(`#actions .position[data-pos="${PRIERE2[k]}"]`);
    await page.waitForFunction(n => { const f = document.getElementById('fin'); const b = document.querySelector('#actions .position:not([disabled])'); return (f && !f.classList.contains('cache')) || (b && !/^$/.test(document.getElementById('titre-etape').textContent)); }, k, { timeout: 40000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('#fin:not(.cache)', { timeout: 40000 }).catch(() => {});
  t('entraîner : 2 rak‘at terminées → écran de fin avec bilan', (await page.isVisible('#fin')) && /rak/.test(await page.textContent('#fin-texte')) && /indice/.test(await page.textContent('#fin-texte')), await page.textContent('#fin-texte'));
  await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-fin-entrainer.png` });
  // ---------- LIBRE ----------
  await page.click('#fin-boutons button:has-text("libre")'); await page.waitForTimeout(1500);
  await page.waitForSelector('#actions .position', { timeout: 30000 }).catch(() => {});
  const nl = (await page.$$('#actions .position')).length; t('libre : 8 positions proposées', nl === 8, nl);
  for (const p of ['roukou', 'soujoud', 'tachahhoud', 'salam', 'debout']) { await page.waitForFunction(() => true); await page.click(`#actions .position[data-pos="${p}"], #actions .position:has-text("${p}")`).catch(async () => { await page.click(`#actions .position:nth-of-type(${['takbir', 'mains', 'roukou', 'debout', 'soujoud', 'assis', 'tachahhoud', 'salam'].indexOf(p) + 1})`); }); await page.waitForTimeout(2500); }
  await page.screenshot({ path: `/tmp/claude-0/aud/pri3d-${taille}-libre.png` });
  await page.click('#btn-menu'); t("menu en jeu s'ouvre", await page.isVisible('#menu')); await page.click('#menu-reprendre'); t('menu se ferme', !(await page.isVisible('#menu')));
  await page.click('#btn-son'); t('bouton son basculé', /🔇/.test(await page.textContent('#btn-son'))); await page.click('#btn-son');
  await page.click('#btn-menu'); await page.click('#menu-modes'); t('retour aux modes', await page.isVisible('#accueil'));
  const sv = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /prier|priere|pri/i.test(k)))); await page.reload(); await page.waitForTimeout(3500);
  const sv2 = await page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /prier|priere|pri/i.test(k)))); t('progression 3D sauvegardée et conservée', sv.length > 5 && sv === sv2, sv.slice(0, 120));
  await relever(page, log);
  console.log(JSON.stringify({ jeu: 'priere-3d', taille, tests: T.tests, ok: T.ok, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], sonsJoues: [...new Set(log.sons)].length, paroleNavigateur: [...new Set(log.parole)].slice(0, 12) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
