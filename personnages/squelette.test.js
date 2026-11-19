// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages/squelette.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("l'épaule droite de la fille est attachée au buste à x = -0,165 et y = 0,43 (comme l'ancien personnage)", async () => {
  const { creerSquelette } = await import('./squelette.js');
  const s = creerSquelette('fille');
  const p = s.bras[0].haut.position;
  assert.ok(Math.abs(p.x - -0.165) < 1e-9 && Math.abs(p.y - 0.43) < 1e-9);
});

test("le squelette est complet : bassin à 0,62 m, jambes, genoux, chevilles, coudes, tête et yeux comme l'ancien personnage", async () => {
  const { creerSquelette } = await import('./squelette.js');
  const s = creerSquelette('garcon');
  assert.equal(s.bassin.position.y, 0.62);
  assert.deepEqual(s.jambes.map(j => j.haut.position.x), [-0.085, 0.085]);
  assert.equal(s.jambes[0].bas.position.y, -0.3);
  assert.equal(s.jambes[0].cheville.position.y, -0.285);
  assert.equal(s.bras[1].bas.position.y, -0.24);
  assert.ok(Math.abs(s.bras[1].haut.position.x - 0.18) < 1e-9);
  assert.deepEqual(s.tete.position.toArray(), [0, 0.64, 0.005]);
  assert.ok(s.yeux && s.jupe && s.corps && s.racine && s.buste);
});

test("chaque main a son os (main_d, main_g), au bout de l'avant-bras, pour porter les doigts", async () => {
  const { creerSquelette } = await import('./squelette.js');
  const s = creerSquelette('fille');
  assert.deepEqual(s.bras.map(b => b.main.name), ['main_d', 'main_g']);
  assert.equal(s.bras[0].main.parent, s.bras[0].bas);
  assert.equal(s.bras[0].main.position.y, -0.25);
});
