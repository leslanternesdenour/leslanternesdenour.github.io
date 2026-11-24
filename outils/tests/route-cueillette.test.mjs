// La cueillette de dattes à la palmeraie : deux dattes à chaque fois, trois fois, dans le panier du troc ; on laisse le reste aux oiseaux.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('cueillette : deux messages doux dits par la narratrice, et la règle (2 dattes, 3 cueillettes) est pure et testée', async () => {
  const { MESSAGES } = await import('../../voyage/js/route/textes-route.js');
  const { cueillir, CUEILLETTE } = await import('../../voyage/js/route/troc-route.js');
  const { inventaire, normaliserTexte } = await import('../voix/route/inventaire-route.mjs');
  const parTexte = new Map((await inventaire()).map(p => [normaliserTexte(p.texte), p]));
  for (const k of ['cueillette', 'cueilletteFin']) { const t = MESSAGES[k]; assert.ok(t && t.length > 20 && t.length <= 120, k); assert.ok(parTexte.get(normaliserTexte(t)), `${k} : sans voix`); assert.equal(parTexte.get(normaliserTexte(t)).role, 'narratrice'); }
  assert.deepEqual([CUEILLETTE.dattes, CUEILLETTE.max], [2, 3]);
  const S = { stock: { datte: 0, tissu: 0, jarre: 0 }, cueillies: 0 };
  for (let k = 1; k <= 3; k++) { assert.equal(cueillir(S), true); assert.equal(S.stock.datte, 2 * k); assert.equal(S.cueillies, k); }
  assert.equal(cueillir(S), false, 'plus de dattes mûres'); assert.equal(S.stock.datte, 6);
});

test('cueillette : un bouton à la palmeraie, le panier du troc est alimenté, sauvegardé dans etat.route.vu', () => {
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /label: 'Cueillir des dattes'/); assert.match(j, /cueillir\(S\)/); assert.match(j, /R\.vu\.troc/); assert.match(j, /MESSAGES\.cueillette/); assert.match(j, /MESSAGES\.cueilletteFin/);
});
