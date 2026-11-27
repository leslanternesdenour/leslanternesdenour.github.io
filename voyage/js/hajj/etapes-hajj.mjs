// Étapes du Hajj - architecture réutilisant LIEUX_ROUTE, LIEUX_SACRES, systèmes existants
import { LIEUX_SACRES } from './route/lieux-mecque-a-valider.js';
import { LIEUX_ROUTE, STATUT_ACTUEL, infoSacree } from './donnees.js';
import { L as L3D } from './route/lieux-3d.js';

export const ETAPES_HAJJ = [
  // Étape 1 : Miqat et Ihram (avant La Mecque)
  {
    id: 'miqat',
    nom: 'Miqat et Ihram',
    position: { x: -100, z: -200 }, // avant La Mecque
    description: 'L'enfant franchit le Miqat et entre en état d\'Ihram.',
    activites: ['vêtements-ihraam', 'talbiyah'],
    valid: true
  },
  // Étape 2 : Arrivée à La Mecque (réutilise cite-place existant)
  {
    id: 'arrivee-mecque',
    nom: 'Arrivée à La Mecque',
    position: { x: 0, z: 0 }, // position de cite-place existante
    description: 'Découverte de La Mecque et de la Mosquée sacrée.',
    activites: ['découverte-mekke', 'kaaba-vue'],
    valid: true,
    reference: 'cite-place'
  },
  // Étape 3 : Tawaf
  {
    id: 'tawaf',
    nom: 'Le Tawaf',
    position: { x: 0, z: 0 },
    description: 'Les sept tours autour de la Kaaba.',
    activites: ['tawaf-sept-tours', 'progression-tawaf'],
    reference: 'cite-place',
    valid: true
  },
  // ... autres étapes continueront ici
];

// Fonction pour créer les lieux Hajj en réutilisant l'architecture existante
export function creerEtapesHajj({ scene, hauteur, colliders, ombres, TX }) {
  const étapes = [];
  
  // Étape 1 : Miqat
  const miqat = {
    id: 'miqat-environnement',
    geometry: new THREE.SphereGeometry(50, 32, 32),
    matériau: new THREE.MeshStandardMaterial({ color: '#2a1a5e', transparent: true, opacity: 0.8 }),
    position: { x: -150, z: -250 }
  };
  // ... création des éléments
  
  return étapes;
}
