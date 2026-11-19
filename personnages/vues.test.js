// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs personnages/vues.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("de face, la caméra est devant le personnage (côté +z, qui est la qibla) ; de profil gauche, elle est du côté de sa main gauche (+x)", async () => {
  const { VUES, positionCamera } = await import('./vues.js');
  const face = positionCamera(VUES.face), gauche = positionCamera(VUES.profilGauche), dos = positionCamera(VUES.dos);
  assert.ok(face[2] > 1 && Math.abs(face[0]) < 1e-9);
  assert.ok(gauche[0] > 1 && Math.abs(gauche[2] - VUES.profilGauche.cible[2]) < 1e-9);
  assert.ok(dos[2] < -1);
});

test("il y a aussi le profil droit, les deux trois-quarts, et des gros plans : visage à hauteur de tête, mains à hauteur des cuisses, pieds près du sol", async () => {
  const { VUES, positionCamera } = await import('./vues.js');
  const droit = positionCamera(VUES.profilDroit), tq = positionCamera(VUES.troisQuartsGauche), tqd = positionCamera(VUES.troisQuartsDroit);
  assert.ok(droit[0] < -1 && tq[0] > 0 && tq[2] > 0 && tqd[0] < 0 && tqd[2] > 0);
  assert.ok(VUES.visage.cible[1] > 1.1 && VUES.visage.distance < 1.2);
  assert.ok(VUES.mains.cible[1] > 0.3 && VUES.mains.cible[1] < 0.8 && VUES.mains.distance < 1.5);
  assert.ok(VUES.pieds.cible[1] < 0.2 && VUES.pieds.distance < 1.5);
});
