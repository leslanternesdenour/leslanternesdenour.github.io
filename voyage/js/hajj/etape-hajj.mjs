// Single file: Hajj steps built on existing architecture
// Réutilise : LIEUX_SACRES (déjà dans voyage/js/route/lieux-mecque-a-valider.js)
// cite-place est au km 5606 du Grand Voyage

import { LIEUX_SACRES } from './../route/lieux-mecque-a-valider.js';
import { LIEUX_ROUTE } from './../route/donnees.js';

// Construction du parcours Hajj en s'appuyant sur l'architecture existante
// La Kaaba cite-place est déjà au km 5606 du Grand Voyage

export const PARCOURS_HAJJ = [
  // --- ÉTAPE 1 : MIQAT (avant La Mecque) ---
  {
    id: 'miqat',
    nom: 'Miqat et Ihram',
    position: { x: -120, z: -220 },
    description: 'Le pèlerin franchit le Miqat et entre en état d\'Ihram.',
    activites: [
      { id: 'etat-ihraam', titre: 'État Ihram', texte: 'Vêtements simples (deux pièces blanches), pas de couture moderne.' },
      { id: 'talbiyah', titre: 'Talbiyah', texte: 'Chant doux : "Labbaik Allahumma labbaik..."' }
    ],
    reference: 'hadith authentic'
  },
  // --- ÉTAPE 2 : ARRIVÉE À LA MECQUE (cite-place existant) ---
  {
    id: 'arrivee-mecque',
    nom: 'Arrivée à La Mecque',
    position: { x: 0, z: 0 }, // cite-place existant
    description: 'Découverte de La Mecque et de la Kaaba.',
    activite: 'Découverte de La Mecque et de la Kaaba.',
    reference: 'cite-place', // architecture 3D existante
    valid: true
  },
  // --- ÉTAPE 3 : TAWAF (autour de la Kaaba existante) ---
  {
    id: 'tawaf',
    nom: 'Le Tawaf',
    position: { x: 0, z: 0 },
    description: ' sept tours autour de la Kaaba.',
    activite: 'Tour autour de la Kaaba avec indicateurs.',
    reference: 'cite-place',
    regles: 'Pas de course, pas de compétition. Acte respectueux.'
  },
  // --- ÉTAPE 4 : SA'I (Safa/Marwa existants) ---
  {
    id: 'safi-marwa',
    nom: 'Sa\'i entre Safa et Marwa',
    position: { x: 50, z: -80 },
    description: 'Marche entre Safa et Marwa, sept fois, en mémoire de Hajar.',
    reference: 'safa-marwa', // LIEUX_SACRES existants
    valid: true,
    regles: 'Huit fois au total. Pas de course, pas de chronomètre.'
  },
  // --- ÉTAPE 5 : MINA (extension géographique) ---
  {
    id: 'mina',
    nom: 'Mina',
    position: { x: 80, z: -100 },
    description: 'Vallée avec les tentes blanches.',
    reference: 'hajj-traditionnelle'
  },
  // --- ÉTAPE 6 : ARAFAT (montagnes existantes) ---
  {
    id: 'arafat',
    nom: 'Arafat',
    position: { x: 30, z: -50 },
    description: 'Jour de Arafat, journée centrale du Hajj.',
    reference: 'montagnes-sacres',
    regles: 'Pas de compétition, pas de chronomètre. Moments de recueillement.'
  },
  // --- ÉTAPE 7 : MUZDALIFAH ---
  {
    id: 'muzdalifah',
    nom: 'Muzdalifah',
    position: { x: 50, z: -30 },
    description: 'Nuit étoilée, collecte de cailloux.',
    reference: 'nuits-hajj'
  },
  // --- ÉTAPE 8 : JAMARAT ---
  {
    id: 'jamarat',
    nom: 'Les Jamarat',
    regles: 'Lancer symbolique aux pilastres. Aucune animation violente. Pas de représentation de Satan.'
  },
  // --- ÉTAPE 9 : SACRIFICE ---
  {
    id: 'sacrifice',
    nom: 'Sacrifice et coupe des cheveux',
    regles: 'Pas de représentation graphique de souffrance. Textes adaptés.'
  },
  // --- ÉTAPE 10 : TAWAF AL-IFADAH ---
  {
    id: 'tawaf-ifadah',
    nom: 'Tawaf al-Ifadah',
    position: { x: 0, z: 0 },
    reference: 'cite-place',
    activite: 'Second tour autour de la Kaaba.'
  },
  // --- ÉTAPE 12 : TAWAF ADIEU ---
  {
    id: 'tawaf-adieu',
    nom: 'Tawaf ad-Du\'a',
    position: { x: 0, z: 0 },
    reference: 'cite-place',
    activite: 'Dernier tour d\'adieu.'
  }
];

// Point d\'accès : obtenir le parcours Hajj
export function obtenirParcoursHajj() {
  return PARCOURS_HAJJ;
}
