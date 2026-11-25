// Balayage téléphone / tablette / ordinateur des pages du site : erreurs JavaScript, ressources en échec, débordement horizontal. Prérequis : dist/ servi sur le port 8791.
const { chromium, ouvrir, relever } = require('./base.js');
const PAGES = ['/', '/monde/', '/voyage/?sandbox=1', '/ablutions/', '/ablutions/jeu3d/', '/priere/', '/priere/jeu3d/', '/calendrier/', '/aventures/', '/aventures/chasse-aux-mots/', '/aventures/mysteres-desert/', '/aventures/quiz-nour/', '/ecole-arabe/', '/ecole-arabe/lettres/', '/ecole-arabe/lecture/', '/ecole-arabe/chiffres/', '/compte/', '/tarifs/', '/soutenir/', '/conditions/', '/decouvrir/'];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); let ko = 0;
  for (const t of ['tel', 'tab', 'pc']) for (const p of PAGES) {
    const { ctx, page, log } = await ouvrir(b, t, p, { attente: 2500 });
    const deb = await page.evaluate(() => ({ d: document.documentElement.scrollWidth - innerWidth, h: document.body ? document.body.innerText.length : 0 })).catch(() => ({ d: 0, h: 0 }));
    const rs = log.reseau.filter(x => !/^404 \/api\/|favicon/.test(x));
    const pb = [...log.erreurs, ...rs.map(x => 'réseau ' + x)]; if (deb.d > 2) pb.push('débordement horizontal +' + deb.d + 'px'); if (deb.h < 20) pb.push('page vide');
    if (pb.length) { ko++; console.log(`✗ ${t} ${p} :`, pb.slice(0, 4).join(' | ').slice(0, 300)); }
    await ctx.close();
  }
  console.log(ko ? `${ko} page(s) à examiner` : '✓ aucune anomalie'); await b.close();
})();
