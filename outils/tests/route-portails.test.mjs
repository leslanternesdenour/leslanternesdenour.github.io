// Le système des deux portails de la Route : portail de départ (village) + portail de retour (au bout de la piste), leurs panneaux de bois, leur place sur la carte.
// Tout est pur et testable sans 3D : positions, hauteurs des marches, orientation des flèches, textes, concordance carte / monde.
import test from 'node:test';
import assert from 'node:assert/strict';

const IMP = async f => import('../../voyage/js/route/' + f);

test('portail de retour : à l\'extrémité de la carte, en travers de la piste, avant la sortie automatique, sur un sol plat', async () => {
  const R = await IMP('retour-plan.js'), { DEC, S_DEBUT, distanceChemin, versRoute, hauteur } = await IMP('relief.js');
  const { auRetourRoute } = await IMP('donnees.js'), { arrivee } = await IMP('portail-plan.js'), { zoneJouable } = await IMP('piste-plan.js');
  const s = R.PORTAIL_RETOUR.s, r = versRoute(R.SITE_RETOUR.x, R.SITE_RETOUR.z);
  assert.ok(Math.abs(r.s - s) < 1e-9 && R.SITE_RETOUR.z === DEC + s, 'le portail est exactement à sa place dans le monde 3D');
  assert.ok(distanceChemin(r.s, r.t) < 0.05, 'pile sur l\'axe de la piste');
  const A = versRoute(arrivee().x, arrivee().z);
  assert.ok(s < A.s - 25 && s > S_DEBUT + 60, 'derrière l\'arrivée (assez loin pour ne pas le voir en naissant), avant la limite arrière : ' + s);
  assert.ok(!auRetourRoute(DEC + R.devantRetour().z - DEC) && !auRetourRoute(R.devantRetour().z) && !auRetourRoute(DEC + s - 4), 'les marches et le portail sont AVANT la sortie automatique (le filet de sécurité reste derrière)');
  for (const k of [-6, -3, 0, 3, 6]) for (const q of [-6, -3, 0, 3, 6]) assert.ok(zoneJouable(s + k, R.PORTAIL_RETOUR.t + q), 'zone jouable');
  // le sol est plat sous les marches (même hauteur partout sous le portail)
  const h0 = hauteur(s, R.PORTAIL_RETOUR.t);
  for (let lx = -4.5; lx <= 4.5; lx += 1.5) for (let lz = -5; lz <= 2; lz += 1) { const w = R.REPERE_RETOUR.versMonde(lx, lz); const rr = versRoute(w.x, w.z); assert.ok(Math.abs(hauteur(rr.s, rr.t) - h0) < 1e-6, 'sol plat'); }
  // le cap suit la piste, vers le village (z décroissant)
  assert.ok(Math.cos(R.SITE_RETOUR.cap) < -0.99, 'on le traverse vers le village (z décroissant) : ' + R.SITE_RETOUR.cap.toFixed(3));
});

