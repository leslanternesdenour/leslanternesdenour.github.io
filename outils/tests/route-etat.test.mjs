// La Route : la sauvegarde vit dans etat.route, STRICTEMENT rétrocompatible.
import test from 'node:test'; import assert from 'node:assert/strict';

test('etat.route : ajouté sans toucher à aucune autre progression', async () => {
  const { preparerRoute } = await import('../../voyage/js/route/etat-route.js');
  const ancien = { v: 1, zones: ['village', 'oasis'], lus: ['soins'], joueur: { x: 3, z: 4, a: 1 }, chameau: null, monte: true, aventure: { pieces: 777, missions: { lanternes: { etat: 'finie' } }, montures: ['sablo'] }, regions: { wadi: 5 } };
  const copie = JSON.parse(JSON.stringify(ancien));
  const etat = JSON.parse(JSON.stringify(ancien));
  const r = preparerRoute(etat);
  assert.equal(etat.route, r, 'le sous-objet est rangé dans etat.route');
  const { route, ...reste } = etat;
  assert.deepEqual(reste, copie, 'aucune autre progression n\'est modifiée');
  assert.equal(r.monde, 'village'); assert.equal(r.pos, null);
});

test('etat.route : un 2e appel ne remplace rien (la progression déjà enregistrée est conservée)', async () => {
  const { preparerRoute } = await import('../../voyage/js/route/etat-route.js');
  const etat = {};
  const r = preparerRoute(etat); r.decouvertes.push('seuil'); r.pos = { x: 10, z: 20000, a: 0.5 };
  const encore = preparerRoute(etat);
  assert.equal(encore, r); assert.deepEqual(encore.decouvertes, ['seuil']); assert.deepEqual(encore.pos, { x: 10, z: 20000, a: 0.5 });
});

test('etat.route : un sous-objet incomplet ou abîmé est complété sans perdre ce qui existe', async () => {
  const { preparerRoute } = await import('../../voyage/js/route/etat-route.js');
  const r = preparerRoute({ route: { v: 1, decouvertes: ['a'], missions: 'abîmé', repos: null, futur: 42 } });
  assert.deepEqual(r.decouvertes, ['a']);
  assert.deepEqual(r.missions, {}, 'un champ de mauvais type est remis à neuf');
  assert.deepEqual(r.repos, []);
  assert.deepEqual(r.sac, {}, 'un champ absent est ajouté');
  assert.equal(r.futur, 42, 'un champ inconnu (version plus récente) est gardé');
});

test('position : sur la Route, on garde la position exacte à part ; la position du village (etat.joueur) n\'est jamais écrasée', async () => {
  const { preparerRoute, memoriserPosition, positionDeReprise } = await import('../../voyage/js/route/etat-route.js');
  const etat = { joueur: { x: 50, z: 340, a: 0 } };
  preparerRoute(etat);
  memoriserPosition(etat, { x: 31.456, z: 21234.5678, a: 1.23456 });
  assert.equal(etat.route.monde, 'route');
  assert.deepEqual(etat.route.pos, { x: 31.46, z: 21234.57, a: 1.235 });
  assert.deepEqual(etat.joueur, { x: 50, z: 340, a: 0 }, 'la position du village n\'est pas touchée');
  assert.deepEqual(positionDeReprise(etat), { x: 31.46, z: 21234.57, a: 1.235 });
});

test('reprise : une position abîmée ou hors de la Route est ignorée (on reprend au village, jamais dans le vide)', async () => {
  const { positionDeReprise } = await import('../../voyage/js/route/etat-route.js');
  const mal = pos => positionDeReprise({ route: { monde: 'route', pos } });
  assert.equal(mal({ x: NaN, z: 21000, a: 0 }), null);
  assert.equal(mal({ x: 0, z: 100, a: 0 }), null, 'z du village : pas la Route');
  assert.equal(mal({ x: 5000, z: 21000, a: 0 }), null, 'trop loin de la piste');
  assert.equal(mal({ x: 0, z: 90000, a: 0 }), null, 'bien au-delà de la fin de la tranche');
  assert.equal(mal('abîmé'), null);
  assert.equal(positionDeReprise({ route: { monde: 'village', pos: { x: 0, z: 21000, a: 0 } } }), null, 'l\'enfant était au village');
  assert.deepEqual(mal({ x: 12, z: 21000, a: 0 }), { x: 12, z: 21000, a: 0 });
});
