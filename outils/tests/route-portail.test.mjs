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

test('portail : le retour de la Route dépose l\'enfant SUR la marche haute, face au portail (jamais derrière le socle)', async () => {
  const P = await IMP('portail-plan.js');
  const R = P.retourVillage(); const dev = P.devant();
  assert.ok(Math.hypot(R.x - dev.x, R.z - dev.z) < 0.01, 'exactement là où l\'on se tient pour franchir le portail');
  assert.ok(Math.abs(Math.atan2(Math.sin(R.a - P.PORTAIL.cap), Math.cos(R.a - P.PORTAIL.cap))) < 0.01, 'face au portail : la caméra, derrière, voit l\'enfant et le voile');
  assert.ok(Math.abs(P.hauteurPortail(R.x, R.z) - 0.4) < 1e-9, 'les pieds sur la surface de la marche haute');
});

test('portail : les marches ont leur vraie hauteur, sans trou, sans saut impossible à monter', async () => {
  const P = await IMP('portail-plan.js');
  const hz = lz => P.hauteurPortail(...Object.values(P.versMonde(0, lz)));
  const at = (lx, lz) => { const w = P.versMonde(lx, lz); return P.hauteurPortail(w.x, w.z); };
  assert.equal(at(0, -6), 0, 'le sol, devant les marches');
  assert.ok(Math.abs(at(0, -3.75) - 0.2) < 1e-9, 'marche basse : 20 cm');
  assert.ok(Math.abs(at(0, -2.25) - 0.4) < 1e-9, 'marche haute : 40 cm');
  assert.ok(Math.abs(at(0, -0.5) - 0.6) < 1e-9, 'socle : 60 cm');
  assert.ok(Math.abs(at(0, -3.75) - 0.2) < 1e-9 && hz(-3.75) === at(0, -3.75));
  // monter à pied (pas de 8 cm) : jamais plus raide que la pente permise par le jeu (1,05), du sol jusqu'à la marche haute
  let prec = hz(-6), pire = 0;
  for (let lz = -6; lz <= -2.25; lz += 0.08) { const h = hz(lz); pire = Math.max(pire, (h - prec) / 0.08); prec = h; }
  assert.ok(pire <= 1.05, 'on peut monter les deux marches (pente max ' + pire.toFixed(2) + ')');
  // le socle, lui, n'est pas un escalier : impossible de le grimper depuis la marche haute ou le côté
  let raide = 0; prec = hz(-2.25); for (let lz = -2.25; lz <= -1.2; lz += 0.08) { const h = hz(lz); raide = Math.max(raide, (h - prec) / 0.08); prec = h; }
  assert.ok(raide > 1.05, 'le socle est un mur, pas une marche');
  // jamais en dessous du sol, et rien à plus de 5 m du portail
  for (let lx = -8; lx <= 8; lx += 0.5) for (let lz = -8; lz <= 6; lz += 0.5) assert.ok(at(lx, lz) >= 0);
  assert.equal(at(12, 0), 0); assert.equal(at(0, 9), 0);
});

test('portail : Sablo repose sur la marche basse, de profil, entièrement sur la même surface ; monté, même chose', async () => {
  const P = await IMP('portail-plan.js');
  const S = P.sabloRetour(), M = P.retourMonte();
  for (const c of [S, M]) {
    const l = P.versLocal(c.x, c.z); assert.ok(Math.abs(P.hauteurPortail(c.x, c.z) - 0.2) < 1e-9, 'au centre : marche basse');
    // de profil : le corps (2,6 m) suit la marche, les quatre pattes (± 1,0 m dans le sens du corps, ± 0,3 m en travers) sont sur la même hauteur
    const ux = Math.sin(c.a), uz = Math.cos(c.a), vx = Math.cos(c.a), vz = -Math.sin(c.a);
    for (const [a, b] of [[1, 0.3], [1, -0.3], [-1, 0.3], [-1, -0.3]]) assert.ok(Math.abs(P.hauteurPortail(c.x + ux * a + vx * b, c.z + uz * a + vz * b) - 0.2) < 1e-9, 'pattes sur la marche basse');
    assert.ok(Math.abs(l.lz - (-3.75)) < 1e-9);
  }
  const dev = P.devant(); assert.ok(Math.hypot(S.x - dev.x, S.z - dev.z) > 1.5, 'à côté de l\'enfant, pas dessus');
  for (const o of P.obstacles()) assert.ok(Math.hypot(S.x - o.x, S.z - o.z) > o.r + 0.5, 'pas dans un pilier');
});

test('portail : un replat plan sous le portail (à tous les niveaux de qualité), sans toucher au village', async () => {
  const { Terrain, PLATEFORME_PORTAIL: PP } = await import('../../voyage/js/terrain.js');
  const P = await IMP('portail-plan.js');
  for (const seg of [140, 200, 260]) {
    const t = new Terrain(seg);
    for (let lx = -6; lx <= 6; lx += 1) for (let lz = -7; lz <= 4; lz += 1) { const w = P.versMonde(lx, lz); assert.ok(Math.abs(t.hauteur(w.x, w.z) - PP.h) < 1e-6, `sol plan (${seg}) en ${lx},${lz} : ${t.hauteur(w.x, w.z).toFixed(3)}`); }
    // le centre du village et la place ne bougent pas
    assert.ok(Math.abs(t.hauteur(0, 0) - 0.3) < 0.2);
  }
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
