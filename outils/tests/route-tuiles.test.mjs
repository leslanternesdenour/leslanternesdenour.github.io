// La Route : le monde se charge par tuiles, autour de l'enfant seulement.
import test from 'node:test'; import assert from 'node:assert/strict';

test('tuiles : celles autour de l\'enfant, de la plus proche à la plus lointaine, jamais en dehors du rayon', async () => {
  const { TAILLE_TUILE, tuilesAutour } = await import('../../voyage/js/route/tuiles-plan.js');
  assert.equal(TAILLE_TUILE, 64);
  const l = tuilesAutour(1000, 10, 3);
  assert.ok(l.length > 20 && l.length < 60, `${l.length} tuiles`);
  assert.deepEqual(l[0], { i: 15, j: 0 }, 'la tuile sous les pieds d\'abord');
  let d0 = -1;
  for (const { i, j } of l) { const d = Math.hypot((i + 0.5) * 64 - 1000, (j + 0.5) * 64 - 10); assert.ok(d <= 3 * 64 + 46, 'hors du rayon'); assert.ok(d >= d0 - 1e-9, 'pas trié'); d0 = d; }
  assert.equal(l.filter(({ i, j }) => i === 15 && j === 0).length, 1, 'pas de doublon');
});

test('décor : le semis d\'une tuile est toujours le même, laisse la piste libre et reste léger', async () => {
  const { semerTuile } = await import('../../voyage/js/route/decor-plan.js');
  const { distanceChemin, relief } = await import('../../voyage/js/route/relief.js');
  let total = 0, genres = new Set();
  for (const [i, j] of [[0, 0], [5, 0], [10, -1], [18, 0], [25, 1], [38, 1], [40, 0]]) {
    const a = semerTuile(i, j), b = semerTuile(i, j);
    assert.deepEqual(a, b, 'même tuile, même décor');
    assert.ok(a.length <= 70, `tuile ${i},${j} : ${a.length} objets (trop lourd)`);
    for (const o of a) {
      assert.ok(o.s >= i * 64 && o.s < (i + 1) * 64 && o.t >= j * 64 && o.t < (j + 1) * 64, 'un objet reste dans sa tuile');
      assert.ok(distanceChemin(o.s, o.t) > 3.2 || o.type === 'borne', `${o.type} sur la piste`);
      assert.ok(relief(o.s, o.t).lac < 0.05 || o.type === 'roseau', `${o.type} dans l'eau`);
      genres.add(o.type); total++;
    }
  }
  assert.ok(total > 100, `décor trop pauvre : ${total}`);
  assert.ok(genres.size >= 5, `peu de variété : ${[...genres]}`);
});
