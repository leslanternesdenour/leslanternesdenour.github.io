// Logique du formulaire de don de /soutenir/ (sans navigateur, sans réseau, sans Stripe). node --test outils/tests/soutenir-don.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { lireMontant, MONTANT_MIN, MONTANT_MAX } from '../../soutenir/don-logique.js';
import { validerMontantDon } from '../../serveur/don.js';
import * as logique from '../../soutenir/don-logique.js';

// Fausse « vue » : enregistre ce que la page afficherait (aucun navigateur).
const fausseVue = () => { const j = []; return { j, montrerBientot: () => j.push('bientot'), montrerFormulaire: () => j.push('formulaire'), montrerErreur: m => j.push('erreur:' + m), montrerPaiement: () => j.push('paiement'), montrerMerci: () => j.push('merci') }; };

test('Montants : 5, 10 et 20 € se choisissent en un clic', () => {
  for (const m of ['5', '10', '20']) assert.deepEqual(lireMontant(m, ''), { ok: true, montant: Number(m) });
});

test('Montant libre : euros entiers de 1 à 500, espaces autour ignorés', () => {
  assert.deepEqual(lireMontant('libre', ' 37 '), { ok: true, montant: 37 });
  assert.deepEqual(lireMontant('libre', '1'), { ok: true, montant: 1 });
  assert.deepEqual(lireMontant('libre', '500'), { ok: true, montant: 500 });
});

test('Montants invalides refusés : vide, zéro, trop grand, virgule, négatif, texte, aucun choix, montant non proposé', () => {
  const refus = { ok: false, raison: 'montant-invalide' };
  for (const libre of ['', '   ', '0', '501', '2,5', '2.5', '-4', 'abc', '1e2', '12 €', '٣٠']) assert.deepEqual(lireMontant('libre', libre), refus, 'libre : ' + JSON.stringify(libre));
  assert.deepEqual(lireMontant(null, '10'), refus, 'aucun choix');
  assert.deepEqual(lireMontant('15', ''), refus, 'seuls 5, 10 et 20 sont proposés en un clic');
});

test('Démarrage : si le don n\'est pas configuré (serveur absent, 503), la page garde « bientôt disponible » et ne montre aucun formulaire', async () => {
  const vue = fausseVue();
  const c = logique.creerControleurDon({ chargerConfig: async () => { throw new Error('503'); }, creerSession: async () => { throw new Error('ne doit pas être appelé'); }, monterPaiement: async () => { throw new Error('ne doit pas être appelé'); }, vue });
  await c.demarrer();
  assert.deepEqual(vue.j, ['bientot']);
});

test('Démarrage : si le don est configuré, le formulaire de montant s\'affiche (et rien d\'autre)', async () => {
  const vue = fausseVue();
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), vue });
  await c.demarrer();
  assert.deepEqual(vue.j, ['formulaire']);
});

test('Validation : un montant invalide affiche un message clair et ne contacte jamais le serveur', async () => {
  const vue = fausseVue();
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), creerSession: async () => { throw new Error('ne doit pas être appelé'); }, vue });
  await c.demarrer();
  await c.valider('libre', '0');
  await c.valider(null, '');
  assert.deepEqual(vue.j, ['formulaire', 'erreur:Merci de choisir un montant entier entre 1 € et 500 €.', 'erreur:Merci de choisir un montant entier entre 1 € et 500 €.']);
});

test('Paiement : un montant valide crée la session côté serveur, puis monte le formulaire Stripe dans la page', async () => {
  const vue = fausseVue(), appels = [];
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }),
    creerSession: async m => { appels.push('session:' + m); return 'cs_secret'; },
    monterPaiement: async o => { appels.push('monter:' + o.cle + ':' + o.clientSecret + ':' + typeof o.onComplete); return { destroy() {} }; }, vue });
  await c.demarrer();
  await c.valider('10', '');
  assert.deepEqual(appels, ['session:10', 'monter:pk_test_abc:cs_secret:function']);
  assert.deepEqual(vue.j, ['formulaire', 'paiement']);
});

test('Échec du serveur ou de Stripe : message simple (aucun détail technique), le formulaire reste utilisable', async () => {
  const vue = fausseVue(); const erreurs = [Object.assign(new Error('x'), { code: 'trop-de-tentatives' }), Object.assign(new Error('Invalid API Key sk_test_zzz'), { code: 'paiement-indisponible' }), new Error('réseau coupé')];
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), creerSession: async () => { throw erreurs.shift(); }, monterPaiement: async () => ({ destroy() {} }), vue });
  await c.demarrer();
  await c.valider('5', ''); await c.valider('5', ''); await c.valider('5', '');
  const indispo = 'erreur:Le paiement est momentanément indisponible. Merci de réessayer plus tard.';
  assert.deepEqual(vue.j, ['formulaire', 'erreur:Trop d\'essais en peu de temps. Merci de réessayer dans quelques minutes.', indispo, indispo]);
  assert.doesNotMatch(vue.j.join('|'), /sk_test|Invalid|réseau/);
});

test('« Changer le montant » : le formulaire Stripe est détruit et on revient au choix du montant', async () => {
  const vue = fausseVue(); let detruit = 0;
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), creerSession: async () => 'cs_secret', monterPaiement: async () => ({ destroy() { detruit++; } }), vue });
  await c.demarrer(); await c.valider('20', '');
  await c.revenir();
  assert.equal(detruit, 1);
  assert.deepEqual(vue.j, ['formulaire', 'paiement', 'formulaire']);
  await c.revenir();
  assert.equal(detruit, 1, 'rien à détruire une seconde fois');
});

test('Fin du paiement : le formulaire Stripe est retiré et la page remercie', async () => {
  const vue = fausseVue(); let detruit = 0, fin;
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), creerSession: async () => 'cs_secret', monterPaiement: async o => { fin = o.onComplete; return { destroy() { detruit++; } }; }, vue });
  await c.demarrer(); await c.valider('10', '');
  fin();
  assert.equal(detruit, 1);
  assert.deepEqual(vue.j, ['formulaire', 'paiement', 'merci']);
});

test('Double clic : une seule session de paiement est créée', async () => {
  const vue = fausseVue(); let sessions = 0;
  const c = logique.creerControleurDon({ chargerConfig: async () => ({ cle: 'pk_test_abc' }), creerSession: async () => { sessions++; await new Promise(r => setTimeout(r, 20)); return 'cs_secret'; }, monterPaiement: async () => ({ destroy() {} }), vue });
  await c.demarrer();
  await Promise.all([c.valider('10', ''), c.valider('10', ''), c.valider('10', '')]);
  assert.equal(sessions, 1);
  assert.deepEqual(vue.j, ['formulaire', 'paiement']);
});

test('Cohérence navigateur / serveur : mêmes limites, tout montant accepté par la page est accepté par le serveur', () => {
  assert.deepEqual([MONTANT_MIN, MONTANT_MAX], [1, 500]);
  for (const [choix, libre] of [['5', ''], ['10', ''], ['20', ''], ['libre', '1'], ['libre', '37'], ['libre', '500']]) {
    const l = lireMontant(choix, libre); assert.equal(l.ok, true); assert.equal(validerMontantDon(l.montant).ok, true, 'le serveur accepte ' + l.montant);
  }
  for (const m of [MONTANT_MIN - 1, MONTANT_MAX + 1]) { assert.equal(lireMontant('libre', String(m)).ok, false); assert.equal(validerMontantDon(m).ok, false); }
});