test('portail de retour : même architecture que le portail du village (mêmes marches, mêmes positions de Nour et de Sablo)', async () => {
  const R = await IMP('retour-plan.js'), P = await IMP('portail-plan.js'), { BLOCS } = await IMP('portail-repere.js');
  for (const [nom, rep] of [['village', { hauteur: P.hauteurPortail, versMonde: P.versMonde, versLocal: P.versLocal, devant: P.devant, sablo: P.sabloRetour, monte: P.retourMonte, obstacles: P.obstacles }],
    ['retour', R.REPERE_RETOUR]]) {
    const at = (lx, lz) => { const w = rep.versMonde(lx, lz); return rep.hauteur(w.x, w.z); };
    assert.equal(at(0, -7), 0, nom + ' : sol devant les marches');
    assert.ok(Math.abs(at(0, -3.75) - 0.2) < 1e-9 && Math.abs(at(0, -2.25) - 0.4) < 1e-9 && Math.abs(at(0, 0) - 0.6) < 1e-9, nom + ' : marches de 20, 40 et 60 cm');
    const d = rep.devant(); assert.ok(Math.abs(rep.hauteur(d.x, d.z) - 0.4) < 1e-9, nom + ' : Nour sur le dessus de la marche haute');
    const S = rep.sablo(), M = rep.monte();
    for (const c of [S, M]) { const ux = Math.sin(c.a), uz = Math.cos(c.a), vx = Math.cos(c.a), vz = -Math.sin(c.a);
      for (const [a, b] of [[0, 0], [1, 0.3], [1, -0.3], [-1, 0.3], [-1, -0.3]]) assert.ok(Math.abs(rep.hauteur(c.x + ux * a + vx * b, c.z + uz * a + vz * b) - 0.2) < 1e-9, nom + ' : Sablo, les quatre pattes sur la marche basse'); }
    assert.ok(Math.hypot(S.x - d.x, S.z - d.z) > 1.5, nom + ' : Sablo à côté de Nour, pas dessus');
    // monter à pied : pente permise (1,05) respectée, du sol à la marche haute ; le socle reste un mur
    let prec = 0, pire = 0; for (let lz = -7; lz <= -2.25; lz += 0.08) { const h = at(0, lz); pire = Math.max(pire, (h - prec) / 0.08); prec = h; } assert.ok(pire <= 1.05, nom + ' : on monte les marches');
    let raide = 0; prec = at(0, -2.25); for (let lz = -2.25; lz <= -1.2; lz += 0.08) { const h = at(0, lz); raide = Math.max(raide, (h - prec) / 0.08); prec = h; } assert.ok(raide > 1.05, nom + ' : le socle est un mur');
    for (const o of rep.obstacles()) assert.ok(Math.hypot(o.x - d.x, o.z - d.z) > o.r + 1.2 && Math.hypot(o.x - S.x, o.z - S.z) > o.r + 0.6, nom + ' : ni Nour ni Sablo dans un pilier');
  }
  assert.ok(BLOCS.length === 3);
  const pose = R.poseRetour(); assert.ok(Math.abs(Math.atan2(Math.sin(pose.a - R.SITE_RETOUR.cap), Math.cos(pose.a - R.SITE_RETOUR.cap))) < 1e-9, 'Nour regarde le portail (la caméra, derrière lui, le voit)');
});

test('panneaux : les inscriptions exactes, lisibles, et la flèche montre vraiment le portail', async () => {
  const PN = await IMP('panneaux-plan.js'), R = await IMP('retour-plan.js'), P = await IMP('portail-plan.js');
  assert.equal(PN.inscription(PN.PANNEAUX.depart), 'Route vers La Mecque');
  assert.equal(PN.inscription(PN.PANNEAUX.retour), 'Retour au village');
  for (const [id, rep, site] of [['depart', PN.REPERE_VILLAGE, P.PORTAIL], ['retour', R.REPERE_RETOUR, R.SITE_RETOUR]]) {
    const p = PN.PANNEAUX[id], c = { x: site.x, z: site.z }, d = rep.devant();
    const dist = Math.hypot(p.x - c.x, p.z - c.z); assert.ok(dist > 6 && dist < 12, id + ' : à côté du portail, pas dessus (' + dist.toFixed(1) + ' m)');
    const l = rep.versLocal(p.x, p.z); assert.ok(Math.abs(l.lx) > 4.8 && l.lz < -3, id + ' : sur le côté, devant les marches, ni sur la piste ni sur les marches');
    assert.equal(rep.hauteur(p.x, p.z), 0, id + ' : posé sur le sol, pas sur une marche');
    // la face regarde celui qui arrive (devant les marches)
    const ar = rep.versMonde(0, -9), nx = Math.sin(p.yaw), nz = Math.cos(p.yaw), vx = ar.x - p.x, vz = ar.z - p.z, vl = Math.hypot(vx, vz);
    assert.ok((nx * vx + nz * vz) / vl > 0.9, id + ' : tourné vers l\'arrivée');
    // la flèche : vers le côté où se trouve le portail, vu de face
    const droite = { x: Math.cos(p.yaw), z: -Math.sin(p.yaw) }, versPortail = (c.x - p.x) * droite.x + (c.z - p.z) * droite.z;
    assert.equal(p.fleche, versPortail >= 0 ? 'droite' : 'gauche', id + ' : la flèche montre le portail');
    assert.ok(Math.abs(versPortail) > 3, id + ' : la direction est sans ambiguïté');
    assert.ok(Math.hypot(p.x - d.x, p.z - d.z) > 3.5, id + ' : Nour peut se tenir devant le portail sans être gêné');
  }
  // le panneau du village ne chevauche pas le relais de Rachid
  const { RELAIS_VILLAGE } = await IMP('donnees.js'); assert.ok(Math.hypot(PN.PANNEAUX.depart.x - RELAIS_VILLAGE.x, PN.PANNEAUX.depart.z - RELAIS_VILLAGE.z) > 4.5, 'loin du relais');
});

