const { chromium } = require('playwright'); const fs = require('fs'); const T = '/home/user/node_modules/three/';
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }); const sortie = [];
  async function ouvrir(vp, mob, q) { const ctx = await b.newContext({ viewport: vp, isMobile: mob, hasTouch: mob }); const p = await ctx.newPage(); const err = [];
    await ctx.route(/cdn\.jsdelivr\.net\/npm\/three@0\.170\.0\//, r => { const f = T + r.request().url().split('three@0.170.0/')[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
    await ctx.route(/fonts\.|youtube|ytimg|\/api\//, r => r.abort()); p.on('pageerror', e => err.push(e.message.slice(0, 140)));
    await p.goto('http://localhost:8803/ablutions/jeu3d/' + q); await p.waitForFunction(() => window.__abl && window.__abl.perso(), null, { timeout: 25000 }).catch(() => {}); await p.waitForTimeout(700); return { ctx, p, err }; }
  for (const [nom, vp, mob] of [['pc', { width: 1100, height: 760 }, false], ['tel', { width: 390, height: 780 }, true]]) for (const [etiq, q] of [['nouveau', '?perso=nouveau'], ['ancien', '?perso=ancien']]) {
    const { ctx, p, err } = await ouvrir(vp, mob, q); const type = await p.evaluate(() => window.__abl.type());
    await p.evaluate(() => window.__abl.lancer('libre')); await p.waitForTimeout(800);
    // marche : on avance
    await p.evaluate(() => { const A = window.__abl; A.J.vit = 2.2; A.J.cible = null; }); await p.waitForTimeout(1200); await p.screenshot({ path: `${process.argv[2]}/abl-${etiq}-${nom}-marche.png` });
    await p.evaluate(() => { window.__abl.J.vit = 0; window.__abl.asseoir(1); }); await p.waitForTimeout(1500); await p.screenshot({ path: `${process.argv[2]}/abl-${etiq}-${nom}-assis.png` });
    const seqs = await p.evaluate(() => Object.keys(window.__abl.SEQUENCES)); const vus = [];
    for (const s of seqs) { const ok = await p.evaluate(n => window.__abl.gestes().jouer(n, null, true), s); await p.waitForTimeout(450); const m = await p.evaluate(() => { const v = window.__abl.perso(); v.racine.updateMatrixWorld(true); let ok = true; v.racine.traverse(o => { if (o.isBone) for (const x of o.matrixWorld.elements) if (!Number.isFinite(x)) ok = false; }); return ok; }); vus.push(s + (m ? '' : '(NaN)')); if (['pied', 'piedD', 'piedG', 'bouche', 'nez', 'puiser'].some(k => s.toLowerCase().includes(k)) && !['x'].includes(s)) await p.screenshot({ path: `${process.argv[2]}/abl-${etiq}-${nom}-${s}.png` }); }
    sortie.push(`${nom} ${etiq} : type=${type} | séquences jouées sans valeur aberrante : ${vus.filter(x => !x.includes('NaN')).length}/${seqs.length} ${vus.filter(x => x.includes('NaN')).join(',')} | erreurs JS : ${err.length} ${err.slice(0, 2).join(' / ')}`); await ctx.close(); }
  console.log(sortie.join('\n')); await b.close(); })();
