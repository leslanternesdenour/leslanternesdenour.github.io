// Parcours de bout en bout d'un compte parent, contre un site réellement déployé (ou le serveur local en mode simulation) :
// inscription → session → profil enfant → limites du Gratuit → contenu Premium fermé → administration fermée → reconnexion → suppression RGPD → compte disparu.
// Usage réel :        node outils/tests/parcours-reel.mjs https://lanternes-de-nour.pages.dev          (Firebase réel : la clé publique est lue dans compte/config.js)
// Usage simulation :  node outils/tests/parcours-reel.mjs http://localhost:8790 --emulateur          (serveur local lancé par outils/tests/parcours-reel.sh)
// Le compte de test est TOUJOURS supprimé à la fin (même en cas d'échec) : aucune donnée de test ne reste. Aucun paiement, aucun envoi d'e-mail.
import { pathToFileURL } from 'url'; import path from 'path'; import { fileURLToPath } from 'url';
const [base, ...opts] = process.argv.slice(2), SIM = opts.includes('--emulateur');
if (!base) { console.error('Usage : node outils/tests/parcours-reel.mjs <adresse-du-site> [--emulateur]'); process.exit(2); }
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const alea = Math.random().toString(36).slice(2, 10), EMAIL = `test-${alea}@exemple.invalid`, MDP = 'Mdp-de-test-' + alea + '-Z9!';
let ok = 0, ko = 0, cookie = '';
const v = (nom, cond, detail) => { if (cond) { ok++; console.log('✓ ' + nom); } else { ko++; console.log('✗ ' + nom + (detail ? '  → ' + detail : '')); } return !!cond; };
async function api(m, chemin, corps, { sansCookie = false } = {}) {
  const r = await fetch(base + chemin, { method: m, headers: { 'X-LDN': '1', Origin: new URL(base).origin, 'Content-Type': 'application/json', ...(cookie && !sansCookie ? { Cookie: cookie } : {}) }, body: corps ? JSON.stringify(corps) : undefined });
  const sc = r.headers.get('set-cookie'); if (sc && !sansCookie) cookie = /Max-Age=0/.test(sc) ? '' : sc.split(';')[0];
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch (e) { j = t; } return { s: r.status, j, h: r.headers };
}
// ---- fournisseur d'identité : Firebase réel, ou simulation locale ----
let cleApi = null;
if (!SIM) { const cfg = (await import(pathToFileURL(path.join(RACINE, 'compte/config.js')).href)).FIREBASE; if (!cfg || !cfg.apiKey) { console.error('Firebase n\'est pas encore configuré dans compte/config.js : parcours réel impossible.'); process.exit(3); } cleApi = cfg.apiKey; }
const fb = async (methode, corps) => { const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${methode}?key=${cleApi}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corps, returnSecureToken: true }) }); return { s: r.status, j: await r.json() }; };
const inscrire = async () => SIM ? (await api('POST', '/api/_emulateur/inscription', { email: EMAIL, mdp: MDP }, { sansCookie: true })).j.idToken : (await fb('signUp', { email: EMAIL, password: MDP })).j.idToken;
const connecter = async () => SIM ? (await api('POST', '/api/_emulateur/connexion', { email: EMAIL, mdp: MDP }, { sansCookie: true })).j.idToken : (await fb('signInWithPassword', { email: EMAIL, password: MDP })).j.idToken;
const CONSENT = { parent: true, cgu: true, confidentialite: true };
let compteCree = false;
try {
  console.log(`Parcours ${SIM ? 'SIMULATION locale' : 'RÉEL'} sur ${base} — compte de test ${EMAIL}\n`);
  const sante = await api('GET', '/api/sante'); v('Le site répond (/api/sante)', sante.s === 200 && sante.j.ok === true);
  v('Visiteur : non connecté', (await api('GET', '/api/moi')).j.connecte === false);
  const t1 = await inscrire(); compteCree = !!t1; if (!v('Inscription auprès du fournisseur d\'identité : jeton reçu', t1)) throw new Error('inscription impossible');
  v('Session refusée sans consentements parentaux (428)', (await api('POST', '/api/session', { idToken: t1 })).s === 428);
  v('Session ouverte avec consentements', (await api('POST', '/api/session', { idToken: t1, consentements: CONSENT })).s === 200);
  const ck = (await api('POST', '/api/session', { idToken: t1, consentements: CONSENT })).h.get('set-cookie') || '';
  v('Cookie de session : HttpOnly + SameSite' + (base.startsWith('https:') ? ' + Secure' : ''), /HttpOnly/i.test(ck) && /SameSite=(Lax|Strict)/i.test(ck) && (!base.startsWith('https:') || /;\s*Secure/i.test(ck)), ck.replace(/=[^;]+/, '=…'));
  const moi = (await api('GET', '/api/moi')).j; v('Compte connecté, statut Gratuit, pas Créateur', moi.connecte && moi.statut === 'gratuit' && moi.niveau === 'gratuit' && !moi.admin);
  v('Aucune activation Créateur proposée à un compte ordinaire', moi.activationCreateur === false);
  // Depuis le 24/11/2026 le serveur exige une adresse e-mail vérifiée avant tout profil enfant (403 email-non-verifie).
  v('Profil enfant refusé tant que l\'adresse e-mail n\'est pas vérifiée (403)', (await api('POST', '/api/enfants', { surnom: 'Inaya', tranche: '3-5', avatar: 'fille' })).j.erreur === 'email-non-verifie');
  if (!SIM) throw new Error('parcours réel : vérifiez d\'abord l\'adresse du compte de test (lien reçu par e-mail), étape non automatisée ici');
  v('Adresse vérifiée (simulation du clic sur le lien reçu par e-mail)', (await api('POST', '/api/_emulateur/verifier')).s === 200);
  const tv = (await api('POST', '/api/_emulateur/jeton')).j.idToken;   // équivalent de getIdToken(true) : le jeton porte maintenant « vérifiée »
  v('Session renouvelée avec le jeton à jour', !!tv && (await api('POST', '/api/session', { idToken: tv, consentements: CONSENT })).s === 200);
  const e1 = await api('POST', '/api/enfants', { surnom: 'Inaya', tranche: '3-5', avatar: 'fille' }); v('Profil enfant créé', e1.s === 200 || e1.s === 201, JSON.stringify(e1.j));
  v('Profil enfant : données minimales seulement', e1.j && Object.keys(e1.j).every(k => ['id', 'surnom', 'tranche', 'avatar', 'gele', 'creeLe', 'progression', 'ok'].includes(k)), JSON.stringify(Object.keys(e1.j || {})));
  v('Surnom invalide refusé (chiffres, symboles)', (await api('POST', '/api/enfants', { surnom: 'Bob123<script>', tranche: '3-5', avatar: 'fille' })).s === 400);
  const liste = await api('GET', '/api/enfants'); v('Profil enfant listé', liste.s === 200 && JSON.stringify(liste.j).includes('Inaya'));
  // Organisation du 24/11/2026 (serveur/droits.js) : 4 profils pour tout compte parent, Gratuit compris.
  const autres = [['Rayan', '6-10', 'garcon'], ['Amina', '3-5', 'fille'], ['Yassine', '6-10', 'garcon']];
  const crees = []; for (const [surnom, tranche, avatar] of autres) crees.push((await api('POST', '/api/enfants', { surnom, tranche, avatar })).s);
  v('Gratuit : jusqu\'à 4 profils acceptés', crees.every(s => s === 200 || s === 201), JSON.stringify(crees));
  v('Gratuit : un cinquième profil est refusé (403 limite-profils)', (await api('POST', '/api/enfants', { surnom: 'Maryam', tranche: '3-5', avatar: 'fille' })).j.erreur === 'limite-profils');
  const prem = await api('GET', '/api/premium/voyage/camp/contenu.json'); v('Contenu Premium fermé au Gratuit (jamais 200)', [401, 403, 404].includes(prem.s), String(prem.s));
  v('Administration fermée (403)', (await api('GET', '/api/admin/resume')).s === 403);
  v('Activation Créateur refusée (403)', (await api('POST', '/api/createur/activer')).s === 403);
  v('Session sans en-tête X-LDN refusée (403)', (await fetch(base + '/api/enfants', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: '{}' })).status === 403);
  await api('POST', '/api/session/fin'); v('Déconnexion : plus de session', (await api('GET', '/api/moi')).j.connecte === false);
  const t2 = await connecter(); v('Reconnexion auprès du fournisseur d\'identité', !!t2);
  v('Nouvelle session ouverte (profil retrouvé)', (await api('POST', '/api/session', { idToken: t2 })).s === 200 && JSON.stringify((await api('GET', '/api/enfants')).j).includes('Inaya'));
  const sup = await api('DELETE', '/api/compte'); v('Suppression RGPD du compte', sup.s === 200, JSON.stringify(sup.j)); if (sup.s === 200) compteCree = false;
  v('Après suppression : plus de session', (await api('GET', '/api/moi')).j.connecte === false);
  const t3 = await connecter(); v('Après suppression : connexion impossible (compte disparu)', !t3);
} catch (e) { ko++; console.log('✗ Arrêt du parcours : ' + e.message); }
finally {
  if (compteCree) { // nettoyage de secours : le compte de test ne doit pas rester
    try { const t = await connecter(); if (t) { await api('POST', '/api/session', { idToken: t }); const s = await api('DELETE', '/api/compte'); console.log(s.s === 200 ? '(nettoyage de secours : compte de test supprimé)' : '⚠ NETTOYAGE ÉCHOUÉ : supprimez à la main le compte ' + EMAIL + ' (Firebase → Authentication)'); } } catch (e) { console.log('⚠ NETTOYAGE ÉCHOUÉ : supprimez à la main le compte ' + EMAIL); }
  }
  console.log(`\n${ok} réussis, ${ko} échoués.`); process.exit(ko ? 1 : 0);
}
