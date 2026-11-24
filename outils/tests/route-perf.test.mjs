// Performances mobiles : on ne dessine que ce qui peut être vu à travers le brouillard.
import test from 'node:test';
import assert from 'node:assert/strict';

test('perf : la cité n\'est dessinée que lorsque l\'enfant est assez près pour la voir (le brouillard la cache de plus loin)', async () => {
  const { villeVisible } = await import('../../voyage/js/route/ville-plan.js');
  const { DEC, CITE } = await import('../../voyage/js/route/relief.js');
  const au = (ds, dt = 0) => villeVisible(CITE.t + dt, DEC + CITE.s + ds);
  assert.equal(au(0), true, 'au centre'); assert.equal(au(-CITE.rayon - 300), true, 'à l\'approche, dans le brouillard');
  assert.equal(au(-CITE.rayon - 650), true); assert.equal(au(-CITE.rayon - 800), false, 'loin : inutile de dessiner');
  assert.equal(villeVisible(0, DEC + 800), false, 'dans la plaine, la cité est cachée'); assert.equal(au(0, 1500), false);
  const fs = await import('node:fs');
  const j = fs.readFileSync(new URL('../../voyage/js/route/jeu-route.js', import.meta.url), 'utf8');
  assert.match(j, /V\.montrer\(dans && villeVisible\(J\.x, J\.z\)\)/, 'mise à jour à chaque changement de proximité');
});

test('perf : en profil faible (téléphone modeste), les cailloux et les buissons ont une géométrie plus simple ; les autres profils ne changent pas', async () => {
  const fs = await import('node:fs');
  const m = fs.readFileSync(new URL('../../voyage/js/route/monde.js', import.meta.url), 'utf8');
  assert.match(m, /if \(Q\.leger\) \{ FORMES\.caillou\.geos = /); assert.match(m, /FORMES\.buisson\.geos = /); assert.match(m, /OctahedronGeometry/);
  assert.ok(m.indexOf('if (Q.leger) { FORMES.caillou.geos') < m.indexOf('const inst = {};'), 'avant la création des instances');
});
