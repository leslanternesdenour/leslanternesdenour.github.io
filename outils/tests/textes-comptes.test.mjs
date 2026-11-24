// Textes publics : avec l'accès au jeu par compte parent (24/11/2026), le site ne prétend plus que tout fonctionne « sans compte ».
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = f => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8');

test('textes : le village et la page Découvrir ne disent plus « sans compte » et expliquent le compte parent', () => {
  const m = lire('monde/index.html'), d = lire('decouvrir/index.html');
  assert.ok(!/Gratuit, sans publicité, sans compte|Gratuit · sans publicité · sans compte/.test(m), 'monde/index.html');
  assert.ok(!/<b>Sans compte<\/b>, tout fonctionne/.test(d), 'decouvrir/index.html');
  assert.match(d, /compte parent/i);
});

test('textes : les conditions décrivent le compte parent, les 4 profils enfants, les données minimales et la sauvegarde automatique', () => {
  const c = lire('conditions/index.html');
  assert.match(c, /jusqu'à 4 profils/); assert.match(c, /enregistrée automatiquement/);
  assert.ok(!/Une partie est accessible sans compte/.test(c));
  assert.match(c, /ni nom de famille, ni date de naissance, ni photo/);
});
