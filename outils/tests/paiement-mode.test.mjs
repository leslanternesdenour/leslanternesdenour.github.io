// Mode des paiements annoncé aux pages (tarifs, compte) : « ferme », « test » ou « reel » — jamais une valeur de clé. node --test outils/tests/paiement-mode.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { traiter } from '../../serveur/api.js';
import { creerBase } from './base-testee.mjs';
import { clientStripe } from '../../serveur/stripe.js';

const base = creerBase();
const mode = async envStripe => {
  const env = { SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', FIREBASE_PROJET: 'ldn-test', ...envStripe };
  const r = await traiter(new Request('https://preprod.exemple/api/paiement/mode'), { env, base, maintenant: Date.UTC(2026, 10, 23), auth: {}, stockage: {}, stripe: clientStripe(env) });
  return { statut: r.status, corps: await r.text() };
};

test('GET /api/paiement/mode : « test » avec une clé de test, sans renvoyer aucune clé', async () => {
  const r = await mode({ STRIPE_CLE_SECRETE: 'sk_test_local' });
  assert.deepEqual(JSON.parse(r.corps), { mode: 'test' });
  assert.doesNotMatch(r.corps, /sk_|pk_/);
});

test('GET /api/paiement/mode : « reel » seulement avec une clé réelle ET STRIPE_MODE_REEL=autorise', async () => {
  const r = await mode({ STRIPE_CLE_SECRETE: 'sk_live_fausse_valeur_de_test', STRIPE_MODE_REEL: 'autorise' });
  assert.deepEqual(JSON.parse(r.corps), { mode: 'reel' });
  assert.doesNotMatch(r.corps, /sk_|pk_/);
});

test('GET /api/paiement/mode : une clé réelle sans autorisation explicite reste refusée par le code', async () => {
  await assert.rejects(() => mode({ STRIPE_CLE_SECRETE: 'sk_live_fausse_valeur_de_test' }), /RÉELLE refusée/);
});

test('GET /api/paiement/mode : « ferme » sans clé Stripe', async () => {
  const r = await mode({});
  assert.equal(r.statut, 200);
  assert.deepEqual(JSON.parse(r.corps), { mode: 'ferme' });
});
