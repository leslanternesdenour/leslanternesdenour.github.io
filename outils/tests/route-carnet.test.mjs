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
  const fini = { etat: { route: { decouvertes: ['seuil', 'oasis'], repos: ['a', 'b', 'c'], missions: { chemin: { etat: 'finie' }, traces: { etat: 'finie' }, campement: { etat: 'finie' } }, vu: { campementRendu: true } } } };
  assert.equal(BADGES_ROUTE.every(b => b.ok(fini)), true, 'tous acquis quand tout est fait');
});
