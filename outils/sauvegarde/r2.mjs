// Transfert des sauvegardes DÉJÀ CHIFFRÉES vers un bucket R2 privé, avec vérification après transfert, manifeste et rétention prudente.
//   Envoi (simulation par défaut) :  node outils/sauvegarde/r2.mjs envoyer   --dossier=<dossier> --bucket=<bucket> [--executer]
//   Rétention (simulation) :         node outils/sauvegarde/r2.mjs retention --dossier=<dossier> --bucket=<bucket> [--appliquer]
//   État :                           node outils/sauvegarde/r2.mjs statut    --dossier=<dossier>
// Garde-fous : seuls les fichiers « firestore-AAAA-MM-JJ-HH-MM.json.gz.age » et « auth-… » dont l'empreinte SHA-256 est conforme sont envoyés
// (jamais une clé, un .env, un .json en clair…). Chaque envoi est relu depuis R2 et comparé (SHA-256) avant d'être inscrit au manifeste.
// La rétention ne supprime que sur --appliquer, au plus 5 objets par passage, en gardant toujours les 3 plus récents de chaque type.
// Authentification : variable CLOUDFLARE_API_TOKEN (jeton limité à « Workers R2 Storage : Modifier »), posée par le propriétaire. Jamais dans le dépôt.
import fs from 'fs'; import os from 'os'; import path from 'path'; import crypto from 'crypto'; import { spawnSync } from 'child_process'; import { fileURLToPath } from 'url';

export const MOTIF = /^(firestore|auth)-(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})\.json\.gz\.age$/;
export const BUCKET_INTERDIT = ['ldn-premium'];   // le bucket du contenu Premium ne reçoit jamais de sauvegarde
const sha = octets => crypto.createHash('sha256').update(octets).digest('hex');

export const cleObjet = nom => { const m = MOTIF.exec(nom); if (!m) throw new Error('nom de sauvegarde invalide : ' + nom); return `sauvegardes/${m[1]}/${m[2]}/${m[3]}/${nom}`; };
const dateDe = nom => { const m = MOTIF.exec(nom); return new Date(Date.UTC(+m[2], +m[3] - 1, +m[4], +m[5], +m[6])); };

export function verifierBucket(bucket) {
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket || '')) throw new Error('Nom de bucket invalide (minuscules, chiffres et tirets).');
  if (BUCKET_INTERDIT.includes(bucket)) throw new Error(`Refus : « ${bucket} » est le bucket du contenu Premium, pas un bucket de sauvegarde.`);
}

// Inventaire du dossier local : seulement les archives chiffrées au bon nom ; tout le reste est listé comme « ignoré » et jamais envoyé.
export function inventaire(dossier) {
  const archives = [], ignores = [];
  for (const e of fs.readdirSync(dossier, { withFileTypes: true })) {
    if (!e.isFile() || e.name.endsWith('.sha256') || e.name === 'manifeste-r2.json') continue;
    if (!MOTIF.test(e.name)) { ignores.push(e.name); continue; }
    const chemin = path.join(dossier, e.name), octets = fs.readFileSync(chemin), f = chemin + '.sha256';
    const attendu = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').trim().split(/\s+/)[0] : null, reel = sha(octets);
    archives.push({ nom: e.name, type: MOTIF.exec(e.name)[1], date: dateDe(e.name), chemin, taille: octets.length, sha256: reel, integre: attendu === reel });
  }
  return { archives: archives.sort((a, b) => a.nom.localeCompare(b.nom)), ignores };
}

export function lireManifeste(chemin) { try { return JSON.parse(fs.readFileSync(chemin, 'utf8')); } catch { return { format: 'ldn-manifeste-r2-1', objets: {} }; } }
const ecrireManifeste = (chemin, m) => fs.writeFileSync(chemin, JSON.stringify(m, null, 2) + '\n');

