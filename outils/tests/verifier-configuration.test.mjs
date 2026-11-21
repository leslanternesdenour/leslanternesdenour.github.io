import test from 'node:test'; import assert from 'node:assert/strict';
import { analyser } from '../admin/verifier-configuration.mjs';
const vide = { sessions: false, firebaseProjet: false, firebaseCompteDeService: false, createurDesigne: false, stripe: 'non', stripeWebhook: false, stockagePremium: 'non' };
test('rien de configuré : tout est listé avec où le faire ; pas prêt', () => {
  const a = analyser({ configuration: vide }, { firebaseDansLeSite: false }); assert.equal(a.pret, false); assert.equal(a.manque.length, 6);
  assert.ok(a.manque.some(m => /CREATOR_UID/.test(m) && /UID/.test(m)));
});
test('comptes complets (Stripe non requis) : prêt ; clé Stripe invalide signalée', () => {
  const ok = { ...vide, sessions: true, firebaseProjet: true, firebaseCompteDeService: true, createurDesigne: true };
  assert.equal(analyser({ configuration: ok }, { firebaseDansLeSite: true }).pret, true, 'le webhook Stripe manque mais n\'est pas bloquant pour les comptes');
  assert.equal(analyser({ configuration: ok }, { firebaseDansLeSite: false }).pret, false, 'sans la configuration web Firebase : pas prêt');
  assert.equal(analyser({ configuration: { ...ok, createurDesigne: false } }, { firebaseDansLeSite: true }).pret, false);
  assert.match(analyser({ configuration: { ...ok, stripe: 'cle-invalide' } }).lignes.join('\n'), /PAS une clé de test/);
  assert.equal(analyser({}).pret, false);
});