test('panneaux : textes simples, d\'époque, sans signalisation moderne, rien de religieux ni de punitif', async () => {
  const { TEXTES_PANNEAUX } = await IMP('panneaux-plan.js'), { TEXTES_RETOUR } = await IMP('retour-plan.js');
  const tout = JSON.stringify([TEXTES_PANNEAUX, TEXTES_RETOUR]);
  assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|pri[eè]re|dieu|musulman|islam)/i.test(tout), 'rien de religieux');
  assert.ok(!/(tu dois|obligatoire|sinon|punition|danger|autoroute|gps|km\/h|stop|sortie n)/i.test(tout), 'ni punitif ni moderne');
  for (const id of ['depart', 'retour']) for (const k of ['petit', 'grand']) { const t = TEXTES_PANNEAUX[id][k]; assert.ok(t.length > 20 && t.length < 260, id + ' ' + k + ' : court'); assert.ok(t.includes('«'), 'cite l\'inscription'); }
  assert.ok(TEXTES_PANNEAUX.depart.petit.length < TEXTES_PANNEAUX.depart.grand.length + 30);
  for (const k of ['petit', 'grand']) assert.ok(/progression|sac|trouv|rest/i.test(TEXTES_RETOUR.dialogue[k]), 'on rassure : rien n\'est perdu');
});

test('carte : le symbole du portail de retour est à sa vraie position dans le monde 3D, toujours connu, légende « Retour au village »', async () => {
  const R = await IMP('retour-plan.js'), { positionDeLieu } = await IMP('donnees.js'), { DEC, versRoute } = await IMP('relief.js'), { capVers } = await IMP('carte-route.js');
  const p = positionDeLieu(R.LIEU_RETOUR), w = versRoute(R.SITE_RETOUR.x, R.SITE_RETOUR.z);
  assert.ok(Math.abs(p.s - w.s) < 1e-9 && Math.abs(p.t - w.t) < 1e-9, 'la carte montre exactement la position du portail 3D');
  assert.equal(R.LIEU_RETOUR.nom, 'Retour au village'); assert.equal(R.LIEU_RETOUR.toujoursConnu, true); assert.ok(R.LIEU_RETOUR.icone);
  // « me guider » : la flèche de cap mène vers le portail (depuis l'arrivée, il est derrière : à peu près demi-tour)
  const c = capVers({ s: -20, t: 45, a: 0 }, p); assert.ok(c.distance > 38 && c.distance < 50, 'à une quarantaine de mètres derrière l\'arrivée : ' + c.distance.toFixed(1));
  assert.ok(Math.abs(Math.abs(c.angle) - Math.PI) < 0.2, 'derrière soi : demi-tour');
  // le portail du village n'est pas dans le monde de la Route, et la carte ne montre que le portail de retour
  assert.ok(DEC > 10000);
});

test('décor : rien ne pousse (rocher, buisson) sur le portail de retour', async () => {
  const D = await IMP('decor-plan.js'), { TAILLE_TUILE } = await IMP('tuiles-plan.js'), { PORTAIL_RETOUR } = await IMP('relief.js');
  const i0 = Math.floor((PORTAIL_RETOUR.s - 40) / TAILLE_TUILE), i1 = Math.floor((PORTAIL_RETOUR.s + 40) / TAILLE_TUILE), j0 = Math.floor((PORTAIL_RETOUR.t - 40) / TAILLE_TUILE), j1 = Math.floor((PORTAIL_RETOUR.t + 40) / TAILLE_TUILE);
  let vus = 0;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const o of D.semerTuile(i, j)) { vus++; assert.ok(Math.hypot(o.s - PORTAIL_RETOUR.s, o.t - PORTAIL_RETOUR.t) >= PORTAIL_RETOUR.r + 6 - 1e-9, 'décor trop près du portail : ' + JSON.stringify(o)); }
  assert.ok(vus > 5, 'le test regarde bien du décor autour');
});
