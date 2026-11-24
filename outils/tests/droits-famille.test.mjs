// Organisation validée le 24/11/2026 : tout compte parent (Gratuit, Premium, Famille) a jusqu'à 4 profils enfants et la sauvegarde automatique de la progression. Les formules ne servent plus qu'aux contenus.
import test from 'node:test'; import assert from 'node:assert/strict';
import { calculerDroits } from '../../serveur/droits.js';

const J = 86400000, T = Date.UTC(2026, 10, 24, 12), env = { CREATOR_UID: 'uid-createur' };
const ab = formule => ({ formule, statut: 'active', finPeriode: T + 20 * J });
const d = (sources = {}) => calculerDroits({ uid: 'u', claims: {}, env, sources, maintenant: T });

test('droits : un compte Gratuit a jusqu\'à 4 profils enfants', () => {
  assert.equal(d().profilsMax, 4);
});

test('droits : Premium et Famille ont aussi 4 profils, le Créateur reste illimité', () => {
  assert.equal(d({ abonnement: ab('premium_annuel') }).profilsMax, 4);
  assert.equal(d({ abonnement: ab('famille_annuel') }).profilsMax, 4);
  assert.equal(calculerDroits({ uid: 'uid-createur', claims: { role: 'creator' }, env, sources: {}, maintenant: T }).profilsMax, Infinity);
});

test('droits : la progression est sauvegardée automatiquement pour tous les comptes (Gratuit, Premium, Famille)', () => {
  assert.equal(d().synchro, true);
  assert.equal(d({ abonnement: ab('premium_annuel') }).synchro, true);
  assert.equal(d({ abonnement: ab('famille_annuel') }).synchro, true);
});

test('droits : rien n\'est débloqué par ce changement (le niveau de contenu d\'un compte Gratuit reste Gratuit)', () => {
  const g = d(); assert.equal(g.niveau, 'gratuit'); assert.equal(g.payant, false); assert.equal(g.admin, false);
});
