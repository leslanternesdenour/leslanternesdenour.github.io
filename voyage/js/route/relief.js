// Le relief de La Route : une fonction pure (s, t) → hauteur. Aucune donnée à télécharger, aucun Three.js.
// Repère « route » : s = distance parcourue depuis le village (m), t = écart latéral (m). Dans le monde du jeu :
//   x = t, z = DEC + s   (DEC éloigne la Route du village : aucun objet du village ne peut se trouver à proximité).
import { fbm, lisse, melange } from './bruit.js';

export const DEC = 20000;
export const versMonde = (s, t) => ({ x: t, z: DEC + s });
export const versRoute = (x, z) => ({ s: z - DEC, t: x });
export const dansLaRoute = z => z > DEC - 2000;          // le village ne dépasse jamais |z| = 400

export const S_DEBUT = -150;           // un peu en arrière du seuil (pour qu'on voie la piste qu'on vient de quitter)
export const S_FIN_TRANCHE = 2900;     // le cairn « le chemin continue » de la première tranche
export const LARGEUR = 1000;           // le monde ne va pas plus loin que ±900 m de la piste

// Points de la piste principale (s, t). Elle serpente doucement : jamais une ligne droite d'horizon à horizon.
const PISTE = [[-300, 50], [-150, 48], [-40, 45], [120, 30], [300, -10], [520, -40], [760, -20], [1000, 10], [1100, 0], [1350, 40],
  [1600, 90], [1850, 60], [2100, 20], [2350, -10], [2440, 0], [2650, 10], [2900, 40], [3100, 60]];
// Le sentier qui mène à l'eau de l'oasis
const SENTIER = [[2400, -4], [2440, 22], [2480, 44]];

// Lieux aplatis : le campement des voyageurs et l'oasis (positions en s, t)
export const OASIS = { s: 2500, t: 62, r: 52, lac: 13 };
export const CAMP = { s: 1100, t: -34, r: 24 };

function interpoler(pts, s) {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, ta] = pts[i], [b, tb] = pts[i + 1];
    if (s <= b) { const u = (s - a) / (b - a); return melange(ta, tb, u * u * (3 - 2 * u)); }
  }
  return pts[pts.length - 1][1];
}
export function pointChemin(s) { return { s, t: interpoler(PISTE, s) }; }
// distance approchée à la piste (la piste suit surtout s)
export function distanceChemin(s, t) {
  const t0 = interpoler(PISTE, s), pente = (interpoler(PISTE, s + 1) - interpoler(PISTE, s - 1)) / 2;
  return Math.abs(t - t0) / Math.sqrt(1 + pente * pente);
}
function distanceSentier(s, t) {
  if (s < SENTIER[0][0] - 10 || s > SENTIER[SENTIER.length - 1][0] + 10) return Infinity;
  let best = Infinity;
  for (let i = 0; i < SENTIER.length - 1; i++) {
    const [as, at] = SENTIER[i], [bs, bt] = SENTIER[i + 1], ds = bs - as, dt = bt - at, l2 = ds * ds + dt * dt;
    const u = Math.max(0, Math.min(1, ((s - as) * ds + (t - at) * dt) / l2)), es = as + u * ds - s, et = at + u * dt - t;
    best = Math.min(best, Math.hypot(es, et));
  }
  return best;
}

// Tout ce que l'on sait d'un endroit (hauteur et masques pour les couleurs et le décor)
export function relief(s, t) {
  const dC = Math.min(distanceChemin(s, t), distanceSentier(s, t));
  const surChemin = lisse(7, 2.5, dC);
  const dOasis = Math.hypot(s - OASIS.s, t - OASIS.t), dCamp = Math.hypot(s - CAMP.s, t - CAMP.t);

  // la plaine : graviers ondulés, très doux
  const plaine = fbm(s * 0.006, t * 0.006, 3) * 3.2 + fbm(s * 0.03, t * 0.03, 2) * 0.7;
  // les dunes : entre 1350 et 2350 ; la piste passe dans le creux d'une vallée, les dunes montent de chaque côté
  const zoneDunes = lisse(1300, 1600, s) * (1 - lisse(2250, 2450, s));
  const ondes = 1 - Math.abs(Math.sin((s * 0.5 + t) * 0.032 + fbm(s * 0.006, t * 0.006, 3) * 6));
  const creux = 1 - 0.92 * lisse(46, 8, dC);
  const dunes = zoneDunes * (fbm(s * 0.012, t * 0.012, 3) * 3 + ondes * ondes * 6.5) * creux;
  // les montagnes au loin, de chaque côté : elles bordent l'horizon sans jamais gêner la piste
  const bord = lisse(460, 900, Math.abs(t));
  const massif = bord * (30 + fbm(s * 0.006, t * 0.006, 3) * 80);
  const rochers = bord * Math.pow(Math.abs(fbm(s * 0.05, t * 0.05, 3) - 0.5) * 2, 1.5) * 8;
  // quelques collines basses de roche près du départ
  const collines = lisse(-100, 80, s) * (1 - lisse(520, 720, s)) * lisse(35, 90, dC) * (3 + fbm(s * 0.012, t * 0.012, 3) * 10);

  let h = plaine * (1 - 0.8 * surChemin) + dunes + massif + rochers + collines * (1 - surChemin);
  // le campement et l'oasis sont plats
  const camp = lisse(CAMP.r + 16, CAMP.r - 2, dCamp);
  h = melange(h, 0.5 + plaine * 0.1, camp);
  const oasis = lisse(OASIS.r + 22, OASIS.r, dOasis);
  h = melange(h, 0.4, oasis);
  const lac = lisse(OASIS.lac + 3, OASIS.lac - 5, dOasis);
  h -= lac * 2.8;
  return { h, surChemin, dunes: zoneDunes, plaine, massif, rochers, oasis, lac, camp, dOasis, dCamp, bord };
}
export const hauteur = (s, t) => relief(s, t).h;
