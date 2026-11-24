// Quelle musique joue où : celle du Grand Voyage partout, celle de La Mecque seulement à l'arrivée sur la Route.
import test from 'node:test'; import assert from 'node:assert/strict';
import { pisteMusique } from '../../voyage/js/musique-zone.js';

test('hors de la Route, même avec une région gardée en mémoire, la musique du jeu habituel (Glowing Village) joue', () => {
  assert.equal(pisteMusique(false, 'cite'), 'jeu');
});

test('dès qu\'on arrive sur la Route vers La Mecque, et jusqu\'à l\'arrivée, la musique de la Route (Golden Hour Hum) joue', () => {
  assert.equal(pisteMusique(true, 'sortie'), 'route');
});

test('sur la Route, dans la vallée de l\'arrivée et dans la cité, la musique de La Mecque joue', () => {
  assert.equal(pisteMusique(true, 'arrivee'), 'mecque');
  assert.equal(pisteMusique(true, 'cite'), 'mecque');
});
