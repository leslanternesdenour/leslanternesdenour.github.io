// Sauvegarde et restauration des COMPTES DE CONNEXION (Firebase Authentication) : API fictive, aucune vraie donnée, aucun réseau.
import test from 'node:test'; import assert from 'node:assert/strict';
import { trouverBibliotheque, nouvelleCle, dechiffrer } from '../sauvegarde/age-js.mjs';
import { exporterAuth, importerAuth, comparerAuth, corpsImport, verifierCible, resume, FORMAT_AUTH } from '../sauvegarde/auth.mjs';
import { preparerSauvegardeAuth, nomFichier } from '../sauvegarde/sauvegarder.mjs';

const options = trouverBibliotheque() ? {} : { skip: 'age-encryption non installé' };
const HASH = { algorithm: 'SCRYPT', signerKey: 'CLE-DE-SIGNATURE-FICTIVE', saltSeparator: 'SEPARATEUR-FICTIF', rounds: 8, memoryCost: 14 };
const comptes = n => Array.from({ length: n }, (_, i) => ({
  localId: 'uid' + String(i).padStart(3, '0'), email: `parent${i}@exemple.invalid`, emailVerified: i % 3 !== 0, createdAt: String(1763550000000 + i), lastLoginAt: String(1764000000000 + i),
  ...(i % 2 ? { passwordHash: 'HASH' + i, salt: 'SEL' + i, providerUserInfo: [{ providerId: 'password', rawId: `parent${i}@exemple.invalid`, email: `parent${i}@exemple.invalid` }] }
              : { providerUserInfo: [{ providerId: 'google.com', rawId: 'g' + i, email: `parent${i}@exemple.invalid` }] }),
  ...(i === 0 ? { customAttributes: '{"role":"creator"}' } : {}) }));

// Fausse API Identity Toolkit : pagination de 2 comptes, config de hachage, import.
function faux(utilisateurs, { importes = [], sansHash = false } = {}) {
  const appels = [];
  const f = async (url, o = {}) => {
    appels.push({ m: o.method || 'GET', url, corps: o.body ? JSON.parse(o.body) : null });
    const rep = j => ({ ok: true, status: 200, json: async () => j });
    if (url.includes('accounts:batchGet')) { const t = new URL(url).searchParams.get('nextPageToken'), max = Math.min(+new URL(url).searchParams.get('maxResults'), 2), d = t ? +t : 0;
      const page = utilisateurs.slice(d, d + max); return rep({ users: page, ...(d + max < utilisateurs.length ? { nextPageToken: String(d + max) } : {}) }); }
    if (url.includes('/config')) return rep({ signIn: sansHash ? {} : { hashConfig: HASH } });
    if (url.includes('accounts:batchCreate')) { importes.push(...JSON.parse(o.body).users); return rep({}); }
    throw new Error('appel inattendu ' + url);
  };
  f.appels = appels; return f;
}
const jeton = async () => 'jeton-fictif';

test('export : toutes les pages, configuration de hachage, résumé sans donnée personnelle', async () => {
  const f = faux(comptes(5)), e = await exporterAuth({ projet: 'p', fetcher: f, jeton });
  assert.equal(e.format, FORMAT_AUTH); assert.equal(e.utilisateurs.length, 5); assert.deepEqual(e.hashConfig, HASH);
  assert.deepEqual(e.compte, { total: 5, parFournisseur: { 'google.com': 3, password: 2 }, avecMotDePasse: 2, emailVerifie: 3, avecRole: 1, desactives: 0 });
  assert.ok(!JSON.stringify(e.compte).includes('@'), 'le résumé ne doit contenir aucune adresse');
  assert.ok(f.appels.every(a => a.m === 'GET'), 'l\'export est en lecture seule');
});

test('export refusé si la configuration de hachage manque (mots de passe non restaurables)', async () => {
  await assert.rejects(() => exporterAuth({ projet: 'p', fetcher: faux(comptes(2), { sansHash: true }), jeton }), /hachage/);
});

