// GET /api/sante : vérifie que les fonctions serveur Cloudflare répondent.
// En préproduction seulement, ajoute un état de configuration sous forme de OUI/NON : aucune valeur, aucun secret, jamais.
function compteDeServiceValide(texte) {
  try { const c = JSON.parse(texte); return c && c.type === 'service_account' && !!c.private_key && !!c.client_email && !!c.project_id; } catch (e) { return false; }
}
export function etatConfiguration(env) {
  const compte = typeof env.FIREBASE_COMPTE_SERVICE === 'string' && compteDeServiceValide(env.FIREBASE_COMPTE_SERVICE);
  const cleStripe = typeof env.STRIPE_CLE_SECRETE === 'string' ? env.STRIPE_CLE_SECRETE : '';
  return {
    sessions: typeof env.SESSION_SECRET === 'string' && env.SESSION_SECRET.length >= 32,
    firebaseProjet: !!env.FIREBASE_PROJET,
    firebaseCompteDeService: compte,
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
