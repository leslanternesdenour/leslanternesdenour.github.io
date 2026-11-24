// Les voyageurs fictifs animés de la cité : marchand, tisserande, potier, porteur d'eau… (modèles du jeu, couleurs variées). Aucun personnage historique ni religieux.
// Ils marchent en aller-retour sur des trajets libres, s'arrêtent quand l'enfant s'approche, et ne sont animés que s'ils sont proches (léger sur téléphone).
import { Enfant } from '../personnages.js?v=4';
import { DEC } from './relief.js';
import { VOYAGEURS_VILLE } from './donnees.js';
import { positionSur } from './voyageurs-plan.js';

const DISTANCE_VISIBLE = 150;
export function creerVoyageurs3D({ scene, hauteur, leger = false }) {
  const garde = leger ? ['marchand-dattes', 'potier', 'porteur-eau', 'marcheur-rue', 'puisatier'] : VOYAGEURS_VILLE.map(v => v.id);   // téléphone : moins de personnages
  const liste = VOYAGEURS_VILLE.filter(v => garde.includes(v.id)).map((v, i) => {
    const e = new Enfant(false, v.tenue); e.racine.visible = false; scene.add(e.racine);
    const L = v.trajet ? 1 : 0;
    return { v, e, d: i * 37, x: v.trajet ? v.trajet[0][1] : v.t, z: DEC + (v.trajet ? v.trajet[0][0] : v.s), a: Math.PI * (0.2 + i * 0.37), arret: false, L };
  });
  function maj(dt, t, J) {
    for (const n of liste) {
      const dist = Math.hypot(n.x - J.x, n.z - J.z); n.e.racine.visible = dist < DISTANCE_VISIBLE; if (!n.e.racine.visible) continue;
      let vit = 0;
      if (n.v.trajet) {
        n.arret = dist < 5;
        if (n.arret) n.a += Math.atan2(Math.sin(Math.atan2(J.x - n.x, J.z - n.z) - n.a), Math.cos(Math.atan2(J.x - n.x, J.z - n.z) - n.a)) * Math.min(1, dt * 4);
        else { n.d += (n.v.vitesse || 1.1) * dt; const p = positionSur(n.v.trajet, n.d); n.x = p.t; n.z = DEC + p.s; n.a += Math.atan2(Math.sin(p.cap - n.a), Math.cos(p.cap - n.a)) * Math.min(1, dt * 6); vit = n.v.vitesse || 1.1; }
      } else { n.x = n.v.t; n.z = DEC + n.v.s; if (dist < 6) n.a += Math.atan2(Math.sin(Math.atan2(J.x - n.x, J.z - n.z) - n.a), Math.cos(Math.atan2(J.x - n.x, J.z - n.z) - n.a)) * Math.min(1, dt * 3); }
      n.e.racine.position.set(n.x, hauteur(n.x, n.z), n.z); n.e.racine.rotation.set(0, n.a, 0); n.e.animer(dt, vit, t);
    }
  }
  return { liste, maj, positions: () => liste.map(n => ({ id: n.v.id, x: n.x, z: n.z })), saluer: id => { const n = liste.find(o => o.v.id === id); if (n && n.e.faire) n.e.faire('salut'); } };
}
