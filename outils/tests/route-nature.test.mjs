// Les découvertes de la nature dans les plaines, les dunes et l'oasis : huit sites à observer, un petit modèle 3D chacun, mission « Le carnet de la nature ».
import test from 'node:test';
import assert from 'node:assert/strict';

const NATURE = ['fourmiliere', 'fleurs-pluie', 'nid-tisserins', 'dune-vent', 'lit-sec', 'rocher-vent', 'roseaux', 'canal-jardin'];

test('nature : huit découvertes réparties dans les plaines, les dunes et l\'oasis, avec un texte 3–5 ans et un texte 6–10 ans sobres, et la mission « Le carnet de la nature »', async () => {
  const { LIEUX_ROUTE, MISSIONS_ROUTE, regionA } = await import('../../voyage/js/route/donnees.js');
  const { TEXTES_LIEUX } = await import('../../voyage/js/route/textes-route.js');
  const l = id => LIEUX_ROUTE.find(x => x.id === id);
  for (const id of NATURE) {
    assert.ok(l(id), id); assert.equal(l(id).type, 'decouverte'); assert.equal(l(id).mission, 'nature');
    const t = TEXTES_LIEUX[id]; assert.ok(t.petit.length > 20 && t.petit.length <= 110 && t.grand.length > 60 && t.grand.length <= 330, `${id} : longueurs`);
    assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|prière|mecque|dieu)/i.test(t.petit + t.grand + l(id).nom), `${id} : rien de religieux`);
  }
  const par = r => NATURE.filter(id => regionA(l(id).s).id === r).length;
  assert.ok(par('plaines') >= 3 && par('dunes') >= 3 && par('oasis') >= 2, 'bien réparties');
  const m = MISSIONS_ROUTE.nature; assert.ok(m && m.total === 8 && m.categorie === 'observation' && m.recompense > 0 && m.simple && m.resume);
});

test('nature : les icônes des nouveaux sites existent sur les anciens téléphones (pas d\'emoji récent qui s\'afficherait en carré vide)', async () => {
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  for (const id of NATURE) assert.ok(!/[\u{1FAA0}-\u{1FAFF}]/u.test(LIEUX_ROUTE.find(x => x.id === id).icone), `${id} : emoji trop récent (Unicode 13 et après)`);
});
