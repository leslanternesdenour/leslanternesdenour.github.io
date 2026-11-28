// Le relief de La Route : une fonction pure (s, t) → hauteur. Aucune donnée à télécharger, aucun Three.js.
// Repère « route » : s = distance parcourue depuis le village (m), t = écart latéral (m). Dans le monde du jeu :
//   x = t, z = DEC + s   (DEC éloigne la Route du village : aucun objet du village ne peut se trouver à proximité).
import { fbm, lisse, melange } from './bruit.js';

export const DEC = 20000;
export const versMonde = (s, t) => ({ x: t, z: DEC + s });
export const versRoute = (x, z) => ({ s: z - DEC, t: x });
export const dansLaRoute = z => z > DEC - 2000;          // le village ne dépasse jamais |z| = 400

export const S_DEBUT = -150;           // un peu en arrière du seuil (pour qu'on voie la piste qu'on vient de quitter)
export const S_FIN_TRANCHE_1 = 2900;   // la fin de la première tranche (repère historique)
export const S_MONTAGNES_DEBUT = 2950;  // les montagnes commencent à se rapprocher de la piste
export const S_FIN_TRANCHE = 5900;     // la fin de la partie jouable : un peu après la place centrale de la cité
export const LARGEUR = 1000;           // le monde ne va pas plus loin que ±900 m de la piste

// Points de la piste principale (s, t). Elle serpente doucement : jamais une ligne droite d'horizon à horizon.
const PISTE = [[-300, 50], [-150, 48], [-40, 45], [120, 30], [300, -10], [520, -40], [760, -20], [1000, 10], [1100, 0], [1350, 40],
  [1600, 90], [1850, 60], [2100, 20], [2350, -10], [2440, 0], [2650, 10], [2900, 40], [3100, 60], [3300, 90], [3500, 60], [3700, 5], [3900, -45], [4100, -70], [4300, -60], [4500, -50],
  [4700, -40], [4900, -10], [5100, -10], [5300, 0], [5500, 0], [5650, 0], [5800, 0], [6000, 0]];
// Les sentiers : vers l'eau de l'oasis, vers le pied de la grande montagne du nord, vers le pied de celle du sud
const SENTIERS = [[[1950, 46], [1960, 150], [1952, 260], [1950, 370], [1950, 418]], [[2400, -4], [2440, 22], [2480, 44]], [[5100, -10], [5170, -140], [5220, -280], [5250, -390]], [[5780, 0], [5810, 160], [5830, 300], [5840, 420]]];

// Lieux aplatis : le campement des voyageurs et l'oasis (positions en s, t)
export const OASIS = { s: 2500, t: 62, r: 52, lac: 13 };
export const CAMP = { s: 1100, t: -34, r: 24 };
// La cité ancienne : un bassin plat autour de la place centrale (Kaaba au centre), entouré de collines basses.
export const CITE = { s: 5650, t: 0, plaza: 46, rayon: 300 };
// Deux grandes montagnes isolées (formes inspirées des vraies, sans copie topographique) et deux petites collines à l'intérieur de la cité
export const MONTAGNE_NORD = { s: 5250, t: -600, r: 270, h: 135 };
export const MONTAGNE_SUD = { s: 5850, t: 650, r: 300, h: 150 };
export const COLLINES_CITE = [{ id: 'a', s: 5740, t: -150, r: 48, h: 15 }, { id: 'b', s: 5540, t: -160, r: 48, h: 15 }];
// Les terrasses au pied des deux montagnes (là où l'on observe la montagne et l'entrée de sa grotte)
export const TERRASSES = [{ id: 'pied-nord', s: 5250, t: -390, r: 26 }, { id: 'pied-sud', s: 5840, t: 420, r: 26 }];

// Le plateau des intérieurs : un rond de sol parfaitement plat, loin de la cité, où l'on pose la pièce d'une maison quand l'enfant y entre (invisible le reste du temps)
export const PLATEAU_INTERIEURS = { s: 6040, t: 0, r: 14 };
// Le hameau des puits : un petit hameau caché dans les dunes, à l'écart de la grande piste, relié par un sentier (sol plat, comme le campement)
export const HAMEAU = { s: 1950, t: 446, r: 30 };
// La halte de repos des caravaniers : au milieu de la Route, un peu à l'écart de la piste (côté gauche), sol plat comme le campement et le hameau
export const HALTE = { s: 2800, t: -10, r: 20 };
const hPlats = new Map();   // la hauteur du terrain naturel au centre de chaque rond plat (calculée une fois)

