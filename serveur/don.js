// Don en ligne (paiement intégré Stripe) : logique pure, sans accès à la base ; Stripe est injecté (fetcher) pour les tests.
import { clientStripe } from './stripe.js';

// Le montant est TOUJOURS revalidé côté serveur : on ne fait jamais confiance au navigateur.
// Euros entiers de 1 à 500 (type nombre uniquement : « 5 » en texte, 2,5, NaN, tableaux, objets sont refusés).
const json = (data, statut = 200) => new Response(JSON.stringify(data), { status: statut, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

// Limitation simple par adresse IP (par instance, comme dans api.js) : chaque don crée une session chez Stripe.
const compteurs = new Map();
function tropDeTentatives(cle, max, fenetreMs, maintenant) {
  const c = compteurs.get(cle);
  if (!c || c.debut + fenetreMs < maintenant) { compteurs.set(cle, { debut: maintenant, n: 1 }); return false; }
  c.n++; return c.n > max;
}

// Même protection que l'API des comptes : en-tête personnalisé X-LDN (impossible depuis un autre site sans autorisation) + même origine.
function memeOrigine(req) {
  if (req.headers.get('X-LDN') !== '1') return false;
  const o = req.headers.get('Origin'); if (!o) return true;
  return o === new URL(req.url).origin;
}

export async function traiterDon(req, env, { fetcher = fetch } = {}) {
  // GET /api/don/config : la clé PUBLIABLE (pk_…) dont le navigateur a besoin pour afficher le formulaire. Une clé qui ne commence pas par « pk_ » n'est jamais renvoyée.
  if (req.method === 'GET') {
    const cle = String(env.STRIPE_CLE_PUBLIABLE || '');
    // Pas de clé = don pas encore ouvert : état normal, réponse calme (200) pour ne pas produire d'erreur serveur à chaque visite de la page.
    return json({ cle: /^pk_(test|live)_[A-Za-z0-9]+$/.test(cle) ? cle : null });
  }
  if (!memeOrigine(req)) return json({ erreur: 'origine' }, 403);
  // Clé absente OU clé réelle refusée par clientStripe : même réponse neutre, jamais le détail ni un extrait de la clé.
  let stripe = null; try { stripe = clientStripe(env, { fetcher }); } catch (e) { stripe = null; }
  if (!stripe) return json({ erreur: 'don-non-configure' }, 503);
  const texte = await req.text();
  if (texte.length > 1000) return json({ erreur: 'trop-gros' }, 400);
  let corps; try { corps = JSON.parse(texte); } catch (e) { return json({ erreur: 'json-invalide' }, 400); }
  if (!corps || typeof corps !== 'object' || Array.isArray(corps)) corps = {};
  const v = validerMontantDon(corps.montant);
  if (!v.ok) return json({ erreur: v.raison }, 400);
  const { centimes } = v;
  if (tropDeTentatives('don:' + (req.headers.get('CF-Connecting-IP') || 'local'), 10, 10 * 60000, Date.now())) return json({ erreur: 'trop-de-tentatives' }, 429);
  try {
    const { clientSecret } = await stripe.creerDon({ centimes });
    return json({ clientSecret });
  } catch (e) {
    // Le message d'erreur de Stripe peut citer un extrait de clé : jamais renvoyé au navigateur, et journalisé UNIQUEMENT en local (terminal du serveur de développement) pour diagnostiquer une clé erronée.
    if (env.ENVIRONNEMENT === 'local') console.error('[don] Stripe a refusé la requête : ' + (e && e.message));
    return json({ erreur: 'paiement-indisponible' }, 502);
  }
}

export function validerMontantDon(montant) {
  if (typeof montant !== 'number' || !Number.isInteger(montant) || montant < 1 || montant > 500) return { ok: false, raison: 'montant-invalide' };
  return { ok: true, centimes: montant * 100 };
}
