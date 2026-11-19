// Test : node --test --test-reporter=./ablutions/jeu3d/tdd-guard-node-reporter.mjs ablutions/jeu3d/cheville.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

test("jambe verticale : le pied est déjà à plat, la cheville ne tourne pas", async () => {
  const { anglePiedPlat } = await import('./cheville.js');
  assert.equal(anglePiedPlat(0, 1), 0);
});

test("jambe penchée (genou en avant) : la cheville compense exactement l'inclinaison", async () => {
  const { anglePiedPlat } = await import('./cheville.js');
  const phi = 0.6;   // inclinaison de la jambe : la direction « devant » du pied devient (0, -sin, cos)
  assert.ok(Math.abs(anglePiedPlat(-Math.sin(phi), Math.cos(phi)) - (-phi)) < 1e-9);
});

test("posture avec piedsPlats : la cheville est calculée, l'angle écrit dans la posture est ignoré", async () => {
  const { cibleCheville } = await import('./cheville.js');
  const phi = 0.6;
  const a = cibleCheville({ piedsPlats: true, cheville: [1.5, 1.5] }, 0, -Math.sin(phi), Math.cos(phi));
  assert.ok(Math.abs(a - (-phi)) < 1e-9);
});

test("posture sans piedsPlats : on garde l'angle indiqué (ou 0), comme avant", async () => {
  const { cibleCheville } = await import('./cheville.js');
  assert.equal(cibleCheville({ cheville: [0.5, 1.5] }, 1, -0.5, 0.8), 1.5);
  assert.equal(cibleCheville({}, 0, -0.5, 0.8), 0);
});
