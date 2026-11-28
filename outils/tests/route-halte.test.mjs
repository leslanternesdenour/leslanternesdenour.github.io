// La halte de repos au milieu de la Route : un petit campement de caravaniers (tente, tapis, palmiers, provisions, eau, abreuvoir et abri pour Sablo).
// Tout est pur et testable sans 3D : position, plan, lieux de soins, textes, terrain aplati, décor écarté, carte. Aucune obligation, rien de punitif.
import test from 'node:test';
import assert from 'node:assert/strict';

const IMP = async f => import('../../voyage/js/route/' + f);

test('halte : au milieu de la partie jouable, près de la piste mais pas dessus, jouable, loin de tout autre lieu', async () => {
  const { HALTE, OASIS, CAMP, HAMEAU, CITE, S_DEBUT, S_FIN_TRANCHE, distanceChemin } = await IMP('relief.js');
  const { LIEUX_ROUTE, positionDeLieu } = await IMP('donnees.js');
  const { zoneJouable } = await IMP('piste-plan.js');
  const milieu = (S_DEBUT + S_FIN_TRANCHE) / 2;
  assert.ok(Math.abs(HALTE.s - milieu) < 400, 'au milieu du parcours : ' + HALTE.s + ' (milieu ' + milieu + ')');
  const dp = distanceChemin(HALTE.s, HALTE.t);
  assert.ok(dp > HALTE.r + 8 && dp < 80, 'à côté de la piste, sans la gêner : ' + dp.toFixed(1) + ' m');
  assert.ok(zoneJouable(HALTE.s, HALTE.t), 'dans la zone jouable');
  for (const l of LIEUX_ROUTE) { const p = positionDeLieu(l); assert.ok(Math.hypot(p.s - HALTE.s, p.t - HALTE.t) > HALTE.r + 8, 'pas de chevauchement avec ' + l.id); }
  assert.ok(Math.hypot(HALTE.s - OASIS.s, HALTE.t - OASIS.t) > OASIS.r + OASIS.lac + HALTE.r, 'hors de l\'oasis');
  assert.ok(Math.hypot(HALTE.s - CAMP.s, HALTE.t - CAMP.t) > CAMP.r + HALTE.r + 50, 'hors du campement des Trois Tentes');
  assert.ok(Math.hypot(HALTE.s - HAMEAU.s, HALTE.t - HAMEAU.t) > HAMEAU.r + HALTE.r + 50, 'hors du hameau');
  assert.ok(Math.hypot(HALTE.s - CITE.s, HALTE.t - CITE.t) > CITE.rayon + 500, 'loin de la cité');
});

test('halte : la halte n\'est PAS un lieu de mission (aucun compteur, aucune progression, aucune sauvegarde existante ne change)', async () => {
  const { LIEUX_ROUTE, MISSIONS_ROUTE } = await IMP('donnees.js');
  assert.ok(!LIEUX_ROUTE.some(l => /halte-?(repos|caravane)?$/.test(l.id) && l.id === 'halte'), 'pas dans LIEUX_ROUTE');
  for (const m of Object.values(MISSIONS_ROUTE)) assert.ok(!(m.lieux || []).includes('halte'), 'pas dans une mission');
  const { preparerRoute } = await IMP('etat-route.js');
  const etat = {}; const R = preparerRoute(etat);
  assert.ok(Array.isArray(R.repos) && R.vu && typeof R.vu === 'object', 'l\'état de la Route garde sa forme');
});

