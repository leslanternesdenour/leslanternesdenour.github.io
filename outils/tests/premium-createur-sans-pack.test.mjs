// Le compte Créateur ne reste pas bloqué parce que le pack Premium n'est pas (encore) importé :
// ses zones s'ouvrent (sans textes ni voix, aucun faux contenu) et le jeu sait qu'il manque le pack.
// Les comptes gratuits, visiteurs et Premium gardent EXACTEMENT les mêmes règles qu'avant : zone fermée sans contenu reçu.
import test from 'node:test'; import assert from 'node:assert/strict';
import { chargerPremium } from '../../voyage/js/premium.js';

const tables = () => ({ POINTS: { camp: { premium: 'camp', texte: '' } }, DESCRIPTIONS_LIEUX: { camp: '' }, SPOTS: [], ajouterPhrases: null });
const reponse = (statut, corps) => ({ ok: statut >= 200 && statut < 300, status: statut, json: async () => corps });
const ouvert = { niveau: 'premium', publie: true, ouvert: true }, ferme = { niveau: 'premium', publie: true, ouvert: false };
const catalogue = (etat, extra = {}) => ({ catalogue: { voyage: { camp: etat, dunes: etat, col: etat, montagnes: etat, wadi: etat, rochers: etat }, missions: {} }, vue: null, ...extra });
const serveur = (cat, packPresent = false) => async u => u === '/api/catalogue' ? reponse(200, cat) : (packPresent ? reponse(200, { format: 'ldn-pack-voyage-1', zone: u.split('/')[4], points: {} }) : reponse(404, { erreur: 'introuvable' }));

test('Créateur, pack absent : les zones s\'ouvrent et sont signalées « sans pack »', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ouvert, { createur: true })) });
  for (const z of ['camp', 'dunes', 'montagnes', 'wadi', 'rochers', 'col']) assert.equal(a.zoneOuverte(z), true, z);
  assert.deepEqual([...a.sansPack].sort(), ['camp', 'dunes', 'montagnes', 'rochers', 'wadi']);
  assert.equal(a.createur, true);
});

test('Créateur, pack présent : zones ouvertes, rien à signaler', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ouvert, { createur: true }), true) });
  assert.equal(a.zoneOuverte('camp'), true); assert.equal(a.sansPack.size, 0);
});

test('Compte gratuit / visiteur : zones fermées, aucune ouverture sans contenu', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ferme)) });
  for (const z of ['camp', 'dunes', 'col', 'montagnes', 'wadi', 'rochers']) assert.equal(a.zoneOuverte(z), false, z);
  assert.equal(a.sansPack.size, 0); assert.equal(a.createur, false);
});

test('Compte Premium, pack absent : la zone reste FERMÉE (jamais d\'ouverture vide pour un client)', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ouvert)) });
  assert.equal(a.zoneOuverte('camp'), false); assert.equal(a.sansPack.size, 0);
});

test('Créateur en vue simulée « gratuit » : le catalogue ne l\'annonce pas Créateur, zones fermées', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ferme, { vue: 'gratuit' })) });
  assert.equal(a.zoneOuverte('camp'), false); assert.equal(a.createur, false);
});

test('Créateur : si le catalogue dit « fermé » (zone non publiée), le Créateur n\'ouvre rien de plus', async () => {
  const a = await chargerPremium(tables(), { fetcher: serveur(catalogue(ferme, { createur: true })) });
  assert.equal(a.zoneOuverte('camp'), false);
});
