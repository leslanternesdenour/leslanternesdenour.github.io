// Ablutions : l'intention vient TOUJOURS en premier, puis Bismillâh. Aucune suite « juste » ne doit commencer aux mains.
import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const page = fs.readFileSync('ablutions/index.html', 'utf8'), jeu3d = fs.readFileSync('ablutions/jeu3d/etapes.js', 'utf8');
const ETAPES = ['intention', 'bismillah', 'mains', 'bouche', 'nez', 'visage', 'bras', 'tete', 'pieds'];
test('étapes : intention puis Bismillâh en tête, dans la page et dans le jeu 3D', () => {
  for (const [nom, t] of [['page', page], ['jeu 3D', jeu3d]]) assert.deepEqual([...t.matchAll(/\{k:'([a-z]+)',t:/g)].map(m => m[1]), ETAPES, nom);
});
test('jeu 4 (erreurs à éviter) : toutes les suites commencent par l\'intention puis Bismillâh', () => {
  const g4 = page.slice(page.indexOf('function g4()'), page.indexOf('/* ---------- confettis'));
  assert.match(g4, /const debut=\['intention','bismillah'\]/); assert.match(g4, /const full=\[\.\.\.debut,'mains'/);
  const suites = [...g4.matchAll(/\{id:'([a-z]+)',seq:([^\n]*?),a:"/g)];
  assert.ok(suites.length >= 7, 'scénarios trouvés : ' + suites.length);
  for (const [, id, seq] of suites) assert.ok(/^(full\.filter\([^)]*\)|full|\[\.\.\.debut,)/.test(seq.trim()), `${id} : la suite doit partir de « debut » ou de « full » (intention d'abord) : ${seq.slice(0, 40)}`);
  assert.ok(!/seq:\['mains'/.test(g4) && !/seq:\['visage'/.test(g4), 'aucune suite ne commence aux mains ou au visage');
});
test('jeu 1 (remets dans l\'ordre) : les 9 cartes, intention en tête', () => { assert.match(page, /function g1\(\)\{const order=ST\.map\(s=>s\.k\)/); assert.match(page, /de la 1re à la 9e étape/); });
