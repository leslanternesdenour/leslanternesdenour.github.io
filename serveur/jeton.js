// Vérification côté serveur (Cloudflare Worker) d'un jeton Firebase, sans le SDK Admin (incompatible avec les Workers).
// Uniquement des API web standard (WebCrypto). Aucune dépendance.
//
// Contrôles (documentation Firebase « Verify ID tokens using a third-party JWT library ») :
//   en-tête : alg = RS256, kid connu ;  signature RS256 valide ;
//   charge  : exp > maintenant, iat ≤ maintenant, auth_time ≤ maintenant, aud = projet, iss = émetteur attendu,
//             sub = identifiant non vide (≤ 128 caractères).
// Deux types : 'id' (jeton d'identification, iss = https://securetoken.google.com/<projet>)
//              'session' (cookie de session, iss = https://session.firebase.google.com/<projet>).
// Les clés publiques sont fournies par « obtenirCle(kid, type) » : en production, elles sont téléchargées chez Google
// et gardées en mémoire selon leur durée de validité ; dans les tests, ce sont des clés locales.

const TOLERANCE_S = 60;        // décalage d'horloge toléré
const RECENT_S = 15 * 60;      // « connexion récente » exigée pour l'administration

const b64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };
const json = s => JSON.parse(new TextDecoder().decode(b64u(s)));

export class JetonInvalide extends Error { constructor(raison) { super(raison); this.raison = raison; } }

export async function verifierJeton(jeton, { projet, type = 'id', obtenirCle, maintenant = Date.now() }) {
  if (typeof jeton !== 'string' || jeton.length > 8192) throw new JetonInvalide('format');
  const parties = jeton.split('.');
  if (parties.length !== 3) throw new JetonInvalide('format');
  let entete, charge;
  try { entete = json(parties[0]); charge = json(parties[1]); } catch (e) { throw new JetonInvalide('format'); }
  if (entete.alg !== 'RS256') throw new JetonInvalide('algorithme');
  if (typeof entete.kid !== 'string' || !entete.kid) throw new JetonInvalide('cle-inconnue');
  const cle = await obtenirCle(entete.kid, type);
  if (!cle) throw new JetonInvalide('cle-inconnue');
  let valide = false;
  try { valide = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, cle, b64u(parties[2]), new TextEncoder().encode(parties[0] + '.' + parties[1])); }
  catch (e) { valide = false; }
  if (!valide) throw new JetonInvalide('signature');

  const t = Math.floor(maintenant / 1000);
  const emetteur = (type === 'session' ? 'https://session.firebase.google.com/' : 'https://securetoken.google.com/') + projet;
  if (!projet || charge.aud !== projet) throw new JetonInvalide('audience');
  if (charge.iss !== emetteur) throw new JetonInvalide('emetteur');
  if (typeof charge.exp !== 'number' || charge.exp <= t - TOLERANCE_S) throw new JetonInvalide('expire');
  if (typeof charge.iat !== 'number' || charge.iat > t + TOLERANCE_S) throw new JetonInvalide('date-emission');
  if (typeof charge.auth_time !== 'number' || charge.auth_time > t + TOLERANCE_S) throw new JetonInvalide('date-connexion');
  if (typeof charge.sub !== 'string' || !charge.sub || charge.sub.length > 128) throw new JetonInvalide('utilisateur');
  return { uid: charge.sub, email: charge.email || null, emailVerifie: charge.email_verified === true,
    fournisseur: charge.firebase && typeof charge.firebase.sign_in_provider === 'string' ? charge.firebase.sign_in_provider : null,
    claims: { role: charge.role === 'creator' ? 'creator' : undefined }, authTime: charge.auth_time, charge };
}

// Pour /admin/ et les actions sensibles : la connexion doit dater de moins de 15 minutes.
export function connexionRecente(verifie, maintenant = Date.now(), limiteS = RECENT_S) {
  return !!verifie && Math.floor(maintenant / 1000) - verifie.authTime <= limiteS;
}

// Clés publiques de Google pour les jetons d'identification (format JWK), avec cache selon Cache-Control.
// (Les cookies de session utilisent un autre jeu de clés : à brancher et tester à l'étape Firebase.)
const URL_JWK_ID = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
let cache = { cles: null, expire: 0 };
export async function cleGoogle(kid, type, { fetcher = fetch, maintenant = Date.now() } = {}) {
  if (type !== 'id') return null;
  if (!cache.cles || cache.expire <= maintenant) {
    const r = await fetcher(URL_JWK_ID);
    if (!r.ok) return null;
    const age = /max-age=(\d+)/.exec(r.headers.get('Cache-Control') || '');
    const { keys } = await r.json();
    const cles = new Map();
    for (const k of keys || []) if (k.kty === 'RSA' && k.kid) cles.set(k.kid, await crypto.subtle.importKey('jwk', { kty: 'RSA', n: k.n, e: k.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']));
    cache = { cles, expire: maintenant + (age ? Number(age[1]) * 1000 : 3600000) };
  }
  return cache.cles.get(kid) || null;
}
