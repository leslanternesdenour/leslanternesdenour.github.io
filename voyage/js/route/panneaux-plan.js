// LES PANNEAUX DE BOIS DES DEUX PORTAILS : fichier PUR (aucune 3D), partagé par le décor (panneau-3d.js), le jeu (jeu-route.js) et les tests.
// Deux panneaux de bois sculpté (Arabie du VIIe siècle : bois, corde, laine, lampe à huile ; jamais de signalisation moderne) :
//  - au village, à côté du portail de départ : « Route vers La Mecque », une flèche vers le portail ;
//  - sur la route, à côté du portail de retour : « Retour au village », une flèche vers le portail.
// Gros caractères, symboles simples (portail, village, flèche) : lisible par un enfant de 3 à 10 ans, même sans savoir lire (le symbole et la flèche parlent).
import { versMonde as versMondeVillage, PORTAIL } from './portail-plan.js';
import { REPERE_RETOUR } from './retour-plan.js';
import { creerRepere } from './portail-repere.js';

export const REPERE_VILLAGE = creerRepere(PORTAIL);

// Le panneau se pose sur le côté, devant les marches (jamais sur la piste ni sur les marches), tourné vers celui qui arrive.
// Il renvoie sa position, son orientation (rotation.y de la face avant) et le sens de la flèche (vers le portail) : 'gauche' ou 'droite' VU DE FACE.
const LX = 5.6, LZ = -6.4;
export function poserPanneau(repere) {
  const p = repere.versMonde(LX, LZ), vers = repere.versMonde(0, -12), c = repere.versMonde(0, 0);
  const yaw = Math.atan2(vers.x - p.x, vers.z - p.z);
  const droite = { x: Math.cos(yaw), z: -Math.sin(yaw) };                      // le « côté droit » de la planche, vu de face
  const fleche = (c.x - p.x) * droite.x + (c.z - p.z) * droite.z >= 0 ? 'droite' : 'gauche';
  return { x: p.x, z: p.z, yaw, fleche };
}

export const PANNEAUX = {
  depart: { id: 'depart', ...poserPanneau(REPERE_VILLAGE), ligne1: 'Route vers', ligne2: 'La Mecque', symbole: 'portail' },
  retour: { id: 'retour', ...poserPanneau(REPERE_RETOUR), ligne1: 'Retour', ligne2: 'au village', symbole: 'village' }
};
// Le texte complet lu sur la planche (pour les tests et l'accessibilité)
export const inscription = p => p.ligne1 + ' ' + p.ligne2;

// Lire le panneau (une courte phrase : on lit ce que l'on voit, rien de plus). À faire relire avec les autres nouveaux textes (docs/CONTENUS-A-VALIDER.md).
export const TEXTES_PANNEAUX = {
  depart: {
    titre: 'Route vers La Mecque',
    petit: 'Le panneau dit : « Route vers La Mecque ». La flèche montre le portail de pierre. Tu le franchis quand tu veux !',
    grand: 'Le panneau de bois dit : « Route vers La Mecque ». La flèche montre le portail de pierre, au bout des marches. Il ouvre le début de la grande route.'
  },
  retour: {
    titre: 'Retour au village',
    petit: 'Le panneau dit : « Retour au village ». La flèche montre le portail de pierre. Il te ramène à la maison !',
    grand: 'Le panneau de bois dit : « Retour au village ». La flèche montre le portail de pierre. Il te ramène au village, avec tout ce que tu as trouvé.'
  }
};
export { versMondeVillage };
