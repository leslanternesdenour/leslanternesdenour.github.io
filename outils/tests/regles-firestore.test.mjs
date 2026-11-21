// Règles Firestore testées dans l'ÉMULATEUR OFFICIEL Firebase : tout est refusé à tout client, quel que soit son état de connexion.
// Lancement : bash outils/tests/regles-emulateur.sh  (installe firebase-tools hors dépôt, aucun compte, aucun réseau Google en dehors du téléchargement de l'émulateur)
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc, collection, collectionGroup, getDocs, query, where, writeBatch, runTransaction } from 'firebase/firestore';

const [h, p] = (process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8089').split(':');
const env = await initializeTestEnvironment({ projectId: 'demo-ldn', firestore: { host: h, port: +p, rules: fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
const COLLECTIONS = ['familles', 'abonnements', 'acces_offerts', 'invitations', 'catalogue', 'etat', 'admin_logs', 'droits', 'bandeau', 'stripe_clients', 'stripe_evenements', 'consentements_achat', 'inconnue'];
const SOUS = ['familles/U1/enfants', 'familles/U1/enfants/E1/progression', 'catalogue/c/versions'];
const clients = () => ({
  anonyme: env.unauthenticatedContext(),
  connecte: env.authenticatedContext('U1', { email: 'a@b.fr', email_verified: true }),
  autre: env.authenticatedContext('U2', { email: 'c@d.fr', email_verified: true }),
  createur: env.authenticatedContext('CREA', { role: 'creator', email_verified: true }),
  admin: env.authenticatedContext('ADM', { role: 'admin', admin: true, email_verified: true }),
  premium: env.authenticatedContext('PRE', { premium: true, plan: 'famille', email_verified: true }),
});
// Données réelles posées en contournant les règles (comme le fait le compte de service) : elles doivent rester illisibles.
await env.withSecurityRulesDisabled(async (c) => { const d = c.firestore();
  for (const col of COLLECTIONS) await setDoc(doc(d, col, 'U1'), { uid: 'U1', secret: 'x', role: 'creator' });
  for (const s of SOUS) await setDoc(doc(d, s, 'X1'), { secret: 'x' });
});

for (const [nom, ctx] of Object.entries(clients())) {
  const d = ctx.firestore();
  test(`${nom} : aucune lecture ni liste, sur toute collection et sous-collection`, async () => {
    for (const col of COLLECTIONS) { await assertFails(getDoc(doc(d, col, 'U1'))); await assertFails(getDoc(doc(d, col, 'absent'))); await assertFails(getDocs(collection(d, col))); await assertFails(getDocs(query(collection(d, col), where('uid', '==', 'U1')))); }
    for (const s of SOUS) { await assertFails(getDoc(doc(d, s, 'X1'))); await assertFails(getDocs(collection(d, s))); }
    await assertFails(getDocs(collectionGroup(d, 'enfants'))); await assertFails(getDocs(collectionGroup(d, 'progression')));
  });
  test(`${nom} : aucune écriture (création, remplacement, mise à jour, suppression, lot, transaction)`, async () => {
    for (const col of COLLECTIONS) {
      await assertFails(setDoc(doc(d, col, 'NOUVEAU'), { a: 1 })); await assertFails(setDoc(doc(d, col, 'U1'), { role: 'creator' }));
      await assertFails(updateDoc(doc(d, col, 'U1'), { role: 'creator', premium: true })); await assertFails(deleteDoc(doc(d, col, 'U1'))); await assertFails(addDoc(collection(d, col), { a: 1 }));
    }
    for (const s of SOUS) { await assertFails(setDoc(doc(d, s, 'N'), { a: 1 })); await assertFails(updateDoc(doc(d, s, 'X1'), { a: 1 })); await assertFails(deleteDoc(doc(d, s, 'X1'))); }
    const b = writeBatch(d); b.set(doc(d, 'familles', 'Z'), { a: 1 }); await assertFails(b.commit());
    await assertFails(runTransaction(d, async (t) => { t.set(doc(d, 'familles', 'Z'), { a: 1 }); }));
  });
}
test('auto-attribution de privilèges refusée (famille, abonnement, accès offert, journal)', async () => {
  const d = env.authenticatedContext('U1', { email_verified: true }).firestore();
  await assertFails(setDoc(doc(d, 'familles', 'U1'), { role: 'creator', plan: 'famille' }));
  await assertFails(setDoc(doc(d, 'abonnements', 'U1'), { statut: 'active', plan: 'famille' }));
  await assertFails(setDoc(doc(d, 'acces_offerts', 'U1'), { actif: true }));
  await assertFails(deleteDoc(doc(d, 'admin_logs', 'U1')));
});
test('les données posées par le serveur sont intactes après toutes les tentatives', async () => {
  await env.withSecurityRulesDisabled(async (c) => { const s = await getDoc(doc(c.firestore(), 'familles', 'U1')); assert.deepEqual(s.data(), { uid: 'U1', secret: 'x', role: 'creator' }); });
});
test.after(() => env.cleanup());
