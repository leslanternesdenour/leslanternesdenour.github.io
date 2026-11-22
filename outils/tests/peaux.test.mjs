// Les couleurs de peau du village, du Grand Voyage et des personnages 3D doivent rester IDENTIQUES (même indice = même teinte).
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { PEAUX, NOMS_PEAUX, indicePeau, visageSVG } from '../../monde/socle/peaux.js';
const lire = (f, re) => JSON.parse(fs.readFileSync(f, 'utf8').match(re)[1].replace(/'/g, '"'));
test('mêmes 4 teintes que le Grand Voyage et les personnages 3D', () => {
  assert.deepEqual(PEAUX, lire('voyage/js/voyageur.js', /export const PEAUX = (\[[^\]]*\])/));
  assert.deepEqual(PEAUX, lire('personnages3d/logique.js', /const PEAUX = (\[[^\]]*\])/));
  assert.equal(NOMS_PEAUX.length, PEAUX.length);
});
test('indice de peau : valeur invalide ou absente → teinte par défaut (1), jamais d\'erreur', () => {
  assert.equal(indicePeau(undefined), 1); assert.equal(indicePeau(-1), 1); assert.equal(indicePeau(9), 1); assert.equal(indicePeau('2'), 1);
  assert.equal(indicePeau(0), 0); assert.equal(indicePeau(3), 3);
});
test('visages : la peau suit la variable --peau (aucune couleur de peau figée, aucun émoji jaune)', () => {
  for (const g of ['fille', 'garcon']) { const s = visageSVG(g); assert.match(s, /fill:var\(--peau\)/); assert.ok(!/#f5b942|#ffcc|#fc0/i.test(s), 'pas de jaune'); assert.ok(!/[\u{1F466}\u{1F467}]/u.test(s)); }
  assert.notEqual(visageSVG('fille'), visageSVG('garcon'));
});
test('l\'écran « Qui joue ? » n\'utilise plus les émojis jaunes 👧 👦', () => {
  const h = fs.readFileSync('monde/index.html', 'utf8').match(/id="accueil"[\s\S]*?<!-- Erreur 3D -->/)[0];
  assert.ok(!/[\u{1F466}\u{1F467}]/u.test(h)); assert.match(h, /id="choix-peau"/);
});
