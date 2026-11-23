// Village (préproduction) : seule la maison des chiffres ouvre l'École arabe ; lettres et lecture sont « bientôt » (en cours de création). node --test outils/tests/village-ecole-arabe.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { BATIMENTS } from '../../monde/batiments.js';

test("dans le village, seule la maison des chiffres ouvre l'École arabe, les deux autres se préparent", () => {
  const par = id => BATIMENTS.find(b => b.id === id);
  assert.equal(par('etoiles').etat, 'ouvert');
  assert.equal(par('etoiles').lien, '../ecole-arabe/chiffres/');
  for (const id of ['sons', 'jardin']) {
    assert.equal(par(id).etat, 'bientot', id);
    assert.equal(par(id).lien, undefined, id);
  }
});
