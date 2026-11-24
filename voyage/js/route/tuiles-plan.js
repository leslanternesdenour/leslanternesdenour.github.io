// Le plan de découpage de La Route en tuiles (pur, sans Three.js). Une tuile = un carré de 64 m (s, t).
export const TAILLE_TUILE = 64;
export const cleTuile = (i, j) => i + ',' + j;
// Les tuiles à garder autour de (s, t), triées de la plus proche à la plus lointaine. rayon : en nombre de tuiles.
export function tuilesAutour(s, t, rayon) {
  const ci = Math.floor(s / TAILLE_TUILE), cj = Math.floor(t / TAILLE_TUILE), liste = [];
  for (let j = cj - rayon - 1; j <= cj + rayon + 1; j++) for (let i = ci - rayon - 1; i <= ci + rayon + 1; i++) {
    const d = Math.hypot((i + 0.5) * TAILLE_TUILE - s, (j + 0.5) * TAILLE_TUILE - t);
    if (d <= rayon * TAILLE_TUILE + TAILLE_TUILE * 0.72) liste.push({ i, j, d });
  }
  liste.sort((a, b) => a.d - b.d);
  return liste.map(({ i, j }) => ({ i, j }));
}
