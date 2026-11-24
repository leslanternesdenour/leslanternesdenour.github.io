// Base Firestore réelle, par l'API REST (le SDK Admin ne fonctionne pas dans les Workers).
// Authentification : compte de service Google (secret FIREBASE_COMPTE_SERVICE, JSON), jeton OAuth2 obtenu par JWT signé RS256.
// Même interface que base-memoire.js. Les dates sont stockées en millisecondes (nombres) pour rester simples.

const PORTEES = 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit';

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const txt64u = s => b64u(new TextEncoder().encode(s));

export function pemVersDer(pem) {
  const corps = String(pem).replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Uint8Array.from(atob(corps), c => c.charCodeAt(0));
}

// Jeton d'accès Google (valable 1 h, gardé en mémoire 55 min)
export function jetonGoogle(compte, { fetcher = fetch } = {}) {
  let cache = { jeton: null, expire: 0 };
  return async (maintenant = Date.now()) => {
    if (cache.jeton && cache.expire > maintenant) return cache.jeton;
    const s = Math.floor(maintenant / 1000);
    const tete = txt64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + txt64u(JSON.stringify({ iss: compte.client_email, scope: PORTEES, aud: 'https://oauth2.googleapis.com/token', iat: s, exp: s + 3600 }));
    const cle = await crypto.subtle.importKey('pkcs8', pemVersDer(compte.private_key), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const assertion = tete + '.' + b64u(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cle, new TextEncoder().encode(tete)));
    const r = await fetcher('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + assertion });
    if (!r.ok) throw new Error('jeton Google refusé : ' + r.status);
    const j = await r.json();
    cache = { jeton: j.access_token, expire: maintenant + 55 * 60000 };
    return cache.jeton;
  };
}

// ---------- conversion valeurs JS <-> valeurs Firestore ----------
export function versFs(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(versFs) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, versFs(x)])) } };
  throw new Error('type non pris en charge');
}
export function depuisFs(f) {
  if (!f || 'nullValue' in f) return null;
  if ('booleanValue' in f) return f.booleanValue;
  if ('integerValue' in f) return Number(f.integerValue);
  if ('doubleValue' in f) return f.doubleValue;
  if ('stringValue' in f) return f.stringValue;
  if ('timestampValue' in f) return Date.parse(f.timestampValue);
  if ('arrayValue' in f) return (f.arrayValue.values || []).map(depuisFs);
  if ('mapValue' in f) return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, depuisFs(x)]));
  return null;
}
const champs = data => Object.fromEntries(Object.entries(data).filter(([, x]) => x !== undefined).map(([k, v]) => [k, versFs(v)]));
const docVersObjet = doc => ({ id: doc.name.split('/').pop(), data: Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, depuisFs(v)])) });

