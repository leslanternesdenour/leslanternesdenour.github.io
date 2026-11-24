// Tests de la fonction serveur des droits : node --test outils/tests/droits.test.mjs
import test from 'node:test'; import assert from 'node:assert/strict';
import { calculerDroits, peutAcceder, verifierActivationInvitation, verifierSouscription, profilsAGeler, creerCodeInvitation, empreinteCode, estCreateur } from '../../serveur/droits.js';

const J = 86400000, T = Date.UTC(2026, 10, 19, 12), env = { CREATOR_UID: 'uid-createur' };
const offert = (niveau, fin, extra = {}) => ({ niveau, debut: T - J, fin, ...extra });
const ab = (formule, statut = 'active', fin = T + 20 * J) => ({ formule, statut, finPeriode: fin });
const d = (uid, claims, sources) => calculerDroits({ uid, claims, env, sources, maintenant: T });

test('Créateur : double verrou (rôle ET CREATOR_UID)', () => {
  const c = d('uid-createur', { role: 'creator' }, {});
  assert.equal(c.statut, 'creator'); assert.equal(c.profilsMax, Infinity); assert.equal(c.admin, true); assert.equal(c.apercu, true);
  assert.equal(d('uid-createur', {}, {}).statut, 'gratuit', 'sans le rôle : refusé');
  assert.equal(d('uid-pirate', { role: 'creator' }, {}).statut, 'gratuit', 'rôle sur un autre compte : refusé');
  assert.equal(estCreateur('uid-createur', { role: 'creator' }, {}), false, 'CREATOR_UID absent : personne n\'est Créateur');
  assert.equal(estCreateur('', { role: 'creator' }, { CREATOR_UID: '' }), false, 'CREATOR_UID vide : refusé');
  assert.equal(d('uid-pirate', { role: 'creator', admin: true }, { accesOfferts: [offert('createur', null)] }).statut, 'gratuit', 'un accès « createur » offert est ignoré');
});

test('Créateur : jamais dépendant de Stripe', () => {
  const c = d('uid-createur', { role: 'creator' }, { abonnement: ab('premium_mensuel', 'canceled', T - J) });
  assert.equal(c.statut, 'creator'); assert.equal(c.payant, false);
});

test('Invité : temporaire, permanent, expiré, révoqué, futur', () => {
  assert.equal(d('u1', {}, { accesOfferts: [offert('famille', T + 30 * J)] }).statut, 'invite');
  const p = d('u1', {}, { accesOfferts: [offert('premium', null)] }); assert.equal(p.niveau, 'premium'); assert.equal(p.expire, null);
  assert.equal(d('u1', {}, { accesOfferts: [offert('famille', T - 1)] }).statut, 'gratuit', 'expiré');
  assert.equal(d('u1', {}, { accesOfferts: [offert('famille', null, { revoqueLe: T - 60000 })] }).statut, 'gratuit', 'révoqué');
  assert.equal(d('u1', {}, { accesOfferts: [{ niveau: 'famille', debut: T + J, fin: null }] }).statut, 'gratuit', 'pas encore commencé');
  assert.equal(d('u1', {}, { accesOfferts: [offert('premium', T + J), offert('famille', T + 2 * J)] }).niveau, 'famille', 'le meilleur l\'emporte');
});

test('Abonné : formules, statuts Stripe, échéance', () => {
  assert.deepEqual([d('u', {}, { abonnement: ab('premium_mensuel') }).niveau, d('u', {}, { abonnement: ab('famille_annuel') }).niveau], ['premium', 'famille']);
  assert.equal(d('u', {}, { abonnement: ab('premium_annuel', 'trialing') }).statut, 'abonne');
  for (const s of ['past_due', 'canceled', 'unpaid', 'incomplete']) assert.equal(d('u', {}, { abonnement: ab('premium_mensuel', s) }).statut, 'gratuit', s);
  assert.equal(d('u', {}, { abonnement: ab('premium_mensuel', 'active', T - 1) }).statut, 'gratuit', 'période échue');
  assert.equal(d('u', {}, { abonnement: ab('formule_inventee') }).statut, 'gratuit', 'formule inconnue');
});

test('Profils et synchronisation : 4 profils et sauvegarde pour toute formule (organisation du 24/11/2026)', () => {
  assert.deepEqual([d('u', {}, {}).profilsMax, d('u', {}, { abonnement: ab('premium_annuel') }).profilsMax, d('u', {}, { abonnement: ab('famille_annuel') }).profilsMax], [4, 4, 4]);
  assert.equal(d('u', {}, { abonnement: ab('premium_annuel') }).synchro, true);
  assert.equal(d('u', {}, { abonnement: ab('famille_annuel') }).synchro, true);
});

