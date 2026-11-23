// La cité ancienne : le plan des maisons (pur). Maisons de pierre variées, ruelles, places dégagées, rien sur la route ni sur la place centrale.
import test from 'node:test'; import assert from 'node:assert/strict';

test('plan : des centaines de maisons variées, ruelles libres, la place, la route, les collines et les lieux restent dégagés', async () => {
  const { maisonsVille, GABARITS } = await import('../../voyage/js/route/ville-plan.js');
  const { CITE, distanceChemin, COLLINES_CITE } = await import('../../voyage/js/route/relief.js');
  const { LIEUX_ROUTE, positionDeLieu } = await import('../../voyage/js/route/donnees.js');
  const m = maisonsVille(), m2 = maisonsVille();
  assert.deepEqual(m, m2, 'toujours la même cité');
  assert.ok(m.length >= 180 && m.length <= 420, `${m.length} maisons`);
  const variete = new Set(m.map(x => x.gabarit)); assert.ok(variete.size >= GABARITS - 1, 'presque tous les gabarits sont utilisés');
  const lieux = LIEUX_ROUTE.map(positionDeLieu);
  for (const x of m) {
    const d = Math.hypot(x.s - CITE.s, x.t - CITE.t), r = Math.hypot(x.l, x.w) / 2;
    assert.ok(d > CITE.plaza + 12 + r * 0.5 && d < CITE.rayon + 25, 'dans la cité, hors de la place');
    assert.ok(distanceChemin(x.s, x.t) > r * 0.7 + 3.5, 'la route reste libre');
    for (const c of COLLINES_CITE) assert.ok(Math.hypot(x.s - c.s, x.t - c.t) > c.r + 6, 'pas de maison sur une colline');
    for (const p of lieux) assert.ok(Math.hypot(x.s - p.s, x.t - p.t) > r * 0.6 + 5, 'pas de maison sur un lieu');
    assert.ok(x.h >= 3 && x.h <= 7.5, 'une ou deux étages, jamais de gratte-ciel');
    assert.ok(x.etage === 1 || x.etage === 2);
  }
  let pire = 99; for (let i = 0; i < m.length; i += 3) for (let j = i + 1; j < m.length; j++) { const a = m[i], b = m[j], d = Math.hypot(a.s - b.s, a.t - b.t); if (d < 30) pire = Math.min(pire, d - (Math.hypot(a.l, a.w) + Math.hypot(b.l, b.w)) * 0.36); }
  assert.ok(pire > -1.5, `deux maisons se chevauchent (${pire.toFixed(1)})`);
});

test('cité 3D : maisons en instances (peu d\'appels de dessin), obstacles seulement autour de l\'enfant, monument central sobre entouré d\'une barrière', async () => {
  const fs = await import('node:fs');
  const v = fs.readFileSync(new URL('../../voyage/js/route/ville-3d.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.match(v, /export function creerVille3D\(/);
  assert.match(v, /InstancedMesh/); assert.match(v, /maisonsVille\(\)/);
  assert.match(v, /RAYON_OBSTACLES/, 'les obstacles ne sont calculés que près de l\'enfant');
  assert.match(v, /barriere/i, 'barrière douce autour du monument central');
  assert.ok(!/(moderne|minaret|dôme|dome|verre|glass|neon)/i.test(v), 'aucune architecture moderne');
  assert.ok(!/(fenetre.*emissive|emissive)/i.test(v), 'pas de lumière électrique');
});
