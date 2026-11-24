// Simulation locale : le parcours de paiement factice reproduit la préproduction SANS webhook (retour du paiement → synchronisation par le serveur).
import test from 'node:test'; import assert from 'node:assert/strict';
import { creerEmulateur } from '../emulateur/emulateur.mjs';

async function monde() {
  const E = await creerEmulateur({ mdpCreateur: 'x'.repeat(12) });
  const appel = (m, chemin, corps, cookie) => E.traiter(new Request('http://localhost:8788' + chemin, { method: m, headers: { 'X-LDN': '1', Origin: 'http://localhost:8788', ...(cookie ? { Cookie: cookie } : {}) }, body: corps ? JSON.stringify(corps) : undefined }));
  const json = async r => r.json();
  // compte parent vérifié, connecté
  const inscrire = async email => {
    const i = await json(await appel('POST', '/api/_emulateur/inscription', { email, mdp: 'Motdepasse-123' }));
    let s = await appel('POST', '/api/session', { idToken: i.idToken, consentements: { parent: true, cgu: true, confidentialite: true } }); let cookie = s.headers.get('Set-Cookie').split(';')[0];
    await appel('POST', '/api/_emulateur/verifier', {}, cookie);
    const jeton = await json(await appel('POST', '/api/_emulateur/jeton', {}, cookie));
    s = await appel('POST', '/api/session', { idToken: jeton.idToken }, cookie); return s.headers.get('Set-Cookie').split(';')[0];
  };
  return { appel, json, inscrire };
}

test('sans webhook, le retour du paiement factice active le Premium par la synchronisation du serveur ; une session non payée n\'active rien', async () => {
  process.env.LDN_EMULATEUR_SANS_WEBHOOK = '1';
  try {
    const { appel, json, inscrire } = await monde(); const cookie = await inscrire('parent-abo@local.test');
    const cs = await json(await appel('POST', '/api/paiement/session', { formule: 'premium_mensuel', consentements: { cgv: true, executionImmediate: true } }, cookie));
    const session = /session=(cs_test_emul_\d+)/.exec(cs.url)[1];
    const avant = await appel('POST', '/api/abonnement/synchroniser', { sessionId: session }, cookie);
    assert.equal(avant.status, 409, 'session ouverte, pas encore payée');
    const paye = await json(await appel('POST', '/api/_emulateur/paiement', { session, action: 'payer' }, cookie));
    assert.match(paye.redirection, new RegExp('/compte/\\?paiement=ok&session_id=' + session + '$'), 'comme Stripe : l\'identifiant de la session remplace le repère dans le lien de retour');
    assert.equal((await json(await appel('GET', '/api/moi', null, cookie))).statut, 'gratuit', 'sans webhook, rien n\'est encore activé');
    const sync = await appel('POST', '/api/abonnement/synchroniser', { sessionId: session }, cookie);
    assert.equal(sync.status, 200);
    const moi = await json(await appel('GET', '/api/moi', null, cookie)); assert.equal(moi.statut, 'abonne'); assert.equal(moi.niveau, 'premium');
  } finally { delete process.env.LDN_EMULATEUR_SANS_WEBHOOK; }
});

test('simulation d\'un échec de paiement au renouvellement : l\'accès s\'arrête et l\'Espace famille propose de régulariser', async () => {
  process.env.LDN_EMULATEUR_SANS_WEBHOOK = '1';
  try {
    const { appel, json, inscrire } = await monde(); const cookie = await inscrire('parent-echec@local.test');
    const cs = await json(await appel('POST', '/api/paiement/session', { formule: 'famille_annuel', consentements: { cgv: true, executionImmediate: true } }, cookie));
    const session = /session=(cs_test_emul_\d+)/.exec(cs.url)[1];
    await appel('POST', '/api/_emulateur/paiement', { session, action: 'payer' }, cookie); await appel('POST', '/api/abonnement/synchroniser', { sessionId: session }, cookie);
    assert.equal((await json(await appel('GET', '/api/moi', null, cookie))).niveau, 'famille');
    assert.equal((await appel('POST', '/api/_emulateur/echec-paiement', {}, cookie)).status, 200);
    await appel('POST', '/api/abonnement/synchroniser', {}, cookie);
    const moi = await json(await appel('GET', '/api/moi', null, cookie)); assert.equal(moi.statut, 'gratuit'); assert.equal(moi.abonnement.aRegulariser, true);
  } finally { delete process.env.LDN_EMULATEUR_SANS_WEBHOOK; }
});
