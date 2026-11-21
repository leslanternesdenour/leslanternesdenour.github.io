// Adaptateur avec le VRAI modèle N1 et le VRAI moteur de gestes, dans Node (Three.js 0.170.0 installé hors dépôt).
const test = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const path = require('node:path');
const RACINE = path.resolve(__dirname, '..');
const POSTURES_PRIERE = ['debout', 'takbir', 'mains', 'roukou', 'plie', 'genoux', 'penche', 'soujoud', 'assis', 'tachahhoud', 'salamDroite', 'salamGauche', 'releve'];
let _env;
async function env() {
  if (_env) return _env;
  const THREE = await import('three'); const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { PersonnageGLB } = await import('./personnage-glb.js'); const { Gestes } = await import('../ablutions/jeu3d/gestes.js'); const { POSTURES } = await import('../priere/jeu3d/postures.js');
  const { Voyageur } = await import('../voyage/js/voyageur.js');
  const gltf = {};
  for (const genre of ['fille', 'garcon']) { const b = fs.readFileSync(path.join(RACINE, 'personnages3d/modeles', genre + '_N1.glb')); const ab = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); gltf[genre] = await new Promise((ok, ko) => new GLTFLoader().parse(ab, '', ok, ko)); }
  return (_env = { THREE, PersonnageGLB, Gestes, POSTURES, Voyageur, gltf });
}
const moteur = (E, p) => { const g = new E.Gestes(p, { postures: E.POSTURES, sequences: {}, depart: 'debout', repos: 'debout' }); g.activer(true); p.lier ? p.lier(g, E.POSTURES) : 0; return g; };
function jouer(E, p, g, nom, secondes = 3) { g.poser(nom); let t = 0; for (let i = 0; i < secondes * 60; i++) { t += 1 / 60; g.maj(1 / 60, t); if (p.suivre) p.suivre(1 / 60); } p.racine.updateMatrixWorld(true); }

test("8. l'adaptateur expose l'interface attendue par le moteur, pour les deux modèles", async () => {
  const E = await env();
  for (const genre of ['fille', 'garcon']) {
    const p = new E.PersonnageGLB(E.gltf[genre], { genre });
    for (const k of ['racine', 'corps', 'bassin', 'buste', 'tete', 'yeux', 'jupe']) assert.ok(p[k] && p[k].isObject3D, `${genre} : ${k}`);
    assert.equal(p.jambes.length, 2); assert.equal(p.bras.length, 2); assert.equal(typeof p.clign, 'number');
    for (const j of p.jambes) for (const k of ['haut', 'bas', 'cheville']) assert.ok(j[k].isBone, `${genre} jambe ${k}`);
    for (const b of p.bras) for (const k of ['haut', 'bas', 'main', 'index']) assert.ok(b[k].isBone, `${genre} bras ${k}`);
    assert.deepEqual([p.bras[0].s, p.bras[1].s, p.jambes[0].s, p.jambes[1].s], [-1, 1, -1, 1]);
    assert.ok(p.bras[0].haut.position.x < 0 && p.bras[1].haut.position.x > 0, 'main droite = côté x négatif');
  }
});

