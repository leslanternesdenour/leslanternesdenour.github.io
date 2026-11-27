// Chiffrement « age » (format standard, compatible avec la commande `age`) en JavaScript pur : aucune installation de programme sur l'ordinateur.
// La bibliothèque `age-encryption` est cherchée : 1) dans le dossier donné par LDN_MODULES, 2) dans node_modules du dépôt ou du dossier parent.
import path from 'path'; import fs from 'fs'; import { pathToFileURL, fileURLToPath } from 'url';
import zlib from 'zlib';

const ICI = path.dirname(fileURLToPath(import.meta.url));
export function trouverBibliotheque() {
  const dossiers = [process.env.LDN_MODULES, path.resolve(ICI, '../../node_modules'), path.resolve(ICI, '../../../node_modules')].filter(Boolean);
  for (const d of dossiers) { const f = path.join(d, 'age-encryption', 'dist', 'index.js'); if (fs.existsSync(f)) return f; }
  return null;
}
export async function chargerAge() {
  const f = trouverBibliotheque();
  if (!f) throw new Error('bibliothèque age-encryption introuvable (définir LDN_MODULES=<dossier node_modules> ou : npm i age-encryption)');
  return import(pathToFileURL(f).href);
}

// Octets → gzip → age (clé PUBLIQUE seulement : le programme de sauvegarde ne peut jamais relire ses propres sauvegardes).
export async function chiffrer(octets, recipient) {
  const age = await chargerAge(); const e = new age.Encrypter(); e.addRecipient(recipient);
  return e.encrypt(zlib.gzipSync(octets, { level: 9 }));
}
// Fichier .age → gunzip, avec la clé PRIVÉE (seulement le jour d'une restauration, sur l'ordinateur du propriétaire).
export async function dechiffrer(octets, identite) {
  const age = await chargerAge(); const d = new age.Decrypter(); d.addIdentity(identite);
  return zlib.gunzipSync(await d.decrypt(octets));
}
// Paire de clés X25519 (compatible avec toutes les versions de la commande `age`).
export async function nouvelleCle() {
  const age = await chargerAge(); const identite = await age.generateX25519Identity();
  return { identite, recipient: await age.identityToRecipient(identite) };
}
