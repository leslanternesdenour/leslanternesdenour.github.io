// Les sentiers de montée des deux grandes montagnes (pur, sans Three.js) : le chemin LE MOINS RAIDE du pied (la terrasse) jusqu'au belvédère, trouvé par un calcul de plus court chemin
// pondéré par la pente (jamais plus de 0,7 m de dénivelé par mètre, bien en deçà de la limite du jeu : 1,05). On marche dessus du début à la fin, sans jamais être arrêté par la roche.
import { hauteur, TERRASSES, MONTAGNE_NORD, MONTAGNE_SUD } from './relief.js';

export const MONTEES = {
  nord: { terrasse: 'pied-nord', montagne: MONTAGNE_NORD, hauteurBelvedere: 70 },
  sud: { terrasse: 'pied-sud', montagne: MONTAGNE_SUD, hauteurBelvedere: 80 }
};
const memo = new Map();

function calculer(M) {
  const T = TERRASSES.find(x => x.id === M.terrasse), C = M.montagne, E = 3, LARGE = 130;
  const ux = C.s - T.s, ut = C.t - T.t, L = Math.hypot(ux, ut), ds = ux / L, dt = ut / L;
  const pos = (i, j) => { const a = i * E, b = j * E; return [T.s + ds * a - dt * b, T.t + dt * a + ds * b]; };        // repère : i vers le centre de la montagne, j sur le côté
  const key = (i, j) => (i + 1000) * 4096 + (j + 1000), H = new Map();
  const h = (i, j) => { const k = key(i, j); let v = H.get(k); if (v === undefined) { const [s, t] = pos(i, j); v = hauteur(s, t); H.set(k, v); } return v; };
  const dist = new Map([[key(0, 0), 0]]), prev = new Map(), file = [[0, 0, 0]];
  let but = null;
  while (file.length) {
    let m = 0; for (let k = 1; k < file.length; k++) if (file[k][0] < file[m][0]) m = k;
    const [c, i, j] = file.splice(m, 1)[0];
    if (c > dist.get(key(i, j))) continue;
    if (h(i, j) >= M.hauteurBelvedere) { but = [i, j]; break; }
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const a = i + di, b = j + dj; if (Math.abs(b * E) > LARGE || a < -5 || a * E > L) continue;
      const d = Math.hypot(di, dj) * E, p = Math.abs(h(a, b) - h(i, j)) / d; if (p > 0.7) continue;
      const nc = c + d * (1 + 3 * p), kk = key(a, b);
      if (nc < (dist.get(kk) ?? Infinity)) { dist.set(kk, nc); prev.set(kk, [i, j]); file.push([nc, a, b]); }
    }
  }
  if (!but) return { pts: [], haltes: [] };
  const pts = []; let cur = but;
  while (cur) { const [s, t] = pos(cur[0], cur[1]); pts.push([+s.toFixed(1), +t.toFixed(1), +h(cur[0], cur[1]).toFixed(1)]); cur = prev.get(key(cur[0], cur[1])); }
  pts.reverse();
  const haltes = [0.34, 0.68, 1].map(f => { const p = pts[Math.min(pts.length - 1, Math.round((pts.length - 1) * f))]; return { s: p[0], t: p[1], h: p[2] }; });   // la 3e halte est le belvédère
  return { pts, haltes };
}
export const sentierMontee = id => { if (!memo.has(id)) memo.set(id, calculer(MONTEES[id])); return memo.get(id); };
