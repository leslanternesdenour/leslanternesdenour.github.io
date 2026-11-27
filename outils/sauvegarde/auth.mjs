// Export / restauration des COMPTES DE CONNEXION Firebase Authentication (adresses, fournisseurs, empreintes de mots de passe).
// Complète outils/sauvegarde/restauration.mjs (qui ne couvre que Firestore). Données personnelles : l'export n'existe qu'EN MÉMOIRE ou CHIFFRÉ (age).
//
// Contenu : tous les comptes (API Identity Toolkit « accounts:batchGet »), plus la configuration de hachage du projet (SCRYPT : clé de signature
// et séparateur de sel), indispensable pour que les mots de passe importés restent valides. La clé de signature est un SECRET : ne jamais écrire l'export en clair.
// Restauration : accounts:batchCreate vers un projet de TEST seulement (le projet de production est refusé en dur), sans écraser un compte existant.
import { jetonGoogle } from '../../serveur/base-firestore.js';

export const FORMAT_AUTH = 'ldn-auth-export-1';
export const PROJET_PRODUCTION = 'lanternes-de-nour';
const API = 'https://identitytoolkit.googleapis.com';

async function appel(fetcher, jeton, projet, methode, url, corps) {
  const r = await fetcher(url, { method: methode, headers: { Authorization: 'Bearer ' + await jeton(), 'X-Goog-User-Project': projet, 'Content-Type': 'application/json' }, body: corps ? JSON.stringify(corps) : undefined });
  if (!r.ok) throw new Error(`Identity Toolkit ${methode} refusé (${r.status})`);   // jamais le corps de la réponse : il peut contenir des données personnelles
  return r.json();
}

// Résumé sans donnée personnelle : seulement des nombres.
export function resume(utilisateurs) {
  const parFournisseur = {};
  for (const u of utilisateurs) for (const p of u.providerUserInfo || []) parFournisseur[p.providerId] = (parFournisseur[p.providerId] || 0) + 1;
  return { total: utilisateurs.length, parFournisseur, avecMotDePasse: utilisateurs.filter(u => u.passwordHash).length, emailVerifie: utilisateurs.filter(u => u.emailVerified).length, avecRole: utilisateurs.filter(u => u.customAttributes).length, desactives: utilisateurs.filter(u => u.disabled).length };
}

export async function exporterAuth({ projet, compte, fetcher = fetch, jeton = jetonGoogle(compte, { fetcher }), maintenant = Date.now() }) {
  const utilisateurs = []; let page = '';
  do {
    const j = await appel(fetcher, jeton, projet, 'GET', `${API}/v1/projects/${projet}/accounts:batchGet?maxResults=500${page ? '&nextPageToken=' + encodeURIComponent(page) : ''}`);
    utilisateurs.push(...(j.users || [])); page = j.nextPageToken || '';
  } while (page);
  const cfg = await appel(fetcher, jeton, projet, 'GET', `${API}/admin/v2/projects/${projet}/config`);
  const hc = cfg.signIn && cfg.signIn.hashConfig;
  if (!hc) throw new Error('configuration de hachage du projet introuvable : export refusé (les mots de passe ne seraient pas restaurables)');
  utilisateurs.sort((a, b) => a.localId < b.localId ? -1 : 1);
  return { format: FORMAT_AUTH, date: new Date(maintenant).toISOString(), projet, hashConfig: hc, utilisateurs, compte: resume(utilisateurs) };
}

const canon = v => v === null || typeof v !== 'object' ? JSON.stringify(v) : Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
// Différences entre deux exports. lastLoginAt / lastRefreshAt changent à chaque connexion : ignorés. Retourne seulement des types et des nombres.
export function comparerAuth(a, b) {
  const IGNORES = ['lastLoginAt', 'lastRefreshAt'], net = u => Object.fromEntries(Object.entries(u).filter(([k]) => !IGNORES.includes(k)));
  const x = Object.fromEntries(a.utilisateurs.map(u => [u.localId, net(u)])), y = Object.fromEntries(b.utilisateurs.map(u => [u.localId, net(u)])), diff = [];
  for (const id of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (!(id in y)) diff.push({ id, type: 'manquant' }); else if (!(id in x)) diff.push({ id, type: 'en-trop' }); else if (canon(x[id]) !== canon(y[id])) diff.push({ id, type: 'different' });
  }
  return diff;
}

// Corps de la requête accounts:batchCreate (pur, testable). Les comptes sans mot de passe (Google seul) n'ont pas de passwordHash : acceptés tels quels.
export function corpsImport(e) {
  if (!e || e.format !== FORMAT_AUTH) throw new Error('format d\'export Auth inconnu');
  const h = e.hashConfig;
  return { allowOverwrite: false, sanityCheck: true, users: e.utilisateurs, hashAlgorithm: h.algorithm, signerKey: h.signerKey, saltSeparator: h.saltSeparator, rounds: h.rounds, memoryCost: h.memoryCost };
}

// Refuse la production en dur, et tout projet qui ne ressemble pas à un projet de test (sauf confirmation explicite du nom exact).
export function verifierCible(projet, confirmee) {
  if (projet === PROJET_PRODUCTION) throw new Error(`Refus : « ${projet} » est le projet de PRODUCTION. Une restauration des comptes ne s'y fait jamais depuis cet outil.`);
  if (!/test|restauration/.test(projet) && confirmee !== projet) throw new Error(`Refus : « ${projet} » ne ressemble pas à un projet de test (relancer avec --cible-confirmee=${projet} si c'est voulu).`);
}

export async function importerAuth(e, { projet, compte, confirmee, fetcher = fetch, jeton = jetonGoogle(compte, { fetcher }) }) {
  verifierCible(projet, confirmee);
  const existants = await appel(fetcher, jeton, projet, 'GET', `${API}/v1/projects/${projet}/accounts:batchGet?maxResults=1`);
  if ((existants.users || []).length) throw new Error('projet cible non vide : import refusé');
  const j = await appel(fetcher, jeton, projet, 'POST', `${API}/v1/projects/${projet}/accounts:batchCreate`, corpsImport(e));
  const erreurs = (j.error || []).length; if (erreurs) throw new Error(`${erreurs} compte(s) refusé(s) à l'import`);
  return e.utilisateurs.length;
}