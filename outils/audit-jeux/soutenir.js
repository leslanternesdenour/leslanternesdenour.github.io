const { chromium, ouvrir, TAILLES } = require('./base.js');
// Audit navigateur de /soutenir/ : état « bientôt » (don non configuré) sur 3 tailles, puis formulaire de don avec des réponses serveur SIMULÉES dans le navigateur.
// Aucun paiement n'est effectué ni simulé : le formulaire Stripe n'est jamais monté (aucune clé, aucun appel à Stripe).
(async () => { const b = await chromium.launch(); const res = [];
  for (const t of ['pc', 'tel', 'tab']) {
    const { ctx, page, log } = await ouvrir(b, t, '/soutenir/', { attente: 1800 });
    const h = await page.evaluate(() => ({ debordeX: document.documentElement.scrollWidth - innerWidth, formVisible: !document.getElementById('form-don').hidden, bientot: !document.getElementById('msg-bientot').hidden, liens: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), h1: document.querySelector('h1').textContent, img: document.querySelector('.maktoub img').naturalWidth }));
    await page.screenshot({ path: `/tmp/claude-0/aud/sout-${t}.png`, fullPage: true });
    res.push(['état « bientôt » ' + t, h.debordeX <= 0 && !h.formVisible && h.bientot && h.img > 0 && !log.erreurs.length && !log.reseau.filter(x => !/api\/(moi|don\/config)/.test(x)).length, JSON.stringify({ ...h, liens: undefined }) + ' ' + log.erreurs.join(',') + log.reseau.join(',')]);
    await ctx.close(); }
  // état « don configuré » : réponses du serveur simulées (rien n'est modifié dans le dépôt)
  for (const t of ['pc', 'tel']) {
    const ctx = await b.newContext(TAILLES[t]); const page = await ctx.newPage(); let sessions = 0;
    await page.route('**/api/don/config', r => r.fulfill({ contentType: 'application/json', body: '{"cle":"pk_test_audit"}' }));
    await page.route('**/api/don/session', r => { sessions++; r.fulfill({ status: 503, contentType: 'application/json', body: '{"erreur":"don-non-configure"}' }); });
    await page.goto('http://localhost:8791/soutenir/'); await page.waitForTimeout(1200);
    const avant = await page.evaluate(() => ({ form: !document.getElementById('form-don').hidden, bientot: !document.getElementById('msg-bientot').hidden, radios: [...document.querySelectorAll('input[name="montant"]')].map(r => r.value), libre: !document.getElementById('champ-libre').hidden }));
    await page.click('label:has(input[value="libre"])'); await page.fill('#montant-libre', '0'); await page.click('#btn-continuer'); await page.waitForTimeout(300);
    const invalide = await page.evaluate(() => ({ erreur: document.getElementById('erreur-don').textContent, libre: !document.getElementById('champ-libre').hidden }));
    await page.click('label:has(input[value="5"])'); await page.click('#btn-continuer'); await page.waitForTimeout(500);
    const panne = await page.evaluate(() => ({ erreur: document.getElementById('erreur-don').textContent, form: !document.getElementById('form-don').hidden }));
    const ok = avant.form && !avant.bientot && avant.radios.join() === '5,10,20,libre' && !avant.libre && /entre 1 € et 500 €/.test(invalide.erreur) && invalide.libre && sessions === 1 && /momentanément indisponible/.test(panne.erreur) && panne.form;
    res.push(['formulaire de don ' + t, ok, JSON.stringify({ avant, invalide, panne, sessions })]);
    if (t === 'pc') await page.screenshot({ path: '/tmp/claude-0/aud/sout-configure.png', fullPage: true });
    await ctx.close(); }
  for (const r of res) console.log(r[1] ? 'OK ' : 'KO ', r[0], r[1] ? '' : r[2]); await b.close(); })();
