// Les angles de caméra de la page d'aperçu des personnages.
// yaw : 0 = devant le personnage (côté +z, la qibla) ; 90° = côté de sa main gauche (+x) ; 180° = derrière lui.
const v = (yaw, distance, cible, pitch = 0.12) => ({ yaw: yaw * Math.PI / 180, pitch, distance, cible });
export const VUES = {
  face: v(0, 3.0, [0, 0.62, 0]),
  profilGauche: v(90, 3.0, [0, 0.62, 0]),
  profilDroit: v(-90, 3.0, [0, 0.62, 0]),
  troisQuartsGauche: v(40, 3.0, [0, 0.62, 0]),
  troisQuartsDroit: v(-40, 3.0, [0, 0.62, 0]),
  dos: v(180, 3.0, [0, 0.62, 0]),
  visage: v(20, 0.85, [0, 1.25, 0.05], 0.05),
  mains: v(-35, 1.0, [-0.1, 0.5, 0.1], 0.3),
  pieds: v(-30, 1.0, [0, 0.08, 0.05], 0.25)
};
export function positionCamera(vue) {
  const { yaw, pitch, distance, cible } = vue;
  return [cible[0] + Math.sin(yaw) * Math.cos(pitch) * distance, cible[1] + Math.sin(pitch) * distance, cible[2] + Math.cos(yaw) * Math.cos(pitch) * distance];
}
