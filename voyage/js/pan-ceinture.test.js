// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs voyage/js/pan-ceinture.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("debout, le bout de la ceinture garde sa taille normale", async () => {
  const { echellePan } = await import('./pan-ceinture.js');
  assert.equal(echellePan(0.1), 1);
});

test("en prosternation (dos très penché), le bout de la ceinture disparaît", async () => {
  const { echellePan } = await import('./pan-ceinture.js');
  assert.ok(echellePan(1.92) <= 0.001, `échelle ${echellePan(1.92)}`);
});

test("aux ablutions (penché jusqu'à 0,85 rad), le bout de la ceinture reste inchangé", async () => {
  const { echellePan } = await import('./pan-ceinture.js');
  assert.equal(echellePan(0.85), 1);
});
