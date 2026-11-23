const { chromium, ouvrir, TAILLES } = require('./base.js');
(async () => { const b = await chromium.launch(); const res = [];
  for (const t of ['pc', 'tel', 'tab']) {
    const { ctx, page, log } = await ouvrir(b, t, '/soutenir/', { attente: 1800 });
    const h = await page.evaluate(() => ({ debordeX: document.documentElement.scrollWidth - innerWidth, btnLien: !!document.querySelector('#btn-participer:not([hidden])'), bientot: !document.getElementById('msg-bientot').hidden, liens: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), h1: document.querySelector('h1').textContent, img: document.querySelector('.maktoub img').naturalWidth }));
    await page.screenshot({ path: `/tmp/claude-0/aud/sout-${t}.png`, fullPage: true });
    res.push(['état « bientôt » ' + t, h.debordeX <= 0 && !h.btnLien && h.bientot && h.img > 0 && !log.erreurs.length && !log.reseau.filter(x => !/api\/moi/.test(x)).length, JSON.stringify({ ...h, liens: undefined }) + ' ' + log.erreurs.join(',') + log.reseau.join(',')]);
    await ctx.close(); }
  // état « configuré » (simulé dans le navigateur uniquement, rien n'est modifié dans le dépôt)
  for (const [nom, url, attendu] of [['URL Leetchi valide', 'https://www.leetchi.com/fr/c/exemple-test', true], ['URL http refusée', 'http://www.leetchi.com/fr/c/x', false], ['hôte étranger refusé', 'https://leetchi.com.pirate.example/c/x', false], ['javascript: refusé', 'javascript:alert(1)', false]]) {
    const ctx = await b.newContext(TAILLES.pc); const page = await ctx.newPage();
    await page.route('**/soutenir/config.js*', r => r.fulfill({ contentType: 'text/javascript', body: `export const SUPPORT_POT_URL = ${JSON.stringify(url)}; export const OBJECTIF_EUROS = 3000;` }));
    await page.goto('http://localhost:8791/soutenir/'); await page.waitForTimeout(1200);
    const e = await page.evaluate(() => { const a = document.getElementById('btn-participer'); return { visible: !a.hidden, href: a.getAttribute('href'), target: a.target, rel: a.rel, bientot: !document.getElementById('msg-bientot').hidden, note: !document.getElementById('note-leetchi').hidden, texte: a.textContent }; });
    const ok = attendu ? e.visible && e.target === '_blank' && /noopener/.test(e.rel) && /noreferrer/.test(e.rel) && e.href === url && !e.bientot && e.texte === 'PARTICIPER À LA CAGNOTTE' : !e.visible && e.bientot;
    res.push([nom, ok, JSON.stringify(e)]); if (attendu) await page.screenshot({ path: '/tmp/claude-0/aud/sout-configure.png', clip: { x: 0, y: 700, width: 1366, height: 700 }, fullPage: true }); await ctx.close(); }
  for (const r of res) console.log(r[1] ? 'OK ' : 'KO ', r[0], r[1] ? '' : r[2]); await b.close(); })();
