import { readFileSync } from 'node:fs';
globalThis.window = {}; new Function('window', readFileSync('/home/user/leslanternesdenour.github.io/calendrier/data.js', 'utf8'))(globalThis.window);
const D = window.D;
const ids = D.M.map(m => m[0]); console.log('jours:', ids.length, 'contigus 1..30:', ids.every((x, i) => x === i + 1), 'textes vides:', D.M.filter(m => m.slice(1, 5).some(x => !x)).length, 'catégories:', [...new Set(D.M.map(m => m[1]))].join(','), 'catégories inconnues:', D.M.filter(m => !D.C[m[1]]).length);
for (const g of Object.keys(D.J)) for (const n of Object.keys(D.J[g])) { const L = D.J[g][n]; console.log(`\n## J.${g}.${n} (${L.length})`); for (const x of L) console.log(' ', JSON.stringify(x).slice(0, 420)); }
