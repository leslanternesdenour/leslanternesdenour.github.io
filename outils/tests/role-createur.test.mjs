import test from 'node:test'; import assert from 'node:assert/strict';
import { poserRoleCreateur } from '../admin/poser-role-createur.mjs';
const appels = [], compte = { project_id: 'ldn-test' };
const fetcher = (users) => async (u, o) => { appels.push({ u, b: JSON.parse(o.body) }); return new Response(JSON.stringify(u.endsWith(':lookup') ? { users } : {}), { status: 200 }); };
test('pose le rôle creator sur le bon compte et renvoie son UID', async () => {
  appels.length = 0; const uid = await poserRoleCreateur({ compte, email: 'a@b.fr', fetcher: fetcher([{ localId: 'UID1', emailVerified: true }]), jeton: async () => 'j' });
  assert.equal(uid, 'UID1'); assert.equal(appels[1].u, 'https://identitytoolkit.googleapis.com/v1/projects/ldn-test/accounts:update');
  assert.deepEqual(JSON.parse(appels[1].b.customAttributes), { role: 'creator' }); assert.equal(appels[1].b.localId, 'UID1');
});
test('refuse un compte absent ou non vérifié, sans rien écrire', async () => {
  for (const users of [[], [{ localId: 'U', emailVerified: false }]]) { appels.length = 0; await assert.rejects(poserRoleCreateur({ compte, email: 'a@b.fr', fetcher: fetcher(users), jeton: async () => 'j' })); assert.equal(appels.length, 1); }
});
