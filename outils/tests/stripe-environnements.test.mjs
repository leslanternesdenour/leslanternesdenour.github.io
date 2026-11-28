// Séparation des environnements de paiement : seule la PRODUCTION peut utiliser des clés et des événements RÉELS, et la production n'accepte QUE du réel.
// Ni Stripe ni aucun réseau : clés fictives, webhooks signés localement. node --test outils/tests/stripe-environnements.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { clientStripe, modeCle } from '../../serveur/stripe.js';
import { MENTIONS_COMPLETES } from '../../serveur/ouverture.js';
import { traiter } from '../../serveur/api.js';
import { traiterDon } from '../../serveur/don.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { calculerDroits } from '../../serveur/droits.js';

const fetcherInterdit = async () => { throw new Error('aucun appel réseau attendu'); };
const essai = env => { try { return { c: clientStripe(env, { fetcher: fetcherInterdit }) }; } catch (e) { return { erreur: e.message }; } };

test('modeCle : sk/rk/pk test ou live reconnus, tout le reste inconnu', () => {
  for (const [k, m] of [['sk_test_abc123', 'test'], ['rk_test_abc', 'test'], ['pk_test_abc', 'test'], ['sk_live_abc', 'reel'], ['rk_live_abc', 'reel'], ['pk_live_abc', 'reel']]) assert.equal(modeCle(k), m, k);
  for (const k of ['', null, undefined, 'sk_abc', 'sk_prod_abc', 'SK_LIVE_abc', 'sk_live_', 'sk_live_a b', 'xsk_live_abc', 'sk_test_abc\nsk_live_x']) assert.equal(modeCle(k), null, String(k));
});

test('clés de test : acceptées hors production (mode test), refusées en production', () => {
  for (const ENVIRONNEMENT of [undefined, 'local', 'preproduction', 'emulateur-local', 'inconnu']) {
    const r = essai({ STRIPE_CLE_SECRETE: 'sk_test_local', ENVIRONNEMENT }); assert.equal(r.c.modeTest, true, String(ENVIRONNEMENT));
  }
  assert.match(essai({ STRIPE_CLE_SECRETE: 'sk_test_local', ENVIRONNEMENT: 'production' }).erreur, /TEST refusée/);
  assert.match(essai({ STRIPE_CLE_SECRETE: 'rk_test_local', ENVIRONNEMENT: 'production' }).erreur, /TEST refusée/);
  assert.equal(essai({ STRIPE_CLE_SECRETE: '' , ENVIRONNEMENT: 'production' }).c, null, 'aucune clé : paiements fermés, pas d\'erreur');
});

test('clés réelles : refusées partout tant que l\'accord et les mentions légales manquent ; JAMAIS hors production même avec l\'accord ; rk_live_ traité comme réel', () => {
  for (const ENVIRONNEMENT of [undefined, 'local', 'preproduction', 'production']) for (const cle of ['sk_live_x', 'rk_live_x']) {
    assert.match(essai({ STRIPE_CLE_SECRETE: cle, ENVIRONNEMENT }).erreur, /RÉELLE refusée/, cle + ' / ' + ENVIRONNEMENT + ' sans accord');
  }
  for (const cle of ['sk_live_x', 'rk_live_x']) {
    const avecAccord = e => essai({ STRIPE_CLE_SECRETE: cle, STRIPE_MODE_REEL: 'autorise', ENVIRONNEMENT: e });
    for (const e of [undefined, 'local', 'preproduction', 'emulateur-local']) assert.match(avecAccord(e).erreur, /RÉELLE refusée/, cle + ' avec accord hors production (' + e + ')');
    if (MENTIONS_COMPLETES) assert.equal(avecAccord('production').c.modeTest, false, 'production + accord + mentions : seule combinaison qui ouvre le réel');
    else assert.match(avecAccord('production').erreur, /mentions légales/, 'mentions légales incomplètes : réel impossible même en production');
  }
});

test('clés de format inconnu refusées (jamais prises pour une clé de test)', () => {
  for (const cle of ['pk_test_abc', 'pk_live_abc', 'whsec_abc', 'sk_abc', 'Bearer sk_test_abc', 'sk_prod_abc', 'x']) assert.match(essai({ STRIPE_CLE_SECRETE: cle }).erreur, /format inconnu/, cle);
});

const SECRET_WH = 'whsec_test_local', T = Date.UTC(2026, 10, 28, 12), J = 86400000;
async function webhook(evenement, env, base) {
  const corps = JSON.stringify(evenement), t = Math.floor(T / 1000);
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET_WH), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(t + '.' + corps))).toString('hex');
  const r = await traiter(new Request('https://x.exemple/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body: corps }),
    { env: { SESSION_SECRET: 'secret-de-test-tres-long-0123456789abcdef', STRIPE_SECRET_WEBHOOK: SECRET_WH, STRIPE_PRIX_PREMIUM_MENSUEL: 'price_pm', ...env }, base, maintenant: T, auth: {}, stockage: null, stripe: null });
  return { s: r.status, j: await r.json() };
}
const evenement = (livemode, uid = 'uid-w') => ({ id: 'evt_' + Math.random(), livemode, type: 'customer.subscription.updated', data: { object: { id: 'sub_1', customer: 'cus_1', status: 'active', current_period_end: Math.floor((T + 30 * J) / 1000), cancel_at_period_end: false, metadata: { uid }, items: { data: [{ price: { id: 'price_pm' } }] } } } });
async function premiumDonne(env, livemode) {
  const base = baseMemoire(); await base.ecrire('familles', 'uid-w', { email: 'w@exemple.fr' });
  const r = await webhook(evenement(livemode), env, base); const ab = await base.lire('abonnements', 'uid-w');
  // accès Premium réellement calculé à partir de ce que le webhook a enregistré
  const d = ab ? calculerDroits({ uid: 'uid-w', claims: {}, env: {}, sources: { accesOfferts: [], abonnement: ab }, maintenant: T }) : null;
  return { r, premium: !!d && d.niveau === 'premium' };
}

