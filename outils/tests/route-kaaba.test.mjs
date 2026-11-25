// L'arrivée à La Mecque (La Route) : le monument central (ville-3d.js) est observé de loin, l'entrée est interdite ; le badge d'arrivée et l'étape finale du parcours de test existent.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

test('monument central : une barrière douce et des collisions, aucune porte ni personnage', () => {
  const src = fs.readFileSync(new URL('../../voyage/js/route/ville-3d.js', import.meta.url), 'utf8');
  assert.match(src, /monument central/); assert.match(src, /const RB = \d+/, 'barrière autour');
  assert.match(src, /fixes\.push\(\{ x: cx, z: cz, r: /, 'collision du volume central');
});

test('arrivée : le point d\'observation « La grande place » est sur la place, hors de la barrière', async () => {
  const { CITE, DEC } = await import('../../voyage/js/route/relief.js');
  const { LIEUX_ROUTE, positionDeLieu } = await import('../../voyage/js/route/donnees.js');
  const { s, t } = positionDeLieu(LIEUX_ROUTE.find(o => o.id === 'cite-place'));
  const d = Math.hypot(t - CITE.t, s - CITE.s);
  assert.ok(d > 18 && d <= CITE.plaza + 2, `distance ${d.toFixed(1)} m`);
  assert.ok(DEC > 0);
});

test('arrivée : le badge « Arrivée à La Mecque » se mérite à la grande place, sans rien retirer aux autres', async () => {
  const { BADGES_ROUTE } = await import('../../voyage/js/route/badges-route.js');
  const b = BADGES_ROUTE.find(x => x.id === 'route-mecque'); assert.ok(b, 'badge présent');
  assert.equal(new Set(BADGES_ROUTE.map(x => x.id)).size, BADGES_ROUTE.length);
  assert.equal(b.ok({ etat: { route: { decouvertes: ['seuil'], repos: [], missions: {}, vu: {} } } }), false);
  assert.equal(b.ok({ etat: { route: { decouvertes: ['cite-place'], repos: [], missions: {}, vu: {} } } }), true);
  assert.ok(BADGES_ROUTE.length >= 8 && BADGES_ROUTE.some(x => x.id === 'route-oasis'));
  assert.ok(!/[\u{1F54B}\u{1F9ED}]/u.test(b.icone), 'icône ancienne et sûre');
});

test('musiques : la Route, puis La Mecque dans la zone d\'arrivée et la cité, la musique du jeu hors Route', async () => {
  const { pisteMusique } = await import('../../voyage/js/musique-zone.js');
  assert.equal(pisteMusique(true, 'cite'), 'mecque'); assert.equal(pisteMusique(true, 'arrivee'), 'mecque');
  assert.equal(pisteMusique(true, 'plaines'), 'route'); assert.equal(pisteMusique(true, 'montagnes'), 'route');
  assert.equal(pisteMusique(false, 'cite'), 'jeu');
});

test('parcours de test : l\'étape finale « Arriver devant le monument » termine le voyage', async () => {
  const { ETAPES_VERIF } = await import('../../voyage/js/route/verification-plan.js');
  const e = ETAPES_VERIF[ETAPES_VERIF.length - 1]; assert.equal(e.id, 'arrivee');
  assert.equal(e.fait({ decouvertes: ['cite-place'] }), true); assert.equal(e.fait({ decouvertes: [] }), false);
});
