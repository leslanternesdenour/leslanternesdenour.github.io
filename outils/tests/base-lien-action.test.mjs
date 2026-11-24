// Liens de vérification et de réinitialisation générés côté serveur (équivalent du SDK Firebase Admin : generateEmailVerificationLink / generatePasswordResetLink).
import test from 'node:test'; import assert from 'node:assert/strict';
import { baseFirestore } from '../../serveur/base-firestore.js';

const base = (fetcher) => baseFirestore({ projet: 'ldn-test', compte: {}, fetcher, jeton: async () => 'jeton-admin' });
const ok = oobLink => async () => new Response(JSON.stringify({ email: 'p@exemple.fr', oobLink }), { status: 200 });

test('lienAction : appelle accounts:sendOobCode avec returnOobLink (aucun e-mail Firebase n\'est envoyé) et renvoie le code d\'action', async () => {
  const appels = [];
  const fetcher = async (u, o) => { appels.push({ u, o }); return new Response(JSON.stringify({ email: 'p@exemple.fr', oobLink: 'https://x.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=CODE123&apiKey=k&lang=fr', oobCode: 'CODE123' }), { status: 200 }); };
  const r = await base(fetcher).lienAction('VERIFY_EMAIL', 'p@exemple.fr');
  assert.deepEqual(r, { oobCode: 'CODE123' });
  assert.equal(appels[0].u, 'https://identitytoolkit.googleapis.com/v1/projects/ldn-test/accounts:sendOobCode');
  assert.equal(appels[0].o.headers.Authorization, 'Bearer jeton-admin');
  const corps = JSON.parse(appels[0].o.body); assert.equal(corps.requestType, 'VERIFY_EMAIL'); assert.equal(corps.email, 'p@exemple.fr'); assert.equal(corps.returnOobLink, true);
});

test('lienAction : le code est lu dans le lien si la réponse ne le donne pas séparément ; la réinitialisation utilise PASSWORD_RESET', async () => {
  let type = null;
  const f = async (u, o) => { type = JSON.parse(o.body).requestType; return ok('https://x.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC%2Bdef&lang=fr')(); };
  assert.deepEqual(await base(f).lienAction('PASSWORD_RESET', 'p@exemple.fr'), { oobCode: 'ABC+def' }); assert.equal(type, 'PASSWORD_RESET');
});

test('lienAction : un type inconnu ou une adresse invalide sont refusés sans appel réseau', async () => {
  let n = 0; const b = base(async () => { n++; return ok('x')(); });
  await assert.rejects(() => b.lienAction('DELETE_ACCOUNT', 'p@exemple.fr'), /type-invalide/);
  await assert.rejects(() => b.lienAction('VERIFY_EMAIL', 'pas-une-adresse'), /adresse-invalide/); assert.equal(n, 0);
});

test('lienAction : compte introuvable = null (pas d\'erreur : on ne révèle rien) ; autre refus de Google = erreur neutre sans détail', async () => {
  const introuvable = async () => new Response(JSON.stringify({ error: { code: 400, message: 'EMAIL_NOT_FOUND' } }), { status: 400 });
  assert.equal(await base(introuvable).lienAction('PASSWORD_RESET', 'inconnu@exemple.fr'), null);
  const refus = async () => new Response(JSON.stringify({ error: { code: 403, message: 'detail-interne-secret' } }), { status: 403 });
  await assert.rejects(() => base(refus).lienAction('VERIFY_EMAIL', 'p@exemple.fr'), e => { assert.match(e.message, /^lien-action-refuse:403$/); assert.ok(!/secret/.test(e.message)); return true; });
});