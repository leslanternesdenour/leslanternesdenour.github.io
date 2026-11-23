// Intégration avec le VRAI Stripe en MODE TEST (aucun paiement réel). Désactivé par défaut : il appelle l'API Stripe.
//   PowerShell : $env:LDN_STRIPE_TEST='1'; node --test outils/tests/stripe-integration.test.mjs
// Lit .dev.vars (clés de TEST, jamais affichées ; STRIPE_PRIX_* = identifiants publics des 3 tarifs). Refuse toute clé réelle. Nettoie ses données de test.
import test, { after } from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
import { clientStripe } from '../../serveur/stripe.js';
import { traiter } from '../../serveur/api.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { abonnementActif } from '../../serveur/droits.js';

const ACTIF = process.env.LDN_STRIPE_TEST === '1';
const opts = { skip: !ACTIF && 'LDN_STRIPE_TEST=1 requis (appels réels à Stripe, mode test)' };
const vars = {};
if (ACTIF) for (const l of fs.readFileSync(path.join(fileURLToPath(new URL('../../', import.meta.url)), '.dev.vars'), 'utf8').split(/\r?\n/)) { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l); if (m) vars[m[1]] = m[2]; }
if (ACTIF && !/^sk_test_/.test(vars.STRIPE_CLE_SECRETE || '')) throw new Error('STRIPE_CLE_SECRETE de .dev.vars absente ou pas une clé de TEST : arrêt.');
const PRIX = { premium_mensuel: vars.STRIPE_PRIX_PREMIUM_MENSUEL, premium_annuel: vars.STRIPE_PRIX_PREMIUM_ANNUEL, famille_annuel: vars.STRIPE_PRIX_FAMILLE_ANNUEL };
const UID = 'uid-verif-' + crypto.randomBytes(4).toString('hex');
const stripe = ACTIF ? clientStripe({ STRIPE_CLE_SECRETE: vars.STRIPE_CLE_SECRETE }) : null;

// Appels directs à l'API Stripe pour fabriquer des données de TEST (client, carte de test, abonnement) et les nettoyer ensuite.
const aplatir = (o, p = '') => Object.entries(o).flatMap(([k, v]) => { const n = p ? `${p}[${k}]` : k; return v && typeof v === 'object' ? aplatir(v, n) : [[n, String(v)]]; });
async function api(methode, chemin, params = {}) {
  const r = await fetch('https://api.stripe.com/v1/' + chemin, { method: methode, headers: { Authorization: 'Bearer ' + vars.STRIPE_CLE_SECRETE, 'Content-Type': 'application/x-www-form-urlencoded' }, body: methode === 'GET' ? undefined : new URLSearchParams(aplatir(params)).toString() });
  const j = await r.json(); if (!r.ok) throw new Error('Stripe ' + chemin + ' : ' + (j.error && (j.error.code || j.error.message))); return j;
}
const etat = {};
after(async () => { if (ACTIF && etat.client) { try { await api('DELETE', 'customers/' + etat.client); } catch (e) {} } });

