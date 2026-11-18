import test from 'node:test';
import assert from 'node:assert/strict';
import { niveauAcces, acces, nouvelEssai, peutDemarrerEssai, accesOffert, prixAffiches, formaterEuros } from './acces.js';
import { REGLAGES_PAR_DEFAUT as R } from './reglages.js';

const J = 86400000, T = Date.parse('2026-12-01T12:00:00Z');

test('sans profil : gratuit', () => assert.equal(niveauAcces(null, T).niveau, 'gratuit'));
test('admin prime sur tout, même suspendu = non', () => {
  assert.equal(niveauAcces({ admin: true }, T).niveau, 'admin');
  assert.equal(niveauAcces({ admin: true, suspendu: true }, T).premium, false);
});
test('offert permanent, daté, expiré, révoqué', () => {
  assert.equal(niveauAcces({ offert: { fin: null } }, T).niveau, 'offert');
  assert.equal(niveauAcces({ offert: { fin: T + J } }, T).niveau, 'offert');
  assert.equal(niveauAcces({ offert: { fin: T - J } }, T).niveau, 'gratuit');
  assert.equal(niveauAcces({ offert: { fin: null, revoque: true } }, T).niveau, 'gratuit');
});
test('payant actif / expiré / résilié mais encore valable', () => {
  assert.equal(niveauAcces({ payant: { statut: 'actif', fin: T + J } }, T).niveau, 'payant');
  assert.equal(niveauAcces({ payant: { statut: 'actif', fin: T - J } }, T).niveau, 'gratuit');
  assert.equal(niveauAcces({ payant: { statut: 'resilie-en-cours', fin: T + J } }, T).premium, true);
  assert.equal(niveauAcces({ payant: { statut: 'echec', fin: T + J } }, T).premium, false);
});
test('essai : valable puis terminé', () => {
  assert.equal(niveauAcces({ essai: { fin: T + J } }, T).niveau, 'essai');
  assert.equal(niveauAcces({ essai: { fin: T - 1 } }, T).niveau, 'gratuit');
});
test('essai : un seul par compte', () => {
  const e = nouvelEssai({}, { maintenant: T });
  assert.equal(e.ok, true);
  assert.equal(e.essai.fin - e.essai.debut, 7 * J);
  assert.equal(nouvelEssai({ essai: e.essai }, { maintenant: T + 30 * J }).raison, 'essai-deja-utilise');
  assert.equal(peutDemarrerEssai({ essai: e.essai, ...{} }, { maintenant: T }).ok, false);
  assert.equal(peutDemarrerEssai({ admin: true }, { maintenant: T }).raison, 'deja-premium');
});
test('accès offert : durées, prolongation, permanent', () => {
  assert.equal(accesOffert({}, '7').ok, false);
  assert.equal(accesOffert({}, 'permanent').offert.fin, null);
  const a = accesOffert({}, '1', { maintenant: T });
  assert.equal(new Date(a.offert.fin).toISOString().slice(0, 10), '2027-01-01');
  const b = accesOffert({ offert: a.offert }, '3', { maintenant: T });
  assert.equal(new Date(b.offert.fin).toISOString().slice(0, 10), '2027-04-01');
});
test('accès aux fonctionnalités', () => {
  assert.equal(acces('decouverte', null, { connecte: false, maintenant: T }).ok, true);
  assert.equal(acces('lecons', null, { connecte: false, maintenant: T }).raison, 'compte-requis');
  const g = acces('lecons', {}, { connecte: true, maintenant: T });
  assert.deepEqual([g.ok, g.limite], [true, 3]);
  assert.equal(acces('nouveautes', {}, { connecte: true, maintenant: T }).raison, 'premium-requis');
  assert.equal(acces('nouveautes', { admin: true }, { maintenant: T }).ok, true);
  assert.equal(acces('alphabet', { admin: true }, { maintenant: T }).raison, 'bientot');
  assert.equal(acces('nimporte', {}, { maintenant: T }).raison, 'inconnue');
});
test('déblocage temporaire', () => {
  const r = { ...R, deblocagesTemporaires: { nouveautes: T + J } };
  assert.equal(acces('nouveautes', {}, { reglages: r, connecte: true, maintenant: T }).raison, 'deblocage');
  assert.equal(acces('nouveautes', {}, { reglages: r, connecte: true, maintenant: T + 2 * J }).ok, false);
});
test('prix : aucune promo ni prix barré par défaut', () => {
  const p = prixAffiches(R, T);
  assert.equal(p.enCours, false);
  assert.equal(p.mensuel.prix, 7.99);
  assert.equal(p.mensuel.barre, null);
});
test('prix : promo active mais prix habituel non validé => pas de prix barré', () => {
  const r = { ...R, promotion: { ...R.promotion, active: true, debut: '2026-12-01', fin: '2026-12-31' } };
  const p = prixAffiches(r, T);
  assert.equal(p.enCours, true);
  assert.equal(p.mensuel.prix, 4.99);
  assert.equal(p.annuel.barre, null);
});
test('prix : promo validée => barré, par mois, économie ; hors dates => retour au prix habituel', () => {
  const r = { ...R, promotion: { ...R.promotion, active: true, debut: '2026-12-01', fin: '2026-12-31', prixHabituelValide: true } };
  const p = prixAffiches(r, T);
  assert.equal(p.annuel.barre, 79.9);
  assert.equal(p.annuelParMois, 4.17);
  assert.equal(p.economieAnnuelle, 29.91);
  assert.equal(prixAffiches(r, Date.parse('2027-01-05T00:00:00Z')).enCours, false);
});
test('promo sans dates => jamais en cours', () => {
  const r = { ...R, promotion: { ...R.promotion, active: true } };
  assert.equal(prixAffiches(r, T).enCours, false);
});
test('format euros', () => assert.equal(formaterEuros(4.99), '4,99 €'));
