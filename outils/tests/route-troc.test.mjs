// Le troc du marché : trois marchands fictifs, des échanges équitables (chacun y gagne), un panier ; jamais bloqué ; aucun argent réel ni pièce du jeu.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('troc : trois marchands, chaîne dattes → tissu → jarre → dattes réalisable, chaque échange est équitable et la chaîne est gagnante pour l\'enfant', async () => {
  const { TROCS, stockVide, echanger, peutEchanger } = await import('../../voyage/js/route/troc-route.js');
  assert.deepEqual(Object.keys(TROCS), ['tisserande', 'potier', 'marchand-dattes']);
  let s = { ...stockVide(), datte: 4 };
  assert.ok(peutEchanger(s, 'tisserande') && !peutEchanger(s, 'potier') && !peutEchanger(s, 'marchand-dattes'));
  let r = echanger(s, 'tisserande'); assert.ok(r.ok); s = r.stock; assert.deepEqual([s.datte, s.tissu, s.jarre], [2, 1, 0]);
  r = echanger(s, 'potier'); assert.ok(r.ok); s = r.stock; assert.deepEqual([s.datte, s.tissu, s.jarre], [2, 0, 1]);
  r = echanger(s, 'marchand-dattes'); assert.ok(r.ok); s = r.stock; assert.deepEqual([s.datte, s.tissu, s.jarre], [6, 0, 0], 'on repart avec plus de dattes qu\'au départ : chacun y a gagné');
  assert.ok(!echanger({ ...stockVide() }, 'potier').ok && echanger({ ...stockVide() }, 'potier').stock.tissu === 0, 'manque : rien ne change');
  for (const t of Object.values(TROCS)) assert.ok(t.donne.n > 0 && t.veut.n > 0 && t.donne.item !== t.veut.item);
});

test('troc : l\'enfant n\'est jamais bloqué (le marchand redonne de quoi recommencer), le panier se lit, les textes sont sobres et sans argent', async () => {
  const { TROCS, stockVide, echanger, bloque, panierTexte, CADEAU } = await import('../../voyage/js/route/troc-route.js');
  assert.ok(bloque(stockVide()), 'panier vide : bloqué sans le cadeau'); assert.ok(!bloque({ ...stockVide(), [CADEAU.item]: CADEAU.n }), 'avec le cadeau, on peut échanger');
  assert.ok(bloque({ ...stockVide(), datte: 1 }), '1 datte seule : rien à faire, donc le cadeau est redonné');
  assert.equal(panierTexte(stockVide()), 'Ton panier est vide.'); assert.equal(panierTexte({ ...stockVide(), datte: 4, tissu: 1 }), 'Ton panier : 🌴 4  🧵 1');
  const roles = JSON.parse(fs.readFileSync(new URL('../voix/jeux/voix-roles.json', import.meta.url), 'utf8'));
  for (const [id, t] of Object.entries(TROCS)) {
    assert.ok(roles[t.voix], `${id} : voix`);
    for (const k of ['offre', 'ok', 'manque', ...(t.cadeau ? ['cadeau'] : [])]) for (const a of ['petit', 'grand']) { const x = t[k][a]; assert.ok(x.length > 15 && x.length <= (a === 'petit' ? 120 : 260), `${id}.${k}.${a} : longueur ${x.length}`); }
    assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu|pièce|euro|dollar|argent|payer|acheter)/i.test(JSON.stringify(t)), `${id} : ni religion ni argent`);
  }
  assert.deepEqual(echanger(stockVide(), 'tisserande').stock, stockVide(), 'un échange manqué ne change rien');
});

test('troc : le voyageur propose « Échanger », le panier est sauvegardé dans etat.route.vu, jamais bloqué, la mission avance une fois par marchand', () => {
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /TROCS\[n\.v\.id\]/); assert.match(j, /txt: '🤝 Échanger'/);
  assert.match(j, /R\.vu\.troc/); assert.match(j, /echanger\(S\.stock, id\)/); assert.match(j, /bloque\(S\.stock\)/); assert.match(j, /panierTexte\(S\.stock\)/);
  assert.match(j, /etape\('troc', 'echange:' \+ id\)/);
  assert.ok(!/bourse\.|acheter|donner\('troc/.test(j.slice(j.indexOf('function lancerTroc'), j.indexOf('function lancerTroc') + 2200)), 'le troc ne touche ni la bourse ni les achats');
});
