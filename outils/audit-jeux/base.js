// Chemins réglables (sinon ceux de la machine d'origine) : PLAYWRIGHT_DIR = dossier du module playwright ; THREE_DIR = dossier du module three (0.170) ;
// les captures vont dans /tmp/claude-0/aud (sous Windows : C:\tmp\claude-0\aud, à créer).
const { chromium } = require(process.env.PLAYWRIGHT_DIR || '/opt/node-tools/node_modules/playwright');
const THREE_DIR = process.env.THREE_DIR || '/home/user/node_modules/three';
const URL0 = 'http://localhost:8791';
const TAILLES = { pc: { viewport: { width: 1366, height: 800 } }, tel: { viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, tab: { viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: true } };
async function ouvrir(browser, taille, chemin, opts = {}) {
  const ctx = await browser.newContext({ ...TAILLES[taille], ...(opts.ctx || {}) });
  const page = await ctx.newPage(); const log = { erreurs: [], reseau: [], voix: [], parole: [], sons: [] };
  page.on('pageerror', e => log.erreurs.push('JS: ' + e.message.slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) log.erreurs.push('console: ' + m.text().slice(0, 200)); });
  page.on('requestfailed', r => { const u = r.url(); if (!/fonts\.g|gstatic|google|cdn\.jsdelivr|firebase|googleapis/.test(u)) log.reseau.push('échec ' + u.replace(URL0, '')); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(URL0)) log.reseau.push(r.status() + ' ' + r.url().replace(URL0, '')); });
  await page.route('**/cdn.jsdelivr.net/npm/three@0.170.0/**', r => { const u = r.request().url().split('three@0.170.0/')[1]; r.fulfill({ path: THREE_DIR + '/' + u.replace('build/three.module.min.js', 'build/three.module.js'), contentType: 'text/javascript' }); });
  await page.addInitScript(() => {
    window.__parole = []; window.__sons = [];
    try { const S = window.speechSynthesis; if (S) { const sp = S.speak.bind(S); S.speak = u => { window.__parole.push(u.text); try { sp(u); } catch (e) {} }; } } catch (e) {}
    const play = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__sons.push((this.currentSrc || this.src || '').replace(location.origin, '')); return play.call(this).catch(() => {}); };
  });
  await page.goto(URL0 + chemin, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(opts.attente || 2500);
  return { ctx, page, log };
}
async function relever(page, log) { try { log.parole.push(...await page.evaluate(() => { const p = window.__parole.splice(0); return p; })); log.sons.push(...await page.evaluate(() => window.__sons.splice(0))); } catch (e) {} }
module.exports = { chromium, ouvrir, relever, TAILLES, URL0 };