function interpoler(pts, s) {
  if (s <= pts[0][0]) return pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, ta] = pts[i], [b, tb] = pts[i + 1];
    if (s <= b) { const u = (s - a) / (b - a); return melange(ta, tb, u * u * (3 - 2 * u)); }
  }
  return pts[pts.length - 1][1];
}
export function pointChemin(s) { return { s, t: interpoler(PISTE, s) }; }
// Le portail de RETOUR au village : à l'extrémité de la carte, derrière le point d'arrivée (s = -20), en travers de la piste, sol plat comme la halte (voir retour-plan.js)
export const PORTAIL_RETOUR = { s: -62, t: interpoler(PISTE, -62), r: 12 };
// distance approchée à la piste (la piste suit surtout s)
export function distanceChemin(s, t) {
  const t0 = interpoler(PISTE, s), pente = (interpoler(PISTE, s + 1) - interpoler(PISTE, s - 1)) / 2;
  return Math.abs(t - t0) / Math.sqrt(1 + pente * pente);
}
export function distanceSentier(s, t) {
  let best = Infinity;
  for (const S of SENTIERS) {
    if (s < S[0][0] - 60 || s > S[S.length - 1][0] + 60) { if (Math.abs(S[0][0] - s) > 700 && Math.abs(S[S.length - 1][0] - s) > 700) continue; }
    for (let i = 0; i < S.length - 1; i++) {
      const [as, at] = S[i], [bs, bt] = S[i + 1], ds = bs - as, dt = bt - at, l2 = ds * ds + dt * dt;
      const u = Math.max(0, Math.min(1, ((s - as) * ds + (t - at) * dt) / l2)), es = as + u * ds - s, et = at + u * dt - t;
      best = Math.min(best, Math.hypot(es, et));
    }
  }
  return best;
}
// Les points d'un sentier (pour poser lieux et décor)
export const sentiers = () => SENTIERS;

