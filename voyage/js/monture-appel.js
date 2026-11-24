// L'appel de la monture (pur, sans Three.js) : quel état pour le bouton ? où la faire arriver quand elle est très loin ?
// Un SEUL bouton (celui de « Monter / Descendre ») : on n'ajoute aucun second système de monture.
export function etatAppel({ monte, sequence, venir, soin, rentre, dist, seuilMonter = 4 }) {
  if (sequence) return { mode: null };
  if (venir && !monte) return { mode: 'arrive', label: 'Arrive…' };
  if (monte) return { mode: 'descendre', label: 'Descendre' };
  if (dist < seuilMonter) return { mode: 'monter', label: 'Monter' };
  if (soin) return { mode: 'indisponible', label: 'Appeler', raison: "Ta monture est en train d'être soignée : elle viendra dès que ce sera fini." };
  return { mode: 'appeler', label: 'Appeler' };
}

// Où faire arriver la monture quand elle est très loin (ou dans un autre monde) : à `distance` mètres du joueur, de préférence DERRIÈRE lui (hors du champ de la caméra :
// on ne la voit pas apparaître), sur un terrain acceptable (ni eau ni falaise). Elle court ensuite jusqu'à lui avec le déplacement habituel, qui contourne les obstacles.
// La caméra regarde vers (-sin yaw, -cos yaw) : derrière le joueur = (sin yaw, cos yaw).
export function pointDeRenfort(J, { yaw, distance = 60, acceptable = () => true }) {
  const essais = [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4, 2.0, -2.0, Math.PI];
  for (const d of essais) { const a = yaw + d, x = J.x + Math.sin(a) * distance, z = J.z + Math.cos(a) * distance; if (acceptable(x, z)) return { x, z }; }
  return { x: J.x + Math.sin(yaw) * distance, z: J.z + Math.cos(yaw) * distance };
}
