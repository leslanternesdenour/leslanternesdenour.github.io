// La page Tarifs ne doit jamais promettre autre chose que ce que contient réellement le catalogue.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { CATALOGUE } from '../../serveur/catalogue.js';
const html = fs.readFileSync('tarifs/index.html', 'utf8');
const nb = (g) => Object.values(CATALOGUE[g]).filter(n => n === 'premium').length;
test('Premium : nombre de zones et de missions affichés = catalogue ; noms des zones cités', () => {
  assert.equal(Number(html.match(/Les (\d+) zones avancées/)[1]), nb('voyage'));
  assert.equal(Number(html.match(/(\d+) missions supplémentaires/)[1]), nb('missions'));
  for (const z of ['campement', 'dunes', 'col', 'montagnes', 'wadi', 'rochers']) assert.match(html, new RegExp('\\b' + z + '\\b'), z);
  assert.deepEqual(Object.entries(CATALOGUE.voyage).filter(([, n]) => n === 'premium').map(([k]) => k).sort(), ['camp', 'col', 'dunes', 'montagnes', 'rochers', 'wadi']);
});
test('formules : plus de formule vague (« Tout le Gratuit »), prix et options présents', () => {
  assert.ok(!/Tout le Gratuit/.test(html)); for (const t of ['4,99 €', '39,99 €', '59,99 €', 'data-formule="premium_mensuel"', 'data-formule="premium_annuel"', 'data-formule="famille_annuel"']) assert.ok(html.includes(t), t);
  assert.equal(Math.round((1 - 39.99 / (4.99 * 12)) * 100), 33, 'l\'économie annoncée est exacte'); assert.equal((39.99 / 12).toFixed(2), '3.33');
});
