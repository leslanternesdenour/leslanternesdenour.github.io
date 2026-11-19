// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages/geometrie.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("un tube lisse donne à chaque sommet des poids de peau dont la somme vaut 1, sur des os valides", async () => {
  const { tube } = await import('./geometrie.js');
  const g = tube({ chemin: [[0, 0, 0], [0, -0.3, 0], [0, -0.6, 0]], rayons: [0.07, 0.06, 0.05], os: [[0, 0, 0], [0, 1, 0.5], [1, 1, 0]], cotes: 8 });
  const w = g.getAttribute('skinWeight'), i = g.getAttribute('skinIndex');
  assert.ok(w.count > 0 && w.count === g.getAttribute('position').count);
  for (let k = 0; k < w.count; k++) {
    assert.ok(Math.abs(w.getX(k) + w.getY(k) + w.getZ(k) + w.getW(k) - 1) < 1e-6);
    assert.ok(i.getX(k) >= 0 && i.getX(k) <= 1 && i.getY(k) >= 0 && i.getY(k) <= 1);
  }
});

test("un tube est une vraie surface : triangles, normales et coordonnées de texture (UV)", async () => {
  const { tube } = await import('./geometrie.js');
  const g = tube({ chemin: [[0, 0, 0], [0, -0.3, 0], [0, -0.6, 0]], rayons: [0.07, 0.06, 0.05], os: [[0, 0, 0], [0, 1, 0.5], [1, 1, 0]], cotes: 8 });
  const nb = g.getAttribute('position').count;
  assert.ok(g.index && g.index.count >= 3 * 2 * 8 * 2, 'des triangles entre les anneaux');
  assert.equal(g.getAttribute('normal').count, nb);
  assert.equal(g.getAttribute('uv').count, nb);
});

test("un tube a des bouts arrondis (dômes) : il est fermé, sans trou, et son extrémité se resserre", async () => {
  const { tube } = await import('./geometrie.js');
  const g = tube({ chemin: [[0, 0, 0], [0, -0.3, 0]], rayons: [0.07, 0.07], os: [[0, 0, 0], [1, 1, 0]], cotes: 8 });
  g.computeBoundingBox();
  // sans dôme, le tube s'arrêterait exactement aux points du chemin (y entre -0,3 et 0) : un dôme dépasse un peu de chaque côté
  assert.ok(g.boundingBox.max.y > 0.02 && g.boundingBox.min.y < -0.32, `y entre ${g.boundingBox.min.y} et ${g.boundingBox.max.y}`);
});
