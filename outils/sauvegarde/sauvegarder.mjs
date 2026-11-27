// Sauvegarde chiffrée des comptes : Firestore (familles, profils enfants, droits…) ET Firebase Authentication (comptes de connexion).
// Export → gzip → chiffrement age (clé publique) → fichier daté + empreinte SHA-256. LECTURE SEULE : rien n'est écrit ni supprimé dans Firebase,
// aucun ancien fichier n'est effacé.
//
//   À blanc (compte les documents et les comptes, n'écrit rien, ne chiffre rien) :
//     node outils/sauvegarde/sauvegarder.mjs --a-blanc
//   Sauvegarde réelle (deux fichiers : firestore-… et auth-…) :
//     node outils/sauvegarde/sauvegarder.mjs --sortie=<dossier> [--cle-publique=<fichier>] [--sans-auth]
//
// Variables : FIREBASE_PROJET (défaut lanternes-de-nour), GOOGLE_APPLICATION_CREDENTIALS (fichier du compte de service, hors dépôt),
//             LDN_CLE_PUBLIQUE (fichier contenant la clé publique « age1… »), LDN_MODULES (dossier node_modules contenant age-encryption).
// La clé PRIVÉE n'est jamais utilisée ici : elle reste chez le propriétaire (voir generer-cle.mjs et docs/SAUVEGARDES.md).
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
import { exporter } from './restauration.mjs'; import { chiffrer } from './age-js.mjs'; import { exporterAuth } from './auth.mjs';

export function nomFichier(date = new Date(), prefixe = 'firestore') { return prefixe + '-' + date.toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json.gz.age'; }

// Cœur testable : objet exporté → octets chiffrés + empreinte. Aucune écriture disque.
export async function chiffrerExport(e, recipient, { maintenant = Date.now(), prefixe = 'firestore' } = {}) {
  const clair = Buffer.from(JSON.stringify(e)), chiffre = Buffer.from(await chiffrer(clair, recipient));
  return { octets: chiffre, sha256: crypto.createHash('sha256').update(chiffre).digest('hex'), compte: e.compte, nom: nomFichier(new Date(maintenant), prefixe), tailleClair: clair.length };
}
export async function preparerSauvegarde(base, recipient, { maintenant = Date.now() } = {}) {
  return chiffrerExport(await exporter(base, { maintenant }), recipient, { maintenant, prefixe: 'firestore' });
}
export async function preparerSauvegardeAuth(opts, recipient, { maintenant = Date.now() } = {}) {
  return chiffrerExport(await exporterAuth({ ...opts, maintenant }), recipient, { maintenant, prefixe: 'auth' });
}
export function ecrire(dossier, s) {
  const f = path.join(dossier, s.nom);
  if (fs.existsSync(f)) throw new Error('Refus : le fichier existe déjà (' + s.nom + ').');
  fs.writeFileSync(f, s.octets, { flag: 'wx' }); fs.writeFileSync(f + '.sha256', `${s.sha256}  ${s.nom}\n`, { flag: 'wx' });
  return f;
}

const direct = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (direct) {
  const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=') || true]; }));
  const projet = process.env.FIREBASE_PROJET || 'lanternes-de-nour', cleF = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_COMPTE_SERVICE_FICHIER;
  if (!cleF || !fs.existsSync(cleF)) { console.error('Compte de service introuvable (GOOGLE_APPLICATION_CREDENTIALS).'); process.exit(2); }
  const { baseFirestore } = await import('../../serveur/base-firestore.js');
  const compte = JSON.parse(fs.readFileSync(cleF, 'utf8')), base = baseFirestore({ projet, compte });
  if (opt['a-blanc']) {   // aucune donnée n'est conservée : uniquement des nombres
    const e = await exporter(base); console.log(`À blanc, Firestore, projet ${projet} : ` + JSON.stringify(e.compte));
    if (!opt['sans-auth']) console.log('À blanc, Authentication : ' + JSON.stringify((await exporterAuth({ projet, compte })).compte));
    process.exit(0);
  }
  const fCle = opt['cle-publique'] || process.env.LDN_CLE_PUBLIQUE;
  if (!fCle || !fs.existsSync(fCle)) { console.error('Clé publique age introuvable : la créer d\'abord avec generer-cle.mjs (voir docs/SAUVEGARDES.md).'); process.exit(2); }
  const recipient = fs.readFileSync(fCle, 'utf8').trim();
  if (!/^age1[0-9a-z]+$/.test(recipient)) { console.error('Ce fichier ne contient pas une clé publique age (age1…). Ne jamais y mettre la clé privée.'); process.exit(2); }
  const dossier = opt.sortie; if (!dossier || dossier === true) { console.error('Indiquer --sortie=<dossier>.'); process.exit(2); }
  fs.mkdirSync(dossier, { recursive: true });
  const maintenant = Date.now(), lots = [await preparerSauvegarde(base, recipient, { maintenant })];
  if (!opt['sans-auth']) lots.push(await preparerSauvegardeAuth({ projet, compte }, recipient, { maintenant }));
  for (const s of lots) {
    let f; try { f = ecrire(dossier, s); } catch (e) { console.error(e.message); process.exit(3); }
    console.log(`Sauvegarde chiffrée : ${f}\n  ${s.octets.length} octets (données en clair : ${s.tailleClair}), SHA-256 ${s.sha256}\n  contenu : ${JSON.stringify(s.compte)}`);
  }
}