// Contrôle « aucune fuite » : les textes et voix Premium (pack privé, hors dépôt) ne doivent apparaître NI dans le dépôt public,
// NI dans le dossier publié dist/. Le pack est lu depuis LDN_PREMIUM_DIR (défaut : ../premium-lanternes) ; absent → contrôle sauté (signalé).
// node outils/construire.mjs && node outils/tests/fuite-premium.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url'; import { execSync } from 'child_process';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), DIST = path.join(RACINE, 'dist');
const PACK = path.resolve(process.env.LDN_PREMIUM_DIR || path.join(RACINE, '..', 'premium-lanternes'));
if (!fs.existsSync(PACK)) { console.log('Pack privé absent (' + PACK + ') : contrôle de fuite sauté — à lancer sur la machine qui le détient.'); process.exit(0); }
const tous = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? tous(path.join(d, e.name)) : [path.join(d, e.name)]);
const cherche = []; // phrases ≥ 25 caractères tirées des textes du pack
const collecte = v => { if (typeof v === 'string') { if (v.length >= 25) cherche.push(v); } else if (Array.isArray(v)) v.forEach(collecte); else if (v && typeof v === 'object') Object.values(v).forEach(collecte); };
const fichiersPack = tous(PACK).map(f => path.relative(PACK, f).split(path.sep).join('/'));
for (const f of fichiersPack.filter(f => f.endsWith('.json'))) { const j = JSON.parse(fs.readFileSync(path.join(PACK, f), 'utf8')); if (f.startsWith('voyage/')) collecte({ ...j, voix: undefined }); }
const mp3 = fichiersPack.filter(f => f.endsWith('.mp3')).map(f => path.basename(f));
const suivis = execSync('git ls-files', { cwd: RACINE, encoding: 'utf8' }).split('\n').filter(Boolean).filter(f => fs.existsSync(path.join(RACINE, f)));
const publics = [...suivis.map(f => ['dépôt', f, path.join(RACINE, f)])];
if (fs.existsSync(DIST)) publics.push(...tous(DIST).map(f => ['dist', path.relative(DIST, f), f]));
let ko = 0, n = 0;
for (const [ou, rel, abs] of publics) {
  if (/^outils\/tests\/(premium|fuite)/.test(rel)) continue;
  if (/\.mp3$/.test(rel) && mp3.includes(path.basename(rel))) { ko++; console.log(`✗ ${ou}/${rel} : voix Premium dans le public`); continue; }
  if (!/\.(js|mjs|html|json|css|txt|md|svg)$/.test(rel)) continue;
  const t = fs.readFileSync(abs, 'utf8'); n++;
  for (const p of cherche) if (t.includes(p)) { ko++; console.log(`✗ ${ou}/${rel} : contient un texte Premium « ${p.slice(0, 50)}… »`); break; }
  if (/^(voyage\/[a-z]+\/(contenu|zone)\.json|maisons\/mots\/)/.test(rel)) { ko++; console.log(`✗ ${ou}/${rel} : fichier de maison/zone Premium dans le public`); }
}
console.log(`${n} fichiers publics contrôlés contre ${cherche.length} textes et ${mp3.length} voix Premium : ${ko} fuite(s).`); process.exit(ko ? 1 : 0);
