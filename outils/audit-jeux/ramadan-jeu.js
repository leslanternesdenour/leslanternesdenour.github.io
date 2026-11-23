const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const taille = process.argv[2] || 'pc';
  const { ctx, page, log } = await ouvrir(b, taille, '/calendrier/', { attente: 2500 });
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(2000);
  const lanternes = await page.$$('#grid button.l'); t('grille de 30 lanternes', lanternes.length === 30, lanternes.length);
  await page.screenshot({ path: `/tmp/claude-0/aud/ram-${taille}-accueil.png`, fullPage: true });
  // premier lancement : création du profil
  t('carte de bienvenue (explication) au premier lancement', await page.isVisible('#gok'));
  await page.click('#gsay'); await page.waitForTimeout(200); await page.click('#gok'); await page.waitForTimeout(300);
  t('formulaire de profil au premier lancement', await page.isVisible('#fn'));
  await page.click('#go'); t("champs obligatoires : refus si vide", await page.isVisible('#fn'));
  await page.fill('#fn', 'Testeur'); await page.selectOption('#fa', '7'); await page.click('.seg button[data-g="g"]'); await page.click('#go'); await page.waitForTimeout(500);
  t('profil créé + salutation', /Testeur/.test(await page.textContent('#hello')));
  t('niveau actif (petite/grande lanterne)', (await page.$$eval('#lv1.on, #lv2.on', x => x.length)) === 1);
  await page.click('#lv2'); await page.waitForTimeout(200); t('passage en Grande lanterne', await page.$eval('#lv2', e => e.classList.contains('on')));
  // 30 missions : ouvrir, lire, allumer
  let toasts = [];
  for (let d = 1; d <= 30; d++) {
    await page.click(`#grid button.l:nth-child(${d})`); await page.waitForSelector('#ov.on .card', { timeout: 3000 }).catch(() => {});
    const c = await page.evaluate(() => ({ titre: document.querySelector('#ov h2') && document.querySelector('#ov h2').textContent, texte: document.querySelector('#ov .cb p') && document.querySelector('#ov .cb p').textContent, med: document.querySelector('#ov .med') && document.querySelector('#ov .med').textContent }));
    t(`jour ${d} : carte de mission complète`, c.titre && c.texte && c.texte.length > 20 && c.med === String(d), JSON.stringify(c).slice(0, 120));
    if (d === 5) { await page.click('#cs'); await page.waitForTimeout(150); }
    await page.click('#lit'); await page.waitForTimeout(120);
    t(`jour ${d} : lanterne allumée`, await page.$eval(`#grid button.l:nth-child(${d})`, e => e.classList.contains('lit')));
    if ([10, 20, 29].includes(d)) { toasts.push(d + ':' + (await page.textContent('#toast'))); }
    if (d === 30) { await page.waitForTimeout(1200); }
  }
  t('compteur 30 / 30', /30 \/ 30/.test(await page.textContent('#count')), await page.textContent('#count'));
  t('messages aux paliers 10 / 20 / 29', toasts.length === 3 && toasts.every(x => x.length > 6), toasts.join(' | '));
  await page.screenshot({ path: `/tmp/claude-0/aud/ram-${taille}-fin.png` });
  t('écran de fin / diplôme après 30 lanternes', await page.isVisible('#ov.on'), '');
  await relever(page, log);
  // éteindre / rallumer
  await page.keyboard.press('Escape'); await page.evaluate(() => { const o = document.getElementById('ov'); o.classList.remove('on'); o.innerHTML = ''; });
  await page.click('#grid button.l:nth-child(3)'); await page.click('#lit'); await page.waitForTimeout(150);
  t('« Éteindre » éteint une lanterne', !(await page.$eval('#grid button.l:nth-child(3)', e => e.classList.contains('lit'))) && /29 \/ 30/.test(await page.textContent('#count')));
  // sauvegarde / reprise
  await page.reload(); await page.waitForTimeout(2000);
  t('progression conservée après réouverture', /29 \/ 30/.test(await page.textContent('#count')) && /Testeur/.test(await page.textContent('#hello')), await page.textContent('#count'));
  // petite lanterne : texte différent
  const grand = await (async () => { await page.click('#grid button.l:nth-child(1)'); const x = await page.textContent('#ov .cb p'); await page.click('#cl'); return x; })();
  await page.click('#lv1'); await page.click('#grid button.l:nth-child(1)'); const petit = await page.textContent('#ov .cb p'); await page.click('#cl');
  t('texte différent selon l\'âge (3-5 / 6-10)', grand !== petit && petit.length > 10);
  // jeux
  await page.goto('http://localhost:8791/calendrier/#jeux'); await page.waitForTimeout(800);
  t('onglet Jeux visible', await page.isVisible('#v-jeux'));
  for (const tab of ['dev', 'qr']) {
    await page.click(`.seg2 button[data-t="${tab}"]`); await page.waitForTimeout(250);
    const n = await page.evaluate(() => (document.querySelector('#jcard .jh span b') || {}).textContent);
    for (let i = 0; i < 3; i++) { await page.click('#jr'); await page.waitForSelector('#jf'); t(`jeu ${tab} #${i + 1} : réponse + mot arabe + traduction`, (await page.isVisible('#jcard .ans .a')) && (await page.isVisible('#jcard .ans .word .ar')) && (await page.textContent('#jcard .ans .word .t')).length > 0); if (i === 0) await page.click('#sq'); await page.click('#jf'); await page.waitForTimeout(200); }
    t(`jeu ${tab} : ⭐ comptées`, /⭐ [1-9]/.test(await page.textContent('#jstars')), await page.textContent('#jstars'));
  }
  // memory niveau petit : paires image/image
  await page.click('.seg2 button[data-t="mem"]'); await page.waitForTimeout(300);
  const nc = await page.$$eval('.mc', x => x.length); t('memory : 12 cartes (3-5 ans)', nc === 12, nc);
  const faces = await page.$$eval('.mc', bs => bs.map(x => x.querySelector('.mf').innerHTML));
  const groupes = {}; faces.forEach((f, i) => (groupes[f] = groupes[f] || []).push(i));
  const paires = Object.values(groupes).filter(g => g.length === 2); t('memory : 6 paires distinctes', paires.length === 6, paires.length);
  await page.click(`.mc[data-i="${paires[0][0]}"]`); await page.click(`.mc[data-i="${paires.find(p => p !== paires[0])[0]}"]`); await page.waitForTimeout(1300);
  t('memory : fausse paire se retourne', (await page.$$eval('.mc.on:not(.ok)', x => x.length)) === 0);
  for (const p of paires) { await page.click(`.mc[data-i="${p[0]}"]`); await page.click(`.mc[data-i="${p[1]}"]`); await page.waitForTimeout(150); }
  await page.waitForTimeout(600);
  t('memory : 6 paires trouvées', /6 \/ 6 paires/.test(await page.textContent('#jstars')), await page.textContent('#jstars'));
  await page.screenshot({ path: `/tmp/claude-0/aud/ram-${taille}-memory.png` });
  // histoires
  await page.goto('http://localhost:8791/calendrier/#histoires'); await page.waitForTimeout(600);
  const hc = await page.$$('#hlist a.hc'); t('histoires : liste des épisodes', hc.length >= 5, hc.length);
  await hc[0].click(); await page.waitForTimeout(800); t('page vidéo s\'affiche', await page.isVisible('#v-video') && (await page.textContent('#v-video')).length > 20);
  await relever(page, log);
  console.log(JSON.stringify({ jeu: 'ramadan', taille, tests: T.tests, ok: T.ok, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], sonsJoues: [...new Set(log.sons)].length, paroleNavigateur: [...new Set(log.parole)].slice(0, 6) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
