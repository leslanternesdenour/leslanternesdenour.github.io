import { readFileSync } from 'node:fs';
import { CATEGORIES, NIVEAUX, PHRASES } from '/home/user/leslanternesdenour.github.io/aventures/quiz-nour/contenu.js';
import * as G from '/home/user/leslanternesdenour.github.io/aventures/quiz-nour/logique.js';
const m = JSON.parse(readFileSync('/home/user/leslanternesdenour.github.io/audio/jeux/quiz-nour/manifeste.json', 'utf8')); const dispo = new Set(m.phrases.map(p => p.id));
const requis = new Set(); for (const c of Object.keys(CATEGORIES)) { requis.add('intro.' + c); for (const n of NIVEAUX) for (const q of G.construirePartie(c, n)) { requis.add('q.' + q.id); requis.add('exp.' + q.id); } }
for (const k of Object.keys(PHRASES)) requis.add(k);
const manque = [...requis].filter(i => !dispo.has(i)); console.log('ids requis par le jeu:', requis.size, '| manquants dans le manifeste:', manque.length, manque.slice(0, 10).join(', '));
