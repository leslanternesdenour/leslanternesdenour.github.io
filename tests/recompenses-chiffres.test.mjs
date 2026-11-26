// Récompenses du village : le jeu des chiffres (clé « ecole_chiffres ») compte dans les étoiles et les lanternes. node --test tests/recompenses-chiffres.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerRecompenses } from '../monde/socle/recompenses.js';
import { ETAPES } from '../ecole-arabe/chiffres/donnees/chiffres.js';

test('une étape de chiffres terminée avec 3 étoiles donne 3 étoiles et 1 lanterne au village', () => {
  const premiere = ETAPES[0].id;
  const lire = cle => (cle === 'ecole_chiffres' ? { etapes: { [premiere]: { fini: true, etoiles: 3 } } } : null);
  const r = calculerRecompenses(lire);
  assert.deepEqual({ etoiles: r.jeux.ecole_chiffres.etoiles, lanternes: r.jeux.ecole_chiffres.lanternes }, { etoiles: 3, lanternes: 1 });
  assert.equal(r.etoiles, 3);
  assert.equal(r.lanternes, 1);
});
