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

test('décor des montagnes : beaucoup plus de roches et de plus grandes sur les flancs que dans la plaine, la piste de la vallée reste libre', async () => {
  const { semerTuile } = await import('../../voyage/js/route/decor-plan.js');
  const { distanceChemin, pointChemin, hauteur } = await import('../../voyage/js/route/relief.js');
  const compte = (i, j) => semerTuile(i, j).filter(o => o.type === 'rocher');
  const tPiste = pointChemin(3700).t, haut = hauteur(3700, tPiste + 220) > hauteur(3700, tPiste - 220) ? 220 : -220;   // le flanc le plus haut de la vallée
  const jFlanc = Math.floor((tPiste + haut) / 64), iMont = Math.floor(3700 / 64);
  const flanc = compte(iMont, jFlanc), plaine = compte(Math.floor(900 / 64), Math.floor(60 / 64));
  assert.ok(flanc.length >= plaine.length + 5, `flanc : ${flanc.length} roches, plaine : ${plaine.length}`);
  assert.ok(Math.max(...flanc.map(o => o.sc)) > 2.8, 'de grosses roches sur les flancs');
  let toutes = 0; for (let j = -3; j <= 3; j++) for (const o of semerTuile(iMont, j)) { toutes++; assert.ok(distanceChemin(o.s, o.t) > 3.2, 'la piste du fond de la vallée reste libre'); }
  assert.ok(toutes <= 7 * 70, 'budget respecté');
});

test('décor : des chemins et de l\'arrivée à la cité, la nature s\'efface (aucun rocher ni buisson parmi les maisons) ; les tuiles de ces régions se construisent sans erreur', async () => {
  const { semerTuile } = await import('../../voyage/js/route/decor-plan.js');
  const { CITE } = await import('../../voyage/js/route/relief.js');
  for (const s of [4800, 5000, 5200, 5350]) assert.ok(semerTuile(Math.floor(s / 64), 0).length > 3, `tuile à s=${s} trop vide ou en erreur`);
  for (const [ds, dt] of [[0, 0], [100, 80], [-120, -60], [60, -150]]) assert.equal(semerTuile(Math.floor((CITE.s + ds) / 64), Math.floor((CITE.t + dt) / 64)).filter(o => o.type !== 'palmier').length, 0, 'la cité est faite de maisons, pas de rochers');
});
