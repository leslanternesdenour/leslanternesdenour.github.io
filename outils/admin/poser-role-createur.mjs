// À lancer SUR VOTRE ORDINATEUR, une seule fois, après avoir créé votre compte sur /compte/ (jamais depuis le site).
// Pose le rôle « creator » sur VOTRE compte Firebase et affiche l'identifiant (UID) à enregistrer dans le secret CREATOR_UID de Cloudflare.
// Usage : node outils/admin/poser-role-createur.mjs <fichier-cle-compte-de-service.json> <votre-email>
// La clé reste sur votre ordinateur : elle n'est ni affichée, ni envoyée ailleurs qu'à Google, ni placée dans le dépôt (.gitignore).
import fs from 'fs'; import { jetonGoogle } from '../../serveur/base-firestore.js';
export async function poserRoleCreateur({ compte, email, fetcher = fetch, jeton = jetonGoogle(compte, { fetcher }) }) {
  const base = `https://identitytoolkit.googleapis.com/v1/projects/${compte.project_id}/accounts`;
  const appel = async (chemin, corps) => {
    const r = await fetcher(base + chemin, { method: 'POST', headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(`Firebase a refusé (${r.status}) : ${j.error && j.error.message || 'erreur'}`); return j;
  };
  const trouves = (await appel(':lookup', { email: [email] })).users || [];
  if (trouves.length !== 1) throw new Error('Aucun compte avec cette adresse : créez-le d\'abord sur la page /compte/ du site.');
  const u = trouves[0];
  if (!u.emailVerified) throw new Error('L\'adresse du compte n\'est pas vérifiée : cliquez d\'abord sur le lien reçu par e-mail.');
  await appel(':update', { localId: u.localId, customAttributes: JSON.stringify({ role: 'creator' }) });
  return u.localId;
}
if (import.meta.url === 'file://' + process.argv[1]) {
  const [cle, email] = process.argv.slice(2);
  if (!cle || !email) { console.error('Usage : node outils/admin/poser-role-createur.mjs <fichier-cle.json> <votre-email>'); process.exit(2); }
  try {
    const compte = JSON.parse(fs.readFileSync(cle, 'utf8')); if (!compte.private_key || !compte.client_email || !compte.project_id) throw new Error('Ce fichier n\'est pas une clé de compte de service Firebase.');
    const uid = await poserRoleCreateur({ compte, email: email.trim().toLowerCase() });
    console.log('Rôle « creator » posé.\nIdentifiant (UID) à copier dans le secret Cloudflare CREATOR_UID :\n' + uid + '\nReconnectez-vous ensuite sur /compte/ pour que le rôle soit pris en compte.');
  } catch (e) { console.error('Échec : ' + e.message); process.exit(1); }
}