test('halte : le plan tient dans le cercle, rien ne se chevauche, les lieux de soins de Sablo sont complets', async () => {
  const { HALTE, DEC } = await IMP('relief.js');
  const P = await IMP('halte-plan.js');
  const c = P.centre(); assert.equal(c.x, HALTE.t); assert.equal(c.z, DEC + HALTE.s);
  for (const e of P.ELEMENTS) { assert.ok(Math.hypot(e.dx, e.dz) <= HALTE.r - 1, `${e.id} dans le cercle`); assert.ok(e.id && e.type, 'chaque élément a un id et un type'); }
  const ids = P.ELEMENTS.map(e => e.id); assert.equal(new Set(ids).size, ids.length, 'ids uniques');
  for (const type of ['tente', 'tapis', 'palmier', 'provisions', 'eau-nour', 'abreuvoir', 'mangeoire', 'abri-sablo', 'foyer']) assert.ok(P.ELEMENTS.some(e => e.type === type), 'il y a : ' + type);
  assert.ok(P.ELEMENTS.filter(e => e.type === 'palmier').length >= 3 && P.ELEMENTS.filter(e => e.type === 'tapis').length >= 2);
  // les lieux de soins : mêmes champs que ceux de l'enclos de l'écurie (soins.js / main.js)
  const S = P.lieuxSoins(); assert.deepEqual(Object.keys(S).sort(), ['eau', 'foin', 'litiere']);
  for (const [id, l] of Object.entries(S)) {
    for (const k of ['objet', 'stand']) { assert.ok(Number.isFinite(l[k].x) && Number.isFinite(l[k].z), `${id}.${k}`); assert.ok(Math.hypot(l[k].x - c.x, l[k].z - c.z) < HALTE.r - 1, `${id}.${k} dans la halte`); }
    assert.ok(Number.isFinite(l.a) && l.rayon >= 3 && l.icone && l.action, `${id} : cap, rayon, icône, action`);
    assert.ok(Math.hypot(l.objet.x - l.stand.x, l.objet.z - l.stand.z) < 2.2, `${id} : la monture est tout près de ce qu'elle utilise`);
  }
  assert.equal(S.eau.action, 'boire'); assert.equal(S.foin.action, 'manger'); assert.equal(S.litiere.action, 'repos');
  // trois endroits pour Sablo bien séparés (sinon deux boutons se chevauchent)
  const L = Object.values(S); for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) assert.ok(Math.hypot(L[i].stand.x - L[j].stand.x, L[i].stand.z - L[j].stand.z) > 3.2, 'les places de Sablo sont distinctes');
  // les trois gestes de Nour (boire, manger, se reposer), éloignés les uns des autres
  const N = P.GESTES_NOUR; assert.deepEqual(N.map(g => g.id).sort(), ['halte-eau', 'halte-tapis', 'halte-vivres']);
  for (const g of N) { assert.ok(g.label && g.icone && g.rayon >= 2 && Math.hypot(g.x - c.x, g.z - c.z) < HALTE.r - 2, g.id); }
  for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) assert.ok(Math.hypot(N[i].x - N[j].x, N[i].z - N[j].z) > 4, 'les gestes de Nour sont éloignés');
  // les gestes de Nour sont loin des places de Sablo (on ne marche pas dessus)
  for (const g of N) for (const l of L) assert.ok(Math.hypot(g.x - l.stand.x, g.z - l.stand.z) > 3, g.id + ' / Sablo');
});

test('halte : les obstacles sont rares et petits, la route de la tente aux soins reste libre', async () => {
  const P = await IMP('halte-plan.js');
  const o = P.obstacles(); assert.ok(o.length > 0 && o.length <= 26, 'peu d\'obstacles : ' + o.length);
  for (const b of o) assert.ok(b.r > 0 && b.r <= 2.4, 'obstacle de taille raisonnable');
  // aucun obstacle sur un geste de Nour ni sur une place de Sablo
  for (const g of P.GESTES_NOUR) for (const b of o) assert.ok(Math.hypot(b.x - g.x, b.z - g.z) > b.r + 0.3, g.id + ' n\'est pas dans un obstacle');
  for (const l of Object.values(P.lieuxSoins())) for (const b of o) assert.ok(Math.hypot(b.x - l.stand.x, b.z - l.stand.z) > b.r + 0.3, 'la place de Sablo est libre');
});

test('halte : le terrain est parfaitement plat dans le cercle, adouci autour, et rien n\'est semé dedans', async () => {
  const { HALTE, hauteur } = await IMP('relief.js');
  const { semerTuile } = await IMP('decor-plan.js');
  const { TAILLE_TUILE } = await IMP('tuiles-plan.js');
  let mn = 1e9, mx = -1e9;
  for (let a = 0; a < 6.283; a += 0.5) for (const k of [0, 0.4, 0.8, 1]) { const h = hauteur(HALTE.s + Math.cos(a) * HALTE.r * k, HALTE.t + Math.sin(a) * HALTE.r * k); mn = Math.min(mn, h); mx = Math.max(mx, h); }
  assert.ok(mx - mn < 0.12, 'sol plat : écart ' + (mx - mn).toFixed(3) + ' m');
  const i0 = Math.floor((HALTE.s - HALTE.r - 10) / TAILLE_TUILE), i1 = Math.floor((HALTE.s + HALTE.r + 10) / TAILLE_TUILE), j0 = Math.floor((HALTE.t - HALTE.r - 10) / TAILLE_TUILE), j1 = Math.floor((HALTE.t + HALTE.r + 10) / TAILLE_TUILE);
  let vus = 0;
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) for (const o of semerTuile(i, j)) { vus++; assert.ok(Math.hypot(o.s - HALTE.s, o.t - HALTE.t) >= HALTE.r + 2, `décor ${o.type} dans la halte`); }
  assert.ok(vus > 0, 'le décor existe bien autour');
});

