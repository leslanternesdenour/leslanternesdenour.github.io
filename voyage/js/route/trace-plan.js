// La trace de lumières du guidage (pur, sans Three.js) : de l'enfant vers la piste, le long de la piste, puis par le sentier qui mène à la destination.
// On ne rend que la partie proche (170 m), une lumière tous les 9 m : le reste apparaît au fur et à mesure qu'on avance.
import { pointChemin, sentiers, S_DEBUT, S_FIN_TRANCHE } from './relief.js';

const PAS = 9, PORTEE = 170;
const borne = s => Math.max(S_DEBUT, Math.min(S_FIN_TRANCHE, s));
const surPiste = s => [borne(s), pointChemin(borne(s)).t];
function suivrePiste(pts, s0, s1) { const n = Math.max(1, Math.ceil(Math.abs(s1 - s0) / PAS)); for (let k = 1; k <= n; k++) pts.push(surPiste(s0 + (s1 - s0) * k / n)); }

function polyligne(j, cible) {
  const pts = [[j.s, j.t]];
  const direct = Math.hypot(cible.s - j.s, cible.t - j.t);
  if (direct < 15) return [[j.s, j.t]];                                          // arrivé
  if (direct < 60) return [[j.s, j.t], [cible.s, cible.t]];                      // tout près : en ligne droite
  const S = sentiers().find(p => Math.hypot(p.at(-1)[0] - cible.s, p.at(-1)[1] - cible.t) < 90);   // un sentier dont le bout est la destination
  if (S) {
    let proche = 0, dmin = Infinity; S.forEach((p, i) => { const d = Math.hypot(p[0] - j.s, p[1] - j.t); if (d < dmin) { dmin = d; proche = i; } });
    if (dmin < 30) { for (let i = proche + 1; i < S.length; i++) pts.push([S[i][0], S[i][1]]); }       // déjà sur le sentier : on le suit jusqu'au bout
    else { pts.push(surPiste(j.s)); suivrePiste(pts, j.s, S[0][0]); for (const p of S) pts.push([p[0], p[1]]); }
  } else { pts.push(surPiste(j.s)); suivrePiste(pts, j.s, cible.s); }
  pts.push([cible.s, cible.t]);
  return pts;
}

// j, cible : { s, t } → les lumières [{ s, t }] à poser maintenant
export function traceLumineuse(j, cible) {
  const pts = polyligne(j, cible), sortie = [];
  let reste = PAS, cumul = 0;
  for (let i = 1; i < pts.length; i++) {
    const [as, at] = pts[i - 1], [bs, bt] = pts[i], seg = Math.hypot(bs - as, bt - at); let u = reste;
    while (u <= seg) { cumul += PAS; if (cumul > PORTEE) return sortie; const f = u / seg; sortie.push({ s: as + (bs - as) * f, t: at + (bt - at) * f }); u += PAS; }
    reste = u - seg;
  }
  return sortie;
}
