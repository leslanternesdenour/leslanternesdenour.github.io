// Crée la paire de clés de chiffrement des sauvegardes. À LANCER PAR LE PROPRIÉTAIRE, sur son ordinateur.
//   node outils/sauvegarde/generer-cle.mjs --privee=<fichier de la clé secrète> --publique=<fichier de la clé publique>
// - La clé PRIVÉE (AGE-SECRET-KEY-…) permet de relire les sauvegardes : à ranger dans un gestionnaire de mots de passe ET sur une clé USB, hors du dépôt.
//   Sans elle, les sauvegardes sont définitivement illisibles. Ne jamais la coller dans un chat ni la publier.
// - La clé PUBLIQUE (age1…) ne permet que de chiffrer : elle peut être posée sur un serveur.
// Le programme refuse d'écraser un fichier existant.
import fs from 'fs'; import { nouvelleCle } from './age-js.mjs';
const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; }));
if (!opt.privee || !opt.publique) { console.error('Usage : node outils/sauvegarde/generer-cle.mjs --privee=<fichier> --publique=<fichier>'); process.exit(2); }
for (const f of [opt.privee, opt.publique]) if (fs.existsSync(f)) { console.error('Refus : ' + f + ' existe déjà.'); process.exit(3); }
const { identite, recipient } = await nouvelleCle();
fs.writeFileSync(opt.privee, identite + '\n', { flag: 'wx', mode: 0o600 }); fs.writeFileSync(opt.publique, recipient + '\n', { flag: 'wx' });
console.log('Clé privée  : ' + opt.privee + '  (À METTRE EN LIEU SÛR, jamais dans le dépôt)\nClé publique : ' + opt.publique + '\n' + recipient);
