// Fait ressembler un squelette (ou un modèle .glb chargé) à l'ancien personnage : les trois jeux n'y voient aucune différence.
// On réutilise telles quelles la marche et les petits gestes de l'ancien Voyageur : ils ne touchent que les articulations,
// que le squelette expose avec les mêmes noms et les mêmes décalages.
import { Voyageur } from '../voyage/js/voyageur.js?v=4';

export function adapterSquelette(sq, { ombres = false } = {}) {
  const comportement = { animer: Voyageur.prototype.animer, faire: Voyageur.prototype.faire };
  return Object.assign(Object.create(comportement), { pan: null }, sq, {
    ombres, phase: 0, pose: 'debout', vitesse: 0, repos: 0, regard: 0, regardCible: 0, prochainRegard: 2, clign: 3, geste: null, balJupe: 0, angPrec: null
  });
}