test('une erreur d\'API ne laisse fuiter aucune donnée dans le message', async () => {
  const f = async () => ({ ok: false, status: 403, json: async () => ({ secret: 'parent@exemple.invalid' }), text: async () => 'parent@exemple.invalid' });
  await assert.rejects(() => exporterAuth({ projet: 'p', fetcher: f, jeton }), e => /403/.test(e.message) && !/exemple/.test(e.message));
});

test('restauration : projet de production refusé, projet non test refusé sans confirmation, base non vide refusée', async () => {
  const e = await exporterAuth({ projet: 'p', fetcher: faux(comptes(3)), jeton });
  assert.throws(() => verifierCible('lanternes-de-nour', 'lanternes-de-nour'), /PRODUCTION/);
  assert.throws(() => verifierCible('autre-projet'), /projet de test/); assert.doesNotThrow(() => verifierCible('ldn-restauration-test'));
  await assert.rejects(() => importerAuth(e, { projet: 'lanternes-de-nour', fetcher: faux([]), jeton }), /PRODUCTION/);
  await assert.rejects(() => importerAuth(e, { projet: 'ldn-test', fetcher: faux(comptes(1)), jeton }), /non vide/);
});

test('restauration dans un projet de test vide : mêmes comptes, SCRYPT, sans écrasement', async () => {
  const src = comptes(5), e = await exporterAuth({ projet: 'p', fetcher: faux(src), jeton }), importes = [], f = faux([], { importes });
  assert.equal(await importerAuth(e, { projet: 'ldn-test', fetcher: f, jeton }), 5);
  const corps = f.appels.find(a => a.m === 'POST').corps;
  assert.equal(corps.allowOverwrite, false); assert.equal(corps.hashAlgorithm, 'SCRYPT'); assert.equal(corps.signerKey, HASH.signerKey); assert.equal(corps.saltSeparator, HASH.saltSeparator); assert.equal(corps.rounds, 8); assert.equal(corps.memoryCost, 14);
  const relu = await exporterAuth({ projet: 'ldn-test', fetcher: faux(importes), jeton });
  assert.equal(comparerAuth(e, relu).length, 0, 'restauration identique');
  assert.throws(() => corpsImport({ format: 'autre' }), /inconnu/);
});

test('comparaison : manquant, en trop, différent ; les dates de connexion sont ignorées', async () => {
  const a = { utilisateurs: comptes(3) }, b = { utilisateurs: comptes(3).map(u => ({ ...u, lastLoginAt: '1' })) };
  assert.equal(comparerAuth(a, b).length, 0);
  b.utilisateurs[1].emailVerified = !b.utilisateurs[1].emailVerified; b.utilisateurs.pop(); b.utilisateurs.push({ localId: 'nouveau' });
  assert.deepEqual(comparerAuth(a, b).map(d => d.type).sort(), ['different', 'en-trop', 'manquant']);
  assert.equal(resume([]).total, 0);
});

test('sauvegarde chiffrée des comptes : illisible sans clé, relue à l\'identique, mauvaise clé refusée', options, async () => {
  const { identite, recipient } = await nouvelleCle(), autre = await nouvelleCle();
  const s = await preparerSauvegardeAuth({ projet: 'p', fetcher: faux(comptes(6)), jeton }, recipient, { maintenant: Date.parse('2026-11-27T20:05:00Z') });
  assert.equal(s.nom, 'auth-2026-11-27-20-05.json.gz.age'); assert.equal(nomFichier(new Date('2026-11-27T20:05:00Z')), 'firestore-2026-11-27-20-05.json.gz.age');
  const brut = s.octets.toString('latin1'); for (const m of ['exemple', 'parent', 'SIGNATURE', 'uid00', 'SCRYPT']) assert.ok(!brut.includes(m), m + ' lisible dans le fichier chiffré');
  const relu = JSON.parse((await dechiffrer(s.octets, identite)).toString());
  assert.equal(relu.utilisateurs.length, 6); assert.deepEqual(relu.hashConfig, HASH);
  await assert.rejects(() => dechiffrer(s.octets, autre.identite));
});