const { chromium, ouvrir, relever } = require('./base.js');
const jeux = { ablutions: '/ablutions/', 'ablutions-3d': '/ablutions/jeu3d/', priere: '/priere/', 'priere-3d': '/priere/jeu3d/', ramadan: '/calendrier/', chasse: '/aventures/chasse-aux-mots/', desert: '/aventures/mysteres-desert/', quiz: '/aventures/quiz-nour/', hub: '/aventures/', village: '/monde/', voyage: '/voyage/' };
(async () => { const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  for (const [nom, chemin] of Object.entries(jeux)) for (const t of ['pc', 'tel', 'tab']) {
    const { ctx, page, log } = await ouvrir(b, t, chemin, { attente: 3500 });
    await page.screenshot({ path: `/tmp/claude-0/aud/s-${nom}-${t}.png` });
    const h = await page.evaluate(() => ({ titre: document.title, debordeX: document.documentElement.scrollWidth - innerWidth, boutons: document.querySelectorAll('button,a').length }));
    console.log(nom.padEnd(13), t, JSON.stringify(h), log.erreurs.length ? 'ERR:' + log.erreurs.join(' | ') : '', log.reseau.length ? 'RES:' + [...new Set(log.reseau)].join(' | ') : ''); await ctx.close(); }
  await b.close(); })();
