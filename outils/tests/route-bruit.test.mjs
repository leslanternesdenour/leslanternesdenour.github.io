// La Route : le bruit est toujours le même pour le même endroit (le monde est identique à chaque visite).
import test from 'node:test'; import assert from 'node:assert/strict';

test('bruit : fbm est déterministe et reste entre 0 et 1', async () => {
  const { fbm } = await import('../../voyage/js/route/bruit.js');
  const a = fbm(12.3, -45.6, 3), b = fbm(12.3, -45.6, 3);
  assert.equal(a, b);
  for (let i = 0; i < 200; i++) { const v = fbm(i * 3.7, i * -1.9, 4); assert.ok(v >= 0 && v <= 1, 'valeur hors de [0,1] : ' + v); }
  assert.notEqual(fbm(1, 1, 3), fbm(50, 80, 3));
});
