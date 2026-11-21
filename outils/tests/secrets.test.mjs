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

import { onRequestGet, etatConfiguration } from '../../functions/api/sante.js';
const lire = async (env) => JSON.parse(await (await onRequestGet({ env })).text());
test('/api/sante : état OUI/NON en préproduction, jamais une valeur ; rien en production', async () => {
  const plein = { ENVIRONNEMENT: 'preproduction', SESSION_SECRET: 'S'.repeat(40) + 'SECRETXYZ', FIREBASE_PROJET: 'ldn', CREATOR_UID: 'UIDXYZ-123', STRIPE_CLE_SECRETE: 'sk_test_SECRETXYZ', STRIPE_SECRET_WEBHOOK: 'whsec_SECRETXYZ',
    FIREBASE_COMPTE_SERVICE: JSON.stringify({ type: 'service_account', project_id: 'ldn', client_email: 'a@b.iam', private_key: 'SECRETXYZ' }) };
  const j = await lire(plein); const brut = JSON.stringify(j);
  assert.deepEqual(j.configuration, { sessions: true, sessionsEtat: 'ok', firebaseProjet: true, firebaseCompteDeService: true, createurDesigne: true, stripe: 'test', stripeWebhook: true, stockagePremium: 'non' });
  assert.ok(!brut.includes('SECRETXYZ') && !brut.includes('UIDXYZ') && !brut.includes('sk_test'), 'aucune valeur dans la réponse');
  assert.deepEqual((await lire({ ENVIRONNEMENT: 'preproduction' })).configuration, { sessions: false, sessionsEtat: 'absent', firebaseProjet: false, firebaseCompteDeService: false, createurDesigne: false, stripe: 'non', stripeWebhook: false, stockagePremium: 'non' });
  assert.equal(etatConfiguration({ STRIPE_CLE_SECRETE: 'sk_live_x', SESSION_SECRET: 'court' }).stripe, 'cle-invalide');
  assert.equal(etatConfiguration({ FIREBASE_COMPTE_SERVICE: '{"private_key":"x' }).firebaseCompteDeService, false);
  assert.equal((await lire({ ENVIRONNEMENT: 'production', ...plein, ENVIRONNEMENT: 'production' })).configuration, undefined, 'rien en production');
});

test('/api/sante : distingue secret absent, trop court, valide — sans révéler la valeur ni la longueur', async () => {
  for (const [v, attendu] of [[undefined, 'absent'], ['', 'absent'], ['x'.repeat(31), 'trop-court'], ['x'.repeat(32), 'ok'], ['x'.repeat(48), 'ok']]) {
    const j = await lire({ ENVIRONNEMENT: 'preproduction', SESSION_SECRET: v }); assert.equal(j.configuration.sessionsEtat, attendu, String(v && v.length)); assert.equal(j.configuration.sessions, attendu === 'ok');
    assert.ok(!JSON.stringify(j).includes('xxxxxxxx'), 'aucune valeur');
  }
});
