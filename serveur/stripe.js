// Stripe : vérification des webhooks (signature HMAC) et appels API. MODE TEST par défaut.
// Une clé « sk_live_ » est refusée tant que STRIPE_MODE_REEL n'est pas explicitement « autorise » (accord du créateur) :
// c'est le seul interrupteur du passage aux paiements réels (voir docs/SOUTIEN-CAGNOTTE.md et les secrets du tableau de bord Cloudflare).
// Version d'API de l'appel « don » (celle de la documentation Stripe du paiement intégré, ui_mode « embedded_page ») :
// elle ne dépend pas de la version par défaut du compte. Doit rester cohérente avec le script chargé par /soutenir/ (soutenir/don.js).
import { MENTIONS_COMPLETES } from './ouverture.js';
export const VERSION_API_DON = '2026-11-18.endive';
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

// Mode d'une clé Stripe : 'test' | 'reel' | null (format inconnu). Fonctionne pour les clés secrètes (sk_/rk_) et publiables (pk_).
export function modeCle(cle) {
  const m = /^(?:sk|rk|pk)_(test|live)_[A-Za-z0-9_]+$/.exec(String(cle || ''));
  return m ? (m[1] === 'live' ? 'reel' : 'test') : null;
}

export async function verifierSignatureStripe(corps, entete, secret, maintenant = Date.now(), toleranceS = 300) {
  if (!secret || !entete) return false;
  const parts = Object.fromEntries(String(entete).split(',').map(x => x.split('=')).filter(x => x.length === 2).map(([k, v]) => [k.trim(), v]));
  const v1s = String(entete).split(',').filter(x => x.trim().startsWith('v1=')).map(x => x.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !v1s.length || Math.abs(Math.floor(maintenant / 1000) - t) > toleranceS) return false;
  const cle = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const attendu = hex(await crypto.subtle.sign('HMAC', cle, enc.encode(t + '.' + corps)));
  return v1s.some(v => v.length === attendu.length && [...v].every((c, i) => c === attendu[i]));
}