// Tout ce que l'on sait d'un endroit (hauteur et masques pour les couleurs et le décor)
export function relief(s, t, sansTerrasses = false) {
  const dSent = distanceSentier(s, t), dC = Math.min(distanceChemin(s, t), dSent);
  const surChemin = lisse(7, 2.5, dC);
  const dOasis = Math.hypot(s - OASIS.s, t - OASIS.t), dCamp = Math.hypot(s - CAMP.s, t - CAMP.t);

  // la plaine : graviers ondulés, très doux
  const plaine = fbm(s * 0.006, t * 0.006, 3) * 3.2 + fbm(s * 0.03, t * 0.03, 2) * 0.7;
  // les dunes : entre 1350 et 2350 ; la piste passe dans le creux d'une vallée, les dunes montent de chaque côté
  const zoneDunes = lisse(1300, 1600, s) * (1 - lisse(2250, 2450, s));
  const ondes = 1 - Math.abs(Math.sin((s * 0.5 + t) * 0.032 + fbm(s * 0.006, t * 0.006, 3) * 6));
  const creux = 1 - 0.92 * lisse(46, 8, dC);
  const dunes = zoneDunes * (fbm(s * 0.012, t * 0.012, 3) * 3 + ondes * ondes * 6.5) * creux;
  // les montagnes : au loin de chaque côté d'abord, puis elles se rapprochent de la piste (contreforts, vallée encaissée, premier col)
  const zm = lisse(S_MONTAGNES_DEBUT, S_MONTAGNES_DEBUT + 500, s) * (1 - lisse(4750, 5300, s));   // les parois s'écartent avant la cité
  const debutBord = 460 - 390 * zm;
  const bord = lisse(debutBord, debutBord + 440 - 150 * zm, Math.abs(t));
  const vallee = zm * lisse(150, 45, dC);                      // le fond de la vallée suit la piste : large et plat (jamais une tranchée), les parois montent plus loin
  const massif = bord * (30 + fbm(s * 0.006, t * 0.006, 3) * 80) * (1 + 0.7 * zm) * (1 - 0.9 * vallee);
  const rochers = bord * Math.pow(Math.abs(fbm(s * 0.05, t * 0.05, 3) - 0.5) * 2, 1.5) * 8 * (1 - 0.85 * vallee);
  // quelques collines basses de roche près du départ
  const collines = lisse(-100, 80, s) * (1 - lisse(520, 720, s)) * lisse(35, 90, dC) * (3 + fbm(s * 0.012, t * 0.012, 3) * 10);

  // la piste suit le niveau de la plaine à cet endroit et se fond dans le décor sur ~30 m : jamais une tranchée dans laquelle on s'enfonce
  const t0 = interpoler(PISTE, s), plainePiste = fbm(s * 0.006, t0 * 0.006, 3) * 3.2 + fbm(s * 0.03, t0 * 0.03, 2) * 0.7;
  let h = melange(plaine, plainePiste, lisse(30, 3, dC)) + dunes + massif + rochers + collines * (1 - surChemin);
  // montagnes en gradins : corniches et falaises (grès et granit), jamais sur la piste ni dans le fond de la vallée
  const gradins = zm * (1 - surChemin) * (1 - vallee) * lisse(12, 34, massif);
  if (gradins > 0.01) { const pas = 7 + fbm(s * 0.004, t * 0.004, 2) * 4, q = h / pas, f = q - Math.floor(q); h = melange(h, (Math.floor(q) + lisse(0.5, 0.88, f)) * pas, gradins * 0.8); }
  // le lit de galets : la piste creuse un peu le fond de la vallée
  h -= zm * lisse(26, 4, dC) * 0.5;
  // deux grandes montagnes isolées, au nord et au sud de la cité ; un sentier mène au pied de chacune
  const cone = (c, g) => { const d = Math.hypot(s - c.s, t - c.t), k = Math.max(0, 1 - d / c.r); return c.h * Math.pow(k, 1.45) * (0.78 + 0.5 * fbm(s * 0.02 + g, t * 0.02, 3)) * (1 + 0.25 * Math.sin(Math.atan2(t - c.t, s - c.s) * 5 + g)); };
  h += (cone(MONTAGNE_NORD, 3.1) + cone(MONTAGNE_SUD, 7.7)) * (1 - 0.92 * lisse(45, 12, dSent));
  // la cité : un bassin plat, des collines basses autour (la route y entre par une brèche), une place centrale
  const dCite = Math.hypot(s - CITE.s, t - CITE.t), cite = lisse(CITE.rayon + 70, CITE.rayon - 30, dCite);
  const anneau = lisse(CITE.rayon + 40, CITE.rayon + 170, dCite) * (1 - lisse(CITE.rayon + 330, CITE.rayon + 520, dCite)) * lisse(40, 150, dC) * (10 + fbm(s * 0.015, t * 0.015, 3) * 22);
  h += anneau * (1 - cite);
  h = melange(h, 0.6 + plaine * 0.05, cite);
  const plaza = lisse(CITE.plaza + 6, CITE.plaza - 4, dCite);
  h = melange(h, 0.6, plaza);
  for (const c of COLLINES_CITE) { const d = Math.hypot(s - c.s, t - c.t); h += c.h * Math.pow(Math.max(0, 1 - d / c.r), 1.2) * (1 + 0.2 * fbm(s * 0.05, t * 0.05, 2)); }
  if (!sansTerrasses) for (const T of TERRASSES) { const d = Math.hypot(s - T.s, t - T.t), m = lisse(T.r + 16, T.r, d); if (m > 0) h = melange(h, hauteurTerrasse(T), m); }
  if (!sansTerrasses) for (const P of [PLATEAU_INTERIEURS, HAMEAU, HALTE, PORTAIL_RETOUR]) { const d = Math.hypot(s - P.s, t - P.t); if (d < P.r + 24) { if (!hPlats.has(P)) hPlats.set(P, relief(P.s, P.t, true).h); h = melange(h, hPlats.get(P), lisse(P.r + 24, P.r, d)); } }
  // le campement et l'oasis sont plats
  const camp = lisse(CAMP.r + 16, CAMP.r - 2, dCamp);
  h = melange(h, 0.5 + plaine * 0.1, camp);
  const oasis = lisse(OASIS.r + 22, OASIS.r, dOasis);
  h = melange(h, 0.4, oasis);
  const lac = lisse(OASIS.lac + 3, OASIS.lac - 5, dOasis);
  h -= lac * 2.8;
  return { h, surChemin, zm, plaza, cite, dCite, dunes: zoneDunes, plaine, massif, rochers, oasis, lac, camp, dOasis, dCamp, bord };
}
const memoTerrasse = new Map();
function hauteurTerrasse(T) { if (!memoTerrasse.has(T.id)) memoTerrasse.set(T.id, relief(T.s, T.t, true).h); return memoTerrasse.get(T.id); }
export const hauteur = (s, t) => relief(s, t).h;
