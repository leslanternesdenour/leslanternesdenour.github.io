// Session du site : cookie signé (HMAC-SHA-256) posé par le serveur après vérification d'un jeton Firebase.
// HttpOnly (illisible par JavaScript), Secure, SameSite=Lax. Le secret (SESSION_SECRET) n'existe que côté serveur.
// Contenu : uid, e-mail, e-mail vérifié, rôle du jeton, heure de connexion, expiration, version (pour tout révoquer).

export const NOM_COOKIE = 'ldn_session';
export const DUREE_S = 5 * 24 * 3600;           // 5 jours

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const deb64u = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return Uint8Array.from(atob(s), c => c.charCodeAt(0)); };

async function cle(secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('SESSION_SECRET absent ou trop court (32 caractères minimum)');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function creerSession({ uid, email, emailVerifie, role, authTime, version = 0 }, secret, maintenant = Date.now()) {
  const charge = { uid, email: email || null, ev: !!emailVerifie, role: role === 'creator' ? 'creator' : null,
    at: authTime, exp: Math.floor(maintenant / 1000) + DUREE_S, v: version };
  const corps = b64u(enc.encode(JSON.stringify(charge)));
  const sig = b64u(await crypto.subtle.sign('HMAC', await cle(secret), enc.encode(corps)));
  return corps + '.' + sig;
}

export async function lireSession(valeur, secret, maintenant = Date.now()) {
  if (typeof valeur !== 'string' || valeur.length > 2048) return null;
  const [corps, sig] = valeur.split('.');
  if (!corps || !sig) return null;
  let ok = false;
  try { ok = await crypto.subtle.verify('HMAC', await cle(secret), deb64u(sig), enc.encode(corps)); } catch (e) { return null; }
  if (!ok) return null;
  let c; try { c = JSON.parse(new TextDecoder().decode(deb64u(corps))); } catch (e) { return null; }
  if (!c || typeof c.uid !== 'string' || !c.uid || typeof c.exp !== 'number' || c.exp <= Math.floor(maintenant / 1000)) return null;
  return { uid: c.uid, email: c.email, emailVerifie: c.ev === true, claims: { role: c.role || undefined }, authTime: c.at, version: c.v || 0 };
}

export function lireCookie(entete, nom = NOM_COOKIE) {
  for (const p of String(entete || '').split(';')) { const i = p.indexOf('='); if (i > 0 && p.slice(0, i).trim() === nom) return decodeURIComponent(p.slice(i + 1).trim()); }
  return null;
}

export function enteteCookie(valeur, { secure = true, effacer = false } = {}) {
  return `${NOM_COOKIE}=${effacer ? '' : encodeURIComponent(valeur)}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}; Max-Age=${effacer ? 0 : DUREE_S}`;
}
