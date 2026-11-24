// La Route : le relief est une fonction pure (aucun fichier à télécharger), continue et praticable à pied.
import test from 'node:test'; import assert from 'node:assert/strict';

test('relief : la piste principale est praticable à pied (pente douce, du seuil jusqu\'au cairn de fin de tranche)', async () => {
  const { hauteur, pointChemin, S_DEBUT, S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  let pireNombre = 0, pire = 0;
  for (let s = S_DEBUT; s < S_FIN_TRANCHE; s += 2) {
    const a = pointChemin(s), b = pointChemin(s + 2);
    const pente = Math.abs(hauteur(b.s, b.t) - hauteur(a.s, a.t)) / Math.hypot(b.s - a.s, b.t - a.t);
    if (pente > pire) { pire = pente; pireNombre = s; }
  }
  assert.ok(pire < 0.35, `pente max sur la piste ${pire.toFixed(2)} à s=${pireNombre}`);
});

test('relief : toute la plaine et les dunes à moins de 450 m de la piste se marchent (jamais de mur invisible)', async () => {
  const { hauteur, S_DEBUT, S_FIN_TRANCHE, S_MONTAGNES_DEBUT, distanceChemin } = await import('../../voyage/js/route/relief.js');
  let pire = 0, ou = '';
  // dans les montagnes, les parois sont volontairement infranchissables (falaises) : on exige seulement que le fond de la vallée (à moins de 25 m de la piste) se marche
  for (let s = S_DEBUT; s < S_FIN_TRANCHE; s += 4) for (let t = -450; t < 450; t += 4) {
    if (s > S_MONTAGNES_DEBUT && distanceChemin(s, t) > 25) continue;
    const h = hauteur(s, t), p = Math.max(Math.abs(hauteur(s + 4, t) - h), Math.abs(hauteur(s, t + 4) - h)) / 4;
    if (p > pire) { pire = p; ou = `s=${s} t=${t}`; }
  }
  assert.ok(pire < 0.9, `pente max ${pire.toFixed(2)} à ${ou} (le jeu bloque au-delà de 1,05)`);
});

test('relief : l\'oasis est plate avec un petit lac creusé ; le campement est plat ; les montagnes bordent l\'horizon', async () => {
  const { hauteur, relief, OASIS, CAMP } = await import('../../voyage/js/route/relief.js');
  const rive = hauteur(OASIS.s + OASIS.lac + 8, OASIS.t), eau = hauteur(OASIS.s, OASIS.t);
  assert.ok(rive - eau > 2.2, `le lac doit être creusé (${(rive - eau).toFixed(2)} m)`);
  assert.ok(relief(OASIS.s, OASIS.t).lac > 0.9);
  for (const a of [0, 1.5, 3, 4.5]) assert.ok(Math.abs(hauteur(CAMP.s + Math.cos(a) * 15, CAMP.t + Math.sin(a) * 15) - hauteur(CAMP.s, CAMP.t)) < 0.8, 'campement plat');
  assert.ok(hauteur(1000, 950) > 40 && hauteur(1000, -950) > 40, 'montagnes au loin des deux côtés');
  assert.ok(hauteur(1000, 10) < 4, 'la plaine reste basse');
});

test('montagnes : la piste s\'enfonce dans un fond de vallée, les parois montent haut et vite de chaque côté, et la fin de la partie jouable est repoussée', async () => {
  const { hauteur, pointChemin, S_FIN_TRANCHE, S_FIN_TRANCHE_1, S_MONTAGNES_DEBUT } = await import('../../voyage/js/route/relief.js');
  assert.equal(S_FIN_TRANCHE_1, 2900, 'la première tranche garde son repère historique');
  assert.ok(S_FIN_TRANCHE >= 4200, 'la partie jouable va maintenant jusqu\'aux premiers cols');
  for (const s of [3400, 3700, 4000]) {
    const t = pointChemin(s).t, fond = hauteur(s, t);
    assert.ok(fond < 8, `fond de vallée trop haut à s=${s} (${fond.toFixed(1)})`);
    assert.ok(hauteur(s, t + 260) > fond + 40 || hauteur(s, t - 260) > fond + 40, `pas de paroi à s=${s} (la vallée est large : les parois montent à 100–250 m de la piste)`);
  }
  assert.ok(hauteur(S_MONTAGNES_DEBUT - 200, 400) < 25, 'avant les montagnes, la plaine reste ouverte à côté de la piste');
  const cote = s => { const t = pointChemin(s).t; return Math.max(hauteur(s, t + 200), hauteur(s, t - 200)); };
  assert.ok(cote(3700) > cote(3000) + 10, 'les montagnes se rapprochent de la piste');
});

test('montagnes : le fond de la vallée est doux, jamais une tranchée dans laquelle on a l\'impression de s\'enfoncer', async () => {
  const { hauteur, pointChemin } = await import('../../voyage/js/route/relief.js');
  let pire = 0, ou = '';
  for (let s = 3350; s <= 4200; s += 10) { const t0 = pointChemin(s).t; for (let d = -22; d < 22; d += 2) {
    const p = Math.abs(hauteur(s, t0 + d + 2) - hauteur(s, t0 + d)) / 2; if (p > pire) { pire = p; ou = `s=${s} d=${d}`; } } }
  assert.ok(pire < 0.16, `pente latérale max ${pire.toFixed(2)} à ${ou} : on dirait une tranchée`);
  for (let s = 3400; s <= 4150; s += 50) {
    const t0 = pointChemin(s).t, creux = (hauteur(s, t0 + 24) + hauteur(s, t0 - 24)) / 2 - hauteur(s, t0);
    assert.ok(creux < 1.0, `le fond est ${creux.toFixed(2)} m sous les bords proches à s=${s}`);
  }
});

test('cité : un bassin plat et ouvert autour de la place, entouré de collines basses, avec la route qui y entre ; la route va jusqu\'à la cité', async () => {
  const { CITE, hauteur, pointChemin, S_FIN_TRANCHE, relief } = await import('../../voyage/js/route/relief.js');
  assert.ok(S_FIN_TRANCHE >= CITE.s + 250, 'la partie jouable dépasse la place centrale');
  assert.ok(CITE.s > 5500 && CITE.s < 5800, 'la place est au bout d\'environ 5,6 km');
  const centre = hauteur(CITE.s, CITE.t);
  for (const a of [0, 1.2, 2.4, 3.6, 4.8, 6]) assert.ok(Math.abs(hauteur(CITE.s + Math.cos(a) * 40, CITE.t + Math.sin(a) * 40) - centre) < 0.6, 'la place est plate');
  assert.ok(relief(CITE.s, CITE.t).plaza > 0.95 && relief(CITE.s + 200, CITE.t).plaza < 0.05, 'la place est marquée au sol');
  const plat = hauteur(CITE.s - 150, pointChemin(CITE.s - 150).t);
  assert.ok(plat < 4, 'la route arrive dans une vallée basse');
  let colline = 0; for (let a = 0; a < 6.28; a += 0.4) colline = Math.max(colline, hauteur(CITE.s + Math.cos(a) * 420, CITE.t + Math.sin(a) * 420));
  assert.ok(colline > 12, 'des collines entourent la cité');
});

test('montagnes isolées : les deux sentiers se marchent jusqu\'à une terrasse plate au pied de chaque montagne, qui domine le bassin', async () => {
  const { hauteur, TERRASSES, MONTAGNE_NORD, MONTAGNE_SUD, sentiers } = await import('../../voyage/js/route/relief.js');
  assert.ok(hauteur(MONTAGNE_NORD.s, MONTAGNE_NORD.t) > 100 && hauteur(MONTAGNE_SUD.s, MONTAGNE_SUD.t) > 100, 'deux vraies montagnes');
  let pire = 0, ou = '';
  for (const S of sentiers().slice(1)) for (let i = 0; i < S.length - 1; i++) { const [a, b, c, d] = [...S[i], ...S[i + 1]]; const n = Math.ceil(Math.hypot(c - a, d - b) / 3);
    for (let k = 0; k < n; k++) { const s0 = a + (c - a) * k / n, t0 = b + (d - b) * k / n, s1 = a + (c - a) * (k + 1) / n, t1 = b + (d - b) * (k + 1) / n; const p = Math.abs(hauteur(s1, t1) - hauteur(s0, t0)) / Math.hypot(s1 - s0, t1 - t0); if (p > pire) { pire = p; ou = `${s0.toFixed(0)},${t0.toFixed(0)}`; } } }
  assert.ok(pire < 0.45, `pente max sur les sentiers ${pire.toFixed(2)} à ${ou}`);
  for (const T of TERRASSES) { const h = hauteur(T.s, T.t); for (const a of [0, 1.6, 3.2, 4.8]) assert.ok(Math.abs(hauteur(T.s + Math.cos(a) * 12, T.t + Math.sin(a) * 12) - h) < 0.7, `la terrasse ${T.id} est plate`); }
});

test('intérieurs : un plateau plat, à l\'écart de la cité, pour les pièces des maisons (le sol sous l\'enfant est le sol de la pièce)', async () => {
  const { hauteur, PLATEAU_INTERIEURS, CITE } = await import('../../voyage/js/route/relief.js');
  const P = PLATEAU_INTERIEURS, h0 = hauteur(P.s, P.t);
  assert.ok(Math.hypot(P.s - CITE.s, P.t - CITE.t) > CITE.rayon + 60, 'loin des maisons de la cité');
  for (let a = 0; a < 6.3; a += 0.7) for (const d of [0, 5, 10, P.r]) assert.ok(Math.abs(hauteur(P.s + Math.cos(a) * d, P.t + Math.sin(a) * d) - h0) < 0.02, `plat à ${d} m`);
  assert.ok(Math.abs(hauteur(P.s + P.r + 40, P.t) - h0) < 14, 'pas de falaise autour');
});