test('Accès aux contenus', () => {
  const g = d('u', {}, {}), p = d('u', {}, { abonnement: ab('premium_mensuel') }), f = d('u', {}, { abonnement: ab('famille_annuel') }), c = d('uid-createur', { role: 'creator' }, {});
  assert.equal(peutAcceder('libre', null), true);
  assert.equal(peutAcceder('gratuit', null), false, 'sans compte');
  assert.deepEqual(['premium', 'famille', 'apercu'].map(n => peutAcceder(n, g)), [false, false, false]);
  assert.deepEqual(['premium', 'famille', 'apercu'].map(n => peutAcceder(n, p)), [true, false, false]);
  assert.deepEqual(['premium', 'famille', 'apercu'].map(n => peutAcceder(n, f)), [true, true, false], 'aperçu : jamais pour un abonné');
  assert.deepEqual(['premium', 'famille', 'apercu', 'gratuit'].map(n => peutAcceder(n, c)), [true, true, true, true]);
  assert.equal(peutAcceder('niveau-inconnu', c), false, 'inconnu = refusé, même au Créateur');
});

test('Invitations : 14 jours, adresse précise, usage unique, e-mail vérifié', () => {
  const inv = { email: 'Soeur@Exemple.fr ', expireLe: T + 14 * J };
  const compte = { email: 'soeur@exemple.fr', emailVerifie: true };
  assert.deepEqual(verifierActivationInvitation({ invitation: inv, compte, maintenant: T }), { ok: true });
  const r = (i, c, a) => verifierActivationInvitation({ invitation: i, compte: c, abonnement: a, maintenant: T }).raison;
  assert.equal(r({ ...inv, expireLe: T - 1 }, compte), 'expiree');
  assert.equal(r({ ...inv, utiliseeLe: T - J }, compte), 'deja-utilisee');
  assert.equal(r(inv, { ...compte, email: 'autre@exemple.fr' }), 'autre-adresse');
  assert.equal(r(inv, { ...compte, emailVerifie: false }), 'email-non-verifie');
  assert.equal(r(null, compte), 'inconnue');
});

test('Double facturation : bloquée dans les deux sens', () => {
  const inv = { email: 'a@b.fr', expireLe: T + J }, compte = { email: 'a@b.fr', emailVerifie: true };
  assert.equal(verifierActivationInvitation({ invitation: inv, compte, abonnement: ab('premium_mensuel'), maintenant: T }).raison, 'abonnement-actif');
  assert.equal(verifierActivationInvitation({ invitation: inv, compte, abonnement: ab('premium_mensuel', 'canceled', T - J), maintenant: T }).ok, true, 'abonnement terminé : OK');
  const invite = d('u', {}, { accesOfferts: [offert('famille', null)] });
  assert.equal(verifierSouscription({ droits: invite, formule: 'premium_mensuel' }).raison, 'acces-offert-actif');
  assert.equal(verifierSouscription({ droits: d('uid-createur', { role: 'creator' }, {}), formule: 'famille_annuel' }).raison, 'compte-createur');
  assert.equal(verifierSouscription({ droits: d('u', {}, {}), formule: 'famille_annuel' }).ok, true);
  assert.equal(verifierSouscription({ droits: d('u', {}, { abonnement: ab('premium_annuel') }), formule: 'famille_annuel' }).raison, 'deja-abonne');
});

test('Fin d\'un accès Famille : profils en trop gelés, jamais supprimés', () => {
  const enfants = [{ id: 'a', creeLe: 1 }, { id: 'b', creeLe: 2 }, { id: 'c', creeLe: 3 }];
  assert.deepEqual(profilsAGeler(enfants, 1), ['b', 'c'], 'par défaut : le plus ancien reste actif');
  assert.deepEqual(profilsAGeler(enfants, 1, 'c'), ['a', 'b'], 'le parent choisit');
  assert.deepEqual(profilsAGeler(enfants, 5), []);
  assert.deepEqual(profilsAGeler(Array.from({ length: 500 }, (_, i) => ({ id: 'e' + i, creeLe: i })), Infinity), [], 'Créateur : illimité');
});

test('Codes d\'invitation : longs, uniques, seule l\'empreinte est stockée', async () => {
  const codes = new Set(Array.from({ length: 2000 }, creerCodeInvitation));
  assert.equal(codes.size, 2000);
  const c = [...codes][0]; assert.match(c, /^LDN_[A-Za-z0-9_-]{43}$/, '256 bits');
  const e = await empreinteCode(c); assert.match(e, /^[0-9a-f]{64}$/); assert.notEqual(e, c); assert.equal(e, await empreinteCode(c));
});
