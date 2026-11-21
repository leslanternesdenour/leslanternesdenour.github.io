// Point d'entrée Cloudflare Pages Functions pour toutes les routes /api/* (sauf /api/sante).
// Les secrets (SESSION_SECRET, FIREBASE_COMPTE_SERVICE, STRIPE_*) et le stockage R2 (R2_PREMIUM) sont
// configurés dans le tableau de bord Cloudflare — jamais dans le dépôt.
import { traiter } from '../../serveur/api.js';
import { baseFirestore } from '../../serveur/base-firestore.js';
import { verifierJeton, cleGoogle } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';

let base = null;

// Stockage privé des contenus Premium : R2 (lié sous le nom R2_PREMIUM ; non public : seules ces Functions y lisent,
// après vérification des droits). Sans R2 lié, aucun contenu Premium n'est servi (404).
export function stockagePremium(env) {
  if (env.R2_PREMIUM) return {
    type: 'r2',
    async get(cle) { const o = await env.R2_PREMIUM.get(cle); return o && { body: o.body, type: o.httpMetadata && o.httpMetadata.contentType }; },
    async lister() { const out = []; let curseur; do { const r = await env.R2_PREMIUM.list({ cursor: curseur, limit: 1000 }); for (const o of r.objects) out.push({ cle: o.key, taille: o.size, date: o.uploaded }); curseur = r.truncated ? r.cursor : null; } while (curseur); return out; }
  };
  return { type: 'aucun', async get() { return null; }, async lister() { return []; } };
}
export async function onRequest({ request, env }) {
  if (!env.SESSION_SECRET || !env.FIREBASE_PROJET || !env.FIREBASE_COMPTE_SERVICE)
    return new Response(JSON.stringify({ erreur: 'comptes-non-configures' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  // Configuration invalide (JSON du compte de service mal collé, clé Stripe réelle refusée…) : réponse neutre, jamais de détail ni d'extrait du secret dans la réponse ou les journaux.
  let ctx;
  try {
    if (!base) base = baseFirestore({ projet: env.FIREBASE_PROJET, compte: JSON.parse(env.FIREBASE_COMPTE_SERVICE) });
    ctx = {
      env, base,
      auth: { verifierIdToken: (jeton, maintenant) => verifierJeton(jeton, { projet: env.FIREBASE_PROJET, type: 'id', obtenirCle: cleGoogle, maintenant }) },
      stockage: stockagePremium(env),
      stripe: clientStripe(env)
    };
  } catch (e) {
    console.error('Configuration des secrets invalide (détail volontairement omis).');
    return new Response(JSON.stringify({ erreur: 'configuration-invalide' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  }
  return traiter(request, ctx);
}
