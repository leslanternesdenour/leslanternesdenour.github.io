// ⚠️ SIMULATION LOCALE — n'est jamais déployée (le dossier outils/ est exclu de dist/ et de functions/).
// Remplace, sur l'ordinateur de développement uniquement, les trois services extérieurs :
//   - Firebase Authentication : comptes en mémoire, jetons RS256 signés par une clé générée au démarrage,
//     vérifiés par le VRAI code serveur (serveur/jeton.js) ;
//   - Firestore : base en mémoire (serveur/base-memoire.js, même interface que base-firestore.js) ;
//   - Stripe (mode test) : page de paiement factice, webhooks signés par le VRAI algorithme et traités par le VRAI code.
//   - R2 : fichiers d'exemple de outils/emulateur/premium-exemple/.
// Tout le reste (droits, sessions, gel des profils, invitations, administration) est le code de production.
import crypto from 'crypto'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import { traiter } from '../../serveur/api.js';
import { baseMemoire } from '../../serveur/base-memoire.js';
import { verifierJeton } from '../../serveur/jeton.js';
import { clientStripe } from '../../serveur/stripe.js';
import { lireSession, lireCookie } from '../../serveur/session.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
// R2 simulé : un dossier local. LDN_PREMIUM_DIR = le dossier des VRAIS contenus Premium (gardé hors du dépôt public) ;
// sans lui, les fichiers d'exemple du dépôt.
const PROJET = 'ldn-emulateur-local', UID_CREATEUR = 'uid-createur-local';
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const TYPES = { '.json': 'application/json', '.js': 'text/javascript; charset=utf-8', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.html': 'text/html; charset=utf-8' };

export async function creerEmulateur({ mdpCreateur = process.env.LDN_EMUL_MDP_CREATEUR || crypto.randomBytes(9).toString('base64url'), dossierPremium = process.env.LDN_PREMIUM_DIR || path.join(ICI, 'premium-exemple') } = {}) {
  const PREMIUM = path.resolve(dossierPremium);
  const cles = await crypto.webcrypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, false, ['sign', 'verify']);
  let decalage = 0; const maintenant = () => Date.now() + decalage;
  const env = { CREATOR_UID: UID_CREATEUR, SESSION_SECRET: crypto.randomBytes(32).toString('hex'), FIREBASE_PROJET: PROJET, ENVIRONNEMENT: 'emulateur-local',
    STRIPE_CLE_SECRETE: 'sk_test_emulateur_local', STRIPE_SECRET_WEBHOOK: 'whsec_' + crypto.randomBytes(16).toString('hex'),
    STRIPE_PRIX_PREMIUM_MENSUEL: 'price_test_premium_mensuel', STRIPE_PRIX_PREMIUM_ANNUEL: 'price_test_premium_annuel', STRIPE_PRIX_FAMILLE_ANNUEL: 'price_test_famille_annuel' };
  const base = baseMemoire();
  // ----- comptes (imitation de Firebase Authentication) -----
  const comptes = new Map();   // email → { uid, sel, empreinte, verifie, role }
  const hacher = (mdp, sel) => crypto.scryptSync(String(mdp), sel, 32).toString('hex');
  const ajouter = (email, mdp, { uid, verifie = false, role } = {}) => { const sel = crypto.randomBytes(16).toString('hex'); const c = { uid: uid || 'u' + crypto.randomBytes(10).toString('hex'), sel, empreinte: hacher(mdp, sel), verifie, role }; comptes.set(email, c); return c; };
  ajouter('createur@local.test', mdpCreateur, { uid: UID_CREATEUR, verifie: true, role: 'creator' });
  const parUid = uid => [...comptes.entries()].find(([, c]) => c.uid === uid);
  async function jeton(email, c, { authAgo = 0 } = {}) {
    const s = Math.floor(maintenant() / 1000), tete = b64u({ alg: 'RS256', kid: 'emul' }) + '.' + b64u({ iss: 'https://securetoken.google.com/' + PROJET, aud: PROJET, firebase: { sign_in_provider: 'password' }, sub: c.uid, iat: s, exp: s + 3600, auth_time: s - authAgo, email, email_verified: c.verifie, ...(c.role ? { role: c.role } : {}) });
    return tete + '.' + Buffer.from(await crypto.webcrypto.subtle.sign('RSASSA-PKCS1-v1_5', cles.privateKey, new TextEncoder().encode(tete))).toString('base64url');
  }
  base.supprimerUtilisateur = async uid => { const e = parUid(uid); if (e) comptes.delete(e[0]); };
  // ----- Stripe simulé (aucun appel réseau) -----
  const sessionsPaiement = new Map(), abonnementsStripe = new Map(); let n = 0;
  const fauxStripe = async (u, o) => {
    const p = new URLSearchParams(o.body || ''), rep = x => new Response(JSON.stringify(x), { status: 200 });
    if (u.endsWith('/checkout/sessions')) { const id = 'cs_test_emul_' + (++n); sessionsPaiement.set(id, { uid: p.get('metadata[uid]'), prix: p.get('line_items[0][price]'), succes: p.get('success_url'), annulation: p.get('cancel_url'), client: p.get('customer') || 'cus_emul_' + p.get('metadata[uid]') });
      return rep({ id, url: '/_emulateur/paiement/?session=' + id }); }
    if (u.endsWith('/billing_portal/sessions')) return rep({ url: '/_emulateur/portail/' });
    const m = /subscriptions\/([^/?]+)$/.exec(u);
    if (m) { const a = abonnementsStripe.get(m[1]); if (!a) return new Response(JSON.stringify({ error: { message: 'inconnu' } }), { status: 404 });
      if (o.method === 'POST' && p.get('cancel_at_period_end') === 'true') { a.cancel_at_period_end = true; await envoyerWebhook('customer.subscription.updated', a); }
      return rep(a); }
    return new Response('{}', { status: 404 });
  };
  const ctx = () => ({ env, base, maintenant: maintenant(),
    auth: { verifierIdToken: (t, m) => verifierJeton(t, { projet: PROJET, type: 'id', obtenirCle: async k => k === 'emul' ? cles.publicKey : null, maintenant: m }) },
    stockage: { type: 'r2-simule',
      async get(cle) { const f = path.join(PREMIUM, cle); if (!f.startsWith(PREMIUM + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return null; return { body: fs.readFileSync(f), type: TYPES[path.extname(f)] }; },
      async lister() { const out = []; const tour = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) tour(f); else out.push({ cle: path.relative(PREMIUM, f).split(path.sep).join('/'), taille: fs.statSync(f).size }); } }; if (fs.existsSync(PREMIUM)) tour(PREMIUM); return out.sort((a, b) => a.cle.localeCompare(b.cle)); } },
    stripe: clientStripe(env, { fetcher: fauxStripe }) });
  async function envoyerWebhook(type, objet) {
    const corps = JSON.stringify({ id: 'evt_emul_' + (++n), livemode: false, type, data: { object: objet } }), t = Math.floor(maintenant() / 1000);
    const sig = crypto.createHmac('sha256', env.STRIPE_SECRET_WEBHOOK).update(t + '.' + corps).digest('hex');
    const r = await traiter(new Request('http://emulateur/api/stripe/webhook', { method: 'POST', headers: { 'Stripe-Signature': `t=${t},v1=${sig}` }, body: corps }), ctx());
    if (!r.ok) throw new Error('webhook refusé : ' + r.status + ' ' + await r.text());
  }
  const json = (x, s = 200) => new Response(JSON.stringify(x), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

  // Routes de l'émulateur : /api/_emulateur/*  (uniquement dans ce serveur local)
  async function routeEmulateur(req, chemin) {
    if (req.method !== 'POST' || req.headers.get('X-LDN') !== '1') return json({ erreur: 'origine' }, 403);
    const b = await req.json().catch(() => ({})), email = String(b.email || '').trim().toLowerCase();
    const session = await lireSession(lireCookie(req.headers.get('Cookie')), env.SESSION_SECRET, maintenant());
    switch (chemin) {
      case 'inscription': {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ erreur: 'auth/invalid-email' }, 400);
        if (String(b.mdp || '').length < 8) return json({ erreur: 'auth/weak-password' }, 400);
        if (comptes.has(email)) return json({ erreur: 'auth/email-already-in-use' }, 409);
        return json({ idToken: await jeton(email, ajouter(email, b.mdp)) });
      }
      case 'connexion': case 'reconnexion': {
        const e = chemin === 'connexion' ? email : session && parUid(session.uid)?.[0];
        const c = e && comptes.get(e);
        if (!c || hacher(b.mdp, c.sel) !== c.empreinte) return json({ erreur: 'auth/invalid-credential' }, 401);
        return json({ idToken: await jeton(e, c) });
      }
      case 'verifier': {                                   // simule le clic sur le lien reçu par e-mail
        const e = session && parUid(session.uid)?.[0]; if (!e) return json({ erreur: 'connexion-requise' }, 401);
        comptes.get(e).verifie = true; return json({ ok: true });
      }
      case 'jeton': {                                      // équivalent de getIdToken(true)
        const e = session && parUid(session.uid)?.[0]; if (!e) return json({ erreur: 'connexion-requise' }, 401);
        return json({ idToken: await jeton(e, comptes.get(e), { authAgo: Math.floor(maintenant() / 1000) - session.authTime }) });
      }
      case 'horloge': decalage += Number(b.jours || 0) * 86400000; return json({ maintenant: maintenant() });
      case 'paiement': {                                   // la page de paiement factice : « payer » ou « annuler »
        const s = sessionsPaiement.get(b.session); if (!s) return json({ erreur: 'session-inconnue' }, 404);
        sessionsPaiement.delete(b.session);
        if (b.action !== 'payer') return json({ redirection: s.annulation });
        const sub = { id: 'sub_emul_' + (++n), customer: s.client, status: 'active', cancel_at_period_end: false, metadata: { uid: s.uid },
          current_period_end: Math.floor(maintenant() / 1000) + (s.prix.includes('mensuel') ? 30 : 365) * 86400, items: { data: [{ price: { id: s.prix } }] } };
        abonnementsStripe.set(sub.id, sub);
        await envoyerWebhook('checkout.session.completed', { id: b.session, customer: s.client, client_reference_id: s.uid, metadata: { uid: s.uid } });
        await envoyerWebhook('customer.subscription.created', sub);
        return json({ redirection: s.succes });
      }
      case 'fin-abonnement': {                             // simule la fin de période d'un abonnement résilié
        const a = [...abonnementsStripe.values()].find(x => x.metadata.uid === (session && session.uid)); if (!a) return json({ erreur: 'aucun' }, 404);
        a.status = 'canceled'; await envoyerWebhook('customer.subscription.deleted', a); return json({ ok: true });
      }
    }
    return json({ erreur: 'inconnu' }, 404);
  }
  return {
    env, base, comptes, mdpCreateur, dossierPremium: PREMIUM,
    async traiter(req) {
      const chemin = new URL(req.url).pathname;
      if (chemin.startsWith('/api/_emulateur/')) return routeEmulateur(req, chemin.slice('/api/_emulateur/'.length));
      return traiter(req, ctx());
    }
  };
}