test('webhook : la production n\'accepte QUE les événements réels ; les événements réels ne sont acceptés qu\'en production avec accord et mentions', async () => {
  const prod = await premiumDonne({ ENVIRONNEMENT: 'production' }, false);
  assert.equal(prod.r.j.erreur, 'mode-test-refuse'); assert.equal(prod.premium, false, 'un paiement de TEST ne donne aucun accès Premium en production');
  const prodSansEnv = await premiumDonne({ ENVIRONNEMENT: 'production' }, undefined);
  assert.equal(prodSansEnv.r.j.erreur, 'mode-test-refuse', 'événement sans indication de mode : refusé en production');
  for (const ENVIRONNEMENT of [undefined, 'local', 'preproduction']) {
    const r = await premiumDonne({ ENVIRONNEMENT, STRIPE_MODE_REEL: 'autorise' }, true);
    assert.equal(r.r.j.erreur, 'mode-reel-refuse', 'événement réel hors production : ' + ENVIRONNEMENT); assert.equal(r.premium, false);
  }
  const prodReel = await premiumDonne({ ENVIRONNEMENT: 'production', STRIPE_MODE_REEL: 'autorise' }, true);
  if (MENTIONS_COMPLETES) { assert.equal(prodReel.r.s, 200); assert.equal(prodReel.premium, true); } else { assert.equal(prodReel.r.j.erreur, 'mode-reel-refuse'); assert.equal(prodReel.premium, false, 'mentions légales incomplètes'); }
  const prodSansAccord = await premiumDonne({ ENVIRONNEMENT: 'production' }, true);
  assert.equal(prodSansAccord.r.j.erreur, 'mode-reel-refuse', 'sans STRIPE_MODE_REEL=autorise');
  for (const ENVIRONNEMENT of [undefined, 'local', 'preproduction']) { const t = await premiumDonne({ ENVIRONNEMENT }, false); assert.equal(t.r.s, 200); assert.equal(t.premium, true, 'hors production : les paiements de test fonctionnent comme avant'); }
});

test('don : la clé publiable n\'est renvoyée que si son mode correspond à l\'environnement ET à la clé secrète', async () => {
  const cle = async env => (await (await traiterDon(new Request('https://x.exemple/api/don/config'), env)).json()).cle;
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'sk_test_x', ENVIRONNEMENT: 'preproduction' }), 'pk_test_abc');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', ENVIRONNEMENT: 'local' }), 'pk_test_abc', 'sans clé secrète : seule la cohérence avec l\'environnement compte');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'sk_test_x', ENVIRONNEMENT: 'production' }), null, 'clé de test sur le site public : jamais exposée');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_live_abc', STRIPE_CLE_SECRETE: 'sk_live_x', ENVIRONNEMENT: 'preproduction' }), null, 'clé réelle hors production : jamais exposée');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_live_abc', ENVIRONNEMENT: undefined }), null);
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'sk_live_x', ENVIRONNEMENT: 'preproduction' }), null, 'publiable test + secrète réelle : incohérent');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_live_abc', STRIPE_CLE_SECRETE: 'sk_test_x', ENVIRONNEMENT: 'production' }), null, 'publiable réelle + secrète de test : incohérent');
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'sk_test_abc', ENVIRONNEMENT: 'preproduction' }), null, 'une clé secrète n\'est jamais renvoyée');
  assert.equal(await cle({ ENVIRONNEMENT: 'preproduction' }), null);
});

test('clé collée avec un retour à la ligne ou des espaces : acceptée une fois nettoyée, le mode est celui de la clé nettoyée', () => {
  assert.equal(essai({ STRIPE_CLE_SECRETE: 'sk_test_local\n' }).c.modeTest, true);
  assert.equal(essai({ STRIPE_CLE_SECRETE: '  sk_test_local  ' }).c.modeTest, true);
  assert.match(essai({ STRIPE_CLE_SECRETE: 'sk_test_local\n', ENVIRONNEMENT: 'production' }).erreur, /TEST refusée/, 'le nettoyage ne contourne pas la séparation');
  assert.match(essai({ STRIPE_CLE_SECRETE: ' sk_live_x \n', ENVIRONNEMENT: 'preproduction', STRIPE_MODE_REEL: 'autorise' }).erreur, /RÉELLE refusée/);
});

test('don : clé secrète présente mais de format inconnu = clé publiable jamais exposée', async () => {
  const cle = async env => (await (await traiterDon(new Request('https://x.exemple/api/don/config'), env)).json()).cle;
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'n-importe-quoi', ENVIRONNEMENT: 'preproduction' }), null);
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'pk_test_abc', ENVIRONNEMENT: 'preproduction' }), null);
  assert.equal(await cle({ STRIPE_CLE_PUBLIABLE: 'pk_test_abc', STRIPE_CLE_SECRETE: 'sk_test_x\n', ENVIRONNEMENT: 'preproduction' }), 'pk_test_abc');
});
