const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, d = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (d ? ' → ' + d : '')); };
const jeu = process.argv[2] || 'ablutions', taille = process.argv[3] || 'pc';
(async () => {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const { ctx, page, log } = await ouvrir(b, taille, `/${jeu}/`, { attente: 2500 });
  await page.evaluate(() => { localStorage.clear(); }); await page.reload(); await page.waitForTimeout(2000);
  const clic = s => page.click(s);
  const txt = s => page.evaluate(x => (document.querySelector(x) || {}).textContent || '', s);
  const visible = s => page.isVisible(s);
  t('accueil : 4 entrées (apprendre, 3D, jouer, 4e)', (await page.$$('.menu .big')).length === 4, (await page.$$('.menu .big')).length);
  await page.screenshot({ path: `/tmp/claude-0/aud/${jeu}2d-${taille}-accueil.png` });
  // ---- APPRENDRE ----
  const NB = jeu === 'ablutions' ? 9 : 13;
  await clic('#m1'); await page.waitForTimeout(500);
  for (let i = 0; i < NB; i++) {
    const c = await page.evaluate(() => ({ h2: (document.querySelector('.card h2') || {}).textContent, txt: (document.querySelector('.card .txt') || {}).textContent, src: (document.querySelector('.card .src') || {}).textContent, art: !!document.querySelector('.card svg') }));
    t(`${jeu} étape ${i + 1}/${NB} : titre, texte, illustration, source`, c.h2 && c.txt && c.txt.length > 25 && c.art && c.src && c.src.length > 6, JSON.stringify(c).slice(0, 140));
    if (jeu === 'priere') { const ar = await page.$$eval('.dh .ar', x => x.map(e => e.textContent.length)); if (ar.length) t(`priere étape ${i + 1} : texte arabe affiché`, ar.every(n => n > 3), ar.join(',')); }
    if (i === 0) await page.screenshot({ path: `/tmp/claude-0/aud/${jeu}2d-${taille}-etape1.png` });
    if (jeu === 'priere' && i === 3) await page.screenshot({ path: `/tmp/claude-0/aud/${jeu}2d-${taille}-fatiha.png` });
    if (jeu === 'ablutions' && i === 2) { await clic('#rp'); await clic('#rd'); }
    if (jeu === 'ablutions' && i === 1) { await clic('#bul'); }
    if (jeu === 'priere' && i === 2) { await clic('[data-play]'); await clic('[data-slow]'); await clic('[data-learn]'); }
    await page.waitForTimeout(250);
    if (i === 1) { await clic('#pv'); await page.waitForTimeout(200); t(`${jeu} : bouton « précédent »`, /1/.test(await txt('.num')) || /Étape 1/.test(await txt('.ttl'))); await clic('#nx'); await page.waitForTimeout(200); }
    await clic('#nx'); await page.waitForTimeout(300);
  }
  t(`${jeu} : écran de félicitations après la dernière étape`, await visible('#gj'));
  await page.screenshot({ path: `/tmp/claude-0/aud/${jeu}2d-${taille}-fin-apprendre.png` });
  await relever(page, log);
  // ---- JEUX ----
  await clic('#gj'); await page.waitForTimeout(400);
  const jeuxIds = jeu === 'ablutions' ? ['g1', 'g2', 'g3', 'g4'] : ['g1', 'g3', 'g4'];
  t(`${jeu} : menu des jeux (${jeuxIds.length})`, (await page.$$('.menu .big')).length === jeuxIds.length);
  const resultat = async nom => { await page.waitForSelector('#ag', { timeout: 12000 }).catch(() => {}); t(`${nom} : écran résultat avec étoiles`, (await visible('#ag')) && /★/.test(await txt('.win .stars'))); return await txt('.win .stars'); };
  if (jeu === 'ablutions') {
    const ordre = ['intention', 'bismillah', 'mains', 'bouche', 'nez', 'visage', 'bras', 'tete', 'pieds'];
    // G1 : une erreur puis tout juste
    await clic('#g1'); await page.waitForTimeout(300);
    await clic(`.pc[data-k="pieds"]`); t('g1 : mauvais choix → indice', /indice/i.test(await txt('#bul')), await txt('#bul'));
    for (const k of ordre) { await clic(`.pc[data-k="${k}"]`); await page.waitForTimeout(120); }
    t('g1 : étoiles obtenues', /★/.test(await resultat('g1')));
    await clic('#og'); await page.waitForTimeout(300);
    // G2
    await clic('#g2'); await page.waitForTimeout(300);
    for (let i = 0; i < 8; i++) {
      const lbl = (await txt('.ql')).trim(); const n = /tête|oreilles/i.test(lbl) ? 1 : 3;
      if (i === 0) { const faux = n === 1 ? 3 : 2; await clic(`.nums button[data-n="${faux}"]`); t('g2 : mauvaise réponse → bonne réponse montrée + explication', (await visible('#fb .bul')) && (await page.$$('.nums button.okk')).length === 1); }
      else await clic(`.nums button[data-n="${n}"]`);
      await page.waitForTimeout(100); await clic('#nq'); await page.waitForTimeout(250);
    }
    t('g2 : étoiles obtenues', /★/.test(await resultat('g2'))); await clic('#og'); await page.waitForTimeout(300);
    // G3
    await clic('#g3'); await page.waitForTimeout(300);
    const suite = { 'les mains': 'bouche', 'la bouche': 'nez', 'le nez': 'visage', 'le visage': 'bras', 'les bras': 'tete', 'la tête': 'pieds' };
    for (let i = 0; i < 7; i++) {
      const q = (await txt('.bul')).trim(); let k; if (/commence/.test(q)) k = 'mains'; else { const m = q.match(/après (.+?)(?: et les oreilles)? \?/); k = suite[m ? m[1].toLowerCase() : '']; }
      t(`g3 q${i + 1} : question comprise (${q.slice(0, 40)})`, !!k);
      if (i === 0) { const mauvais = (await page.$$eval('.pc', x => x.map(e => e.dataset.k))).find(x => x !== k); await clic(`.pc[data-k="${mauvais}"]`); t('g3 : mauvais choix → bonne partie montrée', (await page.$$('.pc.okk')).length === 1); }
      else await clic(`.pc[data-k="${k}"]`);
      await page.waitForTimeout(100); await clic('#nq'); await page.waitForTimeout(250);
    }
    t('g3 : étoiles obtenues', /★/.test(await resultat('g3'))); await clic('#og'); await page.waitForTimeout(300);
    // G4
    await clic('#g4'); await page.waitForTimeout(300);
    for (let i = 0; i < 7; i++) {
      const info = await page.evaluate(() => { const sq = [...document.querySelectorAll('.seq .sq')].map(e => ({ t: e.textContent, b: (e.querySelector('b') || {}).textContent || '' })); return { sq, boutons: [...document.querySelectorAll('.ans button')].map(b => b.dataset.o) }; });
      const L = info.sq.map(x => x.t.replace(/[GD]$/, '').replace(/sans oreilles$/, '')); const noms = info.sq.map(x => x.t);
      let rep = 'Tout est juste !';
      if (noms.some(x => /sans oreilles/.test(x))) rep = 'Il a oublié les oreilles';
      else if (info.sq.length === 9 && noms.findIndex(x => /pieds/i.test(x)) < noms.findIndex(x => /tête/i.test(x))) rep = 'Il a lavé les pieds avant la tête';
      else if (info.sq.some(x => x.b === 'G') && info.sq.findIndex(x => x.b === 'G') < info.sq.findIndex(x => x.b === 'D')) rep = 'Il a commencé par le bras gauche';
      else if (noms.findIndex(x => /visage/i.test(x)) < noms.findIndex(x => /mains/i.test(x))) rep = 'Il a lavé le visage avant les mains';
      else if (!noms.some(x => /nez/i.test(x))) rep = 'Il a oublié le nez';
      else if (!noms.some(x => /pieds/i.test(x))) rep = 'Il a oublié les pieds';
      t(`g4 mission ${i + 1} : bonne réponse proposée parmi les choix`, info.boutons.includes(rep), rep + ' | ' + info.boutons.join(' / '));
      if (i === 0) { const faux = info.boutons.find(x => x !== rep); await clic(`.ans button[data-o="${faux}"]`); t('g4 : mauvaise réponse → bonne montrée', (await page.$$('.ans button.okk')).length === 1); }
      else await clic(`.ans button[data-o="${rep}"]`);
      await page.waitForTimeout(100); await clic('#nq'); await page.waitForTimeout(250);
    }
    t('g4 : étoiles obtenues', /★/.test(await resultat('g4'))); await clic('#og'); await page.waitForTimeout(300);
    // Pourquoi
    await clic('#home'); await page.waitForTimeout(300); await clic('#m3'); await page.waitForTimeout(300);
    t('page « Pourquoi ? » (6 cartes)', (await page.$$('.why .wc')).length === 6);
    await clic('#home'); await page.waitForTimeout(200);
  } else {
    // PRIÈRE
    await clic('#g1'); await page.waitForTimeout(300);
    const ordre = [['takbir', 0], ['mains', 1], ['roukou', 2], ['debout', 3], ['soujoud', 4], ['assis', 5], ['soujoud', 6]];
    await clic('.pc[data-i="2"]'); t('g1 : mauvais choix → indice', /indice/i.test(await txt('#bul')), await txt('#bul'));
    for (let p = 0; p < 7; p++) { await clic(`.pc[data-i="${p}"]`); await page.waitForTimeout(150); }
    t('g1 : étoiles obtenues', /★/.test(await resultat('g1'))); await clic('#og'); await page.waitForTimeout(300);
    // G3
    await clic('#g3'); await page.waitForTimeout(300);
    const rep3 = { debout: 'qiyam', mains: 'qiyam', roukou: 'roukou', soujoud: 'soujoud', assis: 'jouloûs', tachahhoud: 'jouloûs', takbir: 'qiyam' };
    for (let i = 0; i < 6; i++) {
      const pose = await page.$eval('.pbox svg', e => e.getAttribute('aria-label')); const k = rep3[pose]; t(`g3 q${i + 1} : position « ${pose} » reconnue`, !!k);
      if (i === 0) { const faux = ['qiyam', 'roukou', 'soujoud', 'jouloûs'].find(x => x !== k); await clic(`.opt[data-a="${faux}"]`); t('g3 : mauvaise réponse → bonne montrée', (await page.$$('.opt.good')).length === 1); }
      else await clic(`.opt[data-a="${k}"]`);
      await page.waitForTimeout(2900);
    }
    t('g3 : étoiles obtenues', /★/.test(await resultat('g3'))); await clic('#og'); await page.waitForTimeout(300);
    // G4
    await clic('#g4'); await page.waitForTimeout(300);
    const attendu = ['ak', 'rk', 'sm', 'sj', 'gh', 'sj', 'ts'];
    for (let i = 0; i < 7; i++) {
      const dispo = await page.$$eval('.opt', x => x.map(e => e.dataset.d)); t(`g4 q${i + 1} : bonne parole proposée`, dispo.includes(attendu[i]), dispo.join(','));
      // AMBIGUÏTÉ : « Allâhou akbar » proposé comme mauvaise réponse alors qu'on le dit aussi entre les positions
      if (attendu[i] !== 'ak' && dispo.includes('ak')) T.ambigu = (T.ambigu || 0) + 1;
      if (i === 0) { const faux = dispo.find(x => x !== 'ak'); await clic(`.opt[data-d="${faux}"]`); t('g4 : mauvaise réponse → bonne montrée', (await page.$$('.opt.good')).length === 1); }
      else await clic(`.opt[data-d="${attendu[i]}"]`);
      await page.waitForTimeout(3900);
    }
    t('g4 : étoiles obtenues', /★/.test(await resultat('g4'))); await clic('#og'); await page.waitForTimeout(300);
    // diplôme
    await clic('#home'); await page.waitForTimeout(300); await clic('#m3'); await page.waitForTimeout(400);
    t('diplôme disponible après apprentissage + 3 jeux', await visible('#nm'));
    await page.fill('#nm', 'Testeur'); t('nom saisi sur le diplôme', /Testeur/.test(await txt('#dn'))); await page.screenshot({ path: `/tmp/claude-0/aud/priere2d-${taille}-diplome.png` });
    await clic('#home'); await page.waitForTimeout(200);
  }
  // sauvegarde / reprise
  const prog = await page.evaluate(k => localStorage.getItem(k), jeu === 'ablutions' ? 'ablutions' : 'priere'); await page.reload(); await page.waitForTimeout(2000);
  const prog2 = await page.evaluate(k => localStorage.getItem(k), jeu === 'ablutions' ? 'ablutions' : 'priere');
  t('progression sauvegardée et conservée après réouverture', prog && prog === prog2 && /g1/.test(prog), prog);
  t('étoiles visibles à l\'accueil après réouverture', /★/.test(await page.textContent('.menu')) || /\/ \d+ étoiles/.test(await page.textContent('.menu')));
  // son
  await clic('#snd'); t('bouton son basculé', /🔇/.test(await txt('#snd'))); await clic('#snd');
  await relever(page, log);
  console.log(JSON.stringify({ jeu, taille, tests: T.tests, ok: T.ok, ambiguites: T.ambigu || 0, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)], sonsJoues: [...new Set(log.sons)].length, paroleNavigateur: [...new Set(log.parole)].slice(0, 12) }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n'));
  await b.close();
})();
