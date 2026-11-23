// Le semis du décor de La Route, tuile par tuile (pur, sans Three.js) : toujours le même pour la même tuile, léger, et la piste reste libre.
// Le décor de chaque tuile est choisi selon la région (rochers à la sortie, buissons dans la plaine, palmiers à l'oasis…).
import { TAILLE_TUILE } from './tuiles-plan.js';
import { relief, distanceChemin, OASIS, CAMP } from './relief.js';
import { regionA, LIEUX_ROUTE, positionDeLieu } from './donnees.js';

function hasard(graine) { let s = (graine >>> 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

// densité par tuile selon la région : [type, nombre moyen, rayon de collision, échelle min, échelle max]
const SEMIS = {
  sortie: [['rocher', 7, 1.1, 0.8, 2.6], ['caillou', 14, 0, 0.6, 1.4], ['buisson', 6, 0.5, 0.7, 1.3], ['touffe', 6, 0, 0.7, 1.2]],
  plaines: [['rocher', 3, 1.0, 0.7, 2.0], ['caillou', 14, 0, 0.6, 1.4], ['buisson', 12, 0.5, 0.7, 1.4], ['acacia', 0.6, 0.6, 0.9, 1.4], ['touffe', 10, 0, 0.7, 1.3]],
  dunes: [['rocher', 1.5, 1.0, 0.7, 1.8], ['caillou', 6, 0, 0.6, 1.2], ['buisson', 5, 0.5, 0.6, 1.2], ['touffe', 9, 0, 0.7, 1.3]],
  oasis: [['rocher', 1.5, 1.0, 0.7, 1.6], ['caillou', 6, 0, 0.6, 1.2], ['buisson', 6, 0.5, 0.7, 1.3], ['touffe', 8, 0, 0.7, 1.3]]
};
const MONTAGNE = [['rocher', 14, 1.6, 1.4, 4.2], ['caillou', 12, 0, 0.8, 1.8]];

let lieuxPos = null;
const lieux = () => lieuxPos || (lieuxPos = LIEUX_ROUTE.map(positionDeLieu));

export function semerTuile(i, j) {
  const R = hasard(Math.imul(i + 1000, 73856093) ^ Math.imul(j + 1000, 19349663) ^ 0x9e3779b9);
  const s0 = i * TAILLE_TUILE, t0 = j * TAILLE_TUILE, sortie = [];
  const valide = (s, t, type) => {
    const dC = distanceChemin(s, t);
    if (dC < 3.5) return false;
    const r = relief(s, t);
    if (type !== 'roseau' && (r.lac > 0.02 || r.dOasis < OASIS.lac + 3)) return false;
    if (r.dCamp < CAMP.r + 6) return false;
    for (const p of lieux()) if (Math.hypot(p.s - s, p.t - t) < 5) return false;
    return true;
  };
  const poser = (type, nb, rayon, a, b, s1, t1, s2, t2) => {
    const n = Math.floor(nb) + (R() < nb - Math.floor(nb) ? 1 : 0);
    for (let k = 0; k < n; k++) for (let essai = 0; essai < 6; essai++) {
      const s = s1 + R() * (s2 - s1), t = t1 + R() * (t2 - t1);
      if (!valide(s, t, type)) continue;
      sortie.push({ type, s: +s.toFixed(2), t: +t.toFixed(2), rot: +(R() * 6.283).toFixed(3), sc: +(a + R() * (b - a)).toFixed(2), r: rayon }); break;
    }
  };
  const centreS = s0 + TAILLE_TUILE / 2, centreT = t0 + TAILLE_TUILE / 2;
  const regle = SEMIS[regionA(centreS).id];
  const montagneux = Math.abs(centreT) > 380 ? Math.min(1, (Math.abs(centreT) - 380) / 300) : 0;
  for (const [type, nb, rayon, a, b] of regle) poser(type, nb * (1 - 0.7 * montagneux), rayon, a, b, s0, t0, s0 + TAILLE_TUILE, t0 + TAILLE_TUILE);
  if (montagneux) for (const [type, nb, rayon, a, b] of MONTAGNE) poser(type, nb * montagneux, rayon, a, b, s0, t0, s0 + TAILLE_TUILE, t0 + TAILLE_TUILE);
  // l'oasis : des palmiers en couronne autour de l'eau, des roseaux sur la rive
  const dO = Math.hypot(centreS - OASIS.s, centreT - OASIS.t);
  if (dO < OASIS.r + 50) {
    poser('palmier', 9, 0.55, 0.85, 1.3, s0, t0, s0 + TAILLE_TUILE, t0 + TAILLE_TUILE);
    poser('roseau', 6, 0, 0.8, 1.3, s0, t0, s0 + TAILLE_TUILE, t0 + TAILLE_TUILE);
  }
  // un palmier ou un roseau ne doit pas être loin de l'eau : on retire ceux qui sont trop éloignés
  return sortie.filter(o => (o.type !== 'palmier' && o.type !== 'roseau') || (Math.hypot(o.s - OASIS.s, o.t - OASIS.t) > OASIS.lac + 4 && Math.hypot(o.s - OASIS.s, o.t - OASIS.t) < OASIS.r + 30));
}
