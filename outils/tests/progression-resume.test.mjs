// Espace famille : le parent consulte la progression de chaque enfant (étoiles, lanternes, jeux, voyage), sans jamais afficher de données brutes.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('progression : le résumé reprend les étoiles et les lanternes du village', () => {
  const { resume } = require('../../compte/progression-resume.js');
  const r = resume({ monde: { etoiles: 12, lanternes: 5 } });
  assert.equal(r.etoiles, 12); assert.equal(r.lanternes, 5);
});

test('progression : un profil sans progression donne un résumé vide, sans erreur', () => {
  const { resume } = require('../../compte/progression-resume.js');
  for (const p of [undefined, null, {}, { monde: null }, 'x']) { const r = resume(p); assert.equal(r.etoiles, 0); assert.equal(r.lanternes, 0); assert.equal(r.vide, true); }
});

test('progression : les jeux et le Grand Voyage sont résumés (étoiles par jeu, zones découvertes, missions terminées, mots appris)', () => {
  const { resume } = require('../../compte/progression-resume.js');
  const r = resume({ monde: { etoiles: 3, lanternes: 1, jeux: { ablutions: { etoiles: 2, appris: true }, priere: { etoiles: 1 }, ramadan: { lanternes: 4 } } },
    monde_voyage: { zones: ['village', 'oasis'], missions: { a: { etat: 'finie' }, b: { etat: 'en cours' } }, quetes: { mots: ['a', 'b', 'c'] }, animaux: ['x'] } });
  assert.equal(r.jeux.ablutions, 2); assert.equal(r.jeux.priere, 1); assert.equal(r.jeux.ramadan, 4);
  assert.equal(r.voyage.zones, 2); assert.equal(r.voyage.missions, 1); assert.equal(r.voyage.mots, 3); assert.equal(r.voyage.animaux, 1);
  assert.equal(r.vide, false);
});
