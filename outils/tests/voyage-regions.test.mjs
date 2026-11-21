// Grand Voyage : zones Premium fermées / ouvertes par les barrières existantes (régions). Données seulement : Three.js est remplacé
// par l'imitation vide (outils/tests/three-factice) — ce n'est PAS un test du rendu 3D.
// node --import ./outils/tests/three-factice/enregistrer.mjs --test outils/tests/voyage-regions.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
const { creerRegions } = await import('../../voyage/js/regions.js');
const { chargerPremium } = await import('../../voyage/js/premium.js');
const cat = (ouvertes, vue = null) => ({ catalogue: { voyage: Object.fromEntries(['village', 'marche', 'oasis', 'camp', 'dunes', 'col', 'montagnes', 'wadi', 'rochers'].map(z => [z, { ouvert: ['village', 'marche', 'oasis', ...ouvertes].includes(z) }])), missions: {} }, vue });
const packVide = z => ({ format: 'ldn-pack-voyage-1', zone: z, points: {}, phrases: [], voix: {} });
const fetcher = (c, packs) => async u => u === '/api/catalogue' ? new Response(JSON.stringify(c)) : (packs.includes(u.split('/')[4]) ? new Response(JSON.stringify(packVide(u.split('/')[4]))) : new Response('', { status: 404 }));
const regions = acces => { const ouvertes = []; const b = id => ({ ouvrir: () => ouvertes.push(id) });
  return { r: creerRegions({ etat: { zones: [], regions: { wadi: 1, rochers: 1 } }, AV: { quetes: {}, ramasses: [] }, enregistrer() {}, barrieres: { wadi: b('wadi'), rochers: b('rochers') }, ui: { debloquee() {} }, acces }), ouvertes }; };
const tables = () => ({ POINTS: {}, DESCRIPTIONS_LIEUX: {}, SPOTS: [], ajouterPhrases() {} });

test('Sans droits : les zones Premium sont fermées par les barrières, même si la progression locale dit « ouvert »', async () => {
  const a = await chargerPremium(tables(), { fetcher: fetcher(cat([]), []) }), { r, ouvertes } = regions(a);
  const f = r.fermees().map(x => x.id); for (const z of ['camp', 'dunes', 'wadi', 'rochers']) assert.ok(f.includes(z), z + ' fermée');
  assert.equal(r.ouverte('wadi'), false); assert.equal(ouvertes.length, 0, 'aucune barrière ouverte'); assert.match(r.explication('wadi'), /Premium/);
  assert.ok(!/prix|€|acheter/i.test(r.explication('wadi')), 'aucun prix montré à l\'enfant');
});
test('Avec droits et contenu reçu : les zones s\'ouvrent', async () => {
  const a = await chargerPremium(tables(), { fetcher: fetcher(cat(['camp', 'dunes', 'montagnes', 'wadi', 'rochers']), ['camp', 'dunes', 'montagnes', 'wadi', 'rochers']) }), { r, ouvertes } = regions(a);
  assert.equal(r.fermees().length, 0); assert.deepEqual(ouvertes.sort(), ['rochers', 'wadi']);
});
test('Droits sans contenu reçu (fichier absent) : la zone reste fermée', async () => {
  const a = await chargerPremium(tables(), { fetcher: fetcher(cat(['camp', 'wadi']), ['camp']) }), { r } = regions(a);
  assert.equal(a.zoneOuverte('camp'), true); assert.equal(a.zoneOuverte('wadi'), false); assert.ok(r.fermees().some(x => x.id === 'wadi'));
});
