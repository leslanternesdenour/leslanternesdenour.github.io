const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = process.argv[2], BASE = 'http://localhost:8803', T = '/home/user/node_modules/three/';
const POSTURES = ['debout', 'takbir', 'mains', 'roukou', 'plie', 'genoux', 'penche', 'soujoud', 'assis', 'tachahhoud', 'salamDroite', 'salamGauche', 'releve'];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
  async function ouvrir(nom, vp, mob, query, { bloquerGLB = false } = {}) {
    const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob, locale: 'fr-FR' }); const page = await ctx.newPage(); const erreurs = [], echecs = [];
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\//, r => { const f = T + r.request().url().split('three@0.170.0/')[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
    await ctx.route(/fonts\.(googleapis|gstatic)|youtube|ytimg|\/api\//, r => r.abort());
    if (bloquerGLB) await ctx.route(/\.glb$/, r => r.abort());
    page.on('pageerror', e => erreurs.push(e.message.slice(0, 160))); page.on('requestfailed', r => { if (!/fonts|api\//.test(r.url())) echecs.push(r.url().split('/').pop()); });
    page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) erreurs.push('CSP ' + m.text().slice(0, 100)); });
    await page.goto(BASE + '/priere/jeu3d/' + query); await page.waitForFunction(() => window.__pri && window.__pri.enfant() && window.__pri.enfant().v, null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(800); return { ctx, page, erreurs, echecs, nom };
  }
  const resume = [];
  for (const [nom, vp, mob] of [['pc', { width: 1100, height: 760 }, false], ['tel', { width: 390, height: 780 }, true]]) {
    const A = await ouvrir(nom, vp, mob, '?perso=nouveau'); const p = A.page;
    const types = await p.evaluate(() => window.__pri.perso()); resume.push(`${nom} ?perso=nouveau : ${JSON.stringify(types)} | erreurs JS: ${A.erreurs.length} ${A.erreurs.join(' / ')} | requêtes échouées: ${A.echecs.join(',')}`);
    await p.evaluate(() => { const o = document.getElementById('accueil'); }); 
    const lance = await p.evaluate(() => { try { window.__pri.lancer('libre'); return true; } catch (e) { return String(e); } }); await p.waitForTimeout(600);
    const mesures = [];
    for (const po of POSTURES) { await p.evaluate(n => window.__pri.poser(n), po); await p.waitForTimeout(1100);
      const m = await p.evaluate(() => { const e = window.__pri.enfant(), v = e.v; v.racine.updateMatrixWorld(true); const tw = new v.racine.position.constructor(); v.tete.getWorldPosition(tw); const bw = new tw.constructor(); v.bassin.getWorldPosition(bw); return { teteY: +tw.y.toFixed(3), bassinY: +bw.y.toFixed(3), inf: v.influence ? Object.fromEntries(Object.entries(v.influence).map(([k, x]) => [k, +x.toFixed(2)])) : null }; });
      mesures.push(po + ':' + m.teteY + '/' + m.bassinY + (m.inf ? ' ' + JSON.stringify(m.inf) : ''));
      if (['debout', 'roukou', 'soujoud', 'tachahhoud'].includes(po)) await p.screenshot({ path: `${OUT}/${nom}-${po}.png` }); }
    resume.push(`${nom} postures (tête/bassin en m) : ` + mesures.join(' ; '));
    // pixels non vides
    const px = await p.evaluate(() => { const c = document.getElementById('scene'); const t = document.createElement('canvas'); t.width = 64; t.height = 64; const x = t.getContext('2d'); x.drawImage(c, 0, 0, 64, 64); const d = x.getImageData(0, 0, 64, 64).data; let n = 0, s = new Set(); for (let i = 0; i < d.length; i += 4) { s.add(d[i] + ',' + d[i + 1]); if (d[i] + d[i + 1] + d[i + 2] > 30) n++; } return { couleursDistinctes: s.size, pixelsClairs: n }; }); resume.push(`${nom} rendu : ${JSON.stringify(px)}`);
    // changement de genre répété
    let ok = true; const geo = []; await p.evaluate(() => { try { document.getElementById('accueil').classList.remove('cache'); } catch (e) {} });
    for (let passe = 0; passe < 2; passe++) { for (let i = 0; i < 6; i++) { const g = i % 2 ? 'fille' : 'garcon';
      await p.evaluate(gn => document.querySelector(`.choix-perso[data-genre="${gn}"]`).click(), g);
      const att = await p.waitForFunction(gn => window.__pri.enfant().v.genre === gn && window.__pri.perso().enfant === 'nouveau', g, { timeout: 15000 }).then(() => true).catch(() => false); if (!att) ok = false; }
      await p.waitForTimeout(500); geo.push(await p.evaluate(() => { const m = window.__pri.renderer.info.memory; return m.geometries + '/' + m.textures; })); }
    resume.push(`${nom} 12 changements de genre : ${ok ? 'OK' : 'ÉCHEC'} | géométries/textures GPU après la passe 1 puis 2 : ${geo.join(' → ')} | erreurs JS: ${A.erreurs.length}`);
    await A.ctx.close();
    const S = await ouvrir(nom, vp, mob, '?perso=nouveau', { bloquerGLB: true }); const ts = await S.page.evaluate(() => window.__pri.perso()); resume.push(`${nom} secours (modèle bloqué) : ${JSON.stringify(ts)} | erreurs JS: ${S.erreurs.length}`); await S.ctx.close();
    const O = await ouvrir(nom, vp, mob, '?perso=ancien'); await O.page.evaluate(() => window.__pri.lancer('libre')); await O.page.waitForTimeout(500); for (const po of ['debout', 'soujoud']) { await O.page.evaluate(n => window.__pri.poser(n), po); await O.page.waitForTimeout(1100); await O.page.screenshot({ path: `${OUT}/ancien-${nom}-${po}.png` }); } await O.ctx.close();
    const D = await ouvrir(nom, vp, mob, ''); resume.push(`${nom} défaut : ${JSON.stringify(await D.page.evaluate(() => window.__pri.perso()))}`); await D.ctx.close();
  }
  console.log(resume.join('\n')); await b.close();
})();
