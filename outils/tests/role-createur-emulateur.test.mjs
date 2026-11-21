// Script du rôle Créateur contre l'émulateur Auth officiel (mêmes routes identitytoolkit que Firebase réel). Lancé par outils/tests/auth-emulateur.sh.
import test from 'node:test'; import assert from 'node:assert/strict';
import { poserRoleCreateur } from '../admin/poser-role-createur.mjs';
const H = process.env.FIREBASE_AUTH_EMULATOR_HOST || '127.0.0.1:9099', P = 'demo-ldn';
const fetcher = async (u, o) => { assert.ok(u.startsWith('https://identitytoolkit.googleapis.com/'), 'le script vise bien Google'); return fetch(u.replace('https://identitytoolkit.googleapis.com', 'http://' + H + '/identitytoolkit.googleapis.com'), o); };
const api = (c, b, k = 'fake-key') => fetch(`http://${H}/identitytoolkit.googleapis.com/v1/${c}?key=${k}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());
const inscrire = (email) => api('accounts:signUp', { email, password: 'motdepasse-long-1', returnSecureToken: true });
const verifier = async (email) => { const { oobCodes } = await (await fetch(`http://${H}/emulator/v1/projects/${P}/oobCodes`)).json(); const c = oobCodes.filter(x => x.email === email && x.requestType === 'VERIFY_EMAIL').at(-1); await fetch(c.oobLink.replace(/^http:\/\/[^/]+/, 'http://' + H)); };
const claims = (idToken) => JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url'));
const compte = { project_id: P }, jeton = async () => 'owner';

test('compte vérifié : rôle creator posé, UID renvoyé, présent dans le jeton après reconnexion', async () => {
  const s = await inscrire('createur@exemple.fr'); await api('accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: s.idToken }); await verifier('createur@exemple.fr');
  const uid = await poserRoleCreateur({ compte, email: 'createur@exemple.fr', fetcher, jeton });
  assert.equal(uid, s.localId);
  const c = await api('accounts:signInWithPassword', { email: 'createur@exemple.fr', password: 'motdepasse-long-1', returnSecureToken: true });
  assert.equal(claims(c.idToken).role, 'creator');
});
test('compte non vérifié : refusé, aucun rôle posé', async () => {
  const s = await inscrire('nonverifie@exemple.fr');
  await assert.rejects(poserRoleCreateur({ compte, email: 'nonverifie@exemple.fr', fetcher, jeton }), /pas vérifiée/);
  const c = await api('accounts:signInWithPassword', { email: 'nonverifie@exemple.fr', password: 'motdepasse-long-1', returnSecureToken: true });
  assert.equal(claims(c.idToken).role, undefined); assert.equal(c.localId, s.localId);
});
test('compte absent : refusé', async () => { await assert.rejects(poserRoleCreateur({ compte, email: 'absent@exemple.fr', fetcher, jeton }), /Aucun compte/); });
test('un autre compte vérifié n\'hérite pas du rôle', async () => {
  const s = await inscrire('simple@exemple.fr'); await api('accounts:sendOobCode', { requestType: 'VERIFY_EMAIL', idToken: s.idToken }); await verifier('simple@exemple.fr');
  const c = await api('accounts:signInWithPassword', { email: 'simple@exemple.fr', password: 'motdepasse-long-1', returnSecureToken: true });
  assert.equal(claims(c.idToken).role, undefined);
});
