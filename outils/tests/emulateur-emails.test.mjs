// Simulation locale : les e-mails personnalisés (vérification, réinitialisation) sont « envoyés » dans une boîte simulée, avec de vrais liens d'action sur notre page.
import test from 'node:test'; import assert from 'node:assert/strict';
import { creerEmulateur } from '../emulateur/emulateur.mjs';

async function monde() {
  const E = await creerEmulateur({ mdpCreateur: 'x'.repeat(12) });
  const appel = (m, chemin, corps, cookie) => E.traiter(new Request('http://localhost:8788' + chemin, { method: m, headers: { 'X-LDN': '1', Origin: 'http://localhost:8788', ...(cookie ? { Cookie: cookie } : {}) }, body: corps ? JSON.stringify(corps) : undefined }));
  const inscrire = async (email, mdp = 'Motdepasse-123') => { const i = await (await appel('POST', '/api/_emulateur/inscription', { email, mdp })).json(); const s = await appel('POST', '/api/session', { idToken: i.idToken, consentements: { parent: true, cgu: true, confidentialite: true } }); return s.headers.get('Set-Cookie').split(';')[0]; };
  const boite = async () => (await (await appel('POST', '/api/_emulateur/boite', {})).json()).messages;
  const code = m => /oobCode=(emul-[a-f0-9]+)/.exec(m.texte)[1];
  return { appel, inscrire, boite, code };
}

test('simulation locale : la vérification de l\'adresse passe par notre serveur, un lien apparaît dans la boîte simulée', async () => {
  const { appel, inscrire, boite } = await monde(); const cookie = await inscrire('parent@local.test');
  assert.equal((await appel('POST', '/api/email/verification', null, cookie)).status, 200);
  const b = await boite();
  assert.equal(b.length, 1); assert.equal(b[0].a, 'parent@local.test'); assert.match(b[0].texte, /\/compte\/action\/\?mode=verifyEmail&oobCode=emul-/);
});

test('simulation locale : le lien reçu vérifie vraiment l\'adresse (usage unique), puis la session suivante débloque le jeu et envoie la confirmation', async () => {
  const { appel, inscrire, boite, code } = await monde(); const cookie = await inscrire('parent2@local.test');
  assert.equal((await (await appel('GET', '/api/enfants', null, cookie)).json()).erreur, 'email-non-verifie');
  await appel('POST', '/api/email/verification', null, cookie); const c = code((await boite())[0]);
  assert.equal((await appel('POST', '/api/_emulateur/action', { mode: 'verifyEmail', oobCode: c })).status, 200);
  assert.equal((await appel('POST', '/api/_emulateur/action', { mode: 'verifyEmail', oobCode: c })).status, 400, 'le code ne sert qu\'une fois');
  const jeton = await (await appel('POST', '/api/_emulateur/jeton', {}, cookie)).json();
  const ses = await appel('POST', '/api/session', { idToken: jeton.idToken }); const cookie2 = ses.headers.get('Set-Cookie').split(';')[0];
  assert.equal((await appel('GET', '/api/enfants', null, cookie2)).status, 200);
  const b = await boite(); assert.equal(b.length, 2); assert.match(b[1].objet, /vérifiée/);
});

test('simulation locale : mot de passe oublié par notre e-mail, nouveau mot de passe par le lien, ancien mot de passe refusé', async () => {
  const { appel, inscrire, boite, code } = await monde(); await inscrire('parent3@local.test', 'AncienMdp-123');
  assert.equal((await appel('POST', '/api/email/reinitialisation', { email: 'parent3@local.test' })).status, 200);
  assert.equal((await appel('POST', '/api/email/reinitialisation', { email: 'inconnu@local.test' })).status, 200);
  const b = await boite(); assert.equal(b.length, 1, 'rien pour l\'inconnu'); assert.match(b[0].objet, /Réinitialisez/);
  const c = code(b[0]);
  const v = await (await appel('POST', '/api/_emulateur/action', { mode: 'resetPassword', oobCode: c, verifierSeulement: true })).json(); assert.equal(v.email, 'parent3@local.test');
  assert.equal((await appel('POST', '/api/_emulateur/action', { mode: 'resetPassword', oobCode: c, mdp: 'NouveauMdp-456' })).status, 200);
  assert.equal((await appel('POST', '/api/_emulateur/connexion', { email: 'parent3@local.test', mdp: 'AncienMdp-123' })).status, 401);
  assert.equal((await appel('POST', '/api/_emulateur/connexion', { email: 'parent3@local.test', mdp: 'NouveauMdp-456' })).status, 200);
  assert.equal((await appel('POST', '/api/_emulateur/action', { mode: 'resetPassword', oobCode: c, mdp: 'Autre-789' })).status, 400, 'code à usage unique');
});