// Le repérage sur la grande piste (pur) : l'enfant est-il trop loin de la piste, hors des endroits où l'on va exprès (sentiers, montagnes, hameau, cité) ?
import { distanceChemin, distanceSentier, relief, HAMEAU, CITE, S_FIN_TRANCHE, PLATEAU_INTERIEURS } from './relief.js';
import { sentierMontee, MONTEES } from './sentier-montee.js';
export function loinDeLaPiste(s, t) {
  if (s > S_FIN_TRANCHE) return false;                                       // au-delà : la pièce d'une maison
  if (distanceChemin(s, t) < 110) return false;
  if (distanceSentier(s, t) < 70) return false;                              // un sentier (oasis, montagnes, hameau)
  if (Math.hypot(s - HAMEAU.s, t - HAMEAU.t) < HAMEAU.r + 60) return false;  // le hameau
  if (Math.hypot(s - CITE.s, t - CITE.t) < CITE.rayon + 100) return false;   // la cité
  if (relief(s, t).massif > 0.05) return false;                              // les montagnes
  return true;
}

// La zone jouable : l'enfant ne s'aventure jamais là où le monde n'est pas fait (derrière les montagnes, très loin de la piste). Elle comprend la bande de la piste (260 m de chaque côté),
// les sentiers (oasis, montagnes, hameau), les sentiers de montée, le hameau et la cité. Au-delà, un mur invisible et un message doux le ramènent.
export function zoneJouable(s, t) {
  if (Math.hypot(s - PLATEAU_INTERIEURS.s, t - PLATEAU_INTERIEURS.t) < PLATEAU_INTERIEURS.r + 10) return true;   // la pièce d'une maison
  if (distanceChemin(s, t) < 260) return true;
  if (distanceSentier(s, t) < 90) return true;
  if (Math.hypot(s - HAMEAU.s, t - HAMEAU.t) < HAMEAU.r + 70) return true;
  if (Math.hypot(s - CITE.s, t - CITE.t) < CITE.rayon + 150) return true;
  for (const id of Object.keys(MONTEES)) for (const p of sentierMontee(id).pts) if (Math.hypot(s - p[0], t - p[1]) < 100) return true;
  return false;
}
