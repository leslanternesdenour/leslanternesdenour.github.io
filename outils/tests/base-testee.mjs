// Base utilisée par les tests d'intégration : mémoire par défaut ; le VRAI module Firestore (API REST) contre l'émulateur officiel
// quand LDN_TEST_FIRESTORE=1 (lancé par outils/tests/emulateurs-firebase.sh). Chaque exécution a son propre projet : aucune interférence.
import { baseMemoire } from '../../serveur/base-memoire.js';
import { baseFirestore } from '../../serveur/base-firestore.js';
import { exporter } from '../sauvegarde/restauration.mjs';
export const REEL = process.env.LDN_TEST_FIRESTORE === '1';
export function creerBase() {
  if (!REEL) return baseMemoire();
  const H = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8089';
  const fetcher = (u, o) => fetch(u.replace('https://firestore.googleapis.com', 'http://' + H), o);
  const b = baseFirestore({ projet: 'demo-ldn-' + Math.random().toString(36).slice(2, 10), compte: {}, fetcher, jeton: async () => 'owner' });
  // Les comptes Firebase Authentication de ces tests sont fictifs : on enregistre l'appel (la vraie requête est testée dans base-firestore-emulateur.test.mjs).
  b.utilisateursSupprimes = []; b.rolesCreateurPoses = [];
  b.supprimerUtilisateur = async uid => { b.utilisateursSupprimes.push(uid); };
  b.poserRoleCreateur = async uid => { b.rolesCreateurPoses.push(uid); };
  return b;
}
// Tout le contenu de la base sous forme { 'collection/id': données }, quelle que soit l'implémentation.
export async function instantane(base) {
  if (base._donnees) return Object.fromEntries(base._donnees);
  const e = await exporter(base), out = {};
  for (const [col, docs] of Object.entries(e.collections)) for (const [id, d] of Object.entries(docs)) out[col + '/' + id] = d;
  return out;
}
