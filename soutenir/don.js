// Liaison navigateur du don en ligne de /soutenir/ : page, réseau, Stripe. AUCUNE règle ici : tout est dans don-logique.js (testé sans navigateur).
// Aucune donnée bancaire ne passe par ce site : le formulaire de paiement est celui de Stripe (cadre intégré à la page).
import { creerControleurDon } from './don-logique.js?v=1';

// Script Stripe : version cohérente avec VERSION_API_DON (serveur/stripe.js) ; autorisé par la CSP de /soutenir/* (_headers : js.stripe.com).
const SCRIPT_STRIPE = 'https://js.stripe.com/endive/stripe.js';
const $ = id => document.getElementById(id);

function chargerScriptStripe() {
  if (window.Stripe) return Promise.resolve();
  return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = SCRIPT_STRIPE; s.async = true; s.onload = ok; s.onerror = () => ko(new Error('stripe-js-indisponible')); document.head.appendChild(s); });
}

const montrer = (id, oui) => { $(id).hidden = !oui; };
const vue = {
  montrerBientot() { montrer('msg-bientot', true); montrer('form-don', false); montrer('zone-paiement', false); montrer('merci-don', false); montrer('note-don', false); },
  montrerFormulaire() { montrer('msg-bientot', false); montrer('form-don', true); montrer('zone-paiement', false); montrer('merci-don', false); montrer('note-don', true); montrer('erreur-don', false); },
  montrerErreur(message) { const e = $('erreur-don'); e.textContent = message; e.hidden = false; },
  montrerPaiement() { montrer('form-don', false); montrer('zone-paiement', true); montrer('erreur-don', false); },
  montrerMerci() { montrer('zone-paiement', false); montrer('form-don', false); montrer('merci-don', true); }
};

const reseau = {
  async chargerConfig() {
    const r = await fetch('/api/don/config', { cache: 'no-store' });
    if (!r.ok) throw new Error('don-non-configure');
    const j = await r.json(); if (!j || !j.cle) throw new Error('don-non-configure');
    return j;
  },
  async creerSession(montant) {
    const r = await fetch('/api/don/session', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-LDN': '1' }, body: JSON.stringify({ montant }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.clientSecret) throw Object.assign(new Error('don'), { code: j.erreur });
    return j.clientSecret;
  },
  async monterPaiement({ cle, clientSecret, onComplete }) {
    await chargerScriptStripe();
    const stripe = window.Stripe(cle);
    const paiement = await stripe.createEmbeddedCheckoutPage({ fetchClientSecret: async () => clientSecret, onComplete });
    paiement.mount('#paiement');
    return paiement;
  }
};

export async function demarrerDon() {
  const c = creerControleurDon({ ...reseau, vue });
  const choix = () => { const r = document.querySelector('input[name="montant"]:checked'); return r ? r.value : null; };
  document.querySelectorAll('input[name="montant"]').forEach(r => r.addEventListener('change', () => {
    montrer('champ-libre', choix() === 'libre'); montrer('erreur-don', false); if (choix() === 'libre') $('montant-libre').focus();
  }));
  $('form-don').addEventListener('submit', async e => {
    e.preventDefault();
    const bouton = $('btn-continuer'); bouton.disabled = true;
    try { await c.valider(choix(), $('montant-libre').value); } finally { bouton.disabled = false; }
  });
  $('btn-changer').addEventListener('click', () => c.revenir());
  await c.demarrer();
}