test('halte : la piste reste libre et la halte est annoncée sur la carte (à découvrir en passant, jamais imposée)', async () => {
  const { HALTE, distanceChemin, S_DEBUT, S_FIN_TRANCHE } = await IMP('relief.js');
  assert.ok(distanceChemin(HALTE.s, HALTE.t) > HALTE.r + 8);
  const { LIEU_HALTE } = await IMP('halte-plan.js');
  assert.equal(LIEU_HALTE.id, 'halte'); assert.ok(LIEU_HALTE.nom && LIEU_HALTE.icone);
  const { positionDeLieu } = await IMP('donnees.js'); const p = positionDeLieu(LIEU_HALTE);
  assert.equal(p.s, HALTE.s); assert.equal(p.t, HALTE.t); assert.ok(p.s > S_DEBUT && p.s < S_FIN_TRANCHE);
});

test('halte : textes sobres pour les deux âges, rien de punitif, rien de religieux ni d\'inventé sur l\'histoire', async () => {
  const { TEXTES_HALTE } = await IMP('textes-halte.js');
  const cles = ['arrivee', 'eau', 'vivres', 'repos', 'repriseRoute', 'gourde', 'sablo', 'indice'];
  const tout = [];
  for (const k of cles) {
    const t = TEXTES_HALTE[k]; assert.ok(t, k);
    for (const age of ['petit', 'grand']) { assert.ok(typeof t[age] === 'string' && t[age].length > 15, `${k}.${age}`); if (age === 'petit') assert.ok(t.petit.length <= 130, `${k} : court pour les petits`); assert.ok(t[age].length <= 340, `${k}.${age} : pas trop long`); tout.push(t[age]); }
  }
  const txt = tout.join(' ');
  assert.ok(!/(allah|coran|kaaba|zamzam|proph|hadith|pri[eè]re|mecque|dieu|musulman|islam|pèlerin|hajj|hadj)/i.test(txt), 'rien de religieux');
  assert.ok(!/(tu dois|obligatoire|sinon|punition|perdu|échec|trop tard|dépêche|pénalité|mort|meurt)/i.test(txt), 'rien de punitif');
  assert.ok(/(rien ne presse|quand tu veux|à ton rythme|quand tu es prêt|sans te presser|pas pressé)/i.test(txt), 'la halte rassure : aucune obligation');
  assert.ok(/(dattes?|outre|laine|poils|palmier)/i.test(txt), 'matériaux et vivres de l\'Arabie du VIIe siècle');
  assert.ok(!/(plastique|gourde en métal|bouteille|conserve|électri|moteur|sucre|café|thé\b|tabac|pomme de terre|tomate|maïs)/i.test(txt), 'aucun anachronisme');
});

test('halte : les sauvegardes existantes ne changent pas — l\'état de la halte est facultatif et ne bloque rien', async () => {
  const { etatHalte } = await IMP('halte-plan.js');
  const R = { vu: {} }; const h = etatHalte(R);
  assert.deepEqual(Object.keys(h).sort(), ['boire', 'manger', 'repos', 'vue']); assert.ok(Object.values(h).every(v => v === 0 || v === false));
  h.repos = 3; assert.equal(etatHalte(R).repos, 3, 'persistant dans R.vu');
  assert.ok(R.vu.halte && Object.keys(R.vu).length === 1, 'une seule clé ajoutée : vu.halte');
  const vieux = { vu: { arrivee: true, gourdePleine: true } }; assert.ok(etatHalte(vieux).vue === false); assert.equal(vieux.vu.arrivee, true); assert.equal(vieux.vu.gourdePleine, true);
});
