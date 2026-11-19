// Module Firestore REST : conversions, requêtes envoyées, authentification par compte de service (réponses de Google simulées).
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseFirestore, versFs, depuisFs, jetonGoogle } from '../../serveur/base-firestore.js';

test('conversion aller-retour des valeurs', () => {
  const v = { a: 1, b: 1.5, c: 'x', d: true, e: null, f: [1, 'y', { g: 2 }], h: { i: { j: 'k' } } };
  assert.deepEqual(depuisFs(versFs(v)), v);
  assert.deepEqual(versFs(12), { integerValue: '12' });
});

test('jeton Google : JWT signé RS256 envoyé, réponse mise en cache', async () => {
  const k = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const pem = '-----BEGIN PRIVATE KEY-----\n' + Buffer.from(await crypto.subtle.exportKey('pkcs8', k.privateKey)).toString('base64') + '\n-----END PRIVATE KEY-----\n';
  let appels = 0, assertion;
  const fetcher = async (u, o) => { appels++; assertion = new URLSearchParams(o.body).get('assertion'); return new Response(JSON.stringify({ access_token: 'ya29.test' })); };
  const j = jetonGoogle({ client_email: 'sauvegarde@ldn.iam.gserviceaccount.com', private_key: pem }, { fetcher });
  assert.equal(await j(1e12), 'ya29.test'); assert.equal(await j(1e12 + 1000), 'ya29.test'); assert.equal(appels, 1);
  const [t, c, s] = assertion.split('.');
  const charge = JSON.parse(Buffer.from(c, 'base64url'));
  assert.equal(charge.aud, 'https://oauth2.googleapis.com/token'); assert.match(charge.scope, /datastore/);
  assert.ok(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', k.publicKey, Buffer.from(s, 'base64url'), new TextEncoder().encode(t + '.' + c)), 'signature valide');
});

test('requêtes Firestore envoyées (lecture, écriture, mise à jour partielle, recherche, pagination, création exclusive)', async () => {
  const vus = [];
  const fetcher = async (u, o = {}) => {
    vus.push({ u, m: o.method || 'GET', b: o.body ? JSON.parse(o.body) : null });
    if (u.endsWith('/familles/absent')) return new Response('{}', { status: 404 });
    if (u.includes(':runQuery')) return new Response(JSON.stringify([{ document: { name: 'projects/p/databases/(default)/documents/familles/u1', fields: { email: { stringValue: 'a@b.fr' } } } }, { document: { name: 'projects/p/databases/(default)/documents/familles/u2', fields: {} } }]));
    if (u.includes('currentDocument.exists=false')) return new Response('{}', { status: 409 });
    return new Response(JSON.stringify({ name: 'projects/p/databases/(default)/documents/familles/u1', fields: { email: { stringValue: 'a@b.fr' }, n: { integerValue: '3' } } }));
  };
  const b = baseFirestore({ projet: 'p', compte: {}, fetcher, jeton: async () => 'jeton' });
  assert.deepEqual(await b.lire('familles', 'u1'), { email: 'a@b.fr', n: 3 });
  assert.equal(await b.lire('familles', 'absent'), null);
  await b.maj('familles', 'u1', { profilActif: 'e1' });
  assert.match(vus.at(-1).u, /currentDocument\.exists=true&updateMask\.fieldPaths=%60profilActif%60/); assert.equal(vus.at(-1).m, 'PATCH');
  assert.deepEqual(await b.chercher('familles', 'email', 'a@b.fr'), [{ id: 'u1', data: { email: 'a@b.fr' } }, { id: 'u2', data: {} }]);
  assert.equal(vus.at(-1).b.structuredQuery.where.fieldFilter.op, 'EQUAL');
  const p = await b.lister('familles/u1/enfants', { limite: 1 });
  assert.equal(p.docs.length, 1); assert.equal(p.suite, 'u1');
  assert.match(vus.at(-1).u, /documents\/familles\/u1:runQuery$/, 'sous-collection interrogée depuis son parent');
  assert.equal(await b.creerSiAbsent('invitations', 'x', { a: 1 }), false);
  assert.ok(vus.every(v => v.u.startsWith('https://firestore.googleapis.com/v1/projects/p/databases/(default)/documents')));
});
