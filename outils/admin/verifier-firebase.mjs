// Vérifie la configuration RÉELLE de Firebase Authentication à partir de la clé publique de l'application Web (compte/config.js) :
// domaines autorisés, e-mail/mot de passe, Google, fournisseurs désactivés (Apple, Anonyme), règle de mot de passe, cycle inscription → connexion → suppression.
// Aucun secret n'est nécessaire (la clé d'API Web est publique). Le compte de test est TOUJOURS supprimé. Aucun e-mail n'est envoyé.
// Usage : node outils/admin/verifier-firebase.mjs [domaine-du-site]        (défaut : lanternes-de-nour.pages.dev)
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
const API = 'https://identitytoolkit.googleapis.com/v1';
const msg = r => (r && r.j && r.j.error && r.j.error.message) || '';
export async function verifier({ cle, projet, domaine, fetcher = fetch }) {
  const out = []; const v = (nom, etat, detail = '') => out.push({ nom, etat, detail });   // etat : true | false | null (indéterminé)
  const appel = async (chemin, corps, methode = 'POST') => { try { const r = await fetcher(`${API}/${chemin}${chemin.includes('?') ? '&' : '?'}key=${cle}`, { method: methode, headers: { 'Content-Type': 'application/json' }, body: methode === 'GET' ? undefined : JSON.stringify(corps) }); return { s: r.status, j: await r.json().catch(() => ({})) }; } catch (e) { return { s: 0, j: {}, e: e.message }; } };
  const cfg = await appel('projects', null, 'GET');
  if (cfg.s !== 200) { v('Clé d\'API Web acceptée par Google', false, msg(cfg) || cfg.e || ('HTTP ' + cfg.s)); return out; }
  v('Clé d\'API Web acceptée par Google', true);
  v('Projet attendu', cfg.j.projectId === projet, 'projet reçu : ' + cfg.j.projectId);
  const doms = cfg.j.authorizedDomains || []; v(`Domaine autorisé : ${domaine}`, doms.includes(domaine), 'domaines : ' + doms.join(', '));
  // règle de mot de passe (aucun compte créé)
  const faible = await appel('accounts:signUp', { email: `faible-${Date.now()}@exemple.invalid`, password: 'ab1', returnSecureToken: true });
  v('E-mail/mot de passe activé', faible.s === 400 && /WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET|MISSING_PASSWORD/.test(msg(faible)) ? true : /OPERATION_NOT_ALLOWED/.test(msg(faible)) ? false : null, msg(faible));
  v('Règle de mot de passe appliquée (8 caractères minimum)', /WEAK_PASSWORD|PASSWORD_DOES_NOT_MEET/.test(msg(faible)) ? true : faible.s === 200 ? false : null, msg(faible));
  if (faible.s === 200 && faible.j.idToken) await appel('accounts:delete', { idToken: faible.j.idToken });
  // fournisseurs : Google doit être activé ; Apple désactivé
  for (const [fournisseur, attendu] of [['google.com', true], ['apple.com', false]]) {
    const r = await appel('accounts:createAuthUri', { providerId: fournisseur, continueUri: `https://${domaine}/compte/`, identifier: undefined });
    const actif = r.s === 200 && !!r.j.authUri ? true : /OPERATION_NOT_ALLOWED|CONFIGURATION_NOT_FOUND|INVALID_PROVIDER_ID/.test(msg(r)) ? false : null;
    v(attendu ? 'Google activé' : 'Apple désactivé (reporté)', actif === null ? null : actif === attendu, actif === null ? 'indéterminé : ' + msg(r) : (actif ? 'activé' : 'désactivé'));
  }
  // anonyme : doit être désactivé
  const anon = await appel('accounts:signUp', { returnSecureToken: true });
  if (anon.s === 200 && anon.j.idToken) { v('Connexion anonyme désactivée', false, 'ACTIVÉE : à désactiver'); await appel('accounts:delete', { idToken: anon.j.idToken }); }
  else v('Connexion anonyme désactivée', /OPERATION_NOT_ALLOWED|ADMIN_ONLY/.test(msg(anon)) ? true : null, msg(anon));
  // cycle réel par e-mail
  const alea = Math.random().toString(36).slice(2, 10), email = `verif-${alea}@exemple.invalid`, mdp = `Mdp-verif-${alea}-Z9!`;
  const ins = await appel('accounts:signUp', { email, password: mdp, returnSecureToken: true });
  v('Inscription e-mail/mot de passe', ins.s === 200 && !!ins.j.idToken, msg(ins));
  if (ins.s === 200) {
    const con = await appel('accounts:signInWithPassword', { email, password: mdp, returnSecureToken: true });
    v('Connexion e-mail/mot de passe', con.s === 200 && con.j.localId === ins.j.localId, msg(con));
    const jwt = con.j.idToken && JSON.parse(Buffer.from(con.j.idToken.split('.')[1], 'base64url'));
    v('Jeton : fournisseur « password », adresse non vérifiée tant que le lien n\'est pas cliqué', !!jwt && jwt.firebase.sign_in_provider === 'password' && jwt.email_verified === false);
    v('Jeton : émis pour le bon projet', !!jwt && jwt.aud === projet && jwt.iss === 'https://securetoken.google.com/' + projet, jwt && jwt.aud);
    const sup = await appel('accounts:delete', { idToken: ins.j.idToken }); v('Compte de test supprimé', sup.s === 200, msg(sup));
    const apres = await appel('accounts:signInWithPassword', { email, password: mdp, returnSecureToken: true });
    v('Après suppression : connexion impossible', apres.s === 400, msg(apres));
  }
  return out;
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), domaine = process.argv[2] || 'lanternes-de-nour.pages.dev';
  const cfg = (await import(pathToFileURL(path.join(racine, 'compte/config.js')).href)).FIREBASE;
  if (!cfg || !cfg.apiKey) { console.error('compte/config.js ne contient pas encore la configuration web Firebase.'); process.exit(3); }
  const res = await verifier({ cle: cfg.apiKey, projet: cfg.projectId, domaine });
  for (const r of res) console.log((r.etat === true ? '✓ ' : r.etat === false ? '✗ ' : '? ') + r.nom + (r.etat !== true && r.detail ? '  → ' + r.detail : ''));
  const ko = res.filter(r => r.etat === false).length, flou = res.filter(r => r.etat === null).length;
  console.log(`\n${res.filter(r => r.etat === true).length} confirmés, ${ko} à corriger, ${flou} indéterminés.`); process.exit(ko ? 1 : 0);
}