export function baseFirestore({ projet, compte, fetcher = fetch, jeton = jetonGoogle(compte, { fetcher }) }) {
  const racine = `https://firestore.googleapis.com/v1/projects/${projet}/databases/(default)/documents`;
  const appel = async (url, opts = {}) => {
    const r = await fetcher(url, { ...opts, headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('Firestore ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.status === 204 ? {} : r.json();
  };
  const url = (col, id) => `${racine}/${col}/${encodeURIComponent(id)}`;
  const parent = col => { const p = col.split('/'); return { parent: p.length > 1 ? racine + '/' + p.slice(0, -1).join('/') : racine, coll: p[p.length - 1] }; };
  return {
    type: 'firestore',
    async lire(col, id) { const d = await appel(url(col, id)); return d ? docVersObjet(d).data : null; },
    async ecrire(col, id, data) { await appel(url(col, id), { method: 'PATCH', body: JSON.stringify({ fields: champs(data) }) }); },
    async maj(col, id, partiel) {
      const masque = Object.keys(partiel).map(k => 'updateMask.fieldPaths=' + encodeURIComponent('`' + k + '`')).join('&');
      // Firestore répond 404 quand le document n'existe pas (précondition exists=true) : on lève, comme la base mémoire de référence, au lieu d'ignorer.
      if (await appel(url(col, id) + '?currentDocument.exists=true&' + masque, { method: 'PATCH', body: JSON.stringify({ fields: champs(partiel) }) }) === null) throw new Error('document absent : ' + col + '/' + id);
    },
    async creerSiAbsent(col, id, data) {
      const r = await fetcher(url(col, id) + '?currentDocument.exists=false', { method: 'PATCH', headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: champs(data) }) });
      if (r.status === 400 || r.status === 409 || r.status === 412) return false;
      if (!r.ok) throw new Error('Firestore ' + r.status); return true;
    },
    async supprimer(col, id) { await appel(url(col, id), { method: 'DELETE' }); },
    async lister(col, { limite = 20, apres = null } = {}) {
      const { parent: p, coll } = parent(col);
      const q = { structuredQuery: { from: [{ collectionId: coll }], orderBy: [{ field: { fieldPath: '__name__' }, direction: 'ASCENDING' }], limit: limite + 1 } };
      if (apres) q.structuredQuery.startAt = { values: [{ referenceValue: `${p.replace('https://firestore.googleapis.com/v1/', '')}/${coll}/${apres}` }], before: false };
      const res = (await appel(p + ':runQuery', { method: 'POST', body: JSON.stringify(q) })) || [];
      const docs = res.filter(x => x.document).map(x => docVersObjet(x.document));
      return { docs: docs.slice(0, limite), suite: docs.length > limite ? docs[limite - 1].id : null };
    },
    async compter(col) {
      const { parent: p, coll } = parent(col);
      const res = await appel(p + ':runAggregationQuery', { method: 'POST', body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: coll }] }, aggregations: [{ alias: 'n', count: {} }] } }) });
      return Number(res && res[0] && res[0].result && res[0].result.aggregateFields.n.integerValue || 0);
    },
    async chercher(col, champ, valeur, limite = 100) {
      const { parent: p, coll } = parent(col);
      const q = { structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: champ }, op: 'EQUAL', value: versFs(valeur) } }, limit: limite } };
      const res = (await appel(p + ':runQuery', { method: 'POST', body: JSON.stringify(q) })) || [];
      return res.filter(x => x.document).map(x => docVersObjet(x.document));
    },
    // Pose le rôle « creator » (revendication personnalisée) sur un compte Firebase Authentication. Le jeton le contient à la prochaine reconnexion.
    async poserRoleCreateur(uid) {
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:update`, { method: 'POST', headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ role: 'creator' }) }) });
      if (!r.ok) throw new Error('pose du rôle refusée : ' + r.status);
    },
    // Lien d'action (vérification de l'adresse, réinitialisation du mot de passe) généré côté serveur : même appel que le SDK Firebase Admin
    // (generateEmailVerificationLink / generatePasswordResetLink). returnOobLink = Firebase N'ENVOIE PAS d'e-mail : c'est notre serveur qui l'envoie.
    // Renvoie { oobCode } (jeton Firebase à usage unique et à durée limitée) ou null si le compte n'existe pas.
    async lienAction(type, email) {
      if (!['VERIFY_EMAIL', 'PASSWORD_RESET'].includes(type)) throw new Error('type-invalide');
      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('adresse-invalide');
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:sendOobCode`, { method: 'POST', headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: type, email, returnOobLink: true }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { if (/EMAIL_NOT_FOUND|USER_NOT_FOUND/.test(JSON.stringify(j))) return null; throw new Error('lien-action-refuse:' + r.status); }
      let code = typeof j.oobCode === 'string' ? j.oobCode : null;
      if (!code && typeof j.oobLink === 'string') { try { code = new URL(j.oobLink).searchParams.get('oobCode'); } catch (e) {} }
      if (!code) throw new Error('lien-action-vide');
      return { oobCode: code };
    },
    // Suppression d'un compte Firebase Authentication (RGPD)
    async supprimerUtilisateur(uid) {
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:delete`, { method: 'POST', headers: { Authorization: 'Bearer ' + await jeton(), 'Content-Type': 'application/json' }, body: JSON.stringify({ localId: uid }) });
      if (r.ok || r.status === 404) return;
      // Compte déjà supprimé (reprise après une panne partielle) : Firebase répond 400 USER_NOT_FOUND. La suppression doit rester rejouable.
      const j = await r.json().catch(() => ({})); if (r.status === 400 && /USER_NOT_FOUND/.test(JSON.stringify(j))) return;
      throw new Error('suppression du compte refusée : ' + r.status);
    }
  };
}
