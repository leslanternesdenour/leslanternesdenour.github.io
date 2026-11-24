// Les voyageurs fictifs de la cité : un trajet est une ligne brisée parcourue en aller-retour (pur, sans Three.js).
export const longueur = pts => { let L = 0; for (let i = 0; i < pts.length - 1; i++) L += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return L; };
// Position à la distance d parcourue (aller puis retour, en boucle) ; renvoie aussi la direction de marche (cap)
export function positionSur(pts, d) {
  const L = longueur(pts), cycle = 2 * L, u = ((d % cycle) + cycle) % cycle, aller = u <= L, k = aller ? u : cycle - u;
  let reste = k;
  for (let i = 0; i < pts.length - 1; i++) {
    const [as, at] = pts[i], [bs, bt] = pts[i + 1], seg = Math.hypot(bs - as, bt - at);
    if (reste <= seg || i === pts.length - 2) { const f = seg ? Math.min(1, reste / seg) : 0, ds = bs - as, dt = bt - at, sens = aller ? 1 : -1; return { s: as + ds * f, t: at + dt * f, cap: Math.atan2(dt * sens, ds * sens) }; }
    reste -= seg;
  }
  return { s: pts[0][0], t: pts[0][1], cap: 0 };
}