test("9. les 13 postures de prière, avec le vrai moteur : positions finies, sous le sol jamais, mêmes articulations que l'ancien personnage", async () => {
  const E = await env(); const THREE = E.THREE; const v = new THREE.Vector3(); const pires = { sol: 0, ecart: 0 }; let comparees = 0;
  for (const genre of ['fille', 'garcon']) for (const nom of POSTURES_PRIERE) {
    const nouveau = new E.PersonnageGLB(E.gltf[genre], { genre }), ancien = new E.Voyageur(false, { genre, tenue: 'ecru', peau: 1 }, {});
    const gn = moteur(E, nouveau), ga = moteur(E, ancien); jouer(E, nouveau, gn, nom); jouer(E, ancien, ga, nom);
    // positions finies + aucun sommet sous le sol (les pieds posent à 0)
    let mini = Infinity;
    nouveau.modele.traverse(o => { if (o.isBone) for (const x of o.matrixWorld.elements) assert.ok(Number.isFinite(x), `${genre} ${nom} : os ${o.name} non fini`); });
    for (const m of nouveau.maillages) { if (!m.isSkinnedMesh) continue; const n = m.geometry.attributes.position.count; for (let i = 0; i < n; i += 7) { m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); assert.ok(Number.isFinite(v.y), `${genre} ${nom} : sommet non fini`); mini = Math.min(mini, v.y); } }
    pires.sol = Math.min(pires.sol, mini); assert.ok(mini > -0.03, `${genre} ${nom} : un point passe sous le sol (${mini.toFixed(3)} m)`);
    // mêmes articulations que l'ancien personnage (même squelette, même moteur)
    for (const [a, b] of [[nouveau.bras[0].index, ancien.bras[0].index], [nouveau.bras[1].index, ancien.bras[1].index], [nouveau.bras[0].bas, ancien.bras[0].bas], [nouveau.bras[1].bas, ancien.bras[1].bas], [nouveau.jambes[0].bas, ancien.jambes[0].bas], [nouveau.jambes[1].bas, ancien.jambes[1].bas], [nouveau.jambes[0].cheville, ancien.jambes[0].cheville], [nouveau.jambes[1].cheville, ancien.jambes[1].cheville], [nouveau.tete, ancien.tete], [nouveau.bassin, ancien.bassin], [nouveau.buste, ancien.buste]].filter(([a, b]) => a && b)) {   // (l'ancien personnage n'a pas d'index sur la main gauche)
      comparees++; const pa = new THREE.Vector3().setFromMatrixPosition(a.matrixWorld), pb = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld); const d = pa.distanceTo(pb); pires.ecart = Math.max(pires.ecart, d);
      assert.ok(d < 0.01, `${genre} ${nom} : articulation décalée de ${(d * 1000).toFixed(1)} mm par rapport à l'ancien personnage`);
    }
  }
  assert.ok(comparees > 13 * 2 * 8, 'assez d\'articulations comparées : ' + comparees);
  console.log(`   (plus bas sommet : ${pires.sol.toFixed(3)} m ; plus grand écart avec l'ancien personnage : ${(pires.ecart * 1000).toFixed(2)} mm)`);
});

const influence = (p, nom) => { const r = {}; for (const m of p.maillages) if (m.morphTargetDictionary && m.morphTargetDictionary[nom] !== undefined) r[m.name] = m.morphTargetInfluences[m.morphTargetDictionary[nom]]; return r; };

test("10. suivre(dt) : la forme du tissu suit la posture (assis, penché, prosterné), la jupe reste visible quand le moteur la masque", async () => {
  const E = await env();
  for (const genre of ['fille', 'garcon']) {
    const p = new E.PersonnageGLB(E.gltf[genre], { genre }); const g = moteur(E, p);
    const attendu = { debout: [0, 0, 0], roukou: [0, 1, 0], penche: [0, 1, 0], soujoud: [0, 0, 1], assis: [1, 0, 0], tachahhoud: [1, 0, 0], salamDroite: [1, 0, 0], salamGauche: [1, 0, 0] };
    for (const [nom, [a, pe, pr]] of Object.entries(attendu)) {
      jouer(E, p, g, nom, 3);
      assert.ok(Math.abs(p.influence.assis - a) < 0.01 && Math.abs(p.influence.penche - pe) < 0.01 && Math.abs(p.influence.prosterne - pr) < 0.01, `${genre} ${nom} : ${JSON.stringify(p.influence)}`);
      for (const [f, v] of [['assis', a], ['penche', pe], ['prosterne', pr]]) for (const val of Object.values(influence(p, f))) assert.ok(Math.abs(val - v) < 0.01, `${genre} ${nom} : forme ${f} sur un maillage = ${val}`);
    }
    // le moteur masque la jupe (activer(true)) : le maillage « jupe » du modèle reste visible
    const jupe = p.maillages.find(m => m.name === 'jupe'); assert.ok(jupe && jupe.visible, `${genre} : jupe visible`); assert.equal(p.jupe.visible, false, 'le groupe factice reçoit l\'ordre du moteur, pas le maillage');
    // transition progressive, sans saut
    p.influence = { assis: 0, penche: 0, prosterne: 0 }; g.poser('soujoud'); g.maj(1 / 60, 0); p.suivre(1 / 60); assert.ok(p.influence.prosterne > 0 && p.influence.prosterne < 0.2, 'progressif : ' + p.influence.prosterne);
  }
});

test("11. suivre(dt) : yeux.scale.y écrit par le moteur pilote clignement et clignement_mi", async () => {
  const E = await env(); const p = new E.PersonnageGLB(E.gltf.fille, { genre: 'fille' });
  p.yeux.scale.y = 1; p.suivre(1 / 60); let y = p.maillages.find(m => m.name === 'yeux'); assert.equal(y.morphTargetInfluences[y.morphTargetDictionary.clignement], 0);
  p.yeux.scale.y = 0.15; p.suivre(1 / 60); assert.equal(y.morphTargetInfluences[y.morphTargetDictionary.clignement], 1);
  p.yeux.scale.y = 0.6; p.suivre(1 / 60); const v = y.morphTargetInfluences[y.morphTargetDictionary.clignement]; assert.ok(v > 0 && v < 1);
  // avec le vrai moteur, des yeux qui clignent au moins une fois en 10 s
  const g = moteur(E, p); g.poser('debout'); let vu = false; for (let i = 0; i < 600; i++) { g.maj(1 / 60, i / 60); p.suivre(1 / 60); if (y.morphTargetInfluences[y.morphTargetDictionary.clignement] > 0.9) vu = true; } assert.ok(vu, 'le personnage cligne des yeux');
});

