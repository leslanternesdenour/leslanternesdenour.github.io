// Accès au jeu (organisation validée le 24/11/2026) : pour jouer, il faut un compte parent connecté et un profil enfant choisi. Les visiteurs voient la présentation du village.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('accès : un visiteur non connecté, alors que les comptes sont ouverts, doit se connecter ou créer un compte', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: true, connecte: false, profil: null }), 'connexion');
});

test('accès : si les comptes ne sont pas ouverts (serveur absent), le jeu n\'est pas bloqué', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: false, connecte: false, profil: null }), 'libre');
});

test('accès : un parent connecté sans profil enfant choisi doit choisir (ou créer) un profil', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: true, connecte: true, profil: null }), 'profil');
  assert.equal(decision({ comptesOuverts: true, connecte: true, profil: {} }), 'profil', 'un profil sans identifiant ne compte pas');
});

test('accès : un parent connecté avec un profil enfant choisi entre dans le jeu', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: true, connecte: true, profil: { id: 'e1', surnom: 'Amina' } }), 'ok');
});

test('accès : les messages sont en français et sans jargon ; l\'enfant n\'a jamais de compte à créer', () => {
  const { textes } = require('../../compte/acces-logique.js');
  for (const k of ['connexion', 'profil']) { assert.ok(textes[k].titre && textes[k].texte); assert.ok(!/(erreur|undefined|null)/i.test(textes[k].titre + textes[k].texte)); }
  assert.match(textes.connexion.texte, /parent/i, 'on s\'adresse au parent');
});
