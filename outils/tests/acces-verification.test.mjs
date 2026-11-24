// Accès au jeu : l'adresse e-mail du parent doit être vérifiée (décision du 24/11/2026). Côté navigateur, la garde l'explique ; le serveur reste seul juge.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('accès : un parent connecté dont l\'adresse e-mail n\'est pas vérifiée doit la vérifier, même avec un profil enfant enregistré sur l\'appareil', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: true, connecte: true, emailVerifie: false, profil: { id: 'e1' } }), 'verification');
});

test('accès : un parent dont l\'adresse est vérifiée n\'est pas arrêté par cette règle', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: true, connecte: true, emailVerifie: true, profil: { id: 'e1' } }), 'ok');
  assert.equal(decision({ comptesOuverts: true, connecte: true, emailVerifie: true, profil: null }), 'profil');
  assert.equal(decision({ comptesOuverts: true, connecte: false, emailVerifie: false, profil: null }), 'connexion', 'un visiteur doit d\'abord se connecter');
});

test('accès : le message de vérification est clair, en français, et mentionne l\'e-mail reçu et l\'Espace famille', () => {
  const { textes } = require('../../compte/acces-logique.js');
  assert.ok(textes.verification.titre && textes.verification.texte);
  assert.match(textes.verification.texte, /e-mail/i); assert.match(textes.verification.texte, /Espace famille/);
  assert.ok(!/(erreur|undefined|null|403)/i.test(textes.verification.titre + textes.verification.texte));
});

test('accès : la garde affiche l\'écran de vérification avec un lien vers l\'Espace famille et transmet l\'état de vérification', async () => {
  const fs = await import('node:fs'); const js = fs.readFileSync(new URL('../../compte/acces.js', import.meta.url), 'utf8');
  assert.match(js, /ecranVerification/); assert.match(js, /verification=1#verification/); assert.match(js, /emailVerifie: j && j\.emailVerifie/);
});
