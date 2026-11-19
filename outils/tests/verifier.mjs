// Vérifications automatiques des Lanternes de Nour (sans dépendance) : node outils/tests/verifier.mjs
// 1. syntaxe de tous les JS (fichiers + scripts en ligne)  2. chemins locaux  3. catalogues de voix
// 4. règle « pas de synthèse vocale pour l'arabe »  5. calcul des récompenses du village  6. sauvegarde du village
import fs from 'fs'; import path from 'path'; import os from 'os'; import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
let ok = 0, ko = 0; const erreurs = [];
const test = (nom, cond, detail = '') => { if (cond) ok++; else { ko++; erreurs.push(`✗ ${nom} ${detail}`); } };
const tous = (d = RACINE) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name.startsWith('.') ? [] : e.isDirectory() ? tous(path.join(d, e.name)) : [path.join(d, e.name)]);
const fichiers = tous(); const rel = f => path.relative(RACINE, f);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-'));
const verifierSyntaxe = (code, module) => { const f = path.join(tmp, module ? 'x.mjs' : 'x.js'); fs.writeFileSync(f, code);
  try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); return ''; } catch (e) { return String(e.stderr).split('\n').slice(0, 4).join(' '); } };

// 1. syntaxe
for (const f of fichiers.filter(f => f.endsWith('.js') || f.endsWith('.mjs'))) {
  const c = fs.readFileSync(f, 'utf8'); const err = verifierSyntaxe(c, /^\s*(import|export)\s/m.test(c)); test('syntaxe ' + rel(f), !err, err);
}
for (const f of fichiers.filter(f => f.endsWith('.html'))) {
  const s = fs.readFileSync(f, 'utf8'); let i = 0;
  for (const m of s.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/importmap|ld\+json/.test(m[1])) { try { JSON.parse(m[2]); } catch (e) { test('JSON en ligne ' + rel(f), false, e.message); } continue; }
    const err = verifierSyntaxe(m[2], /module/.test(m[1])); test(`script en ligne ${rel(f)}#${i++}`, !err, err);
  }
}
// 2. chemins locaux dans le HTML et le CSS (attributs src/href/srcset et url())
const externe = u => /^(https?:|data:|mailto:|#|javascript:|blob:|tel:)/.test(u) || u.includes('${');
for (const f of fichiers.filter(f => /\.(html|css|webmanifest)$/.test(f))) {
  const s = fs.readFileSync(f, 'utf8'), d = path.dirname(f);
  const liens = [...s.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1])
    .concat([...s.matchAll(/srcset="([^"]+)"/g)].flatMap(m => m[1].split(',').map(x => x.trim().split(' ')[0])))
    .concat([...s.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(m => m[1]))
    .concat([...s.matchAll(/"src"\s*:\s*"([^"]+)"/g)].map(m => m[1]));
  for (let u of liens) { if (externe(u)) continue; u = u.split('#')[0].split('?')[0]; if (!u) continue;
    let t = u.startsWith('/') ? path.join(RACINE, u) : path.resolve(d, u); if (fs.existsSync(t) && fs.statSync(t).isDirectory()) t = path.join(t, 'index.html');
    test(`lien ${rel(f)} → ${u}`, fs.existsSync(t)); }
}
// imports ES des modules
for (const f of fichiers.filter(f => f.endsWith('.js'))) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?:^|\n)\s*import\s[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]/g)) {
    const u = (m[1] || m[2]); if (!u.startsWith('.')) continue; const t = path.resolve(path.dirname(f), u.split('?')[0]);
    test(`import ${rel(f)} → ${u}`, fs.existsSync(t));
  }
}
// 3. catalogues de voix
for (const j of ['audio/voix.json', 'monde/voix/voix.json', 'ablutions/voix/voix.json', 'priere/voix/voix.json', 'calendrier/voix/voix.json', 'ablutions/voix/voix-catalogue.json', 'priere/voix/voix-catalogue.json']) {
  const p = path.join(RACINE, j); if (!fs.existsSync(p)) { test('catalogue ' + j, false, 'absent'); continue; }
  let d; try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { test('JSON ' + j, false, e.message); continue; }
  for (const [k, v] of Object.entries(d)) {
    const ok1 = Array.isArray(v) && typeof v[0] === 'string' && v[1] >= 0 && v[2] > v[1]; test(`format ${j}:${k}`, ok1);
    if (ok1) test(`fichier ${j}:${k}`, fs.existsSync(path.resolve(path.dirname(p), v[0])), v[0]);
  }
}
// 4. aucune synthèse vocale arabe
const synthArabe = fichiers.filter(f => f.endsWith('.js') && /getVoices\(\)[\s\S]{0,160}?(startsWith\('ar'\)|\/\^ar\/i)|\bu\.lang\s*=\s*['"]ar/.test(fs.readFileSync(f, 'utf8')));
test('aucune voix de synthèse arabe', synthArabe.length === 0, synthArabe.map(rel).join(', '));
// 5. récompenses du village
const { calculerRecompenses } = await import(pathToFileURL(path.join(RACINE, 'monde/socle/recompenses.js')).href);
const donnees = { ablutions: { g1: 3, g2: 2, g3: 1, g4: 3, learned: 1 }, priere: { g1: 3, g3: 2, g4: 1, learn: 1, jeu3d: { appris: true } },
  lanternes2: { cur: 0, kids: [{ name: 'A', lit: { 1: 1, 2: 1, 3: 1 }, jeux: { dp0: true, qp1: true } }, { name: 'B', lit: { 1: 1 }, jeux: { dp0: true } }] },
  monde_voyage: { aventure: { ramasses: ['lanterne-0', 'lanterne-3', 'seau', 'lanterne-3'] } } };
const r = calculerRecompenses(k => donnees[k] ?? null);
test('étoiles ablutions = 9', r.jeux.ablutions.etoiles === 9, JSON.stringify(r.jeux.ablutions));
test('étoiles prière = 6', r.jeux.priere.etoiles === 6);
test('jeux du Ramadan distincts = 2', r.jeux.ramadan.etoiles === 2);
test('étoiles totales = 17', r.etoiles === 17, String(r.etoiles));
test('lanternes = 4 (Ramadan) + 2 (Voyage, sans doublon)', r.lanternes === 6, String(r.lanternes));
const vide = calculerRecompenses(() => null); test('sans aucune partie : 0 / 0', vide.etoiles === 0 && vide.lanternes === 0);
const abime = calculerRecompenses(k => ({ ablutions: { g1: 99, g2: 'x' }, lanternes2: { kids: [null, {}] }, monde_voyage: { aventure: { ramasses: 'x' } } })[k] ?? null);
test('données abîmées : bornées, sans plantage', abime.jeux.ablutions.etoiles === 3 && abime.lanternes === 0);
// 6. sauvegarde du village : recalcul idempotent, rien n'est additionné deux fois
const store = new Map(); globalThis.localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
const { sauvegarde } = await import(pathToFileURL(path.join(RACINE, 'monde/socle/sauvegarde.js')).href);
test('1er calcul : change', sauvegarde.appliquerRecompenses(r) === true);
test('2e calcul identique : rien ne change', sauvegarde.appliquerRecompenses(r) === false);
const s1 = JSON.parse(store.get('monde')); test('sauvé : 17 étoiles / 6 lanternes', s1.etoiles === 17 && s1.lanternes === 6);
test('étoiles de la maison des ablutions sauvées', s1.jeux.ablutions.etoiles === 9);
test('réglages conservés', !!s1.sons && s1.v === 1);

fs.rmSync(tmp, { recursive: true, force: true });
console.log(erreurs.join('\n'));
console.log(`\n${ok} vérifications réussies, ${ko} en échec.`);
process.exit(ko ? 1 : 0);
