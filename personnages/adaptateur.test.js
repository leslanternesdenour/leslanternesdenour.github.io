// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages/adaptateur.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("l'adaptateur expose tous les membres de l'ancien personnage (Voyageur)", async () => {
  const { Voyageur } = await import('../voyage/js/voyageur.js');
  const { creerSquelette } = await import('./squelette.js');
  const { adapterSquelette } = await import('./adaptateur.js');
  const ancien = new Voyageur(false, { genre: 'fille' }, {});
  const nouveau = adapterSquelette(creerSquelette('fille'));
  const manquants = Object.keys(ancien).filter(k => !(k in nouveau));
  assert.deepEqual(manquants, []);
});

test("le moteur de gestes place les mains, les pieds et la tête exactement comme avec l'ancien personnage (toutes les postures de prière)", async () => {
  const { Voyageur } = await import('../voyage/js/voyageur.js');
  const { Gestes } = await import('../ablutions/jeu3d/gestes.js');
  const { POSTURES } = await import('../priere/jeu3d/postures.js');
  const { creerSquelette } = await import('./squelette.js');
  const { adapterSquelette } = await import('./adaptateur.js');
  const THREE = await import('three');
  const ecarts = [];
  for (const genre of ['fille', 'garcon']) {
    const ancien = new Voyageur(false, { genre }, {});
    const nouveau = adapterSquelette(creerSquelette(genre));
    const ga = new Gestes(ancien, { postures: POSTURES, sequences: {}, depart: 'debout', repos: 'debout' }); ga.activer(true);
    const gn = new Gestes(nouveau, { postures: POSTURES, sequences: {}, depart: 'debout', repos: 'debout' }); gn.activer(true);
    for (const nom of Object.keys(POSTURES)) {
      ga.poser(nom); gn.poser(nom);
      for (let i = 0; i < 160; i++) { ga.maj(0.05, i * 0.05); gn.maj(0.05, i * 0.05); }
      ancien.racine.updateMatrixWorld(true); nouveau.racine.updateMatrixWorld(true);
      const pts = v => [v.jambes[0].cheville, v.jambes[1].cheville, v.bras[0].bas, v.bras[1].bas, v.tete].map(o => o.getWorldPosition(new THREE.Vector3()));
      const [a, n] = [pts(ancien), pts(nouveau)];
      a.forEach((p, i) => ecarts.push(p.distanceTo(n[i])));
    }
  }
  assert.ok(Math.max(...ecarts) < 1e-6, `écart max ${Math.max(...ecarts)}`);
});