test('Abonnement de test payé avec la carte de test, et portail client ouvert (résiliation, factures, moyen de paiement)', opts, async () => {
  const client = await api('POST', 'customers', { email: 'verif@example.com', name: 'Verification Technique', metadata: { uid: UID } }); etat.client = client.id;
  const pm = await api('POST', 'payment_methods/pm_card_visa/attach', { customer: client.id });
  etat.abonnement = await api('POST', 'subscriptions', { customer: client.id, items: { 0: { price: PRIX.premium_mensuel } }, default_payment_method: pm.id, metadata: { uid: UID } });
  assert.equal(etat.abonnement.status, 'active'); assert.equal(etat.abonnement.livemode, false);
  const portail = await stripe.creerPortail({ client: client.id, retour: 'https://verif.exemple/compte/' });
  assert.match(portail.url || '', /^https:\/\/billing\.stripe\.com\//);
});

// Webhook : événement signé avec un secret LOCAL (propre à ce test), contenant la VRAIE donnée renvoyée par Stripe, traité par le VRAI code du site.
const WHSEC = 'whsec_' + crypto.randomBytes(16).toString('hex'), base = baseMemoire();
const ctx = () => ({ env: { SESSION_SECRET: crypto.randomBytes(32).toString('hex'), FIREBASE_PROJET: 'ldn-verif', STRIPE_SECRET_WEBHOOK: WHSEC,
  STRIPE_PRIX_PREMIUM_MENSUEL: PRIX.premium_mensuel, STRIPE_PRIX_PREMIUM_ANNUEL: PRIX.premium_annuel, STRIPE_PRIX_FAMILLE_ANNUEL: PRIX.famille_annuel }, base, maintenant: Date.now(), auth: {}, stockage: {}, stripe: null });
async function webhook(type, objet) {
  const corps = JSON.stringify({ id: 'evt_verif_' + crypto.randomBytes(6).toString('hex'), livemode: false, type, data: { object: objet } });
  const t = Math.floor(Date.now() / 1000), sig = crypto.createHmac('sha256', WHSEC).update(t + '.' + corps).digest('hex');
  return traiter(new Request('https://verif.exemple/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body: corps }), ctx());
}

test('Webhook « abonnement créé » avec la vraie donnée Stripe : abonnement actif, formule Premium mensuel, fin de période = celle de Stripe (pas 0), accès Premium actif', opts, async () => {
  await base.ecrire('familles', UID, { email: 'verif@example.com', creeLe: Date.now() });
  const r = await webhook('customer.subscription.created', etat.abonnement);
  assert.equal(r.status, 200);
  const ab = await base.lire('abonnements', UID);
  assert.equal(ab.statut, 'active'); assert.equal(ab.formule, 'premium_mensuel');
  const finStripe = (etat.abonnement.current_period_end || etat.abonnement.items.data[0].current_period_end) * 1000;
  assert.ok(Math.abs(ab.finPeriode - finStripe) < 1000 && ab.finPeriode > Date.now(), `fin enregistrée ${ab.finPeriode}, attendue ${finStripe}`);
  assert.equal(abonnementActif(ab), true);
});

test('Résiliation en fin de période (appel réel à Stripe) : l\'annulation est notée et l\'accès est conservé jusqu\'à la fin de la période payée', opts, async () => {
  const resilie = await stripe.resilierFinPeriode(etat.abonnement.id);
  assert.equal(resilie.cancel_at_period_end, true);
  assert.equal((await webhook('customer.subscription.updated', resilie)).status, 200);
  const ab = await base.lire('abonnements', UID);
  assert.equal(ab.annulationFinPeriode, true);
  assert.equal(abonnementActif(ab), true);
});

test('Fin réelle de l\'abonnement (annulation chez Stripe) : statut « canceled » et plus d\'accès Premium', opts, async () => {
  const supprime = await api('DELETE', 'subscriptions/' + etat.abonnement.id);
  assert.equal((await webhook('customer.subscription.deleted', supprime)).status, 200);
  const ab = await base.lire('abonnements', UID);
  assert.equal(ab.statut, 'canceled');
  assert.equal(abonnementActif(ab), false);
});

test('Remboursement réel (mode test) : l\'événement « charge.refunded » est accepté (200) sans changer l\'état de l\'abonnement', opts, async () => {
  const charges = await api('GET', 'charges?customer=' + etat.client + '&limit=1');
  assert.equal(charges.data.length, 1, 'le paiement de test de l\'abonnement existe');
  const remb = await api('POST', 'refunds', { charge: charges.data[0].id });
  assert.ok(['succeeded', 'pending'].includes(remb.status), 'remboursement : ' + remb.status);
  const charge = await api('GET', 'charges/' + charges.data[0].id);
  const avant = JSON.stringify(await base.lire('abonnements', UID));
  assert.equal((await webhook('charge.refunded', charge)).status, 200);
  assert.equal(JSON.stringify(await base.lire('abonnements', UID)), avant);
});

test('Don de 5 € : le vrai Stripe de test crée la session de paiement intégré', opts, async () => {
  const don = await stripe.creerDon({ centimes: 500 });
  assert.match(don.clientSecret || '', /^cs_test_/);
});

test('Pages de paiement : les 3 tarifs créent une page Checkout d\'abonnement en mode test', opts, async () => {
  for (const [formule, prix] of Object.entries(PRIX)) {
    assert.match(prix || '', /^price_/, 'STRIPE_PRIX pour ' + formule + ' dans .dev.vars');
    const s = await stripe.creerCheckout({ uid: UID, email: 'verif@example.com', prix, succes: 'https://verif.exemple/compte/?paiement=ok', annulation: 'https://verif.exemple/tarifs/?paiement=annule' });
    assert.match(s.url || '', /^https:\/\/checkout\.stripe\.com\//, formule);
    assert.match(s.id || '', /^cs_test_/, formule);
  }
});
