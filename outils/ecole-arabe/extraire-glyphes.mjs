// Extrait de la police libre AMIRI (licence SIL OFL 1.1) les contours EXACTS des 28 lettres arabes, dans leurs 4 formes (isolée, initiale, médiane, finale).
// Aucune lettre n'est redessinée ni déformée : ce sont les contours de la police (formes de présentation Unicode FE70–FEFC), exportés en chemins SVG.
// Utilisation : OUTILS_POLICE=/chemin/vers/dossier-avec-node_modules node outils/ecole-arabe/extraire-glyphes.mjs
//   (le dossier contient « opentype.js » et « @fontsource/amiri » installés par npm ; ils ne sont PAS dans le dépôt)
import fs from 'fs'; import path from 'path'; import { fileURLToPath, pathToFileURL } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), DOSSIER = process.env.OUTILS_POLICE || '/home/user/outils-police';
const opentype = (await import(pathToFileURL(path.join(DOSSIER, 'node_modules/opentype.js/dist/opentype.mjs')).href));
const buf = fs.readFileSync(path.join(DOSSIER, 'node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff')), font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
// lettre : [isolée, finale, initiale, médiane] (formes de présentation Unicode B) ; les lettres qui ne s'attachent pas à la suivante n'ont que isolée et finale
const FORMES = {
  alif: [0xFE8D, 0xFE8E], ba: [0xFE8F, 0xFE90, 0xFE91, 0xFE92], ta: [0xFE95, 0xFE96, 0xFE97, 0xFE98], tha: [0xFE99, 0xFE9A, 0xFE9B, 0xFE9C], jim: [0xFE9D, 0xFE9E, 0xFE9F, 0xFEA0], ha: [0xFEA1, 0xFEA2, 0xFEA3, 0xFEA4],
  kha: [0xFEA5, 0xFEA6, 0xFEA7, 0xFEA8], dal: [0xFEA9, 0xFEAA], dhal: [0xFEAB, 0xFEAC], ra: [0xFEAD, 0xFEAE], zay: [0xFEAF, 0xFEB0], sin: [0xFEB1, 0xFEB2, 0xFEB3, 0xFEB4], shin: [0xFEB5, 0xFEB6, 0xFEB7, 0xFEB8],
  sad: [0xFEB9, 0xFEBA, 0xFEBB, 0xFEBC], dad: [0xFEBD, 0xFEBE, 0xFEBF, 0xFEC0], ta2: [0xFEC1, 0xFEC2, 0xFEC3, 0xFEC4], za2: [0xFEC5, 0xFEC6, 0xFEC7, 0xFEC8], ayn: [0xFEC9, 0xFECA, 0xFECB, 0xFECC], ghayn: [0xFECD, 0xFECE, 0xFECF, 0xFED0],
  fa: [0xFED1, 0xFED2, 0xFED3, 0xFED4], qaf: [0xFED5, 0xFED6, 0xFED7, 0xFED8], kaf: [0xFED9, 0xFEDA, 0xFEDB, 0xFEDC], lam: [0xFEDD, 0xFEDE, 0xFEDF, 0xFEE0], mim: [0xFEE1, 0xFEE2, 0xFEE3, 0xFEE4], nun: [0xFEE5, 0xFEE6, 0xFEE7, 0xFEE8],
  ha2: [0xFEE9, 0xFEEA, 0xFEEB, 0xFEEC], waw: [0xFEED, 0xFEEE], ya: [0xFEF1, 0xFEF2, 0xFEF3, 0xFEF4]
};
const NOMS_FORMES = ['isolee', 'finale', 'initiale', 'mediane'];
const arrondi = n => Math.round(n * 10) / 10;
function parties(chemin) {      // sépare les sous-tracés : le plus grand = corps de la lettre ; les autres = points (ou hamza)
  const cmds = chemin.commands, morceaux = []; let cur = null;
  for (const c of cmds) { if (c.type === 'M') { cur = []; morceaux.push(cur); } if (cur) cur.push(c); }
  return morceaux.map(m => { const p = new opentype.Path(); p.commands = m; const bb = p.getBoundingBox(); return { d: p.toPathData(1), bb: [arrondi(bb.x1), arrondi(bb.y1), arrondi(bb.x2), arrondi(bb.y2)], aire: (bb.x2 - bb.x1) * (bb.y2 - bb.y1) }; })
    .sort((a, b) => b.aire - a.aire).map((p, i) => ({ d: p.d, bb: p.bb, type: i === 0 ? 'corps' : 'point' }));
}
const sortie = {};
for (const [id, codes] of Object.entries(FORMES)) {
  sortie[id] = {};
  codes.forEach((cp, i) => {
    const g = font.charToGlyph(String.fromCodePoint(cp)); if (!g || !g.index) throw new Error('glyphe absent ' + id + ' ' + cp.toString(16));
    const ch = g.getPath(0, 0, 1000), bb = ch.getBoundingBox();
    sortie[id][NOMS_FORMES[i]] = { cp: 'U+' + cp.toString(16).toUpperCase(), d: ch.toPathData(1), largeur: arrondi(g.advanceWidth), bb: [arrondi(bb.x1), arrondi(bb.y1), arrondi(bb.x2), arrondi(bb.y2)], parties: parties(ch) };
  });
}
const dest = path.join(RACINE, 'ecole-arabe/lettres/donnees/glyphes.json');
fs.writeFileSync(dest, JSON.stringify({ police: 'Amiri (SIL OFL 1.1)', unites: 1000, lettres: sortie }));
console.log('28 lettres exportées :', Object.keys(sortie).length, '; formes :', Object.values(sortie).reduce((s, l) => s + Object.keys(l).length, 0), '; taille', (fs.statSync(dest).size / 1024).toFixed(0), 'Ko');
