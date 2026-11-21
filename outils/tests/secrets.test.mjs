// Protection des secrets : une configuration invalide ne produit ni exception, ni fragment de secret dans la réponse ou les journaux.
import test from 'node:test'; import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/[[route]].js';
const SECRET = 'SECRETXYZ-fragment-sensible-0123456789';
const requete = () => new Request('https://x.pages.dev/api/me');
async function appeler(env) {
  const journal = []; const orig = console.error; console.error = (...a) => journal.push(a.map(String).join(' '));
  try { const r = await onRequest({ request: requete(), env }); return { statut: r.status, corps: await r.text(), journal: journal.join('\n') }; } finally { console.error = orig; }
}
const base = { SESSION_SECRET: 'x'.repeat(40), FIREBASE_PROJET: 'ldn-test' };
test('secrets absents : 503 comptes-non-configures', async () => { const r = await appeler({}); assert.equal(r.statut, 503); assert.match(r.corps, /comptes-non-configures/); });
test('compte de service mal collé : 503 neutre, aucun fragment du secret nulle part', async () => {
  const r = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: '{"private_key":"' + SECRET });
  assert.equal(r.statut, 503); assert.match(r.corps, /configuration-invalide/);
  assert.ok(!r.corps.includes('SECRETXYZ') && !r.journal.includes('SECRETXYZ') && !r.journal.includes('private_key'));
});
test('clé Stripe réelle refusée : 503 neutre, clé jamais répétée', async () => {
  const r = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: JSON.stringify({ project_id: 'p', client_email: 'a@b', private_key: 'k' }), STRIPE_CLE_SECRETE: 'sk_live_' + SECRET });
  assert.equal(r.statut, 503); assert.ok(!(r.corps + r.journal).includes('SECRETXYZ'));
});
