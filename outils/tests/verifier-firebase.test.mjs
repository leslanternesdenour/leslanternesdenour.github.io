// Logique de l'outil de vérification Firebase, contre une fausse API (les vraies réponses de Google ne sont observables qu'avec la vraie clé).
import test from 'node:test'; import assert from 'node:assert/strict';
import { verifier } from '../admin/verifier-firebase.mjs';
const jwt = (o) => 'x.' + Buffer.from(JSON.stringify(o)).toString('base64url') + '.y';
function fausseApi({ politique7 = false, domaines = ['localhost', 'lanternes-de-nour.pages.dev'], google = true, apple = false, anonyme = false, emailActif = true } = {}) {
  const comptes = new Map(), supprimes = [];
  const f = async (url, o) => {
    const chemin = url.split('/v1/')[1].split('?')[0], b = o.body ? JSON.parse(o.body) : {}, rep = (s, j) => new Response(JSON.stringify(j), { status: s });
    if (chemin === 'projects') return rep(200, { projectId: '447068927790', authorizedDomains: domaines });
    if (chemin === 'accounts:createAuthUri') return (b.providerId === 'google.com' ? google : apple) ? rep(200, { authUri: 'https://accounts.google.com/x' }) : rep(400, { error: { message: 'OPERATION_NOT_ALLOWED' } });
    if (chemin === 'accounts:signUp') {
      if (!b.email) return anonyme ? rep(200, { idToken: 'anon', localId: 'a' }) : rep(400, { error: { message: 'ADMIN_ONLY_OPERATION' } });
      if (!emailActif) return rep(400, { error: { message: 'OPERATION_NOT_ALLOWED' } });
      if (b.password.length < (politique7 ? 6 : 8)) return rep(400, { error: { message: 'WEAK_PASSWORD : Password should be at least 8 characters' } });
      const id = 'u' + comptes.size; comptes.set(b.email, { id, mdp: b.password }); return rep(200, { idToken: 'tok-' + b.email, localId: id });
    }
    if (chemin === 'accounts:signInWithPassword') { const c = comptes.get(b.email); return c && c.mdp === b.password ? rep(200, { localId: c.id, idToken: jwt({ aud: 'lanternes-de-nour', iss: 'https://securetoken.google.com/lanternes-de-nour', email_verified: false, firebase: { sign_in_provider: 'password' } }) }) : rep(400, { error: { message: 'INVALID_LOGIN_CREDENTIALS' } }); }
    if (chemin === 'accounts:delete') { supprimes.push(b.idToken); const e = b.idToken.replace('tok-', ''); comptes.delete(e); return rep(200, {}); }
    return rep(404, {});
  };
  return { f, comptes, supprimes };
}
const etat = (res, nom) => res.find(r => r.nom.startsWith(nom)).etat;
test('configuration conforme : tout confirmé, compte de test supprimé', async () => {
  const api = fausseApi(); const res = await verifier({ cle: 'k', projet: 'lanternes-de-nour', domaine: 'lanternes-de-nour.pages.dev', fetcher: api.f });
  assert.deepEqual(res.filter(r => r.etat !== true), [], JSON.stringify(res.filter(r => r.etat !== true))); assert.equal(api.comptes.size, 0, 'aucun compte laissé'); assert.ok(api.supprimes.length >= 1);
});
test('anomalies détectées : domaine absent, Google désactivé, Apple activé, anonyme activé (et nettoyé)', async () => {
  const api = fausseApi({ domaines: ['localhost'], google: false, apple: true, anonyme: true }); const res = await verifier({ cle: 'k', projet: 'lanternes-de-nour', domaine: 'lanternes-de-nour.pages.dev', fetcher: api.f });
  assert.equal(etat(res, 'Domaine autorisé'), false); assert.equal(etat(res, 'Google activé'), false); assert.equal(etat(res, 'Apple désactivé'), false); assert.equal(etat(res, 'Connexion anonyme'), false);
  assert.ok(api.supprimes.includes('anon'), 'compte anonyme de test supprimé');
});
test('e-mail/mot de passe désactivé ou clé refusée : signalé, rien de plus tenté', async () => {
  const res = await verifier({ cle: 'k', projet: 'p', domaine: 'd', fetcher: fausseApi({ emailActif: false }).f.bind(null) }); assert.equal(etat(res, 'E-mail/mot de passe activé'), false);
  const refus = await verifier({ cle: 'k', projet: 'p', domaine: 'd', fetcher: async () => new Response('{"error":{"message":"API key not valid"}}', { status: 400 }) });
  assert.equal(refus.length, 1); assert.equal(refus[0].etat, false);
});
test('stratégie de mot de passe à 6 caractères (défaut Firebase) : détectée', async () => {
  const res = await verifier({ cle: 'k', projet: 'lanternes-de-nour', domaine: 'd', fetcher: fausseApi({ politique7: true, domaines: ['d'] }).f });
  assert.equal(etat(res, 'Règle de mot de passe'), false); assert.match(res.find(r => r.nom.startsWith('Règle de mot de passe')).detail, /7 caractères/);
});
