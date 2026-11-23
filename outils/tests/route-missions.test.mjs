// La Route : le suivi des missions (pur, sans Three.js). Chaque étape ne compte qu'une fois ; la fin ne se déclenche qu'une fois.
import test from 'node:test'; import assert from 'node:assert/strict';

test('mission : chaque étape ne compte qu\'une fois et la mission se termine au bon moment, une seule fois', async () => {
  const { faireEtape, progression } = await import('../../voyage/js/route/missions-route.js');
  const route = { missions: {} };
  assert.deepEqual(progression(route, 'chemin'), { n: 0, total: 3, etat: 'a_faire' });
  const r1 = faireEtape(route, 'chemin', 'balise1'); assert.deepEqual([r1.nouveau, r1.termine], [true, false]);
  const r1b = faireEtape(route, 'chemin', 'balise1'); assert.deepEqual([r1b.nouveau, r1b.termine], [false, false], 'la même balise ne compte pas deux fois');
  faireEtape(route, 'chemin', 'balise2');
  const r3 = faireEtape(route, 'chemin', 'balise3'); assert.deepEqual([r3.nouveau, r3.termine], [true, true]);
  assert.deepEqual(progression(route, 'chemin'), { n: 3, total: 3, etat: 'finie' });
  const r4 = faireEtape(route, 'chemin', 'balise3'); assert.equal(r4.termine, false, 'la fin ne se déclenche qu\'une fois (pas de pièces en double)');
});
