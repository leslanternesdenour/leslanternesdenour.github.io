// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages/construire.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const maillages = racine => { const l = []; racine.traverse(o => { if (o.isSkinnedMesh) l.push(o); }); return l; };

test("le personnage-test a un maillage lié à un squelette complet (au moins 16 os)", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const p = construirePersonnage('fille');
  const l = maillages(p.racine);
  assert.ok(l.length >= 1);
  assert.ok(l[0].skeleton.bones.length >= 16);
});

test("le corps a de vraies parties modelées : torse, cou, jambes, bras, mains, pieds, tête", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const p = construirePersonnage('garcon');
  const noms = [];
  p.racine.traverse(o => { if (o.isMesh) noms.push(o.name); });
  for (const n of ['torse', 'cou', 'jambe_d', 'jambe_g', 'bras_d', 'bras_g', 'main_d', 'main_g', 'pied_d', 'pied_g', 'tete']) assert.ok(noms.includes(n), 'manque ' + n);
});

test("le visage a des yeux, un nez, une bouche, des sourcils et des joues (fille et garçon), et les yeux sont dans le groupe qui sert à cligner", async () => {
  const { construirePersonnage } = await import('./construire.js');
  for (const genre of ['fille', 'garcon']) {
    const p = construirePersonnage(genre);
    const noms = []; p.racine.traverse(o => { if (o.isMesh) noms.push(o.name); });
    for (const n of ['oeil_d', 'oeil_g', 'nez', 'bouche', 'sourcil_d', 'sourcil_g', 'joue_d', 'joue_g']) assert.ok(noms.includes(n), genre + ' : manque ' + n);
    const yeux = []; p.yeux.traverse(o => { if (o.isMesh) yeux.push(o.name); });
    assert.ok(yeux.includes('oeil_d') && yeux.includes('oeil_g'));
  }
});

test("le garçon a des cheveux modelés et un bonnet ; la fille a un hijab qui retombe sur les épaules, et pas l'inverse", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const noms = genre => { const l = []; construirePersonnage(genre).racine.traverse(o => { if (o.isMesh) l.push(o.name); }); return l; };
  const g = noms('garcon'), f = noms('fille');
  for (const n of ['cheveux', 'meches', 'bonnet']) assert.ok(g.includes(n), 'garçon : manque ' + n);
  for (const n of ['hijab', 'hijab_epaules', 'hijab_cadre']) assert.ok(f.includes(n), 'fille : manque ' + n);
  assert.ok(!f.includes('cheveux') && !f.includes('bonnet') && !g.includes('hijab'));
});

test("la robe de la fille descend plus bas que la tunique du garçon ; l'index est un doigt attaché à l'os d'index, avec les autres doigts et le pouce sur la main", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const THREE = await import('three');
  const bas = genre => { const p = construirePersonnage(genre); p.racine.updateMatrixWorld(true); const r = p.jupe.children.find(o => o.name === 'robe'); assert.ok(r, genre + ' : pas de robe'); return new THREE.Box3().setFromObject(r).min.y; };
  assert.ok(bas('fille') < bas('garcon') - 0.05);
  const p = construirePersonnage('fille');
  assert.ok(p.bras[0].index.children.some(o => o.name === 'doigt_index'));
  const noms = []; p.racine.traverse(o => { if (o.isMesh) noms.push(o.name); });
  for (const n of ['doigts_d', 'doigts_g', 'pouce_d', 'pouce_g']) assert.ok(noms.includes(n), 'manque ' + n);
});

test("le hijab couvre le haut du front (aucun trou au-dessus de la tête) mais laisse le visage dégagé", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const THREE = await import('three');
  const p = construirePersonnage('fille'); p.racine.updateMatrixWorld(true);
  let hijab = null; p.racine.traverse(o => { if (o.name === 'hijab') hijab = o; });
  const rc = new THREE.Raycaster();
  const touche = (origine, dir, filtre = () => true) => { rc.set(new THREE.Vector3(...origine), new THREE.Vector3(...dir)); return rc.intersectObject(hijab, false).some(h => filtre(h.point)); };
  for (const z of [0.04, 0.085, 0.12]) assert.ok(touche([0, 2, z], [0, -1, 0]), 'haut de la tête non couvert à z=' + z);
  assert.ok(!touche([0, 1.27, 1], [0, 0, -1], pt => pt.z > 0.1), 'le visage doit rester visible');
});

test("le bord de l'ouverture du hijab est net : tous les sommets restent sur ou hors de l'ellipse du visage (pas de dents de scie)", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const p = construirePersonnage('fille');
  let hijab = null; p.racine.traverse(o => { if (o.name === 'hijab') hijab = o; });
  const pos = hijab.geometry.getAttribute('position'), idx = hijab.geometry.index.array, utilises = new Set(idx);
  let dedans = 0;
  for (const i of utilises) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); if (z > 0.08 && (x / 0.125) ** 2 + ((y + 0.02) / 0.17) ** 2 < 0.96) dedans++; }
  assert.equal(dedans, 0);
});

