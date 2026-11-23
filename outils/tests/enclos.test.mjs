// Étape 4 : le plan de l'enclos — places stables, aucune place partagée, allée dégagée, soins dans l'enclos, passage par l'entrée.
import test from 'node:test'; import assert from 'node:assert/strict';
const P = await import('../../voyage/js/enclos-plan.js');
const { MONTURES } = await import('../../voyage/js/montures.js').catch(() => ({ MONTURES: null }));
const IDS = ['sablo', 'cannelle', 'perle', 'eclair', 'zephyr', 'bactra', 'lune', 'etoile', 'baobab'];
const espece = id => (id === 'baobab' ? 'elephant' : 'chameau');

test('chaque monture possédée a sa place, toutes différentes, toutes dans l\'enclos', () => {
  const m = P.affecter(IDS, espece), vus = new Set();
  assert.equal(Object.keys(m).length, 9);
  for (const [id, p] of Object.entries(m)) { assert.ok(P.dansEnclos(p.x, p.z), id + ' dans l\'enclos'); const k = p.x + ',' + p.z; assert.ok(!vus.has(k), 'place unique'); vus.add(k); }
  assert.deepEqual({ x: m.baobab.x, z: m.baobab.z }, { x: P.PLACE_GRANDE.x, z: P.PLACE_GRANDE.z }, 'l\'éléphant a la grande place');
});
test('stabilité : la place d\'une monture ne dépend que de l\'ordre de la liste (jamais de la monture choisie)', () => {
  const a = P.affecter(IDS, espece), b = P.affecter(['sablo', 'cannelle', 'perle'], espece);
  for (const id of ['sablo', 'cannelle', 'perle']) assert.deepEqual(a[id], b[id], id + ' garde sa place quand on en adopte d\'autres');
});
test('plus de montures que de places : aucune ne reçoit une place déjà prise (elle reste simplement sans place)', () => {
  const beaucoup = Array.from({ length: 14 }, (_, i) => 'm' + i), m = P.affecter(beaucoup, () => 'chameau');
  assert.equal(Object.keys(m).length, P.PLACES.length); const k = new Set(Object.values(m).map(p => p.x + ',' + p.z)); assert.equal(k.size, P.PLACES.length);
});
test('l\'allée centrale reste dégagée (aucune place à moins de 2,6 m de l\'axe) et l\'entrée est libre', () => {
  for (const p of P.PLACES) assert.ok(Math.abs(p.x - P.ECURIE.x) >= 4.0, 'allée');
  assert.ok(P.ENTREE.z > P.ECURIE.z + P.ENCLOS.devant);
});
test('les lieux de soins sont dans l\'enclos, séparés des montures au repos, et l\'arrêt est près de l\'objet', () => {
  for (const [id, l] of Object.entries(P.LIEUX)) {
    assert.ok(P.dansEnclos(l.objet.x, l.objet.z) && P.dansEnclos(l.stand.x, l.stand.z), id);
    assert.ok(Math.hypot(l.stand.x - l.objet.x, l.stand.z - l.objet.z) < 2.5, id + ' : arrêt près de l\'objet');
    for (const p of P.PLACES) assert.ok(Math.hypot(p.x - l.stand.x, p.z - l.stand.z) > 2.0, id + ' ne tombe pas sur une place de repos');
  }
  assert.ok(P.dansEnclos(P.NID_LOUMI.x, P.NID_LOUMI.z), 'Loumi est dans l\'enclos');
  for (const p of P.PLACES) assert.ok(Math.hypot(p.x - P.NID_LOUMI.x, p.z - P.NID_LOUMI.z) > 1.8, 'Loumi n\'est pas sur une monture');
});
test('trajet vers l\'enclos : jamais en ligne droite à travers la clôture', () => {
  const cible = P.LIEUX.eau.stand;
  for (const depart of [{ x: 33, z: -9 }, { x: 45, z: -10 }, { x: 70, z: -20 }, { x: 52, z: -10 }, { x: 40, z: -30 }, { x: 52 + 12, z: -24 + 1 }]) {
    let pos = { ...depart }, n = 0; while (!P.dansEnclos(pos.x, pos.z) && n++ < 400) {
      const e = P.etape(pos, cible), d = Math.hypot(e.x - pos.x, e.z - pos.z), pas = Math.min(d, 0.5); const nx = pos.x + (e.x - pos.x) / (d || 1) * pas, nz = pos.z + (e.z - pos.z) / (d || 1) * pas;
      // franchir la clôture (z devant) uniquement par l'entrée, et le côté jamais
      if (!P.dansEnclos(pos.x, pos.z) && P.dansEnclos(nx, nz)) assert.ok(Math.abs(nx - P.ECURIE.x) < P.ENCLOS.entree + 0.1, 'entre par l\'entrée depuis ' + JSON.stringify(depart));
      pos = { x: nx, z: nz };
    }
    assert.ok(P.dansEnclos(pos.x, pos.z), 'arrive dans l\'enclos depuis ' + JSON.stringify(depart));
  }
  assert.deepEqual(P.etape({ x: 52, z: -20 }, cible), cible, 'déjà dedans : tout droit');
});
