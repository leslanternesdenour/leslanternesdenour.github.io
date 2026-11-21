// Construit le dossier publié « dist/ » pour Cloudflare Pages, à partir du dépôt, SANS modifier le dépôt.
// Utilisation : node outils/construire.mjs        (préproduction : LDN_PREPROD=1 ajoute les outils d'écoute internes)
// Le site GitHub Pages actuel n'est pas concerné : il continue de servir le dépôt tel quel.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(RACINE, 'dist');
// Garde-fou : sur Cloudflare Pages (CF_PAGES_BRANCH défini), seule la branche « preproduction » peut être construite. Toute autre branche, dont « main », fait échouer le build.
if (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'preproduction') { console.error(`Build refusé : la branche « ${process.env.CF_PAGES_BRANCH} » ne peut pas être publiée (seule « preproduction » l'est).`); process.exit(1); }
const PREPROD = process.env.LDN_PREPROD === '1' || (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'main');
// jamais publiés : outillage, fonctions serveur (Cloudflare les prend à part), configuration, documents de travail
const EXCLUS = new Set(['.git', '.github', 'dist', 'node_modules', 'functions', 'serveur', 'outils', '.node-version', 'wrangler.toml', 'package.json', 'package-lock.json',
  '_documentation', 'docs', 'premium', 'tests', 'compte/comptes.js', 'firestore.rules', 'firestore.indexes.json', 'firebase.json', '.gitignore', '.dev.vars', 'CNAME']);
const exclu = rel => EXCLUS.has(rel.split('/')[0]) || EXCLUS.has(rel) || rel.startsWith('personnages3d/donnees-tests') || rel.startsWith('personnages3d/essais') || /\.(md|patch|mjs)$/.test(rel) || /\.test\.js$/.test(rel) || /(^|\/)\.env/.test(rel);
fs.rmSync(SORTIE, { recursive: true, force: true }); fs.mkdirSync(SORTIE);
let n = 0, octets = 0;
(function copier(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name), rel = path.relative(RACINE, abs).split(path.sep).join('/');
    if (exclu(rel)) continue;
    if (e.isDirectory()) { copier(abs); continue; }
    const dest = path.join(SORTIE, rel); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(abs, dest); n++; octets += fs.statSync(abs).size;
  }
})(RACINE);
if (PREPROD) { // page d'écoute des voix (outil interne, non indexée) disponible uniquement en préproduction
  fs.mkdirSync(path.join(SORTIE, 'outils'), { recursive: true }); fs.copyFileSync(path.join(RACINE, 'outils/ecoute-voix.html'), path.join(SORTIE, 'outils/ecoute-voix.html')); n++;
  // la préproduction ne doit jamais être indexée par Google
  // ATTENTION : Cloudflare ne garde qu'UN bloc par chemin (le dernier). Le noindex est donc fusionné dans le bloc « /* » existant, jamais ajouté en second bloc.
  const ent = path.join(SORTIE, '_headers'), src = fs.readFileSync(ent, 'utf8');
  if (!/^\/\*[ \t]*$/m.test(src)) throw new Error('_headers : bloc « /* » introuvable');
  fs.writeFileSync(ent, src.replace(/^\/\*[ \t]*\r?\n/m, m => m + '  X-Robots-Tag: noindex, nofollow\n'));
  fs.writeFileSync(path.join(SORTIE, 'robots.txt'), '# Préproduction : rien ne doit être indexé\nUser-agent: *\nDisallow: /\n');
  fs.rmSync(path.join(SORTIE, 'sitemap.xml'), { force: true });
}
// Quel commit est réellement en ligne ? (le dépôt est public : le numéro de commit n'est pas un secret)
fs.writeFileSync(path.join(SORTIE, 'version.json'), JSON.stringify({ commit: process.env.CF_PAGES_COMMIT_SHA || 'local', branche: process.env.CF_PAGES_BRANCH || 'local' }) + '\n');
console.log(`dist/ : ${n} fichiers, ${(octets / 1048576).toFixed(1)} Mo${PREPROD ? ' (préproduction)' : ''}`);
