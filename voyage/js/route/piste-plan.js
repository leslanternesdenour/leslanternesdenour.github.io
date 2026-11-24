// Le repérage sur la grande piste (pur) : l'enfant est-il trop loin de la piste, hors des endroits où l'on va exprès (sentiers, montagnes, hameau, cité) ?
import { distanceChemin, distanceSentier, relief, HAMEAU, CITE, S_FIN_TRANCHE } from './relief.js';
export function loinDeLaPiste(s, t) {
  if (s > S_FIN_TRANCHE) return false;                                       // au-delà : la pièce d'une maison
  if (distanceChemin(s, t) < 110) return false;
  if (distanceSentier(s, t) < 70) return false;                              // un sentier (oasis, montagnes, hameau)
  if (Math.hypot(s - HAMEAU.s, t - HAMEAU.t) < HAMEAU.r + 60) return false;  // le hameau
  if (Math.hypot(s - CITE.s, t - CITE.t) < CITE.rayon + 100) return false;   // la cité
  if (relief(s, t).massif > 0.05) return false;                              // les montagnes
  return true;
}
