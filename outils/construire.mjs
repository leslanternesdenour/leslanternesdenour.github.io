// Construit le dossier publié « dist/ » pour Cloudflare Pages, à partir du dépôt, SANS modifier le dépôt.
// Utilisation : node outils/construire.mjs        (préproduction : LDN_PREPROD=1 ajoute les outils d'écoute internes)
// Le site GitHub Pages actuel n'est pas concerné : il continue de servir le dépôt tel quel.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.join(RACINE, 'dist');
// Garde-fou de branche (Cloudflare Pages : CF_PAGES_BRANCH défini). Le MODE de publication n'est jamais deviné : il est DÉCLARÉ dans le wrangler.toml
// de la branche construite (ENVIRONNEMENT = "preproduction" | "production") et doit correspondre à la branche :
//   « preproduction » ne se construit que si son wrangler.toml déclare « preproduction » ;
//   « production » et « main » ne se construisent que si leur wrangler.toml déclare « production » (la mise en production est donc un acte explicite, versionné) ;
//   toute autre branche est refusée. Aucun dossier publié n'est produit en cas de refus.
const BRANCHE = process.env.CF_PAGES_BRANCH || '';
const WRANGLER = process.env.LDN_WRANGLER || path.join(RACINE, 'wrangler.toml');
const ENV_DECLAREE = (fs.existsSync(WRANGLER) && (fs.readFileSync(WRANGLER, 'utf8').match(/^[ \t]*ENVIRONNEMENT[ \t]*=[ \t]*"([^"]*)"/m) || [])[1]) || '';
if (BRANCHE) {
  const attendu = BRANCHE === 'preproduction' ? 'preproduction' : (BRANCHE === 'production' || BRANCHE === 'main') ? 'production' : null;
  if (!attendu) { console.error(`Build refusé : la branche « ${BRANCHE} » ne peut pas être publiée (seules « preproduction », « production » et « main », ces deux dernières uniquement si leur wrangler.toml déclare la production, le sont).`); process.exit(1); }
  if (ENV_DECLAREE !== attendu) { console.error(`Build refusé : la branche « ${BRANCHE} » exige ENVIRONNEMENT = "${attendu}" dans wrangler.toml (trouvé : « ${ENV_DECLAREE || 'rien'} »). ` + (BRANCHE === 'main' || BRANCHE === 'production' ? 'La production n\'est pas activée sur cette version.' : 'Une configuration de production ne doit jamais être publiée comme préproduction.')); process.exit(1); }
}
const PRODUCTION = BRANCHE === 'main' || BRANCHE === 'production';
const PREPROD = process.env.LDN_PREPROD === '1' || (BRANCHE && !PRODUCTION);
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
  fs.mkdirSync(path.join(SORTIE, 'outils/voix'), { recursive: true }); fs.copyFileSync(path.join(RACINE, 'outils/voix/prononciation-ar.html'), path.join(SORTIE, 'outils/voix/prononciation-ar.html')); n++; fs.mkdirSync(path.join(SORTIE, 'outils/voix/prononciation-ar'), { recursive: true }); for (const f of fs.readdirSync(path.join(RACINE, 'outils/voix/prononciation-ar'))) { fs.copyFileSync(path.join(RACINE, 'outils/voix/prononciation-ar', f), path.join(SORTIE, 'outils/voix/prononciation-ar', f)); n++; } fs.copyFileSync(path.join(RACINE, 'outils/voix/narratrice.html'), path.join(SORTIE, 'outils/voix/narratrice.html')); n++; fs.mkdirSync(path.join(SORTIE, 'outils/voix/narratrice'), { recursive: true }); for (const f of fs.readdirSync(path.join(RACINE, 'outils/voix/narratrice'))) { fs.copyFileSync(path.join(RACINE, 'outils/voix/narratrice', f), path.join(SORTIE, 'outils/voix/narratrice', f)); n++; } for (const f of ['lot.html', 'lots.html']) { fs.copyFileSync(path.join(RACINE, 'outils/voix', f), path.join(SORTIE, 'outils/voix', f)); n++; } (function cp(rel) { const a = path.join(RACINE, rel), d = path.join(SORTIE, rel); fs.mkdirSync(d, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.isDirectory()) cp(path.join(rel, e.name)); else { fs.copyFileSync(path.join(a, e.name), path.join(d, e.name)); n++; } } })('outils/voix/lots'); for (const f of ['validation.html', 'textes-ecoute.json']) { fs.copyFileSync(path.join(RACINE, 'outils/voix', f), path.join(SORTIE, 'outils/voix', f)); n++; } fs.mkdirSync(path.join(SORTIE, 'outils/voix/essais'), { recursive: true }); fs.copyFileSync(path.join(RACINE, 'outils/voix/choix-voix.html'), path.join(SORTIE, 'outils/voix/choix-voix.html')); n++; for (const f of fs.readdirSync(path.join(RACINE, 'outils/voix/essais'))) { fs.copyFileSync(path.join(RACINE, 'outils/voix/essais', f), path.join(SORTIE, 'outils/voix/essais', f)); n++; } // validation des voix phrase par phrase (interne)
  // validation des prononciations des 28 lettres (page + données) : outil interne, préproduction seulement, jamais en production
  (function cp(rel) { const a = path.join(RACINE, rel), d = path.join(SORTIE, rel); fs.mkdirSync(d, { recursive: true });
    for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.isDirectory()) cp(rel + '/' + e.name); else { fs.copyFileSync(path.join(a, e.name), path.join(d, e.name)); n++; } } })('outils/voix/lettres-validation');
  // enregistrements CANDIDATS des lettres (à valider) : même règle, dossier interne, jamais sous /audio (publié en production)
  if (fs.existsSync(path.join(RACINE, 'outils/voix/lettres-candidats'))) (function cp(rel) { const a = path.join(RACINE, rel), d = path.join(SORTIE, rel); fs.mkdirSync(d, { recursive: true });
    for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (e.isDirectory()) cp(rel + '/' + e.name); else { fs.copyFileSync(path.join(a, e.name), path.join(d, e.name)); n++; } } })('outils/voix/lettres-candidats');
  // pages de contrôle des personnages (mode sans visage, amélioration des personnages) : préproduction seulement, jamais en production
  if (fs.existsSync(path.join(RACINE, 'outils/personnages'))) { fs.mkdirSync(path.join(SORTIE, 'outils/personnages'), { recursive: true });
    for (const f of fs.readdirSync(path.join(RACINE, 'outils/personnages'))) if (/\.(html|js|css)$/.test(f)) { fs.copyFileSync(path.join(RACINE, 'outils/personnages', f), path.join(SORTIE, 'outils/personnages', f)); n++; } }
  // page d'écoute des voix des jeux « Les Aventures des Lanternes » (interne, préproduction seulement)
  fs.mkdirSync(path.join(SORTIE, 'outils/voix/jeux'), { recursive: true });
  for (const f of ['ecoute.html', 'voix-roles.json', 'voix-nour.json']) { fs.copyFileSync(path.join(RACINE, 'outils/voix/jeux', f), path.join(SORTIE, 'outils/voix/jeux', f)); n++; }
  // la préproduction ne doit jamais être indexée par Google
  // ATTENTION : Cloudflare ne garde qu'UN bloc par chemin (le dernier). Le noindex est donc fusionné dans le bloc « /* » existant, jamais ajouté en second bloc.
  const ent = path.join(SORTIE, '_headers'), src = fs.readFileSync(ent, 'utf8');
  if (!/^\/\*[ \t]*$/m.test(src)) throw new Error('_headers : bloc « /* » introuvable');
  fs.writeFileSync(ent, src.replace(/^\/\*[ \t]*\r?\n/m, m => m + '  X-Robots-Tag: noindex, nofollow\n'));
  fs.writeFileSync(path.join(SORTIE, 'robots.txt'), '# Préproduction : rien ne doit être indexé\nUser-agent: *\nDisallow: /\n');
  fs.rmSync(path.join(SORTIE, 'sitemap.xml'), { force: true });
}
// Production : la page Conditions publiée n'affiche jamais les emplacements « EN ATTENTE » (vue publique), et aucune page légale ou tarifaire ne garde de marqueur provisoire.
if (PRODUCTION) {
  const { vuePublique, MARQUEURS_PROVISOIRES } = await import('./legal/vue-publique.mjs');
  const cond = path.join(SORTIE, 'conditions/index.html');
  if (fs.existsSync(cond)) fs.writeFileSync(cond, vuePublique(fs.readFileSync(cond, 'utf8')));
  for (const p of ['conditions/index.html', 'tarifs/index.html']) { const f = path.join(SORTIE, p); if (fs.existsSync(f) && MARQUEURS_PROVISOIRES.test(fs.readFileSync(f, 'utf8'))) { console.error('Build refusé : ' + p + ' contient encore un marqueur provisoire ([EN ATTENTE], [À COMPLÉTER], brouillon).'); process.exit(1); } }
}
// Anti-copie périmée du Grand Voyage : Cloudflare garde les fichiers statiques 4 h dans le navigateur (réglage de zone, que _headers ne peut pas raccourcir).
// Chaque import relatif de voyage/js/** et la page reçoivent donc ?v=<empreinte du contenu> : dès que le jeu change, le navigateur recharge TOUT le jeu, jamais un mélange ancien/nouveau.
{
  const dossier = path.join(SORTIE, 'voyage/js'), page = path.join(SORTIE, 'voyage/index.html');
  if (fs.existsSync(dossier) && fs.existsSync(page)) {
    const fichiers = []; (function lister(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const a = path.join(d, e.name); if (e.isDirectory()) lister(a); else if (a.endsWith('.js')) fichiers.push(a); } })(dossier);
    fichiers.sort();
    const h = crypto.createHash('sha1'); for (const f of fichiers) { h.update(path.relative(dossier, f)); h.update(fs.readFileSync(f)); } h.update(fs.readFileSync(path.join(SORTIE, 'voyage/voyage.css')));
    const ID = h.digest('hex').slice(0, 10);
    const RE = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])(\.{1,2}\/[^'"?]+\.js)(?:\?[^'"]*)?\2/g;
    for (const f of fichiers) { const t = fs.readFileSync(f, 'utf8'), u = t.replace(RE, (m, a, q, c) => path.resolve(path.dirname(f), c).startsWith(dossier + path.sep) ? `${a}${q}${c}?v=${ID}${q}` : m); /* seuls les modules DU jeu : les modules partagés avec le village gardent leur propre ?v= */ if (u !== t) fs.writeFileSync(f, u); }
    const html = fs.readFileSync(page, 'utf8');
    const html2 = html.replace(/(js\/main\.js)(\?v=[^"']*)?/, `$1?v=${ID}`).replace(/(voyage\.css)(\?v=[^"']*)?/, `$1?v=${ID}`);
    if (!html2.includes(`main.js?v=${ID}`)) { console.error('Build refusé : la page du Grand Voyage ne référence plus js/main.js.'); process.exit(1); }
    fs.writeFileSync(page, html2); console.log(`Grand Voyage : version de cache ${ID} (${fichiers.length} modules)`);
  }
}
// Quel commit est réellement en ligne ? (le dépôt est public : le numéro de commit n'est pas un secret)
fs.writeFileSync(path.join(SORTIE, 'version.json'), JSON.stringify({ commit: process.env.CF_PAGES_COMMIT_SHA || 'local', branche: process.env.CF_PAGES_BRANCH || 'local' }) + '\n');
console.log(`dist/ : ${n} fichiers, ${(octets / 1048576).toFixed(1)} Mo${PREPROD ? ' (préproduction)' : PRODUCTION ? ' (PRODUCTION)' : ''}`);
