// Le plan de la cité ancienne (pur, sans Three.js) : des maisons de pierre et de terre sur une trame irrégulière, des ruelles étroites, des places dégagées.
// Toujours la même cité (graine fixe). Aucune architecture moderne : 1 à 2 étages, toits plats, murs épais, petites fenêtres.
import { CITE, distanceChemin, COLLINES_CITE } from './relief.js';
import { LIEUX_ROUTE, positionDeLieu } from './donnees.js';

export const GABARITS = 8;                                  // formes de maisons différentes (bloc, étage en retrait, plan en L, escalier extérieur, cour, échoppe à auvent, tour basse, enclos)
const CELLULE = 24;
function hasard(graine) { let s = graine >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
// les places dégagées (marchés, placettes) : jamais de maison dedans
export const PLACETTES = [{ s: 5790, t: 60, r: 26 }, { s: 5520, t: 78, r: 16 }, { s: 5620, t: -92, r: 18 }, { s: 5760, t: -60, r: 14 }];

let cache = null;
export function maisonsVille() {
  if (cache) return cache;
  const R = hasard(0x4d454343), liste = [], lieux = LIEUX_ROUTE.map(positionDeLieu);
  const a = COLLINES_CITE[0], b = COLLINES_CITE[1];
  for (let ci = -14; ci <= 14; ci++) for (let cj = -14; cj <= 14; cj++) {
    const s = CITE.s + ci * CELLULE + (R() - 0.5) * 7, t = CITE.t + cj * CELLULE + (R() - 0.5) * 7;
    const l = 9 + R() * 8, w = 8 + R() * 6, r = Math.hypot(l, w) / 2, d = Math.hypot(s - CITE.s, t - CITE.t);
    // densité : plus serrée au centre, qui s'éclaircit vers les bords ; quelques vides naturels
    const dens = 1 - Math.max(0, (d - 150) / 190) * 0.85;
    if (R() > dens * 0.9) continue;
    if (d < CITE.plaza + 12 + r * 0.5 || d > CITE.rayon + 10) continue;
    if (distanceChemin(s, t) < r * 0.7 + 3.5) continue;
    if (COLLINES_CITE.some(c => Math.hypot(s - c.s, t - c.t) < c.r + 6)) continue;
    // le chemin plat entre les deux collines reste libre
    { const ux = b.s - a.s, ut = b.t - a.t, l2 = ux * ux + ut * ut, k = Math.max(0, Math.min(1, ((s - a.s) * ux + (t - a.t) * ut) / l2)), dd = Math.hypot(s - (a.s + ux * k), t - (a.t + ut * k)); if (dd < 12 + r * 0.6) continue; }
    if (PLACETTES.some(p => Math.hypot(s - p.s, t - p.t) < p.r + r * 0.6)) continue;
    if (lieux.some(p => Math.hypot(s - p.s, t - p.t) < r * 0.6 + 5)) continue;
    if (liste.some(o => Math.hypot(o.s - s, o.t - t) < (Math.hypot(o.l, o.w) + Math.hypot(l, w)) * 0.36 + 1.2)) continue;
    const etage = R() < 0.3 + 0.25 * (1 - d / CITE.rayon) ? 2 : 1;
    liste.push({ s: +s.toFixed(1), t: +t.toFixed(1), l: +l.toFixed(1), w: +w.toFixed(1), h: +(3.2 + (etage - 1) * 2.8 + R() * 0.8).toFixed(1), etage, rot: +((R() - 0.5) * 0.5 + (R() < 0.5 ? 0 : Math.PI / 2)).toFixed(3), gabarit: Math.floor(R() * GABARITS), teinte: +R().toFixed(2) });
  }
  return (cache = liste);
}
