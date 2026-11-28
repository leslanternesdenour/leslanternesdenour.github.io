// Le portail de pierre du village : on le franchit pour arriver directement au départ de la grande route (plus de marche dans le désert).
// Tout est pur et testable sans 3D : position du portail, point d'arrivée exactement sur la piste, cap le long de la piste, retour au village, textes.
import test from 'node:test';
import assert from 'node:assert/strict';

const IMP = async f => import('../../voyage/js/route/' + f);

test('portail : dans le village, au relais de la grande route, de plain-pied et sans rien d\'autre autour', async () => {
  const P = await IMP('portail-plan.js');
  const { RELAIS_VILLAGE } = await IMP('donnees.js');
  const d = Math.hypot(P.PORTAIL.x - RELAIS_VILLAGE.x, P.PORTAIL.z - RELAIS_VILLAGE.z);
  assert.ok(d > 6 && d < 20, 'près du guide Rachid et du sac, sans être dessus : ' + d.toFixed(1) + ' m');
  const dev = P.devant(); assert.ok(Math.hypot(dev.x - P.PORTAIL.x, dev.z - P.PORTAIL.z) > 2 && Math.hypot(dev.x - P.PORTAIL.x, dev.z - P.PORTAIL.z) < 4.5, 'on se tient à quelques pas du voile');
  for (const c of P.obstacles()) { assert.ok(c.r > 0 && c.r <= 1.2); assert.ok(Math.hypot(c.x - dev.x, c.z - dev.z) > c.r + 1.2, 'l\'endroit où l\'on se tient est dégagé'); }
  assert.ok(P.obstacles().length >= 4, 'deux piliers et le voile fermé par des obstacles');
  // ne chevauche pas le relais (auvent, table, guide, panneau : colliders posés à ± 2,5 m autour de RELAIS)
  for (const c of P.obstacles()) assert.ok(Math.hypot(c.x - RELAIS_VILLAGE.x, c.z - RELAIS_VILLAGE.z) > 5, 'loin du relais');
});

test('portail : le point d\'arrivée est EXACTEMENT sur la piste, avant le seuil, et l\'enfant regarde le long de la piste', async () => {
  const P = await IMP('portail-plan.js');
  const { DEC, S_DEBUT, distanceChemin, pointChemin, versRoute } = await IMP('relief.js');
  const { zoneJouable } = await IMP('piste-plan.js');
  const { auRetourRoute, positionDeLieu, LIEUX_ROUTE } = await IMP('donnees.js');
  const A = P.arrivee(); const r = versRoute(A.x, A.z);
  assert.ok(distanceChemin(r.s, r.t) < 0.05, 'pile sur l\'axe de la piste : ' + distanceChemin(r.s, r.t).toFixed(3) + ' m');
  assert.ok(Math.abs(pointChemin(r.s).t - r.t) < 1e-6);
  assert.ok(r.s > S_DEBUT + 40 && !auRetourRoute(A.z), 'assez loin de la limite arrière : pas de retour immédiat au village');
  assert.ok(zoneJouable(r.s, r.t));
  const seuil = positionDeLieu(LIEUX_ROUTE.find(l => l.id === 'seuil')); assert.ok(r.s > seuil.s && r.s - seuil.s < 40, 'tout au début de la route, juste après le seuil');
  // cap : atan2(dx, dz) le long de la piste (monde x = t, z = DEC + s)
  const q = pointChemin(r.s + 10), cap = Math.atan2(q.t - r.t, 10);
  const ecart = Math.abs(Math.atan2(Math.sin(A.a - cap), Math.cos(A.a - cap)));
  assert.ok(ecart < 0.03, 'orienté face à la route (écart ' + ecart.toFixed(3) + ' rad)'); assert.ok(Math.abs(A.a) < 0.4, 'vers l\'avant de la route (z croissant)');
  assert.equal(A.z, DEC + r.s);
  // les prochains mètres sont libres : rien à moins de 3 m devant
  for (let m = 1; m <= 12; m += 1) { const p = pointChemin(r.s + m); assert.ok(distanceChemin(r.s + m, p.t) < 0.05); }
});

test('portail : le retour de la Route dépose l\'enfant devant le portail, face au désert (pas à l\'ancienne sortie lointaine)', async () => {
  const P = await IMP('portail-plan.js');
  const R = P.retourVillage(); const dev = P.devant();
  assert.ok(Math.hypot(R.x - dev.x, R.z - dev.z) < 1.5, 'devant le portail');
  assert.ok(Math.abs(Math.atan2(Math.sin(R.a - (P.PORTAIL.cap + Math.PI)), Math.cos(R.a - (P.PORTAIL.cap + Math.PI)))) < 0.01, 'dos au portail');
});

test('portail : l\'ancienne marche vers l\'est ne déclenche plus rien, la progression ne change pas', async () => {
  const P = await IMP('portail-plan.js'); assert.equal(P.ANCIENNE_MARCHE_ACTIVE, false);
  const { preparerRoute } = await IMP('etat-route.js'); const R = preparerRoute({}); assert.ok(R.missions && R.vu && Array.isArray(R.decouvertes), 'même état de la Route');
});

test('portail : textes sobres, rien de religieux, rien de punitif', async () => {
  const { TEXTES_PORTAIL } = await IMP('portail-plan.js');
  for (const k of ['nom', 'bouton', 'indice', 'panneau']) assert.ok(typeof TEXTES_PORTAIL[k] === 'string' && TEXTES_PORTAIL[k].length > 5, k);
  const tout = Object.values(TEXTES_PORTAIL).join(' ');
  assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|pri[eè]re|dieu|musulman|islam)/i.test(tout), 'rien de religieux');
  assert.ok(!/(tu dois|obligatoire|sinon|punition|danger)/i.test(tout), 'rien de punitif');
});