export function clientStripe(env, { fetcher = fetch } = {}) {
  const cle = String(env.STRIPE_CLE_SECRETE || '').trim();   // un retour à la ligne ou une espace collés avec la clé ne la rendent pas inutilisable
  if (!cle) return null;
  // Séparation stricte des environnements (28/11/2026) : seule la production (ENVIRONNEMENT = « production ») peut utiliser une clé RÉELLE, et la production
  // ne peut utiliser QUE des clés réelles. Une clé de test sur le site public ferait donner de vrais accès Premium contre une carte de test ;
  // une clé réelle en préproduction ou en local encaisserait de vrais paiements depuis un site d'essai. Toute clé de format inconnu est refusée
  // (une clé restreinte « rk_live_ » n'était pas reconnue comme réelle : elle passait pour une clé de test et échappait aux garde-fous).
  const mode = /^(sk|rk)_/.test(cle) ? modeCle(cle) : null;
  if (!mode) throw new Error('Clé Stripe refusée : format inconnu (attendu sk_test_, sk_live_, rk_test_ ou rk_live_).');
  if (mode === 'reel' && env.STRIPE_MODE_REEL !== 'autorise') throw new Error('Clé Stripe RÉELLE refusée : le site doit rester en mode test sans accord du créateur.');
  if (mode === 'reel' && !MENTIONS_COMPLETES) throw new Error('Clé Stripe RÉELLE refusée : les mentions légales de l\'éditeur ne sont pas toutes renseignées (conditions/index.html).');
  if (mode === 'reel' && env.ENVIRONNEMENT !== 'production') throw new Error('Clé Stripe RÉELLE refusée : réservée à l\'environnement de production.');
  if (mode === 'test' && env.ENVIRONNEMENT === 'production') throw new Error('Clé Stripe de TEST refusée : la production n\'accepte que des clés réelles.');
  const formulaire = (o, p = '') => Object.entries(o).flatMap(([k, v]) => { const n = p ? `${p}[${k}]` : k; return v && typeof v === 'object' ? formulaire(v, n) : [[n, String(v)]]; });
  const appel = async (chemin, params = {}, methode = 'POST', version = null) => {
    const r = await fetcher('https://api.stripe.com/v1/' + chemin, { method: methode, headers: { Authorization: 'Bearer ' + cle, 'Content-Type': 'application/x-www-form-urlencoded', ...(version ? { 'Stripe-Version': version } : {}) },
      body: methode === 'GET' ? undefined : new URLSearchParams(formulaire(params)).toString() });
    const j = await r.json(); if (!r.ok) throw new Error('Stripe : ' + (j.error && j.error.message || r.status)); return j;
  };
  return {
    modeTest: mode === 'test',
    creerCheckout: ({ uid, email, prix, succes, annulation, client }) => appel('checkout/sessions', {
      mode: 'subscription', client_reference_id: uid, 'line_items': { 0: { price: prix, quantity: 1 } },
      ...(client ? { customer: client } : { customer_email: email }), success_url: succes, cancel_url: annulation,
      subscription_data: { metadata: { uid } }, metadata: { uid }, locale: 'fr' }),
    // Don libre en paiement INTÉGRÉ : le formulaire Stripe s'affiche dans la page /soutenir/ (aucune redirection).
    // Seul le « client_secret » du formulaire est renvoyé au navigateur ; aucune donnée de carte ne passe par nos serveurs.
    creerDon: async ({ centimes }) => {
      const s = await appel('checkout/sessions', {
        ui_mode: 'embedded_page', mode: 'payment', redirect_on_completion: 'never', submit_type: 'donate', locale: 'fr',
        line_items: { 0: { quantity: 1, price_data: { currency: 'eur', unit_amount: centimes, product_data: { name: 'Soutien aux Lanternes de Nour' } } } } },
      'POST', VERSION_API_DON);
      return { clientSecret: s.client_secret };
    },
    creerPortail: ({ client, retour }) => appel('billing_portal/sessions', { customer: client, return_url: retour }),
    resilierFinPeriode: abonnementId => appel('subscriptions/' + abonnementId, { cancel_at_period_end: 'true' }),
    lireAbonnement: abonnementId => appel('subscriptions/' + abonnementId, {}, 'GET'),
    // Retour du paiement : le serveur relit lui-même la session auprès de Stripe (le navigateur ne prouve rien), abonnement inclus.
    lireSession: id => appel('checkout/sessions/' + encodeURIComponent(id) + '?expand[]=subscription', {}, 'GET'),
    // Rattrapage sans identifiant de session : les abonnements de ce compte (métadonnée « uid » posée à la souscription).
    // 1) lecture IMMÉDIATE : les clients Stripe de l'adresse (celle du compte, vérifiée), puis leurs abonnements ;
    // 2) sinon la recherche Stripe, dont l'index peut mettre plus d'une minute à voir un abonnement tout neuf.
    chercherAbonnements: async (uid, email) => {
      const trouves = [], dejaVus = new Set();
      const ajouter = liste => { for (const a of liste || []) if (a && !dejaVus.has(a.id)) { dejaVus.add(a.id); trouves.push(a); } };
      if (email) {
        const clients = await appel('customers?limit=10&email=' + encodeURIComponent(email), {}, 'GET');
        for (const c of (clients.data || []).slice(0, 10)) ajouter((await appel('subscriptions?status=all&limit=10&customer=' + encodeURIComponent(c.id), {}, 'GET')).data);
      }
      if (!trouves.some(a => a.metadata && a.metadata.uid === uid && ['active', 'trialing'].includes(a.status)))
        ajouter((await appel('subscriptions/search?query=' + encodeURIComponent("metadata['uid']:'" + uid + "'"), {}, 'GET')).data);
      return { data: trouves };
    }
  };
}
