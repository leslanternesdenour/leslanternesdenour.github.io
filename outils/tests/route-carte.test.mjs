// La Route : la carte (projection cohérente avec les déplacements réels) et le cap vers un lieu.
import test from 'node:test'; import assert from 'node:assert/strict';

test('carte : la projection garde les distances réelles (même échelle dans les deux sens) et reste dans le cadre', async () => {
  const { creerProjection } = await import('../../voyage/js/route/carte-route.js');
  for (const portrait of [false, true]) {
    const P = creerProjection(900, 600, portrait);
    const a = P(0, 0), b = P(1000, 0), c = P(0, 300);
    const dS = Math.hypot(b.x - a.x, b.y - a.y), dT = Math.hypot(c.x - a.x, c.y - a.y);
    assert.ok(Math.abs(dS / 1000 - dT / 300) < 1e-9, `échelle différente selon les axes (portrait=${portrait})`);
    for (const [s, t] of [[-300, -600], [3300, 600], [2900, 40]]) { const p = P(s, t); assert.ok(p.x >= 0 && p.x <= 900 && p.y >= 0 && p.y <= 600, `${s},${t} hors du cadre (portrait=${portrait})`); }
    assert.ok(P(2000, 0)[portrait ? 'y' : 'x'] > P(0, 0)[portrait ? 'y' : 'x'], 'le village est au début, la route avance');
  }
});

test('cap : l\'angle vers un lieu est relatif à la direction du joueur', async () => {
  const { capVers } = await import('../../voyage/js/route/carte-route.js');
  const devant = capVers({ s: 0, t: 0, a: 0 }, { s: 100, t: 0 });      // a = 0 : regarde vers z (donc s croissant)
  assert.ok(Math.abs(devant.angle) < 1e-9 && Math.abs(devant.distance - 100) < 1e-9);
  const cote = capVers({ s: 0, t: 0, a: 0 }, { s: 0, t: 50 });         // t croissant = x croissant : à gauche de la direction z+ ? (angle positif)
  assert.ok(Math.abs(Math.abs(cote.angle) - Math.PI / 2) < 1e-9);
  const derriere = capVers({ s: 100, t: 0, a: 0 }, { s: 0, t: 0 });
  assert.ok(Math.abs(Math.abs(derriere.angle) - Math.PI) < 1e-9);
});
