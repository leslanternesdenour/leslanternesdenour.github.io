// Test : node --test ablutions/jeu3d/doigt.test.js
const test = require('node:test');
const assert = require('node:assert/strict');

const faux = () => ({ visible: false, scale: { v: 1, setScalar(x) { this.v = x; } }, rotation: { x: 0 } });

test("l'index apparaît pendant le tachahhoud", async () => {
  const { majIndex } = await import('./doigt.js');
  const ix = faux(), e = {};
  for (let i = 0; i < 30; i++) majIndex(ix, e, { index: true }, 0.5);
  assert.equal(ix.visible, true);
});

test("l'index prend l'inclinaison demandée par la posture", async () => {
  const { majIndex } = await import('./doigt.js');
  const ix = faux(), e = {};
  majIndex(ix, e, { index: true, indexX: -0.3 }, 0.5);
  assert.equal(ix.rotation.x, -0.3);
});

test("rien ne plante quand le modèle n'a pas d'index (autre jeu)", async () => {
  const { majIndex } = await import('./doigt.js');
  assert.doesNotThrow(() => majIndex(null, {}, { index: true }, 0.5));
});

test("l'index se lève en grandissant, il n'apparaît pas d'un coup", async () => {
  const { majIndex } = await import('./doigt.js');
  const ix = faux(), e = {};
  majIndex(ix, e, { index: true }, 0.5);
  assert.ok(ix.scale.v > 0.4 && ix.scale.v < 0.6, `taille ${ix.scale.v}`);
});

test("l'index se rabaisse et disparaît quand la posture change", async () => {
  const { majIndex } = await import('./doigt.js');
  const ix = faux(), e = {};
  for (let i = 0; i < 30; i++) majIndex(ix, e, { index: true }, 0.5);
  for (let i = 0; i < 30; i++) majIndex(ix, e, {}, 0.5);
  assert.equal(ix.visible, false);
});
