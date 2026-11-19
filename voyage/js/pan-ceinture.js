// Taille du bout de la ceinture selon l'inclinaison du buste (rad).
export function echellePan(angle) {
  const t = Math.min(1, Math.max(0, (angle - 0.9) / 0.3));
  return Math.max(0.001, 1 - t * t * (3 - 2 * t));
}
