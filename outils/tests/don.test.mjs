// Tests du don en ligne (paiement intégré Stripe, page /soutenir/). node --test outils/tests/don.test.mjs
// Stripe est toujours simulé ici : aucun appel réseau, aucune clé réelle.
import test from 'node:test'; import assert from 'node:assert/strict';
import { validerMontantDon } from '../../serveur/don.js';
import * as don from '../../serveur/don.js';
import { clientStripe } from '../../serveur/stripe.js';

test('Montant du don : euros entiers de 1 à 500, converti en centimes ; tout le reste est refusé', () => {
  assert.deepEqual(validerMontantDon(5), { ok: true, centimes: 500 });
  assert.deepEqual(validerMontantDon(1), { ok: true, centimes: 100 });
  assert.deepEqual(validerMontantDon(500), { ok: true, centimes: 50000 });
  for (const mauvais of [0, -3, 501, 2.5, '5', NaN, Infinity, null, undefined, {}, [5], true])
    assert.deepEqual(validerMontantDon(mauvais), { ok: false, raison: 'montant-invalide' }, 'refusé : ' + JSON.stringify(mauvais));
});

test('Stripe : le don demande un paiement INTÉGRÉ (reste sur la page), unique, en euros, sans redirection ; la clé réelle reste refusée', async () => {
  const appels = [];
  const faux = async (u, o) => { appels.push({ u, o }); return new Response(JSON.stringify({ id: 'cs_test_don', client_secret: 'cs_test_don_secret_abc' }), { status: 200 }); };
  const stripe = clientStripe({ STRIPE_CLE_SECRETE: 'sk_test_local' }, { fetcher: faux });
  const r = await stripe.creerDon({ centimes: 500 });
  assert.deepEqual(r, { clientSecret: 'cs_test_don_secret_abc' }, 'seul le secret du formulaire est renvoyé au navigateur');
  const corps = new URLSearchParams(appels[0].o.body);
  assert.equal(appels[0].u, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(corps.get('ui_mode'), 'embedded_page', 'nom actuel du mode intégré (docs.stripe.com/checkout/embedded/quickstart)');
  assert.equal(corps.get('mode'), 'payment');
  assert.equal(appels[0].o.headers['Stripe-Version'], '2026-11-18.endive', 'version d\'API fixée : ne dépend pas de l\'ancienneté du compte');
  assert.equal(corps.get('redirect_on_completion'), 'never');
  assert.equal(corps.get('submit_type'), 'donate');
  assert.equal(corps.get('locale'), 'fr');
  assert.equal(corps.get('line_items[0][price_data][currency]'), 'eur');
  assert.equal(corps.get('line_items[0][price_data][unit_amount]'), '500');
  assert.equal(corps.get('line_items[0][quantity]'), '1');
  assert.ok(corps.get('line_items[0][price_data][product_data][name]'), 'le don a un libellé');
  assert.throws(() => clientStripe({ STRIPE_CLE_SECRETE: 'sk_live_xxx' }, { fetcher: faux }), /RÉELLE refusée/);
});

// ---- point d'entrée serveur (POST /api/don/session) ----
const O = 'https://preprod.exemple';
const envOk = { STRIPE_CLE_SECRETE: 'sk_test_local', STRIPE_CLE_PUBLIABLE: 'pk_test_local' };
const stripeOk = async () => new Response(JSON.stringify({ id: 'cs_test', client_secret: 'cs_test_secret' }), { status: 200 });
const poster = (corps, { entetes = {}, env = envOk, fetcher = stripeOk, ip = '1.2.3.4' } = {}) => don.traiterDon(
  new Request(O + '/api/don/session', { method: 'POST', headers: { 'X-LDN': '1', Origin: O, 'CF-Connecting-IP': ip, ...entetes }, body: typeof corps === 'string' ? corps : JSON.stringify(corps) }), env, { fetcher });

test('POST /api/don/session : un don valide renvoie seulement le secret du formulaire, sans aucune clé', async () => {
  const ok = await poster({ montant: 10 });
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.deepEqual(j, { clientSecret: 'cs_test_secret' });
  assert.doesNotMatch(JSON.stringify(j), /sk_test|pk_test/);
});

test('POST /api/don/session : un montant invalide est refusé (400) sans jamais appeler Stripe', async () => {
  let appels = 0;
  const espion = async () => { appels++; return stripeOk(); };
  for (const montant of [0, -5, 501, 2.5, '10', null, undefined]) {
    const r = await poster({ montant }, { fetcher: espion });
    assert.equal(r.status, 400, 'montant ' + JSON.stringify(montant));
    assert.deepEqual(await r.json(), { erreur: 'montant-invalide' });
  }
  assert.equal(appels, 0, 'Stripe n\'est pas appelé');
});

test('POST /api/don/session : refusé (403) sans l\'en-tête X-LDN ou depuis un autre site, sans appeler Stripe', async () => {
  let appels = 0;
  const espion = async () => { appels++; return stripeOk(); };
  assert.equal((await poster({ montant: 10 }, { entetes: { 'X-LDN': '0' }, fetcher: espion })).status, 403);
  assert.equal((await poster({ montant: 10 }, { entetes: { Origin: 'https://pirate.exemple' }, fetcher: espion })).status, 403);
  assert.equal(appels, 0);
});

test('POST /api/don/session : un corps cassé ou énorme donne une erreur 400 propre, sans appeler Stripe', async () => {
  let appels = 0;
  const espion = async () => { appels++; return stripeOk(); };
  for (const corps of ['{pas du json', '', 'null', '[]', JSON.stringify({ montant: 10, remplissage: 'x'.repeat(5000) })]) {
    const r = await poster(corps, { fetcher: espion });
    assert.equal(r.status, 400, 'corps : ' + corps.slice(0, 20));
    assert.match((await r.json()).erreur, /^(json-invalide|montant-invalide|trop-gros)$/);
  }
  assert.equal(appels, 0);
});

test('POST /api/don/session : sans clé Stripe, ou avec une clé réelle refusée, le don est « non configuré » (503) et ne divulgue rien', async () => {
  let appels = 0;
  const espion = async () => { appels++; return stripeOk(); };
  const sansCle = await poster({ montant: 10 }, { env: {}, fetcher: espion });
  assert.equal(sansCle.status, 503);
  assert.deepEqual(await sansCle.json(), { erreur: 'don-non-configure' });
  const reelle = await poster({ montant: 10 }, { env: { STRIPE_CLE_SECRETE: 'sk_live_secret_tres_long' }, fetcher: espion });
  assert.equal(reelle.status, 503);
  const texte = await reelle.text();
  assert.doesNotMatch(texte, /sk_live|secret_tres_long|RÉELLE/);
  assert.equal(appels, 0);
});

test('POST /api/don/session : si Stripe échoue, réponse neutre 502 sans le détail de l\'erreur (qui peut citer une clé)', async () => {
  const stripeEnPanne = async () => new Response(JSON.stringify({ error: { message: 'Invalid API Key provided: sk_test_local' } }), { status: 401 });
  const r = await poster({ montant: 10 }, { fetcher: stripeEnPanne });
  assert.equal(r.status, 502);
  const texte = await r.text();
  assert.deepEqual(JSON.parse(texte), { erreur: 'paiement-indisponible' });
  assert.doesNotMatch(texte, /sk_test|Invalid API Key/);
});

test('POST /api/don/session : au plus 10 sessions de paiement par adresse IP et par 10 minutes (429 ensuite) ; les autres adresses ne sont pas touchées', async () => {
  for (let i = 0; i < 10; i++) assert.equal((await poster({ montant: 5 }, { ip: '9.9.9.9' })).status, 200, 'session ' + (i + 1));
  const trop = await poster({ montant: 5 }, { ip: '9.9.9.9' });
  assert.equal(trop.status, 429);
  assert.deepEqual(await trop.json(), { erreur: 'trop-de-tentatives' });
  assert.equal((await poster({ montant: 5 }, { ip: '8.8.8.8' })).status, 200);
});

test('GET /api/don/config : renvoie la clé PUBLIABLE (pk_…) quand elle est configurée, et seulement elle', async () => {
  const ok = await don.traiterDon(new Request(O + '/api/don/config'), { ...envOk, STRIPE_CLE_SECRETE: 'sk_test_ne_doit_jamais_sortir' }, { fetcher: stripeOk });
  assert.equal(ok.status, 200);
  const texte = await ok.text();
  assert.deepEqual(JSON.parse(texte), { cle: 'pk_test_local' });
  assert.doesNotMatch(texte, /sk_test/);
});

test('Diagnostic LOCAL : en local seulement, la raison du refus de Stripe est journalisée côté serveur ; la réponse reste neutre, et en production rien n\'est journalisé', async () => {
  const panne = async () => new Response(JSON.stringify({ error: { message: 'Invalid API Key provided: sk_test_****abcd' } }), { status: 401 });
  const journal = []; const origine = console.error; console.error = (...a) => journal.push(a.join(' '));
  try {
    const local = await poster({ montant: 10 }, { env: { ...envOk, ENVIRONNEMENT: 'local' }, fetcher: panne, ip: '7.7.7.7' });
    assert.equal(local.status, 502); assert.doesNotMatch(await local.text(), /Invalid API Key/);
    assert.equal(journal.length, 1); assert.match(journal[0], /Invalid API Key/);
    journal.length = 0;
    await poster({ montant: 10 }, { env: envOk, fetcher: panne, ip: '7.7.7.8' });
    assert.equal(journal.length, 0, 'rien en production');
  } finally { console.error = origine; }
});

test('GET /api/don/config sans clé publiable : réponse calme 200 « pas de clé » (état normal avant la mise en service), jamais une erreur serveur à chaque visite', async () => {
  const lire = env => don.traiterDon(new Request(O + '/api/don/config'), env, { fetcher: stripeOk });
  for (const env of [{}, { STRIPE_CLE_SECRETE: 'sk_test_local' }, { STRIPE_CLE_PUBLIABLE: 'sk_test_oups_mauvaise_cle' }]) {
    const r = await lire(env);
    assert.equal(r.status, 200);
    const texte = await r.text();
    assert.deepEqual(JSON.parse(texte), { cle: null });
    assert.doesNotMatch(texte, /sk_test|oups/);
  }
});

test('Cloudflare Pages Functions : /api/don/config et /api/don/session sont branchées sur traiterDon, sans dépendre de Firebase ni des comptes', async () => {
  const config = await import('../../functions/api/don/config.js');
  const rc = await config.onRequest({ request: new Request(O + '/api/don/config'), env: { STRIPE_CLE_PUBLIABLE: 'pk_test_abc123' } });
  assert.deepEqual(await rc.json(), { cle: 'pk_test_abc123' });
  const session = await import('../../functions/api/don/session.js');
  const rs = await session.onRequest({ request: new Request(O + '/api/don/session', { method: 'POST', headers: { 'X-LDN': '1', Origin: O }, body: '{"montant":5}' }), env: {} });
  assert.equal(rs.status, 503);
  assert.deepEqual(await rs.json(), { erreur: 'don-non-configure' });
});
