// Parcours de la Route dans le bac à sable (?sandbox=1) : entrée sur la Route, téléportation d'une région à l'autre, contrôle de la musique
// (une seule piste en boucle une fois le fondu fini) et de l'arrivée. Prérequis : serveur statique de dist/ sur le port 8791.
// Durées des pistes : village 69 s, Golden Hour Hum 141 s, Sacred City at Dusk 137 s.
const { chromium, TAILLES, URL0 } = require('./base.js');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext(TAILLES[process.argv[2] || 'pc']); const page = await ctx.newPage(); const erreurs = [];
  page.on('pageerror', e => erreurs.push('JS: ' + e.message.slice(0, 160)));
  await page.addInitScript(() => { window.__src = new Set(); window.__ctx = []; const AC = window.AudioContext; window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ctx.push(this); } }; const d = AudioBufferSourceNode.prototype, st = d.start, sp = d.stop;
    d.start = function () { if (this.loop) window.__src.add(this); return st.apply(this, arguments); }; d.stop = function () { window.__src.delete(this); return sp.apply(this, arguments); }; });
  await page.route('**/cdn.jsdelivr.net/npm/three@0.170.0/**', r => { const u = r.request().url().split('three@0.170.0/')[1]; r.fulfill({ path: '/home/user/node_modules/three/' + u.replace('build/three.module.min.js', 'build/three.module.js'), contentType: 'text/javascript' }); });
  await page.goto(URL0 + '/voyage/?sandbox=1', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(6000);
  await page.mouse.click(300, 300); await page.waitForTimeout(1500);
  const go = page.locator('button:visible', { hasText: "C'est parti" }); for (let i = 0; i < 3; i++) { if (await go.count()) { await go.first().click(); await page.waitForTimeout(1500); } }   // l'écran « Qui part en voyage ? » du premier lancement
  await page.evaluate(() => { const c = document.getElementById('musique-active'); c.checked = true; c.dispatchEvent(new Event('input')); }); await page.waitForTimeout(5000);   // la musique est un réglage : on l'active comme le ferait un parent
  const etat = () => page.evaluate(() => { const V = window.__voyage, r = V.route; return { enRoute: r.enRoute(), region: r.regionId(), z: Math.round(V.J.z), ac: window.__ctx.map(c => c.state).join(','), pistes: [...window.__src].map(s => Math.round(s.buffer.duration) + 's') }; });
  console.log('village  ', JSON.stringify(await etat()));
  await page.evaluate(() => { const V = window.__voyage; for (const z of ['oasis', 'camp']) if (!V.etat.zones.includes(z)) V.etat.zones.push(z); const A = V.aventure.A; for (const a of ['lezard', 'gerboise', 'renard']) if (!A.animaux.includes(a)) A.animaux.push(a); V.regions.verifier(); V.teleporter(326, 50); });
  await page.waitForTimeout(1500); await page.evaluate(() => window.__voyage.teleporter(360, 50)); await page.waitForTimeout(9000);
  console.log('entrée   ', JSON.stringify(await etat()));
  for (const [nom, s] of [['plaines', 400], ['dunes', 1800], ['oasis', 2500], ['montagnes', 4300], ['arrivée', 5380], ['cité', 5560], ['place', 5622]]) {
    await page.evaluate(s => window.__voyage.teleporter(0, 20000 + s), s); await page.waitForTimeout(13000);
    console.log(nom.padEnd(9), JSON.stringify(await etat()));
  }
  const p = await page.evaluate(() => { const V = window.__voyage, l = V.route.lieux3d.lieux['cite-place'] || V.route.lieux3d.pos('cite-place'); V.teleporter(l.x + 1.2, l.z); window.__voyage.route.fermerCarte && window.__voyage.route.fermerCarte(); return { x: Math.round(l.x), z: Math.round(l.z) }; });
  await page.waitForTimeout(2500); console.log('à la grande place', JSON.stringify(p), 'interaction:', await page.evaluate(() => { const V = window.__voyage, i = V.habitants.interaction(V.J); return i ? (i.label + ' d=' + (i.d || 0).toFixed(1)) : 'aucune'; }));
  await page.evaluate(() => { try { window.__voyage.action(); } catch (e) {} }); await page.waitForFunction(() => !!window.__voyage.aventure.A.badges['route-mecque'], null, { timeout: 120000 }).catch(() => {});   // les badges sont vérifiés à chaque sauvegarde périodique (toutes les 3 s de jeu : plus de 30 s de mur quand le rendu 3D est logiciel)
  await page.screenshot({ path: '/tmp/claude-0/route-place.png' });
  console.log('découvertes', JSON.stringify(await page.evaluate(() => window.__voyage.route.etat.decouvertes)));
  console.log('badge arrivée', await page.evaluate(() => { const V = window.__voyage; return JSON.stringify(Object.keys(V.aventure.A.badges || {}).filter(k => /route/.test(k))); }));
  await page.screenshot({ path: process.env.CAPTURE || '/tmp/claude-0/route-arrivee.png' });
  console.log('erreurs JS', JSON.stringify(erreurs.slice(0, 5)));
  await b.close();
})();
