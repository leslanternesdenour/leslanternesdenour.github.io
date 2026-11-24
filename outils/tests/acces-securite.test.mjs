// Accès au jeu, sécurité : si le système de comptes est indisponible sur un site public, le jeu reste fermé (fail-closed). Seul le développement local reste libre.
import test from 'node:test'; import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

test('accès sécurisé : comptes indisponibles sur un site public : le jeu reste fermé', () => {
  const { decision } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: false, connecte: false, profil: null, hoteLocal: false }), 'indisponible');
  assert.equal(decision({ comptesOuverts: false, connecte: true, profil: { id: 'e1' }, hoteLocal: false }), 'indisponible', 'même avec un profil enregistré sur l\'appareil');
});

test('accès sécurisé : en développement local (localhost, 127.0.0.1), l\'absence de serveur de comptes ne bloque pas', () => {
  const { decision, estHoteLocal } = require('../../compte/acces-logique.js');
  assert.equal(decision({ comptesOuverts: false, connecte: false, profil: null, hoteLocal: true }), 'libre');
  for (const h of ['localhost', '127.0.0.1', '[::1]']) assert.equal(estHoteLocal(h), true, h);
  for (const h of ['leslanternesdenour.fr', 'preproduction.lanternes-de-nour.pages.dev', 'localhost.evil.com', '127.0.0.1.evil.com', '']) assert.equal(estHoteLocal(h), false, h);
});

test('accès sécurisé : un message clair en français explique que le service est indisponible, sans jargon', () => {
  const { textes } = require('../../compte/acces-logique.js');
  assert.ok(textes.indisponible.titre && textes.indisponible.texte); assert.ok(!/(erreur|undefined|null|503)/i.test(textes.indisponible.titre + textes.indisponible.texte));
  assert.match(textes.indisponible.texte, /réessay/i);
});

test('accès sécurisé : la garde ferme le jeu quand le service est indisponible, propose de réessayer, et revérifie au retour sur la page (session expirée)', async () => {
  const fs = await import('node:fs');
  const js = fs.readFileSync(new URL('../../compte/acces.js', import.meta.url), 'utf8');
  assert.match(js, /ecranIndisponible/); assert.match(js, /Réessayer/); assert.match(js, /estHoteLocal\(location\.hostname\)/);
  assert.match(js, /visibilitychange/); assert.match(js, /pageshow/);
  assert.ok(!/\.catch\(function \(\) \{\}\);\s*\}\s*if \(document\.readyState/.test(js), 'une erreur réseau n\'ouvre plus le jeu');
});
