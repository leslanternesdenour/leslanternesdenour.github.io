// La Route : l'onglet « Itinéraire » du carnet (six sections, lié au profil de l'enfant via la sauvegarde).
import test from 'node:test'; import assert from 'node:assert/strict';

test('carnet : les six sections, les découvertes et les missions de l\'enfant, la mention « À VALIDER » des connaissances', async () => {
  const { pageCarnetRoute } = await import('../../voyage/js/route/carnet-route.js');
  const route = { decouvertes: ['region:sortie', 'seuil', 'balise1'], repos: ['repos1'], missions: { chemin: { etat: 'en_cours', n: 1, faits: ['balise1'] } }, objets: ['objet1'], connaissances: ['intro-grande-route'], sac: { gourde: true, carte: true }, pos: { x: 40, z: 20300, a: 0 } };
  const html = pageCarnetRoute({ route, badges: { 'route-depart': 1 }, age: '6-10' });
  for (const t of ['Mon itinéraire', 'Mes découvertes', 'Mes missions', 'Mes objets', 'Mes connaissances', 'Mes badges']) assert.ok(html.includes(t), `section manquante : ${t}`);
  assert.ok(html.includes('Retrouver le chemin de la grande route') && html.includes('1 / 3'));
  assert.ok(html.includes('À VALIDER'), 'les connaissances non validées sont marquées');
  assert.ok(html.includes('Le seuil de la grande route'));
  assert.ok(!html.includes('undefined') && !html.includes('NaN'));
  assert.ok(pageCarnetRoute({ route: { decouvertes: [], repos: [], missions: {}, objets: [], connaissances: [], sac: {}, pos: null }, badges: {}, age: '3-5' }).includes('Mon itinéraire'), 'carnet vide : pas de plantage');
});

test('badges : se méritent en explorant et en aidant, jamais présentés comme spirituels, sans toucher aux badges existants', async () => {
  const { BADGES_ROUTE } = await import('../../voyage/js/route/badges-route.js');
  const vide = { etat: { route: { decouvertes: [], repos: [], missions: {}, vu: {} } } };
  assert.ok(BADGES_ROUTE.length >= 5);
  assert.equal(new Set(BADGES_ROUTE.map(b => b.id)).size, BADGES_ROUTE.length);
  for (const b of BADGES_ROUTE) { assert.ok(b.id.startsWith('route-'), 'les identifiants ne peuvent pas entrer en conflit avec les badges existants'); assert.equal(b.ok(vide), false, `${b.id} ne doit pas être acquis au départ`); assert.ok(!/(bénédiction|saint|pieu|prière|récompense d'allah)/i.test(b.nom + b.desc)); }
  const fini = { etat: { route: { decouvertes: ['seuil', 'oasis'], repos: ['a', 'b', 'c'], missions: { chemin: { etat: 'finie' }, traces: { etat: 'finie' }, campement: { etat: 'finie' } }, recits: { 'eau-desert': { carnet: true }, 'caravanes-hospitalite': { carnet: true } }, vu: { campementRendu: true } } } };
  assert.ok(BADGES_ROUTE.some(b => b.id === 'route-histoires'), 'un badge récompense la curiosité pour les histoires (jamais présenté comme spirituel)');
  assert.equal(BADGES_ROUTE.every(b => b.ok(fini)), true, 'tous acquis quand tout est fait');
});

test('carnet : le nombre de haltes possibles suit les lieux de repos qui existent (5 maintenant)', async () => {
  const { pageCarnetRoute } = await import('../../voyage/js/route/carnet-route.js');
  const { LIEUX_ROUTE } = await import('../../voyage/js/route/donnees.js');
  const n = LIEUX_ROUTE.filter(l => l.type === 'repos').length;
  assert.ok(n >= 5, 'au moins les cinq haltes des premières étapes');
  const html = pageCarnetRoute({ route: { decouvertes: [], repos: ['repos1', 'repos4'], missions: {}, objets: [], connaissances: [], sac: {}, pos: null }, badges: {}, age: '6-10' });
  assert.ok(html.includes(`Haltes faites : 2 / ${n}`), 'le total de haltes est calculé, pas écrit en dur');
});

test('carnet : « Mes histoires découvertes » — titre, lieu, contexte, résumé adapté à l\'âge, illustration, références, statut, questions ; seulement les histoires ajoutées', async () => {
  const { pageCarnetRoute } = await import('../../voyage/js/route/carnet-route.js');
  const base = { decouvertes: [], repos: [], missions: {}, objets: [], connaissances: [], sac: {}, pos: null };
  const vide = pageCarnetRoute({ route: { ...base, recits: {} }, badges: {}, age: '6-10' });
  assert.ok(vide.includes('Mes histoires découvertes') && /pas encore/i.test(vide), 'section présente même vide');
  const route = { ...base, recits: { 'safa-marwa': { etape: 3, reponses: { q1: 0 }, activite: false, carnet: true }, 'eau-desert': { etape: 1, reponses: {}, activite: false, carnet: false } } };
  const grand = pageCarnetRoute({ route, badges: {}, age: '6-10' }), petit = pageCarnetRoute({ route, badges: {}, age: '3-5' });
  assert.ok(grand.includes('Safa et Marwa') && grand.includes('<svg'), 'titre, lieu et illustration');
  assert.ok(!grand.includes('L\'eau, un trésor du désert'), 'une histoire seulement ouverte (pas ajoutée au carnet) n\'y est pas');
  assert.ok(grand.includes('À VALIDER') && grand.includes('Référence à vérifier'), 'statut et références à vérifier');
  assert.ok(grand.includes('Dans le Coran') && grand.includes('Récit rapporté dans un hadith'), 'chaque phrase garde son origine');
  assert.ok(grand.length > petit.length, 'les 6–10 ans ont plus de détails que les 3–5 ans');
  assert.ok(grand.includes('Question') && grand.includes('✓'), 'les questions et la réponse juste conservée');
});
