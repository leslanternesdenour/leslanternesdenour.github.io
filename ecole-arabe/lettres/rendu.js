// Rendu 2D des lettres arabes en SVG, à partir des CONTOURS EXACTS de la police (glyphes.json). Une lettre n'est jamais redessinée ni déformée :
// seule la mise à l'échelle (identique en largeur et en hauteur) est appliquée. Les points sont colorés à part pour les repérer (pédagogie).
import { PAR_ID } from './donnees/lettres.js?v=2';
import { formesDuMot, miseEnPage } from './moteur/mots.js?v=2';
export const COULEURS = { encre: '#191345', points: '#1d8f9c', or: '#e8b53a', ivoire: '#fff6e0' };
let G = null;
export async function chargerGlyphes() { if (!G) G = await (await fetch(new URL('./donnees/glyphes.json', import.meta.url))).json(); return G; }
export const glyphes = () => G;
const bbox = parts => parts.reduce((b, p) => [Math.min(b[0], p.bb[0]), Math.min(b[1], p.bb[1]), Math.max(b[2], p.bb[2]), Math.max(b[3], p.bb[3])], [1e9, 1e9, -1e9, -1e9]);
// Boîte d'une lettre (centrée) ; carree : même échelle pour plusieurs lettres (on passe la plus grande dimension)
export function boite(id, forme = 'isolee', marge = 0.14, taille = null) {
  const f = G.lettres[id][forme], b = f.bb, w = b[2] - b[0], h = b[3] - b[1], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, T = (taille || Math.max(w, h)) * (1 + marge * 2);
  return { x: cx - T / 2, y: cy - T / 2, t: T, w, h, cx, cy };
}
// SVG d'une lettre. opts : { forme, taille (échelle commune), couleur, points, classe, aria, carre (true = viewBox carrée) }
export function svgLettre(id, opts = {}) {
  const forme = opts.forme || 'isolee', f = G.lettres[id][forme], b = boite(id, forme, opts.marge ?? 0.14, opts.taille);
  const corps = f.parties.filter(p => p.type === 'corps').map(p => `<path d="${p.d}" fill="${opts.couleur || COULEURS.encre}"/>`).join(''), pts = f.parties.filter(p => p.type !== 'corps').map(p => `<path d="${p.d}" fill="${opts.points || COULEURS.points}" class="pt"/>`).join('');
  return `<svg class="lettre-svg ${opts.classe || ''}" viewBox="${b.x.toFixed(1)} ${b.y.toFixed(1)} ${b.t.toFixed(1)} ${b.t.toFixed(1)}" role="img" aria-label="${opts.aria || PAR_ID[id].nomFr}">${corps}${pts}</svg>`;
}
// SVG d'un mot composé de lettres réelles (de droite à gauche), avec la forme choisie par la place dans le mot. surligne : index de la lettre mise en valeur
export function svgMot(ids, opts = {}) {
  const items = formesDuMot(ids).map(x => (opts.isole ? { ...x, forme: 'isolee' } : x)), lay = miseEnPage(items, G, opts.isole ? 170 : 0); let xmin = 1e9, ymin = 1e9, ymax = -1e9;
  const gs = lay.placees.map(p => { const f = G.lettres[p.id][p.forme]; const surligne = opts.surligne === p.position, vide = opts.vide === p.position;
    xmin = Math.min(xmin, p.x + f.bb[0]); ymin = Math.min(ymin, f.bb[1]); ymax = Math.max(ymax, f.bb[3]);
    if (vide) return `<g transform="translate(${p.x.toFixed(1)} 0)" class="case-vide"><rect x="${f.bb[0] - 20}" y="${f.bb[1] - 30}" width="${f.bb[2] - f.bb[0] + 40}" height="${f.bb[3] - f.bb[1] + 60}" rx="40" fill="none" stroke="${COULEURS.or}" stroke-width="14" stroke-dasharray="40 30"/></g>`;
    return `<g transform="translate(${p.x.toFixed(1)} 0)" class="${surligne ? 'surligne' : ''}" data-i="${p.position}" data-forme="${p.forme}">${f.parties.map(q => `<path d="${q.d}" fill="${q.type === 'corps' ? (surligne ? COULEURS.or : opts.couleur || COULEURS.encre) : (surligne ? COULEURS.or : COULEURS.points)}"/>`).join('')}</g>`; });
  const m = 90, w = lay.largeur - 0, h = ymax - ymin; return { svg: `<svg class="mot-svg ${opts.classe || ''}" viewBox="${(xmin - m).toFixed(1)} ${(ymin - m).toFixed(1)} ${(w + m * 2).toFixed(1)} ${(h + m * 2).toFixed(1)}" role="img" aria-label="${opts.aria || 'mot arabe'}">${gs.join('')}</svg>`, items };
}
// Plus grande dimension commune d'un groupe de lettres (pour les comparer à la même échelle : lettres jumelles)
export function tailleCommune(ids, forme = 'isolee') { return Math.max(...ids.map(id => { const b = G.lettres[id][forme].bb; return Math.max(b[2] - b[0], b[3] - b[1]); })); }

// Les formes de l'alif (أ إ آ ٱ) : contours exacts de la police, à la même échelle pour pouvoir les comparer. Le corps est en encre, la hamza / madda / wasla en turquoise.
export function svgAlifForme(cle) {
  const F = G.alifFormes, f = F[cle], T = Math.max(...Object.values(F).map(x => Math.max(x.bb[2] - x.bb[0], x.bb[3] - x.bb[1]))) * 1.3, cx = (f.bb[0] + f.bb[2]) / 2, cy = (f.bb[1] + f.bb[3]) / 2;
  return `<svg class="lettre-svg" viewBox="${(cx - T / 2).toFixed(1)} ${(cy - T / 2).toFixed(1)} ${T.toFixed(1)} ${T.toFixed(1)}" role="img" aria-label="alif : ${cle.replace('_', ' ')}">${f.parties.map(p => `<path d="${p.d}" fill="${p.type === 'corps' ? COULEURS.encre : COULEURS.points}"/>`).join('')}</svg>`;
}
