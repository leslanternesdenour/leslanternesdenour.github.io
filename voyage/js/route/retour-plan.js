// LE PORTAIL DE RETOUR AU VILLAGE : fichier PUR (aucune 3D), partagé par le décor (portail-3d.js), le jeu (jeu-route.js), la carte (carte-route.js) et les tests.
// Où ? À l'extrémité de la carte, du côté du village : la piste commence à s = -150 (limite arrière) et l'on arrive du portail du village à s = -20. Le portail de retour
// est EN TRAVERS DE LA PISTE, à s = -62 : assez loin derrière l'arrivée pour qu'on ne le voie pas en naissant (la vue s'ouvre vers l'avant de la route), assez près
// pour qu'un enfant qui se retourne le trouve (40 m, une demi-minute de marche), et AVANT la limite de sortie automatique (s = -75, gardée comme filet de sécurité).
// Le sol y est plat (relief.js : PORTAIL_RETOUR), comme à la halte. Même architecture que le portail du village (portail-repere.js) : on le traverse vers le village.
import { DEC, pointChemin, PORTAIL_RETOUR } from './relief.js';
import { creerRepere } from './portail-repere.js';

export { PORTAIL_RETOUR };
// Le cap : on le traverse EN RECULANT sur la piste, vers le village (z décroissant), en suivant la piste
const q = pointChemin(PORTAIL_RETOUR.s - 10);
export const SITE_RETOUR = { x: PORTAIL_RETOUR.t, z: DEC + PORTAIL_RETOUR.s, cap: Math.atan2(q.t - PORTAIL_RETOUR.t, -10) };
export const REPERE_RETOUR = creerRepere(SITE_RETOUR);
export const devantRetour = REPERE_RETOUR.devant;
export const hauteurRetour = REPERE_RETOUR.hauteur;
export const sabloRetourRoute = REPERE_RETOUR.sablo, monteRetourRoute = REPERE_RETOUR.monte;
export const obstaclesRetour = REPERE_RETOUR.obstacles;
// Nour sur la marche haute, face au portail
export const poseRetour = () => { const d = devantRetour(); return { x: d.x, z: d.z, a: REPERE_RETOUR.cap }; };

// Sur la carte ancienne : toujours connu (jamais caché derrière un « ? »), jamais compté dans une mission
export const LIEU_RETOUR = { id: 'portail-retour', type: 'portail', nom: 'Retour au village', icone: '🚪', s: PORTAIL_RETOUR.s, t: PORTAIL_RETOUR.t, toujoursConnu: true };

export const TEXTES_RETOUR = {
  nom: 'Le portail de retour',
  bouton: 'Retourner au village',
  indice: 'Un portail de pierre ramène au village.',
  dialogue: { petit: 'Ce portail te ramène au village. Ton sac, tes lanternes et tout ce que tu as trouvé restent avec toi !', grand: 'Ce portail de pierre te ramène au village de Nour. Ta progression est gardée : ton sac, tes lanternes, tes découvertes et tes missions restent avec toi. Tu pourras revenir sur la route quand tu veux.' },
  oui: 'Retourner au village', non: 'Rester sur la route'
};
