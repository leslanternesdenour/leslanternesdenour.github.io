// Contrôle du dossier publié dist/ : rien d'interne, de secret ou de Premium ne doit y être.
// node outils/construire.mjs && node outils/tests/verifier-dist.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), DIST = path.join(RACINE, 'dist');
if (!fs.existsSync(DIST)) { console.error('dist/ absent : lancer d\'abord node outils/construire.mjs'); process.exit(2); }
const tous = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? tous(path.join(d, e.name)) : [path.join(d, e.name)]);
const fichiers = tous(DIST).map(f => path.relative(DIST, f).split(path.sep).join('/'));
const INTERDITS = [
  [/^functions\//, 'code serveur'], [/^outils\/(tests|restauration|admin)\//, 'outillage interne'], [/^_documentation\//, 'documentation interne'],
  [/^premium\//, 'contenu Premium (doit être servi depuis R2 privé par le Worker)'], [/^voyage\/[a-z]+\/(contenu|zone)\.json$/, 'pack Premium du Grand Voyage'], [/^maisons\//, 'maison Premium (servie par /api/premium)'], [/^voyage\/[a-z]+\/voix\//, 'voix Premium'], [/\.md$/, 'document de travail'],
  [/(^|\/)(wrangler\.toml|firestore\.rules|\.dev\.vars|\.env.*|package(-lock)?\.json)$/, 'configuration'],
  [/service-account|credentials|\.pem$|\.key$|\.bundle$/i, 'fichier sensible']
];
const SECRETS = /AIza[0-9A-Za-z_-]{35}|sk_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY|"private_key"\s*:|ghp_[0-9A-Za-z]{30,}/;
let ko = 0;
for (const f of fichiers) {
  for (const [re, quoi] of INTERDITS) if (re.test(f)) { ko++; console.log(`✗ ${f} : ${quoi}`); }
  if (/\.(js|html|json|css|txt|webmanifest|toml)$/.test(f) && SECRETS.test(fs.readFileSync(path.join(DIST, f), 'utf8'))) { ko++; console.log(`✗ ${f} : ressemble à une clé secrète`); }
}
console.log(`${fichiers.length} fichiers publiés contrôlés, ${ko} problème(s).`); process.exit(ko ? 1 : 0);
