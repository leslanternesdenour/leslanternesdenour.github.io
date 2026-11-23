import { readFileSync } from 'node:fs';
const R = '/home/user/leslanternesdenour.github.io/';
const h = readFileSync(R + 'ablutions/index.html', 'utf8');
const blocA = h.slice(h.indexOf('const ST=['), h.indexOf('];', h.indexOf('const ST=[')) + 2);
const { ST: S3, HINT: H3 } = await import(R + 'ablutions/jeu3d/etapes.js');
const S2 = new Function(blocA.replace('const ST=', 'return ') )();
console.log('étapes 2D:', S2.length, '3D:', S3.length);
let ecarts = 0; for (let i = 0; i < S2.length; i++) for (const k of ['k', 't', 'c', 'txt', 'tip', 'src']) if (JSON.stringify(S2[i][k]) !== JSON.stringify(S3[i][k])) { ecarts++; console.log('ÉCART étape', i + 1, k, '\n  2D:', S2[i][k], '\n  3D:', S3[i][k]); }
for (let i = 0; i < S2.length; i++) if (JSON.stringify(S2[i].ph) !== JSON.stringify(S3[i].ph)) { ecarts++; console.log('ÉCART phases étape', i + 1); }
const hint2 = h.match(/const HINT=(\[.*?\]);/s); const H2 = hint2 ? new Function('return ' + hint2[1])() : null; console.log('HINT 2D:', H2 && H2.length, '3D:', H3.length, 'identiques:', H2 && JSON.stringify(H2) === JSON.stringify(H3));
console.log('écarts texte entre 2D et 3D:', ecarts);
