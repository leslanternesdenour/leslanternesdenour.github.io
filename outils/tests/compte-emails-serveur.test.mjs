// Client des comptes : les e-mails (vérification, mot de passe oublié) passent d'abord par NOTRE serveur ; repli sur l'envoi Firebase tant que le prestataire n'est pas configuré. Page de lien sur notre domaine.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs';

const lire = f => fs.readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const client = () => lire('compte/client.js');

test('renvoi de la vérification : appel de notre serveur d\'abord, repli sur Firebase seulement si le prestataire n\'est pas configuré (503 email-non-configure)', () => {
  const c = client(); const i = c.indexOf('async renvoyerVerification()'); assert.ok(i > 0);
  const f = c.slice(i, c.indexOf('\n', c.indexOf('async quitter()', i)));
  assert.match(f, /'\/api\/email\/verification'/); assert.match(f, /email-non-configure/); assert.match(f, /sendEmailVerification/);
});

test('mot de passe oublié : appel de notre serveur d\'abord (réponse neutre), repli sur Firebase seulement si le prestataire n\'est pas configuré', () => {
  const c = client(); const i = c.indexOf('async motDePasseOublie('); assert.ok(i > 0);
  const f = c.slice(i, c.indexOf('async renvoyerVerification()', i));
  assert.match(f, /'\/api\/email\/reinitialisation'/); assert.match(f, /email-non-configure/); assert.match(f, /sendPasswordResetEmail/);
});

test('inscription : Firebase n\'envoie plus d\'e-mail à la création du compte ; le premier envoi est demandé à notre serveur une fois la session ouverte', () => {
  const c = client(); const i = c.indexOf('async inscrire('); const f = c.slice(i, c.indexOf('async connecter(', i));
  assert.ok(!/sendEmailVerification/.test(f), 'plus d\'envoi Firebase à l\'inscription');
  assert.match(f, /ldn_verif_a_envoyer/);
});

test('les erreurs de notre serveur transmettent le délai d\'attente et ont des messages clairs en français', () => {
  const c = client();
  assert.match(c, /e\.attente = j\.attente/);
  for (const k of ['trop-tot', 'limite-journaliere', 'envoi-impossible', 'adresse-invalide', 'auth/invalid-action-code', 'auth/expired-action-code']) assert.ok(c.includes("'" + k + "'"), k);
});

test('espace famille : le premier e-mail est demandé après l\'inscription, et les attentes imposées par le serveur sont affichées en français', () => {
  const h = lire('compte/index.html');
  assert.match(h, /async function premierEnvoi\(\)/); assert.match(h, /ldn_verif_a_envoyer/); assert.match(h, /e\.raison === 'trop-tot'/); assert.match(h, /e\.attente/);
  assert.match(h, /function surveillerVerification\(\) \{ premierEnvoi\(\);/);
});

test('page du lien (/compte/action/) : vérification de l\'adresse et nouveau mot de passe, sur notre domaine, en français, avec messages d\'erreur clairs', () => {
  const h = lire('compte/action/index.html');
  assert.match(h, /<html lang="fr"/); assert.match(h, /name="robots" content="noindex/);
  assert.match(h, /verifyEmail/); assert.match(h, /resetPassword/);
  assert.match(h, /appliquerCodeVerification\(/); assert.match(h, /verifierCodeReinit\(/); assert.match(h, /confirmerReinit\(/);
  assert.match(h, /Ce lien n'est plus valable/); assert.match(h, /Votre adresse e-mail est vérifiée/); assert.match(h, /Votre mot de passe a été modifié/);
  assert.match(h, /\/compte\/\?verifie=1/); assert.ok(!/apiKey|sk_|secret/i.test(h), 'aucun secret dans la page');
});

test('client : les trois actions de lien existent (Firebase réel ou simulation locale) et n\'envoient rien à un tiers', () => {
  const c = client();
  for (const n of ['appliquerCodeVerification', 'verifierCodeReinit', 'confirmerReinit']) assert.match(c, new RegExp('async ' + n + '\\('));
  assert.match(c, /applyActionCode\(/); assert.match(c, /verifyPasswordResetCode\(/); assert.match(c, /confirmPasswordReset\(/);
});