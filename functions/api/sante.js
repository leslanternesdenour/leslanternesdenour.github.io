// GET /api/sante : vérifie que les fonctions serveur Cloudflare répondent.
// En préproduction seulement, ajoute un état de configuration sous forme de OUI/NON : aucune valeur, aucun secret, jamais.
import { estRevoquee } from '../../serveur/cles-revoquees.js';
function lireCompte(texte) { try { const c = JSON.parse(texte); return c && c.type === 'service_account' && !!c.private_key && !!c.client_email && !!c.project_id ? c : null; } catch (e) { return null; } }
const compteDeServiceValide = (texte) => { const c = lireCompte(texte); return !!c && !estRevoquee(c); };
export function etatConfiguration(env) {
  const compte = typeof env.FIREBASE_COMPTE_SERVICE === 'string' && compteDeServiceValide(env.FIREBASE_COMPTE_SERVICE);
  const cleStripe = typeof env.STRIPE_CLE_SECRETE === 'string' ? env.STRIPE_CLE_SECRETE : '';
  return {
    sessions: typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length >= 32,
    // Détail sans jamais révéler la valeur ni sa longueur exacte : absent | trop-court (moins de 32 caractères) | ok
    sessionsEtat: typeof env.SESSION_SECRET !== 'string' || env.SESSION_SECRET.length === 0 ? 'absent' : env.SESSION_SECRET.length < 32 ? 'trop-court' : 'ok',
    firebaseProjet: !!env.FIREBASE_PROJET,
    firebaseCompteDeService: compte,
    // Clé exposée puis révoquée recollée par erreur : signalé (le site refuse alors de l'utiliser)
    cleRevoquee: typeof env.FIREBASE_COMPTE_SERVICE === 'string' && estRevoquee(lireCompte(env.FIREBASE_COMPTE_SERVICE)),
    createurDesigne: typeof env.CREATOR_UID === 'string' && env.CREATOR_UID.trim().length > 0,
    stripe: !cleStripe ? 'non' : cleStripe.startsWith('sk_test_') ? 'test' : 'cle-invalide',
    stripeWebhook: !!env.STRIPE_SECRET_WEBHOOK,
    stockagePremium: env.R2_PREMIUM ? 'lie' : 'non'
  };
}
export function onRequestGet({ env }) {
  const corps = { ok: true, service: 'lanternes-de-nour', environnement: env.ENVIRONNEMENT || 'inconnu', heure: new Date().toISOString() };
  if (env.ENVIRONNEMENT === 'preproduction') corps.configuration = etatConfiguration(env);
  return new Response(JSON.stringify(corps), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
