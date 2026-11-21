// À lancer SUR VOTRE ORDINATEUR, seulement APRÈS votre décision d'activer R2 (qui demande un moyen de paiement) et la création du bucket.
// Envoie le pack Premium (hors dépôt) dans le bucket R2 privé, en gardant les mêmes chemins.
// Usage :  node outils/admin/envoyer-premium-r2.mjs <dossier-du-pack> <nom-du-bucket>             → SIMULATION : liste ce qui serait envoyé, n'envoie RIEN
//          node outils/admin/envoyer-premium-r2.mjs <dossier-du-pack> <nom-du-bucket> --executer   → envoie réellement (wrangler doit être connecté : npx wrangler login)
// Garde-fous : refuse un dossier situé dans le dépôt, un fichier suspect (clé, .env, .git…) et tout chemin hors du dossier du pack.
import fs from 'fs'; import path from 'path'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';
const TYPES = { '.json': 'application/json', '.mp3': 'audio/mpeg', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.txt': 'text/plain' };
const SUSPECT = /(^|\/)(\.git|\.env[^/]*|node_modules)(\/|$)|\.(pem|key|p12)$|service-account|cle-privee/i;
export function planifier(dossier, bucket, depot) {
  const racine = fs.realpathSync(dossier), r = depot ? fs.realpathSync(depot) : null;
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('Nom de bucket invalide (minuscules, chiffres et tirets).');
  if (r && (racine === r || racine.startsWith(r + path.sep))) throw new Error('Le pack doit rester HORS du dépôt : dossier refusé.');
  const fichiers = [];
  (function parcourir(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const abs = path.join(d, e.name), rel = path.relative(racine, abs).split(path.sep).join('/');
    if (SUSPECT.test(rel)) throw new Error('Fichier suspect dans le pack, envoi annulé : ' + rel);
    if (e.isSymbolicLink()) throw new Error('Lien symbolique refusé : ' + rel);
    if (e.isDirectory()) parcourir(abs); else if (e.isFile()) fichiers.push({ rel, abs, taille: fs.statSync(abs).size, type: TYPES[path.extname(rel).toLowerCase()] || 'application/octet-stream' });
  } })(racine);
  if (!fichiers.length) throw new Error('Le dossier du pack est vide.');
  return fichiers.sort((a, b) => a.rel.localeCompare(b.rel)).map(f => ({ ...f, args: ['wrangler', 'r2', 'object', 'put', `${bucket}/${f.rel}`, '--file', f.abs, '--content-type', f.type, '--remote'] }));
}
if (import.meta.url === 'file://' + process.argv[1]) {
  const [dossier, bucket, ...opts] = process.argv.slice(2), executer = opts.includes('--executer');
  if (!dossier || !bucket) { console.error('Usage : node outils/admin/envoyer-premium-r2.mjs <dossier-du-pack> <nom-du-bucket> [--executer]'); process.exit(2); }
  try {
    const plan = planifier(dossier, bucket, path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'));
    const total = plan.reduce((a, f) => a + f.taille, 0);
    console.log(`${plan.length} fichiers, ${(total / 1048576).toFixed(1)} Mo → bucket « ${bucket} »${executer ? '' : '  (SIMULATION : rien n\'est envoyé)'}`);
    for (const f of plan) {
      console.log((executer ? 'envoi  ' : 'serait envoyé  ') + f.rel + '  (' + (f.taille / 1024).toFixed(0) + ' Ko)');
      if (executer) { const r = spawnSync('npx', f.args, { stdio: 'inherit', shell: process.platform === 'win32' }); if (r.status !== 0) throw new Error('Échec de l\'envoi de ' + f.rel); }
    }
    console.log(executer ? 'Terminé. Vérifiez dans /admin/ → Premium que les fichiers apparaissent.' : 'Pour envoyer réellement : ajoutez --executer');
  } catch (e) { console.error('Échec : ' + e.message); process.exit(1); }
}
