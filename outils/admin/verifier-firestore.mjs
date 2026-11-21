// Vérifie les règles Firestore RÉELLES du projet : tout doit être refusé (403) à un visiteur anonyme ET à un parent connecté,
// pour toute lecture, liste, requête, création, modification et suppression. Seul le serveur (compte de service) accède à la base.
// Utilise la clé d'API Web publique (compte/config.js) ; crée un compte de test TOUJOURS supprimé ; ne crée aucune collection ;
// si une écriture passait par erreur, le document de test est supprimé aussitôt et l'anomalie est signalée.
// Usage : node outils/admin/verifier-firestore.mjs
import path from 'path'; import { pathToFileURL, fileURLToPath } from 'url';
export async function verifier({ cle, projet, fetcher = fetch }) {
  const out = []; const v = (nom, etat, detail = '') => out.push({ nom, etat, detail });
  const ID = 'https://identitytoolkit.googleapis.com/v1', FS = `https://firestore.googleapis.com/v1/projects/${projet}/databases/(default)/documents`;
  const appel = async (url, { m = 'GET', jeton, corps } = {}) => { try { const r = await fetcher(url, { method: m, headers: { 'Content-Type': 'application/json', ...(jeton ? { Authorization: 'Bearer ' + jeton } : {}) }, body: corps ? JSON.stringify(corps) : undefined }); return { s: r.status, j: await r.json().catch(() => ({})) }; } catch (e) { return { s: 0, j: {}, e: e.message }; } };
  const refuse = r => r.s === 403;   // 403 = règles : refusé. 200 ou 404 sur une lecture = autorisé (anomalie). Autre = indéterminé.
  const verdict = (r) => refuse(r) ? true : (r.s === 200 || r.s === 404) ? false : null;
  const marque = 'verification-regles-' + Math.random().toString(36).slice(2, 8);   // (les identifiants « __x__ » sont réservés par Firestore)
  const essais = (jeton) => [
    ['lire une liste (familles)', () => appel(`${FS}/familles?pageSize=1`, { jeton })],
    ['lire une liste (droits)', () => appel(`${FS}/droits?pageSize=1`, { jeton })],
    ['lire une liste (abonnements)', () => appel(`${FS}/abonnements?pageSize=1`, { jeton })],
    ['lire une liste (admin_logs)', () => appel(`${FS}/admin_logs?pageSize=1`, { jeton })],
    ['lire un document (familles)', () => appel(`${FS}/familles/${marque}`, { jeton })],
    ['requête sur toutes les sous-collections « enfants »', () => appel(`${FS}:runQuery`, { m: 'POST', jeton, corps: { structuredQuery: { from: [{ collectionId: 'enfants', allDescendants: true }], limit: 1 } } })],
    ['créer un document', () => appel(`${FS}/familles?documentId=${marque}`, { m: 'POST', jeton, corps: { fields: { role: { stringValue: 'creator' } } } })],
    ['modifier un document (s\'attribuer un rôle)', () => appel(`${FS}/droits/${marque}`, { m: 'PATCH', jeton, corps: { fields: { statut: { stringValue: 'creator' } } } })],
    ['supprimer un document', () => appel(`${FS}/familles/${marque}`, { m: 'DELETE', jeton })]
  ];
  const nettoyer = async (jeton) => { for (const c of ['familles', 'droits']) await appel(`${FS}/${c}/${marque}`, { m: 'DELETE', jeton }); };
  // 1. visiteur anonyme
  for (const [nom, f] of essais(null)) { const r = await f(); v(`Anonyme : ${nom} refusé`, verdict(r), refuse(r) ? '' : `HTTP ${r.s} ${(r.j.error && r.j.error.message) || r.e || ''}`); }
  // 2. parent connecté (compte de test)
  const alea = Math.random().toString(36).slice(2, 10), email = `regles-${alea}@exemple.invalid`;
  const ins = await appel(`${ID}/accounts:signUp?key=${cle}`, { m: 'POST', corps: { email, password: `Mdp-regles-${alea}-Z9!`, returnSecureToken: true } });
  if (ins.s !== 200) { v('Compte de test créé pour la vérification', false, (ins.j.error && ins.j.error.message) || ins.e); return out; }
  const jeton = ins.j.idToken;
  try {
    for (const [nom, f] of essais(jeton)) { const r = await f(); v(`Parent connecté : ${nom} refusé`, verdict(r), refuse(r) ? '' : `HTTP ${r.s} ${(r.j.error && r.j.error.message) || r.e || ''}`); }
    const propre = await appel(`${FS}/familles/${ins.j.localId}`, { jeton }); v('Parent connecté : lire SON PROPRE document refusé (tout passe par le serveur)', verdict(propre), refuse(propre) ? '' : `HTTP ${propre.s}`);
  } finally {
    await nettoyer(jeton);
    const sup = await appel(`${ID}/accounts:delete?key=${cle}`, { m: 'POST', corps: { idToken: jeton } }); v('Compte de test supprimé', sup.s === 200, (sup.j.error && sup.j.error.message) || '');
  }
  return out;
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const cfg = (await import(pathToFileURL(path.join(racine, 'compte/config.js')).href)).FIREBASE;
  if (!cfg || !cfg.apiKey) { console.error('compte/config.js ne contient pas la configuration web Firebase.'); process.exit(3); }
  const res = await verifier({ cle: cfg.apiKey, projet: cfg.projectId });
  for (const r of res) console.log((r.etat === true ? '✓ ' : r.etat === false ? '✗ ' : '? ') + r.nom + (r.etat !== true && r.detail ? '  → ' + r.detail : ''));
  const ko = res.filter(r => r.etat === false).length, flou = res.filter(r => r.etat === null).length;
  console.log(`\n${res.filter(r => r.etat === true).length} confirmés, ${ko} à corriger, ${flou} indéterminés.`); process.exit(ko || flou ? 1 : 0);
}
