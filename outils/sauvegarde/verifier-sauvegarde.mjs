// Vérifie une sauvegarde chiffrée : empreinte SHA-256, déchiffrement avec la clé PRIVÉE, structure du contenu. À LANCER PAR LE PROPRIÉTAIRE.
//   node outils/sauvegarde/verifier-sauvegarde.mjs --fichier=<fichier.json.gz.age> --cle-privee=<fichier de la clé privée>
// N'affiche que des NOMBRES (documents par collection) : ni la clé, ni aucune donnée personnelle. Rien n'est écrit sur le disque.
import fs from 'fs'; import crypto from 'crypto';
import { dechiffrer } from './age-js.mjs'; import { FORMAT_AUTH, resume } from './auth.mjs';
const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, ...v] = a.slice(2).split('='); return [k, v.join('=')]; }));
if (!opt.fichier || !opt['cle-privee']) { console.error('Usage : node outils/sauvegarde/verifier-sauvegarde.mjs --fichier=<.age> --cle-privee=<fichier>'); process.exit(2); }
const octets = fs.readFileSync(opt.fichier); let ko = 0;
const v = (nom, ok, detail) => { console.log((ok ? '✓ ' : '✗ ') + nom + (detail ? ' : ' + detail : '')); if (!ok) ko++; };
if (fs.existsSync(opt.fichier + '.sha256')) { const attendu = fs.readFileSync(opt.fichier + '.sha256', 'utf8').trim().split(/\s+/)[0]; v('empreinte SHA-256 conforme au fichier .sha256', crypto.createHash('sha256').update(octets).digest('hex') === attendu); }
else v('fichier .sha256 présent', false);
let e = null;
try {
  const cle = fs.readFileSync(opt['cle-privee'], 'utf8').trim().split(/\r?\n/).find(l => l.startsWith('AGE-SECRET-KEY-'));
  if (!cle) throw new Error('aucune ligne AGE-SECRET-KEY-… dans ce fichier');
  e = JSON.parse((await dechiffrer(octets, cle)).toString('utf8')); v('déchiffrement avec la clé privée', true);
} catch (err) { v('déchiffrement avec la clé privée', false, err.message.replace(/AGE-SECRET-KEY-\S+/g, '***')); }
if (e && e.format === FORMAT_AUTH) {   // sauvegarde des comptes de connexion (Authentication)
  v('format de sauvegarde reconnu (' + FORMAT_AUTH + ')', true, e.date);
  v('configuration de hachage présente (mots de passe restaurables)', !!(e.hashConfig && e.hashConfig.algorithm && e.hashConfig.signerKey && e.hashConfig.saltSeparator));
  v('nombres de comptes cohérents avec le journal de l\'export', JSON.stringify(resume(e.utilisateurs)) === JSON.stringify(e.compte));
  v('chaque compte avec mot de passe a son sel', e.utilisateurs.filter(u => u.passwordHash).every(u => u.salt));
  console.log('comptes : ' + JSON.stringify(e.compte));
} else if (e) {
  v('format de sauvegarde reconnu (ldn-export-1)', e.format === 'ldn-export-1', e.date);
  const recompte = Object.fromEntries(Object.entries(e.collections).map(([c, d]) => [c, Object.keys(d).length]));
  v('nombres de documents cohérents avec le journal de l\'export', JSON.stringify(recompte) === JSON.stringify(e.compte));
  console.log('documents par collection : ' + JSON.stringify(e.compte));
}
console.log(ko ? `\n${ko} vérification(s) en échec.` : '\nSauvegarde saine et lisible avec votre clé.'); process.exit(ko ? 1 : 0);