test("12. deux personnages du même genre (enfant et ami) ne partagent ni matériaux ni squelette ; le teint de l'ami peut différer", async () => {
  const E = await env(); const a = new E.PersonnageGLB(E.gltf.fille, { genre: 'fille', peau: 1 }), b = new E.PersonnageGLB(E.gltf.fille, { genre: 'fille', peau: 3 });
  assert.notEqual(a.bassin, b.bassin); assert.notEqual(a.bras[0].haut, b.bras[0].haut);
  const sq = o => o.maillages.filter(m => m.isSkinnedMesh).map(m => m.skeleton); assert.ok(sq(a).every((s, i) => s !== sq(b)[i]), 'squelettes distincts');
  for (let i = 0; i < a.maillages.length; i++) assert.notEqual(a.maillages[i].material, b.maillages[i].material, 'matériau partagé : ' + a.maillages[i].name);
  const peau = o => o.maillages.find(m => m.name === 'peau').material.color;
  assert.notDeepEqual(peau(a).toArray(), peau(b).toArray(), "l'ami a un autre teint"); assert.deepEqual(peau(a).toArray().map(x => +x.toFixed(3)), new E.THREE.Color(1, 1, 1).toArray().map(x => +x.toFixed(3)), "l'enfant garde son teint d'origine");
  const robe = o => o.maillages.find(m => m.name === 'robe').material.color.toArray(); assert.deepEqual(robe(a), robe(b), 'les vêtements ne sont pas recolorés');
  // changer le teint de l'ami ne touche pas l'enfant ; revenir au teint d'origine est exact
  const avant = peau(a).toArray(); b.teinte(0); assert.deepEqual(peau(a).toArray(), avant); b.teinte(1); assert.deepEqual(peau(b).toArray().map(x => +x.toFixed(4)), avant.map(x => +x.toFixed(4)));
  // les deux bougent indépendamment
  const ga = moteur(E, a), gb = moteur(E, b); jouer(E, a, ga, 'soujoud', 2); jouer(E, b, gb, 'debout', 2); assert.ok(a.bassin.position.y < 0.4 && b.bassin.position.y > 0.55, `bassins ${a.bassin.position.y} / ${b.bassin.position.y}`);
});

test("13. maillages à squelette : frustumCulled désactivé ; ombres selon l'option", async () => {
  const E = await env();
  for (const ombres of [false, true]) { const p = new E.PersonnageGLB(E.gltf.garcon, { genre: 'garcon', ombres });
    for (const m of p.maillages) { if (m.isSkinnedMesh) assert.equal(m.frustumCulled, false, m.name); assert.equal(m.castShadow, ombres, m.name); } }
});

test("les deux modèles gardent leur poids : triangles et os annoncés dans le rapport final", async () => {
  const E = await env(); const attendu = { fille: [15531, 55], garcon: [15957, 49] };
  for (const genre of ['fille', 'garcon']) { let tri = 0, os = 0; E.gltf[genre].scene.traverse(o => { if (o.isBone) os++; if (o.isMesh) tri += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
    assert.equal(os, attendu[genre][1], genre + ' os'); assert.ok(Math.abs(tri - attendu[genre][0]) <= 5, `${genre} : ${tri} triangles`); }
});

test("liberer() : matériaux et textures d'os du personnage libérés, géométries partagées conservées", async () => {
  const E = await env(); const p = new E.PersonnageGLB(E.gltf.fille, { genre: 'fille' }); let sq = 0, mat = 0, geo = 0;
  for (const m of p.maillages) { if (m.skeleton) { const d = m.skeleton.dispose.bind(m.skeleton); m.skeleton.dispose = () => { sq++; d(); }; } const dm = m.material.dispose.bind(m.material); m.material.dispose = () => { mat++; dm(); }; m.geometry.addEventListener('dispose', () => geo++); }
  p.liberer(); assert.equal(sq, p.maillages.filter(m => m.isSkinnedMesh).length, 'un squelette libéré par maillage à squelette'); assert.equal(mat, p.maillages.length); assert.equal(geo, 0, 'la géométrie partagée n\'est pas libérée');
});
