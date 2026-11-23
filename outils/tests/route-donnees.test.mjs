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
  assert.ok(fin[1] <= 358, 'la piste reste dans les limites du village (360)');
  assert.equal(auSeuilVillage(50, 330), false); assert.equal(auSeuilVillage(50, 349), true); assert.equal(auSeuilVillage(-200, 349), false, 'hors de la piste');
  const arrivee = versLaRoute({ x: 52, z: 350, a: 0.2 });
  assert.ok(dansLaRoute(arrivee.z) && arrivee.z > DEC - 100 && arrivee.z < DEC, 'on arrive juste avant le seuil de la Route');
  assert.equal(arrivee.a, 0.2, 'même direction : pas de demi-tour surprise');
  assert.equal(auRetourRoute(arrivee.z), false, 'on n\'est pas renvoyé tout de suite au village');
  assert.equal(auRetourRoute(DEC - 80), true);
  const retour = versLeVillage({ x: 48, z: DEC - 80, a: 3 });
  assert.equal(auSeuilVillage(retour.x, retour.z), false, 'au retour on n\'est pas renvoyé tout de suite sur la Route');
  assert.ok(retour.z < 345 && retour.z > 300);
});
