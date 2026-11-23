// La Route : les données (régions, lieux, sac, missions) — noms fictifs, rien d'inventé comme certitude historique.
import test from 'node:test'; import assert from 'node:assert/strict';

test('régions : consécutives, sans trou ni chevauchement', async () => {
  const { REGIONS_ROUTE } = await import('../../voyage/js/route/donnees.js');
  assert.ok(REGIONS_ROUTE.length >= 4);
  for (let i = 1; i < REGIONS_ROUTE.length; i++) assert.equal(REGIONS_ROUTE[i].s0, REGIONS_ROUTE[i - 1].s1, `trou ou chevauchement avant ${REGIONS_ROUTE[i].id}`);
});

test('regionA : donne la région où l\'on se trouve, et reste valable au-delà des bords', async () => {
  const { regionA } = await import('../../voyage/js/route/donnees.js');
  assert.equal(regionA(-20).id, 'sortie'); assert.equal(regionA(900).id, 'plaines'); assert.equal(regionA(1800).id, 'dunes'); assert.equal(regionA(2500).id, 'oasis');
  assert.equal(regionA(-1000).id, 'sortie'); assert.equal(regionA(99999).id, 'oasis');
});

test('lieux : jamais plus de 300 m de marche sans rien à voir (long par l\'exploration, pas par la marche vide)', async () => {
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const { S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  const s = LIEUX_ROUTE.filter(l => l.type !== 'objet').map(l => l.s).sort((a, b) => a - b);
  assert.ok(s[0] <= 150, 'le premier lieu est tout près du seuil');
  for (let i = 1; i < s.length; i++) assert.ok(s[i] - s[i - 1] <= 300, `trop loin entre s=${s[i - 1]} et s=${s[i]}`);
  assert.ok(S_FIN_TRANCHE - s.at(-1) <= 300, 'le cairn de fin n\'est pas isolé');
  assert.equal(new Set(LIEUX_ROUTE.map(l => l.id)).size, LIEUX_ROUTE.length, 'identifiants uniques');
});

test('lieux : chaque lieu se trouve sur un sol praticable, jamais dans l\'eau ni sur une pente', async () => {
  const { LIEUX_ROUTE, positionLieu } = await import('../../voyage/js/route/donnees.js');
  const { relief, hauteur } = await import('../../voyage/js/route/relief.js');
  for (const l of LIEUX_ROUTE) {
    const { s, t } = positionLieu(l);
    assert.ok(relief(s, t).lac < 0.05, `${l.id} est dans l'eau`);
    const h = hauteur(s, t), pente = Math.max(Math.abs(hauteur(s + 3, t) - h), Math.abs(hauteur(s, t + 3) - h)) / 3;
    assert.ok(pente < 0.45, `${l.id} est sur une pente de ${pente.toFixed(2)}`);
  }
});

test('durée : calculée avec les VRAIES vitesses du jeu (marche 3,3 m/s, course 6,2 m/s)', async () => {
  const { VITESSES, dureeMinutes, DISTANCE_TOTALE } = await import('../../voyage/js/route/donnees.js');
  const { S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  const fs = await import('node:fs');
  const main = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes(`d.course ? ${VITESSES.course} : ${VITESSES.marche}`), 'les vitesses de donnees.js doivent suivre celles de main.js');
  const tranche = dureeMinutes(S_FIN_TRANCHE, VITESSES.marche);
  assert.ok(tranche > 12 && tranche < 18, `première tranche à pied : ${tranche.toFixed(1)} min`);
  assert.ok(dureeMinutes(DISTANCE_TOTALE, VITESSES.marche) < 31, 'le grand voyage complet reste d\'une demi-heure de marche');
  assert.ok(dureeMinutes(DISTANCE_TOTALE, VITESSES.course) < dureeMinutes(DISTANCE_TOTALE, VITESSES.marche) / 1.8);
});

test('sac : les six objets du voyage, chacun avec son utilité, sans aucune jauge de survie', async () => {
  const { SAC_ROUTE } = await import('../../voyage/js/route/donnees.js');
  assert.deepEqual(SAC_ROUTE.map(o => o.id), ['gourde', 'sac', 'tissu', 'lanterne', 'provisions', 'carte']);
  for (const o of SAC_ROUTE) { assert.ok(o.nom && o.icone && o.utilite && o.utilite.length > 20, `${o.id} sans utilité`); assert.ok(!/(soif|faim|mourir|danger|épuis|perdre des points)/i.test(o.utilite), `${o.id} : pas de survie stressante`); }
});

test('missions : trois missions de la première tranche, chacune réalisable avec les lieux qui existent', async () => {
  const { MISSIONS_ROUTE, LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  assert.deepEqual(Object.keys(MISSIONS_ROUTE), ['chemin', 'traces', 'campement']);
  for (const [id, m] of Object.entries(MISSIONS_ROUTE)) {
    const n = LIEUX_ROUTE.filter(l => l.mission === id).length;
    assert.equal(m.total, n, `${id} : ${m.total} étapes annoncées, ${n} lieux`);
    assert.ok(m.recompense > 0 && m.titre && m.icone && m.resume && m.simple, `${id} incomplète (le texte « simple » est pour les 3–5 ans)`);
    assert.ok(['exploration', 'entraide', 'observation', 'connaissance'].includes(m.categorie));
  }
});

test('ouverture : la Route réutilise les conditions EXISTANTES (oasis et camp découverts, puis une activité au choix)', async () => {
  const { REGION_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const vide = { AV: { quetes: {}, animaux: [], missions: {}, ramasses: [], equipement: {} }, zones: [] };
  assert.equal(REGION_ROUTE.requis.ok(vide), false);
  assert.equal(REGION_ROUTE.requis.ok({ ...vide, zones: ['oasis'] }), false, 'il faut l\'oasis ET le camp');
  assert.equal(REGION_ROUTE.requis.ok({ ...vide, zones: ['oasis', 'camp'] }), true);
  assert.ok(REGION_ROUTE.auChoix.length >= 3, 'jamais une seule activité obligatoire');
  assert.ok(REGION_ROUTE.auChoix.every(a => a.ok(vide) === false), 'rien n\'est acquis au départ');
  assert.equal(REGION_ROUTE.auChoix.some(a => a.ok({ ...vide, AV: { ...vide.AV, missions: { lanternes: { etat: 'finie' } } } })), true, 'une grande mission terminée suffit');
  assert.ok(REGION_ROUTE.nom && REGION_ROUTE.icone);
});

test('seuil : la piste du village mène au seuil ; on passe d\'un monde à l\'autre sans aller-retour parasite', async () => {
  const { SORTIE_VILLAGE, auSeuilVillage, versLaRoute, auRetourRoute, versLeVillage } = await import('../../voyage/js/route/donnees.js');
  const { DEC, dansLaRoute } = await import('../../voyage/js/route/relief.js');
  const fin = SORTIE_VILLAGE.at(-1);
  assert.ok(fin[0] <= 358, 'la piste reste dans les limites du village (360)');
  // la sortie est à l'EST, par la zone gratuite de l'oasis : elle ne traverse aucune zone Premium (dunes, camp, col, montagnes, wadi, rochers)
  for (const [x, z] of SORTIE_VILLAGE) for (const [nom, c] of Object.entries({ dunes: [30, 230, 124], camp: [-175, 60, 46], wadi: [-245, 175, 50], rochers: [150, -95, 44], montagnes: [0, -265, 74] }))
    assert.ok(Math.hypot(x - c[0], z - c[1]) > c[2], `la piste de sortie traverse la zone ${nom} (Premium)`);
  assert.equal(auSeuilVillage(330, 50), false); assert.equal(auSeuilVillage(349, 50), true); assert.equal(auSeuilVillage(349, -200), false, 'hors de la piste');
  const arrivee = versLaRoute({ x: 350, z: 50, a: Math.PI / 2 });
  assert.ok(dansLaRoute(arrivee.z) && arrivee.z > DEC - 100 && arrivee.z < DEC, 'on arrive juste avant le seuil de la Route');
  assert.ok(Math.abs(arrivee.a) < 1e-9, 'on regardait vers l\'est, on regarde maintenant vers l\'avant de la piste : pas de demi-tour surprise');
  assert.ok(Math.abs(arrivee.x - 46) < 1e-9, 'au centre de la piste quand on arrive au milieu de la sortie');
  assert.equal(auRetourRoute(arrivee.z), false, 'on n\'est pas renvoyé tout de suite au village');
  assert.equal(auRetourRoute(DEC - 80), true);
  const retour = versLeVillage({ x: 46, z: DEC - 80, a: Math.PI });
  assert.equal(auSeuilVillage(retour.x, retour.z), false, 'au retour on n\'est pas renvoyé tout de suite sur la Route');
  assert.ok(retour.x < 345 && retour.x > 300 && Math.abs(retour.z - 50) < 1e-9);
  assert.ok(Math.abs(Math.abs(retour.a) - Math.PI / 2) < 1e-9, 'on repart vers l\'ouest');
});

test('textes : chaque lieu a un texte court et simple (version 3–5 ans et version 6–10 ans), sans religion ni inventions historiques', async () => {
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const { TEXTES_LIEUX, texteLieu } = await import('../../voyage/js/route/textes-route.js');
  for (const l of LIEUX_ROUTE.filter(o => !['objet', 'personnage'].includes(o.type))) {
    const t = TEXTES_LIEUX[l.id]; assert.ok(t, `texte manquant : ${l.id}`);
    assert.ok(t.petit && t.petit.length <= 110, `${l.id} : version 3–5 ans trop longue (${(t.petit || '').length})`);
    assert.ok(t.grand && t.grand.length <= 330, `${l.id} : version 6–10 ans trop longue`);
  }
  assert.equal(texteLieu('balise1', '3-5'), TEXTES_LIEUX.balise1.petit);
  assert.equal(texteLieu('balise1', '6-10'), TEXTES_LIEUX.balise1.grand);
});

test('marche naturelle : sur la Route, la marche à pied est légèrement plus lente que dans le village (distance inchangée), sans toucher à la vitesse des montures ni du village', async () => {
  const { VITESSES, VITESSES_ROUTE, FACTEUR_MARCHE_ROUTE, dureeMinutes, DISTANCE_TOTALE } = await import('../../voyage/js/route/donnees.js');
  const { S_FIN_TRANCHE } = await import('../../voyage/js/route/relief.js');
  assert.ok(FACTEUR_MARCHE_ROUTE >= 0.8 && FACTEUR_MARCHE_ROUTE < 1, 'légèrement plus lente, pas une marche d\'escargot');
  assert.ok(Math.abs(VITESSES_ROUTE.marche - VITESSES.marche * FACTEUR_MARCHE_ROUTE) < 1e-9);
  assert.ok(Math.abs(VITESSES_ROUTE.course - VITESSES.course * FACTEUR_MARCHE_ROUTE) < 1e-9);
  const t = dureeMinutes(S_FIN_TRANCHE, VITESSES_ROUTE.marche), tot = dureeMinutes(DISTANCE_TOTALE, VITESSES_ROUTE.marche);
  assert.ok(t > 15 && t < 19, `première tranche à pied : ${t.toFixed(1)} min`);
  assert.ok(tot > 29 && tot < 35, `grand voyage complet à pied : ${tot.toFixed(1)} min`);
  assert.equal(DISTANCE_TOTALE, 5600, 'la distance du voyage est conservée');
  const fs = await import('node:fs');
  const main = fs.readFileSync(new URL('../../voyage/js/main.js', import.meta.url), 'utf8');
  assert.ok(main.includes(`(d.course ? ${VITESSES.course} : ${VITESSES.marche}) * (d.analogique || 0) * (route && route.enRoute() ? route.facteurMarche : 1)`), 'le facteur ne s\'applique qu\'à pied et sur la Route');
});