// Exécuteur Wrangler (remplaçable dans les tests).
export function wrangler(args) {
  const r = spawnSync(process.env.LDN_WRANGLER || 'wrangler', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return { status: r.status, sortie: (r.stdout || '') + (r.stderr || '') };
}

export function planEnvoi(inv, manifeste) {
  const nonIntegres = inv.archives.filter(a => !a.integre).map(a => a.nom);
  return { aEnvoyer: inv.archives.filter(a => a.integre && !manifeste.objets[cleObjet(a.nom)]), dejaEnvoyes: inv.archives.filter(a => manifeste.objets[cleObjet(a.nom)]).length, nonIntegres, ignores: inv.ignores };
}

export function envoyer(plan, { bucket, executer = false, executeur = wrangler, manifeste, cheminManifeste, maintenant = Date.now() }) {
  verifierBucket(bucket); const resultats = [];
  for (const a of plan.aEnvoyer) {
    const cle = cleObjet(a.nom);
    if (!executer) { resultats.push({ nom: a.nom, cle, etat: 'simulation' }); continue; }
    const put = executeur(['r2', 'object', 'put', `${bucket}/${cle}`, '--file', a.chemin, '--content-type', 'application/octet-stream', '--remote']);
    if (put.status !== 0) throw new Error('échec de l\'envoi de ' + a.nom);
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-r2-')), 'relu.age');
    try {
      const get = executeur(['r2', 'object', 'get', `${bucket}/${cle}`, '--file', tmp, '--remote']);
      if (get.status !== 0 || !fs.existsSync(tmp)) throw new Error('relecture impossible de ' + a.nom);
      if (sha(fs.readFileSync(tmp)) !== a.sha256) throw new Error('INTÉGRITÉ : le fichier relu depuis R2 diffère de l\'original (' + a.nom + ')');
    } finally { fs.rmSync(path.dirname(tmp), { recursive: true, force: true }); }
    manifeste.objets[cle] = { nom: a.nom, type: a.type, date: a.date.toISOString(), sha256: a.sha256, taille: a.taille, envoyeLe: new Date(maintenant).toISOString(), verifie: true };
    ecrireManifeste(cheminManifeste, manifeste); resultats.push({ nom: a.nom, cle, etat: 'envoye-et-verifie' });
  }
  return resultats;
}

// Rétention : tout garder 14 jours ; ensuite 1 par semaine pendant 8 semaines ; ensuite 1 par mois pendant 12 mois ; au-delà : candidat à la suppression.
// Toujours conserver les 3 plus récents de chaque type. Ne propose jamais un objet absent du manifeste ou non vérifié.
export function planRetention(manifeste, maintenant = Date.now(), { jours = 14, semaines = 8, mois = 12, minimum = 3 } = {}) {
  const garder = new Set(), tous = Object.entries(manifeste.objets).filter(([, o]) => o.verifie).map(([cle, o]) => ({ cle, ...o, t: Date.parse(o.date) }));
  for (const type of new Set(tous.map(o => o.type))) {
    const liste = tous.filter(o => o.type === type).sort((a, b) => b.t - a.t), vus = new Set();
    liste.slice(0, minimum).forEach(o => garder.add(o.cle));
    for (const o of liste) {
      const age = (maintenant - o.t) / 86400000, d = new Date(o.t);
      const sem = `${d.getUTCFullYear()}-S${Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 1)) / (7 * 86400000))}`, mo = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
      if (age <= jours) garder.add(o.cle);
      else if (age <= semaines * 7 && !vus.has('s' + sem)) { vus.add('s' + sem); garder.add(o.cle); }
      else if (age <= mois * 31 && !vus.has('m' + mo)) { vus.add('m' + mo); garder.add(o.cle); }
    }
  }
  return { garder: tous.filter(o => garder.has(o.cle)).map(o => o.cle), supprimer: tous.filter(o => !garder.has(o.cle)).map(o => o.cle) };
}

export function appliquerRetention(plan, { bucket, appliquer = false, executeur = wrangler, manifeste, cheminManifeste, max = 5 }) {
  verifierBucket(bucket); const supprimes = [];
  if (!appliquer) return supprimes;
  for (const cle of plan.supprimer.slice(0, max)) {
    const r = executeur(['r2', 'object', 'delete', `${bucket}/${cle}`, '--remote']);
    if (r.status !== 0) throw new Error('échec de la suppression de ' + cle);
    delete manifeste.objets[cle]; ecrireManifeste(cheminManifeste, manifeste); supprimes.push(cle);
  }
  return supprimes;
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const [cmd, ...reste] = process.argv.slice(2), opt = Object.fromEntries(reste.filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
  try {
    if (!['envoyer', 'retention', 'statut'].includes(cmd) || !opt.dossier) throw new Error('Usage : node outils/sauvegarde/r2.mjs envoyer|retention|statut --dossier=<dossier> --bucket=<bucket> [--executer|--appliquer]');
    const chemin = path.join(opt.dossier, 'manifeste-r2.json'), manifeste = lireManifeste(chemin), inv = inventaire(opt.dossier);
    if (cmd === 'statut') { console.log(`${inv.archives.length} archive(s) locale(s), ${Object.keys(manifeste.objets).length} objet(s) vérifié(s) dans R2, ${inv.archives.filter(a => !a.integre).length} fichier(s) local(aux) non conforme(s).`); process.exit(0); }
    if (!opt.bucket) throw new Error('Indiquer --bucket=<nom>.');
    verifierBucket(opt.bucket);
    if (cmd === 'envoyer') {
      const p = planEnvoi(inv, manifeste); console.log(`${p.aEnvoyer.length} à envoyer, ${p.dejaEnvoyes} déjà dans R2, ${p.nonIntegres.length} refusé(s) (empreinte non conforme), ${p.ignores.length} fichier(s) ignoré(s) (jamais envoyés).`);
      if (p.nonIntegres.length) console.error('⚠ Non conformes : ' + p.nonIntegres.join(', '));
      for (const r of envoyer(p, { bucket: opt.bucket, executer: !!opt.executer, manifeste, cheminManifeste: chemin })) console.log((r.etat === 'simulation' ? 'serait envoyé  ' : '✓ ') + r.cle);
      if (!opt.executer) console.log('SIMULATION : rien n\'est envoyé. Pour envoyer : ajoutez --executer'); process.exit(p.nonIntegres.length ? 1 : 0);
    }
    const p = planRetention(manifeste); console.log(`${p.garder.length} à garder, ${p.supprimer.length} candidat(s) à la suppression${opt.appliquer ? '' : ' (SIMULATION : rien n\'est supprimé ; --appliquer pour supprimer, 5 au plus)'}`);
    for (const c of p.supprimer) console.log('  ' + c);
    const s = appliquerRetention(p, { bucket: opt.bucket, appliquer: !!opt.appliquer, manifeste, cheminManifeste: chemin }); if (s.length) console.log(s.length + ' objet(s) supprimé(s).');
  } catch (e) { console.error('Échec : ' + e.message); process.exit(1); }
}