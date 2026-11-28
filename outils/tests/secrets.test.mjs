// Protection des secrets : une configuration invalide ne produit ni exception, ni fragment de secret dans la réponse ou les journaux.
import test from 'node:test'; import assert from 'node:assert/strict';
import { onRequest } from '../../functions/api/[[route]].js';
const SECRET = 'SECRETXYZ-fragment-sensible-0123456789';
const requete = chemin => new Request('https://x.pages.dev' + (chemin || '/api/me'));
async function appeler(env, chemin) {
  const journal = []; const orig = console.error; console.error = (...a) => journal.push(a.map(String).join(' '));
  try { const r = await onRequest({ request: requete(chemin), env }); return { statut: r.status, corps: await r.text(), journal: journal.join('\n') }; } finally { console.error = orig; }
}
const base = { SESSION_SECRET: 'x'.repeat(40), FIREBASE_PROJET: 'ldn-test' };
test('secrets absents : 503 comptes-non-configures', async () => { const r = await appeler({}); assert.equal(r.statut, 503); assert.match(r.corps, /comptes-non-configures/); });
test('compte de service mal collé : 503 neutre, aucun fragment du secret nulle part', async () => {
  const r = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: '{"private_key":"' + SECRET });
  assert.equal(r.statut, 503); assert.match(r.corps, /configuration-invalide/);
  assert.ok(!r.corps.includes('SECRETXYZ') && !r.journal.includes('SECRETXYZ') && !r.journal.includes('private_key'));
});
test('clé Stripe refusée (réelle hors production, test en production, format inconnu) : SEULS les paiements sont fermés, le site répond, clé jamais répétée', async () => {
  const compte = JSON.stringify({ project_id: 'p', client_email: 'a@b', private_key: 'k' });
  for (const stripe of [{ STRIPE_CLE_SECRETE: 'sk_live_' + SECRET }, { STRIPE_CLE_SECRETE: 'sk_test_' + SECRET, ENVIRONNEMENT: 'production' }, { STRIPE_CLE_SECRETE: 'cle-' + SECRET }]) {
    const r = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: compte, ...stripe });
    assert.notEqual(r.statut, 503, 'le site est toujours servi'); assert.ok(!(r.corps + r.journal).includes('SECRETXYZ'));
    const mode = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: compte, ...stripe }, '/api/paiement/mode');
    assert.equal(mode.statut, 200); assert.deepEqual(JSON.parse(mode.corps), { mode: 'indisponible' }); assert.ok(!(mode.corps + mode.journal).includes('SECRETXYZ'));
    assert.match(mode.journal, /Paiements désactivés/);
    const moi = await appeler({ ...base, FIREBASE_COMPTE_SERVICE: compte, ...stripe }, '/api/moi'); assert.equal(moi.statut, 200); assert.deepEqual(JSON.parse(moi.corps), { connecte: false, statut: 'visiteur' });
  }
});

import { onRequestGet, etatConfiguration } from '../../functions/api/sante.js';
const lire = async (env) => JSON.parse(await (await onRequestGet({ env })).text());
test('/api/sante : état OUI/NON en préproduction, jamais une valeur ; rien en production', async () => {
  const plein = { ENVIRONNEMENT: 'preproduction', SESSION_SECRET: 'S'.repeat(40) + 'SECRETXYZ', FIREBASE_PROJET: 'ldn', CREATOR_UID: 'UIDXYZ-123', STRIPE_CLE_SECRETE: 'sk_test_SECRETXYZ', STRIPE_SECRET_WEBHOOK: 'whsec_SECRETXYZ',
    FIREBASE_COMPTE_SERVICE: JSON.stringify({ type: 'service_account', project_id: 'ldn', client_email: 'a@b.iam', private_key: 'SECRETXYZ' }) };
  const j = await lire(plein); const brut = JSON.stringify(j);
  assert.deepEqual(j.configuration, { sessions: true, sessionsEtat: 'ok', firebaseProjet: true, firebaseCompteDeService: true, cleRevoquee: false, createurDesigne: true, stripe: 'test', stripeWebhook: true, stockagePremium: 'non', courriel: 'non' });
  assert.ok(!brut.includes('SECRETXYZ') && !brut.includes('UIDXYZ') && !brut.includes('sk_test'), 'aucune valeur dans la réponse');
  assert.deepEqual((await lire({ ENVIRONNEMENT: 'preproduction' })).configuration, { sessions: false, sessionsEtat: 'absent', firebaseProjet: false, firebaseCompteDeService: false, cleRevoquee: false, createurDesigne: false, stripe: 'non', stripeWebhook: false, stockagePremium: 'non', courriel: 'non' });
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

test('clé de compte de service RÉVOQUÉE : refusée par le site (503 neutre) et signalée, même si le JSON est valide', async () => {
  const revoquee = JSON.stringify({ type: 'service_account', project_id: 'p', client_email: 'a@b', private_key: 'k', private_key_id: 'bfff0d72daaf01ff0000000000000000000000' });
  const r = await appeler({ SESSION_SECRET: 'x'.repeat(40), FIREBASE_PROJET: 'p', FIREBASE_COMPTE_SERVICE: revoquee });
  assert.equal(r.statut, 503); assert.match(r.corps, /configuration-invalide/); assert.ok(!(r.corps + r.journal).includes('bfff0d72'));
  const j = await lire({ ENVIRONNEMENT: 'preproduction', FIREBASE_COMPTE_SERVICE: revoquee }); assert.equal(j.configuration.firebaseCompteDeService, false); assert.equal(j.configuration.cleRevoquee, true);
  const autre = JSON.stringify({ type: 'service_account', project_id: 'p', client_email: 'a@b', private_key: 'k', private_key_id: '1234abcd5678' });
  assert.equal((await lire({ ENVIRONNEMENT: 'preproduction', FIREBASE_COMPTE_SERVICE: autre })).configuration.firebaseCompteDeService, true, 'une autre clé reste acceptée');
});
