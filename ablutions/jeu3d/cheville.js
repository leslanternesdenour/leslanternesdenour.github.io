// Angle de la cheville (rad) pour que le pied reste à plat sur le sol.
// (y, z) : la direction « devant » du repère de la jambe, exprimée dans le repère du personnage.
export function anglePiedPlat(y, z) {
  return Math.atan2(y, z);
}

// L'angle visé pour la cheville i d'une posture : calculé si la posture demande des pieds à plat, sinon celui qu'elle indique (0 par défaut).
export function cibleCheville(posture, i, y, z) {
  if (posture.piedsPlats) return anglePiedPlat(y, z);
  return posture.cheville ? posture.cheville[i] : 0;
}
