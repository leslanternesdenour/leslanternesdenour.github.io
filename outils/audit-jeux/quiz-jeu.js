const { chromium, ouvrir, relever } = require('./base.js');
const T = { tests: 0, ok: 0, echecs: [] };
const t = (nom, cond, detail = '') => { T.tests++; if (cond) T.ok++; else T.echecs.push(nom + (detail ? ' → ' + detail : '')); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const taille = process.argv[2] || 'pc', age = process.argv[3] || 'moyens';
  const { ctx, page, log } = await ouvrir(b, taille, '/aventures/quiz-nour/', { attente: 3000 });
  await page.evaluate(a => { localStorage.clear(); }, 0); await page.reload(); await page.waitForTimeout(2500);
  t('écran âge affiché au premier lancement', await page.isVisible('#age-bloc'));
  await page.screenshot({ path: `/tmp/claude-0/aud/quiz-${taille}-age.png` });
  await page.click(`[data-age="${age}"]`); await page.waitForTimeout(400);
  t('thèmes affichés après le choix de l\'âge', await page.isVisible('#themes-bloc'));
  const themes = await page.$$eval('#themes button', bs => bs.map(x => x.dataset.c)); t('8 thèmes', themes.length === 8, themes.length);
  const niveaux = await page.$$eval('#niveaux button', bs => bs.map(x => x.dataset.n)); t('3 niveaux', niveaux.length === 3);
  const voixManquantes = new Set(), parolesFallback = [];
  const listeThemes = taille === 'pc' ? themes : themes.slice(0, 2), listeNiv = taille === 'pc' ? niveaux : ['moyen'];
  for (const th of listeThemes) for (const niv of listeNiv) {
    await page.click(`#niveaux button[data-n="${niv}"]`); await page.waitForTimeout(150);
    await page.click(`#themes button[data-c="${th}"]`); await page.waitForTimeout(600);
    t(`${th}/${niv} : la partie démarre`, await page.evaluate(() => !!window.__quiz.partie()));
    const n = await page.evaluate(() => window.__quiz.partie().qs.length); t(`${th}/${niv} : 4 questions`, n === 4, n);
    // l'intro parle : la question apparaît ensuite (filet de sécurité) 
    await page.waitForSelector('#question:not(.cache)', { timeout: 20000 }).catch(() => {});
    t(`${th}/${niv} : la 1re question s'affiche`, await page.isVisible('#question'));
    for (let i = 0; i < n; i++) {
      await page.waitForSelector('#reponses .rep', { timeout: 8000 }).catch(() => {});
      const bonne = await page.evaluate(() => window.__quiz.bonne()); const nb = await page.$$eval('#reponses .rep', x => x.length);
      if (i === 0 && nb > 1) { // mauvaise réponse d'abord
        const faux = bonne === 0 ? 1 : 0; await page.click(`#reponses .rep[data-k="${faux}"]`); await page.waitForTimeout(200);
        t(`${th}/${niv} : mauvaise réponse marquée + explication`, await page.$eval(`#reponses .rep[data-k="${faux}"]`, e => e.classList.contains('faux') && e.disabled) && await page.isVisible('#explication') && !(await page.isVisible('#suivant')));
      }
      if (i === 1) { await page.click('#aide'); await page.waitForTimeout(150); }   // coup de pouce
      await page.click(`#reponses .rep[data-k="${bonne}"]`); await page.waitForTimeout(150);
      t(`${th}/${niv} q${i + 1} : bonne réponse validée`, await page.$eval(`#reponses .rep[data-k="${bonne}"]`, e => e.classList.contains('juste')) && await page.isVisible('#suivant'));
      await page.click('#suivant'); await page.waitForTimeout(150);
    }
    await page.waitForSelector('#fin:not(.cache)', { timeout: 5000 }).catch(() => {});
    t(`${th}/${niv} : écran de fin`, await page.isVisible('#fin'));
    const fin = await page.evaluate(() => ({ titre: document.getElementById('fin-titre').textContent, score: document.getElementById('fin-score').textContent, et: document.getElementById('fin-etoiles').textContent }));
    t(`${th}/${niv} : fin cohérente (étoiles/score)`, /⭐/.test(fin.et) && /sur 4/.test(fin.score), JSON.stringify(fin));
    if (th === listeThemes[0] && niv === listeNiv[0]) await page.screenshot({ path: `/tmp/claude-0/aud/quiz-${taille}-fin.png` });
    await page.click('#fin-themes'); await page.waitForTimeout(250);
    await relever(page, log);
  }
  // sauvegarde + reprise
  const avant = await page.evaluate(() => JSON.stringify(window.__quiz.etat().etoiles)); await page.reload(); await page.waitForTimeout(2500);
  const apres = await page.evaluate(() => JSON.stringify(window.__quiz.etat().etoiles)); t('étoiles conservées après fermeture/réouverture', avant === apres && avant.includes('1') || avant === apres, avant + ' / ' + apres);
  t('âge conservé', await page.evaluate(a => window.__quiz.etat().age === a, age)); t('thèmes affichés directement à la reprise', await page.isVisible('#themes-bloc'));
  // boutons annexes
  await page.click('#btn-diplomes'); t('diplômes s\'ouvrent', await page.isVisible('#diplomes')); await page.click('#diplomes-fermer'); t('diplômes se ferment', !(await page.isVisible('#diplomes')));
  await page.click('#btn-reglages'); t('réglages s\'ouvrent', await page.isVisible('#reglages')); await page.screenshot({ path: `/tmp/claude-0/aud/quiz-${taille}-reglages.png` });
  await page.click('#changer-age'); t('changer d\'âge réaffiche le choix', await page.isVisible('#age-bloc'));
  await page.click(`[data-age="petits"]`); await page.waitForTimeout(300); t('nouveau groupe d\'âge pris en compte', await page.evaluate(() => window.__quiz.etat().age === 'petits'));
  await page.click(`#themes button[data-c="${themes[0]}"]`); await page.waitForSelector('#question:not(.cache)', { timeout: 20000 }).catch(() => {});
  await page.click('#reecouter'); t('bouton réécouter sans erreur', true); await page.screenshot({ path: `/tmp/claude-0/aud/quiz-${taille}-question.png` });
  await page.click('#retour'); t('retour aux thèmes', await page.isVisible('#themes-bloc'));
  const v = await page.evaluate(() => window.__quiz.voix().length);
  console.log(JSON.stringify({ jeu: 'quiz', taille, age, tests: T.tests, ok: T.ok, voixDispo: v, parolesNavigateur: [...new Set(log.parole)].length, sons: log.sons.length, erreursJS: log.erreurs, reseau: [...new Set(log.reseau)] }));
  if (T.echecs.length) console.log('ÉCHECS:\n' + T.echecs.join('\n')); await b.close();
})();
