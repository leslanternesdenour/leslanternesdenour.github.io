// Test : node --test --test-reporter=file:///C:/Users/zakar/leslanternesdenour.github.io/ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages3d/logique.test.js
// La logique pure (sans three.js) des nouveaux personnages 3D N1, réservés au jeu de la Prière (puis des Ablutions). Le Grand Voyage n'est pas concerné.
const test = require('node:test');
const assert = require('node:assert/strict');

test("la forme de tissu suit la posture de prière (soujoûd, roukoû‘, assis…)", async () => {
  const { formeTissu } = await import('./logique.js');
  assert.equal(formeTissu('soujoud'), 'prosterne');
  assert.equal(formeTissu('roukou'), 'penche');
  assert.equal(formeTissu('penche'), 'penche');
  for (const p of ['assis', 'tachahhoud', 'salamDroite', 'salamGauche']) assert.equal(formeTissu(p), 'assis');
  assert.equal(formeTissu('debout'), null);
});
