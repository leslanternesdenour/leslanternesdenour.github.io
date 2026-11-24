// Quelle musique joue où : celle du Grand Voyage partout, celle de La Mecque seulement à l'arrivée sur la Route.
import test from 'node:test'; import assert from 'node:assert/strict';
import { pisteMusique } from '../../voyage/js/musique-zone.js';

test('hors de la Route, la musique du Grand Voyage joue', () => {
  assert.equal(pisteMusique(false, null), 'voyage');
});

test('avant l\'arrivée, ou hors de la Route même avec une région gardée en mémoire, la musique du Grand Voyage continue', () => {
  for (const r of ['sortie', 'plaines', 'dunes', 'oasis', 'montagnes', 'chemins', null]) assert.equal(pisteMusique(true, r), 'voyage', String(r));
  assert.equal(pisteMusique(false, 'cite'), 'voyage');
});

test('sur la Route, dans la vallée de l\'arrivée et dans la cité, la musique de La Mecque joue', () => {
  assert.equal(pisteMusique(true, 'arrivee'), 'mecque');
  assert.equal(pisteMusique(true, 'cite'), 'mecque');
});
