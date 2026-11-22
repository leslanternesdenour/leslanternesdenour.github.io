// Planches de présentation de l'amélioration des personnages (avant/après, vues, expressions, gestes, compatibilité mode sans visage).
//   node outils/tests/planches-personnages.cjs [url]   puis   python3 outils/tests/planches-personnages.py
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const BASE = process.argv[2] || 'http://localhost:8797', OUT = process.env.SORTIE || '/tmp/ldn-planches/'; fs.mkdirSync(OUT, { recursive: true });
const THREE = '/home/user/node_modules/three';
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await c.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r => { const f = THREE + '/' + r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f) ? r.fulfill({ path: f, contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }) : r.abort(); });
  await c.route(/fonts\./, r => r.abort());
  const p = await c.newPage(); await p.goto(BASE + '/outils/personnages/amelioration.html'); await p.waitForFunction(() => window.__pret, null, { timeout: 40000 });
  const sauve = async (nom, o) => { const u = await p.evaluate(o => window.__cadre(o), o); fs.writeFileSync(OUT + nom + '.png', Buffer.from(u.split(',')[1], 'base64')); };
  const G = ['garcon', 'fille'], VUES = { face: 0, trois: 0.65, profil: Math.PI / 2, dos: Math.PI };
  const EX = ['neutre', 'joie', 'surprise', 'curiosite', 'tristesse', 'malice'];
  const GE = { garcon: ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'maladroit'], fille: ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'encourager'] };
  const T = { accueil: [0.3, 0.7, 1.1, 1.6, 2.1], reussite: [0.2, 0.5, 0.8, 1.1, 1.5], recompense: [0.3, 0.6, 0.9, 1.3, 1.8], surprise: [0.15, 0.4, 0.7, 1.0, 1.25], curiosite: [0.3, 0.7, 1.1, 1.6, 2.1], tristesse: [0.3, 0.7, 1.1, 1.6, 2.0], maladroit: [0.2, 0.45, 0.7, 1.0, 1.4], encourager: [0.3, 0.7, 1.1, 1.6, 2.0] };
  for (const g of G) {
    for (const v of [false, true]) for (const [vn, yaw] of Object.entries(VUES)) await sauve(`vue-${g}-${v ? 'apres' : 'avant'}-${vn}`, { genre: g, v2: v, cam: 'corps', yaw, t: 0.3, sv: 0, larg: 260, haut: 360 });
    for (const v of [false, true]) await sauve(`visage-${g}-${v ? 'apres' : 'avant'}`, { genre: g, v2: v, cam: 'tete', sv: 0, larg: 420, haut: 420 });
    for (const e of EX) { await sauve(`expr-${g}-${e}`, { genre: g, cam: 'tete', expr: e === 'neutre' ? null : e, sv: 0, incl: 1, larg: 300, haut: 300 }); await sauve(`exprsv-${g}-${e}`, { genre: g, cam: 'tete', expr: e === 'neutre' ? null : e, sv: 1, incl: 1, larg: 300, haut: 300 }); }
    for (const ge of GE[g]) for (const [i, t] of T[ge].entries()) { await sauve(`geste-${g}-${ge}-${i}`, { genre: g, cam: 'corps', geste: ge, t, yaw: 0.45, sv: 0, larg: 240, haut: 320 }); await sauve(`gestesv-${g}-${ge}-${i}`, { genre: g, cam: 'corps', geste: ge, t, yaw: 0.45, sv: 1, larg: 240, haut: 320 }); }
    for (const [i, t] of [0.3, 0.9, 1.5, 2.1, 2.7].entries()) await sauve(`geste-${g}-dialogue-${i}`, { genre: g, cam: 'corps', parle: true, t, sv: 0, larg: 240, haut: 320 });
    for (const [i, bl] of [0.16, 0.12, 0.085, 0.04, 0.01].entries()) await sauve(`clin-${g}-${i}`, { genre: g, cam: 'tete', blink: bl, sv: 0, larg: 300, haut: 300 });
    await sauve(`clin-${g}-oeil`, { genre: g, cam: 'tete', clin: 1, sv: 0, larg: 300, haut: 300 });
  }
  for (const v of [false, true]) await sauve(`sac-${v ? 'apres' : 'avant'}`, { genre: 'garcon', v2: v, cam: 'sac', sv: 0, larg: 420, haut: 420, t: 0.3 });
  await sauve('sac-trois-quarts', { genre: 'garcon', cam: 'corps', yaw: 0.5, sv: 0, larg: 420, haut: 560 });
  await b.close();
})();
