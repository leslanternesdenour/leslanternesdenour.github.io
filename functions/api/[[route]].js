// Point d'entrée Cloudflare Pages Functions pour toutes les routes /api/* (sauf /api/sante).
// Les secrets (SESSION_SECRET, FIREBASE_COMPTE_SERVICE, STRIPE_*) et le stockage R2 (R2_PREMIUM) sont
// configurés dans le tableau de bord Cloudflare — jamais dans le dépôt.
import { traiter } from '../../serveur/api.js';
import { baseFirestore } from '../../serveur/base-firestore.js';
import { verifierJeton, cleGoogle } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';

let base = null;
export async function onRequest({ request, env }) {
  if (!env.SESSION_SECRET || !env.FIREBASE_PROJET || !env.FIREBASE_COMPTE_SERVICE)
    return new Response(JSON.stringify({ erreur: 'comptes-non-configures' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  if (!base) base = baseFirestore({ projet: env.FIREBASE_PROJET, compte: JSON.parse(env.FIREBASE_COMPTE_SERVICE) });
  const ctx = {
    env, base,
    auth: { verifierIdToken: (jeton, maintenant) => verifierJeton(jeton, { projet: env.FIREBASE_PROJET, type: 'id', obtenirCle: cleGoogle, maintenant }) },
    stockage: { async get(cle) { if (!env.R2_PREMIUM) return null; const o = await env.R2_PREMIUM.get(cle); return o && { body: o.body, type: o.httpMetadata && o.httpMetadata.contentType }; } },
    stripe: clientStripe(env)
  };
  return traiter(request, ctx);
}