test("le visage est affiné : joues sensiblement moins larges, mâchoire qui se resserre, petit menton (plus de boule), crâne inchangé", async () => {
  const { construirePersonnage } = await import('./construire.js');
  for (const genre of ['fille', 'garcon']) {
    const tete = (() => { let t = null; construirePersonnage(genre).racine.traverse(o => { if (o.name === 'tete') t = o; }); return t; })();
    const pos = tete.geometry.getAttribute('position');
    const demi = yRel => { let m = 0; for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getY(i) - 1.265 - yRel) < 0.012) m = Math.max(m, Math.abs(pos.getX(i))); return m; };
    assert.ok(demi(0.0) > 0.17, genre + ' : crâne trop étroit ' + demi(0));
    assert.ok(demi(-0.06) <= 0.16, genre + ' : joues trop larges ' + demi(-0.06));
    assert.ok(demi(-0.13) <= 0.105, genre + ' : mâchoire trop large ' + demi(-0.13));
    assert.ok(demi(-0.17) <= 0.06, genre + ' : menton trop large ' + demi(-0.17));
  }
});

test("les proportions du visage sont naturelles (yeux plus petits, nez à mi-chemin, petite bouche basse) et les traits sont posés sur la surface du visage", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const THREE = await import('three');
  for (const genre of ['fille', 'garcon']) {
    const p = construirePersonnage(genre); p.racine.updateMatrixWorld(true);
    const nom = {}; p.racine.traverse(o => { if (o.isMesh) nom[o.name] = o; });
    const w = n => nom[n].getWorldPosition(new THREE.Vector3());
    const tete = nom.tete, pos = tete.geometry.getAttribute('position');
    let menton = 1e9; for (let i = 0; i < pos.count; i++) menton = Math.min(menton, pos.getY(i));
    const yO = w('oeil_d').y, r1 = (yO - w('nez').y) / (yO - menton), r2 = (yO - w('bouche').y) / (yO - menton);
    assert.ok(r1 > 0.36 && r1 < 0.48, genre + ' : nez à ' + r1.toFixed(2));
    assert.ok(r2 > 0.58 && r2 < 0.7, genre + ' : bouche à ' + r2.toFixed(2));
    assert.ok(nom.oeil_d.geometry.parameters.radius <= 0.031, 'yeux trop grands');
    const ecart = w('oeil_g').x - w('oeil_d').x; assert.ok(ecart > 0.11 && ecart < 0.14, 'écart des yeux ' + ecart.toFixed(3));
    assert.ok(nom.bouche.geometry.parameters.radius * 2 <= 0.06, 'bouche trop large');
    assert.ok(nom.joue_d.geometry.parameters.radius <= 0.024, 'joues (rougeurs) trop grosses');
    // les traits sont posés sur la peau : ni enfoncés, ni flottants
    const surf = new THREE.Mesh(tete.geometry), rc = new THREE.Raycaster();
    for (const n of ['nez', 'bouche', 'joue_d', 'sourcil_d']) {
      const c = w(n); rc.set(new THREE.Vector3(c.x, c.y, 2), new THREE.Vector3(0, 0, -1));
      const h = rc.intersectObject(surf)[0]; assert.ok(h, n + ' : hors du visage');
      const d = c.z - h.point.z; assert.ok(d > -0.012 && d < 0.03, n + ' : à ' + d.toFixed(3) + ' de la peau');
    }
  }
});

test("le sourire déplace les lèvres, à la hauteur de la bouche (et pas ailleurs sur le visage)", async () => {
  const { construirePersonnage } = await import('./construire.js');
  const THREE = await import('three');
  const p = construirePersonnage('fille'); p.racine.updateMatrixWorld(true);
  const nom = {}; p.racine.traverse(o => { if (o.isMesh) nom[o.name] = o; });
  const yBouche = nom.bouche.getWorldPosition(new THREE.Vector3()).y;
  const pos = nom.tete.geometry.getAttribute('position'), d = nom.tete.geometry.morphAttributes.position[0];
  let somme = 0, poids = 0; for (let i = 0; i < d.count; i++) { const m = Math.abs(d.getY(i)); somme += m * pos.getY(i); poids += m; }
  assert.ok(Math.abs(somme / poids - yBouche) < 0.015, 'le sourire agit à ' + (somme / poids).toFixed(3) + ' au lieu de ' + yBouche.toFixed(3));
});

test("la tête a une forme corrective « sourire » qui remonte les coins de la bouche, et le personnage reste sous 60 000 triangles", async () => {
  const { construirePersonnage } = await import('./construire.js');
  for (const genre of ['fille', 'garcon']) {
    const p = construirePersonnage(genre);
    let tete = null, triangles = 0;
    p.racine.traverse(o => { if (o.isMesh) { if (o.name === 'tete') tete = o; const g = o.geometry; triangles += (g.index ? g.index.count : g.getAttribute('position').count) / 3; } });
    assert.equal(tete.morphTargetDictionary.sourire, 0);
    const d = tete.geometry.morphAttributes.position[0];
    let max = 0; for (let i = 0; i < d.count; i++) max = Math.max(max, d.getY(i));
    assert.ok(max > 0.008, 'le sourire doit lever la bouche, max ' + max);
    assert.ok(triangles < 60000, genre + ' : ' + triangles + ' triangles');
  }
});
