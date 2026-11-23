import { readFileSync } from 'node:fs';
globalThis.window = {}; new Function('window', readFileSync('/home/user/leslanternesdenour.github.io/calendrier/data.js', 'utf8'))(globalThis.window);
const D = window.D; console.log('clés:', Object.keys(D).map(k => `${k}:${Array.isArray(D[k]) ? D[k].length : typeof D[k] === 'object' ? 'obj(' + Object.keys(D[k]).length + ')' : typeof D[k]}`).join(' | '));
for (const k of Object.keys(D)) { const v = D[k]; console.log('—', k, JSON.stringify(Array.isArray(v) ? v[0] : v).slice(0, 330)); }
