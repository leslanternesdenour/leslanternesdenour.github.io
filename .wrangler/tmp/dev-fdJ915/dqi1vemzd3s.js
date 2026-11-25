var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ZxUVjY/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// .wrangler/tmp/pages-ctJRsu/functionsWorker-0.5370486277202324.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
function stripCfConnectingIPHeader2(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
__name2(stripCfConnectingIPHeader2, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader2.apply(null, argArray)
    ]);
  }
});
var VERSION_API_DON = "2026-11-18.endive";
var enc = new TextEncoder();
var hex = /* @__PURE__ */ __name2((buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""), "hex");
async function verifierSignatureStripe(corps, entete, secret, maintenant = Date.now(), toleranceS = 300) {
  if (!secret || !entete)
    return false;
  const parts = Object.fromEntries(String(entete).split(",").map((x) => x.split("=")).filter((x) => x.length === 2).map(([k, v]) => [k.trim(), v]));
  const v1s = String(entete).split(",").filter((x) => x.trim().startsWith("v1=")).map((x) => x.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !v1s.length || Math.abs(Math.floor(maintenant / 1e3) - t) > toleranceS)
    return false;
  const cle2 = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const attendu = hex(await crypto.subtle.sign("HMAC", cle2, enc.encode(t + "." + corps)));
  return v1s.some((v) => v.length === attendu.length && [...v].every((c, i) => c === attendu[i]));
}
__name(verifierSignatureStripe, "verifierSignatureStripe");
__name2(verifierSignatureStripe, "verifierSignatureStripe");
function clientStripe(env, { fetcher = fetch } = {}) {
  const cle2 = env.STRIPE_CLE_SECRETE || "";
  if (!cle2)
    return null;
  if (cle2.startsWith("sk_live_") && env.STRIPE_MODE_REEL !== "autorise")
    throw new Error("Cl\xE9 Stripe R\xC9ELLE refus\xE9e : le site doit rester en mode test sans accord du cr\xE9ateur.");
  const formulaire = /* @__PURE__ */ __name2((o, p = "") => Object.entries(o).flatMap(([k, v]) => {
    const n = p ? `${p}[${k}]` : k;
    return v && typeof v === "object" ? formulaire(v, n) : [[n, String(v)]];
  }), "formulaire");
  const appel = /* @__PURE__ */ __name2(async (chemin, params = {}, methode = "POST", version = null) => {
    const r = await fetcher("https://api.stripe.com/v1/" + chemin, {
      method: methode,
      headers: { Authorization: "Bearer " + cle2, "Content-Type": "application/x-www-form-urlencoded", ...version ? { "Stripe-Version": version } : {} },
      body: methode === "GET" ? void 0 : new URLSearchParams(formulaire(params)).toString()
    });
    const j = await r.json();
    if (!r.ok)
      throw new Error("Stripe : " + (j.error && j.error.message || r.status));
    return j;
  }, "appel");
  return {
    modeTest: !cle2.startsWith("sk_live_"),
    creerCheckout: ({ uid, email, prix, succes, annulation, client }) => appel("checkout/sessions", {
      mode: "subscription",
      client_reference_id: uid,
      "line_items": { 0: { price: prix, quantity: 1 } },
      ...client ? { customer: client } : { customer_email: email },
      success_url: succes,
      cancel_url: annulation,
      subscription_data: { metadata: { uid } },
      metadata: { uid },
      locale: "fr"
    }),
    // Don libre en paiement INTÉGRÉ : le formulaire Stripe s'affiche dans la page /soutenir/ (aucune redirection).
    // Seul le « client_secret » du formulaire est renvoyé au navigateur ; aucune donnée de carte ne passe par nos serveurs.
    creerDon: async ({ centimes }) => {
      const s = await appel(
        "checkout/sessions",
        {
          ui_mode: "embedded_page",
          mode: "payment",
          redirect_on_completion: "never",
          submit_type: "donate",
          locale: "fr",
          line_items: { 0: { quantity: 1, price_data: { currency: "eur", unit_amount: centimes, product_data: { name: "Soutien aux Lanternes de Nour" } } } }
        },
        "POST",
        VERSION_API_DON
      );
      return { clientSecret: s.client_secret };
    },
    creerPortail: ({ client, retour }) => appel("billing_portal/sessions", { customer: client, return_url: retour }),
    resilierFinPeriode: (abonnementId) => appel("subscriptions/" + abonnementId, { cancel_at_period_end: "true" }),
    lireAbonnement: (abonnementId) => appel("subscriptions/" + abonnementId, {}, "GET"),
    // Retour du paiement : le serveur relit lui-même la session auprès de Stripe (le navigateur ne prouve rien), abonnement inclus.
    lireSession: (id) => appel("checkout/sessions/" + encodeURIComponent(id) + "?expand[]=subscription", {}, "GET"),
    // Rattrapage sans identifiant de session : les abonnements de ce compte (métadonnée « uid » posée à la souscription).
    // 1) lecture IMMÉDIATE : les clients Stripe de l'adresse (celle du compte, vérifiée), puis leurs abonnements ;
    // 2) sinon la recherche Stripe, dont l'index peut mettre plus d'une minute à voir un abonnement tout neuf.
    chercherAbonnements: async (uid, email) => {
      const trouves = [], dejaVus = /* @__PURE__ */ new Set();
      const ajouter = /* @__PURE__ */ __name2((liste) => {
        for (const a of liste || [])
          if (a && !dejaVus.has(a.id)) {
            dejaVus.add(a.id);
            trouves.push(a);
          }
      }, "ajouter");
      if (email) {
        const clients = await appel("customers?limit=10&email=" + encodeURIComponent(email), {}, "GET");
        for (const c of (clients.data || []).slice(0, 10))
          ajouter((await appel("subscriptions?status=all&limit=10&customer=" + encodeURIComponent(c.id), {}, "GET")).data);
      }
      if (!trouves.some((a) => a.metadata && a.metadata.uid === uid && ["active", "trialing"].includes(a.status)))
        ajouter((await appel("subscriptions/search?query=" + encodeURIComponent("metadata['uid']:'" + uid + "'"), {}, "GET")).data);
      return { data: trouves };
    }
  };
}
__name(clientStripe, "clientStripe");
__name2(clientStripe, "clientStripe");
var json = /* @__PURE__ */ __name2((data, statut = 200) => new Response(JSON.stringify(data), { status: statut, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }), "json");
var compteurs = /* @__PURE__ */ new Map();
function tropDeTentatives(cle2, max, fenetreMs, maintenant) {
  const c = compteurs.get(cle2);
  if (!c || c.debut + fenetreMs < maintenant) {
    compteurs.set(cle2, { debut: maintenant, n: 1 });
    return false;
  }
  c.n++;
  return c.n > max;
}
__name(tropDeTentatives, "tropDeTentatives");
__name2(tropDeTentatives, "tropDeTentatives");
function memeOrigine(req) {
  if (req.headers.get("X-LDN") !== "1")
    return false;
  const o = req.headers.get("Origin");
  if (!o)
    return true;
  return o === new URL(req.url).origin;
}
__name(memeOrigine, "memeOrigine");
__name2(memeOrigine, "memeOrigine");
async function traiterDon(req, env, { fetcher = fetch } = {}) {
  if (req.method === "GET") {
    const cle2 = String(env.STRIPE_CLE_PUBLIABLE || "");
    return json({ cle: /^pk_(test|live)_[A-Za-z0-9]+$/.test(cle2) ? cle2 : null });
  }
  if (!memeOrigine(req))
    return json({ erreur: "origine" }, 403);
  let stripe = null;
  try {
    stripe = clientStripe(env, { fetcher });
  } catch (e) {
    stripe = null;
  }
  if (!stripe)
    return json({ erreur: "don-non-configure" }, 503);
  const texte = await req.text();
  if (texte.length > 1e3)
    return json({ erreur: "trop-gros" }, 400);
  let corps;
  try {
    corps = JSON.parse(texte);
  } catch (e) {
    return json({ erreur: "json-invalide" }, 400);
  }
  if (!corps || typeof corps !== "object" || Array.isArray(corps))
    corps = {};
  const v = validerMontantDon(corps.montant);
  if (!v.ok)
    return json({ erreur: v.raison }, 400);
  const { centimes } = v;
  if (tropDeTentatives("don:" + (req.headers.get("CF-Connecting-IP") || "local"), 10, 10 * 6e4, Date.now()))
    return json({ erreur: "trop-de-tentatives" }, 429);
  try {
    const { clientSecret } = await stripe.creerDon({ centimes });
    return json({ clientSecret });
  } catch (e) {
    if (env.ENVIRONNEMENT === "local")
      console.error("[don] Stripe a refus\xE9 la requ\xEAte : " + (e && e.message));
    return json({ erreur: "paiement-indisponible" }, 502);
  }
}
__name(traiterDon, "traiterDon");
__name2(traiterDon, "traiterDon");
function validerMontantDon(montant) {
  if (typeof montant !== "number" || !Number.isInteger(montant) || montant < 1 || montant > 500)
    return { ok: false, raison: "montant-invalide" };
  return { ok: true, centimes: montant * 100 };
}
__name(validerMontantDon, "validerMontantDon");
__name2(validerMontantDon, "validerMontantDon");
var onRequest = /* @__PURE__ */ __name2(({ request, env }) => traiterDon(request, env), "onRequest");
var onRequest2 = /* @__PURE__ */ __name2(({ request, env }) => traiterDon(request, env), "onRequest");
var PREFIXES_REVOQUES = ["bfff0d72"];
var estRevoquee = /* @__PURE__ */ __name2((compte) => !!compte && typeof compte.private_key_id === "string" && PREFIXES_REVOQUES.some((p) => compte.private_key_id.startsWith(p)), "estRevoquee");
var ADRESSE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/;
function creerCourriel(env, { fetcher = fetch, delaiMs = 8e3 } = {}) {
  const f = String(env && env.EMAIL_FOURNISSEUR || "").trim().toLowerCase(), cle2 = String(env && env.EMAIL_CLE_API || "").trim();
  if (!["resend", "brevo"].includes(f) || cle2.length < 20 || /\s/.test(cle2))
    return null;
  const adresse = String(env.EMAIL_EXPEDITEUR_ADRESSE || "bonjour@leslanternesdenour.fr").trim();
  const nom = String(env.EMAIL_EXPEDITEUR_NOM || "Les Lanternes de Nour").replace(/[\r\n<>"]/g, "").trim();
  const reponse = String(env.EMAIL_REPONSE || "").trim();
  if (!ADRESSE.test(adresse) || !nom || reponse && !ADRESSE.test(reponse))
    return null;
  return {
    fournisseur: f,
    async envoyer({ a, objet, texte, html }) {
      if (typeof a !== "string" || !ADRESSE.test(a) || typeof objet !== "string" || !objet || /[\r\n]/.test(objet) || !texte || !html)
        throw new Error("courriel-invalide");
      const demande = f === "resend" ? { url: "https://api.resend.com/emails", entetes: { Authorization: "Bearer " + cle2 }, corps: { from: `${nom} <${adresse}>`, to: [a], subject: objet, html, text: texte, ...reponse ? { reply_to: reponse } : {} } } : { url: "https://api.brevo.com/v3/smtp/email", entetes: { "api-key": cle2, accept: "application/json" }, corps: { sender: { name: nom, email: adresse }, to: [{ email: a }], subject: objet, htmlContent: html, textContent: texte, ...reponse ? { replyTo: { email: reponse } } : {} } };
      const ctrl = new AbortController(), minuteur = setTimeout(() => ctrl.abort(), delaiMs);
      let r;
      try {
        r = await fetcher(demande.url, { method: "POST", headers: { "Content-Type": "application/json", ...demande.entetes }, body: JSON.stringify(demande.corps), signal: ctrl.signal });
      } catch (e) {
        throw new Error("courriel-injoignable");
      } finally {
        clearTimeout(minuteur);
      }
      if (!r.ok)
        throw new Error("courriel-refuse:" + r.status);
      return { ok: true };
    }
  };
}
__name(creerCourriel, "creerCourriel");
__name2(creerCourriel, "creerCourriel");
function lireCompte(texte) {
  try {
    const c = JSON.parse(texte);
    return c && c.type === "service_account" && !!c.private_key && !!c.client_email && !!c.project_id ? c : null;
  } catch (e) {
    return null;
  }
}
__name(lireCompte, "lireCompte");
__name2(lireCompte, "lireCompte");
var compteDeServiceValide = /* @__PURE__ */ __name2((texte) => {
  const c = lireCompte(texte);
  return !!c && !estRevoquee(c);
}, "compteDeServiceValide");
function etatConfiguration(env) {
  const compte = typeof env.FIREBASE_COMPTE_SERVICE === "string" && compteDeServiceValide(env.FIREBASE_COMPTE_SERVICE);
  const cleStripe = typeof env.STRIPE_CLE_SECRETE === "string" ? env.STRIPE_CLE_SECRETE : "";
  return {
    sessions: typeof env.SESSION_SECRET === "string" && env.SESSION_SECRET.length >= 32,
    // Détail sans jamais révéler la valeur ni sa longueur exacte : absent | trop-court (moins de 32 caractères) | ok
    sessionsEtat: typeof env.SESSION_SECRET !== "string" || env.SESSION_SECRET.length === 0 ? "absent" : env.SESSION_SECRET.length < 32 ? "trop-court" : "ok",
    firebaseProjet: !!env.FIREBASE_PROJET,
    firebaseCompteDeService: compte,
    // Clé exposée puis révoquée recollée par erreur : signalé (le site refuse alors de l'utiliser)
    cleRevoquee: typeof env.FIREBASE_COMPTE_SERVICE === "string" && estRevoquee(lireCompte(env.FIREBASE_COMPTE_SERVICE)),
    createurDesigne: typeof env.CREATOR_UID === "string" && env.CREATOR_UID.trim().length > 0,
    stripe: !cleStripe ? "non" : cleStripe.startsWith("sk_test_") ? "test" : "cle-invalide",
    stripeWebhook: !!env.STRIPE_SECRET_WEBHOOK,
    stockagePremium: env.R2_PREMIUM ? "lie" : "non",
    // Envoi d'e-mails personnalisé : non | resend | brevo | invalide (variables présentes mais refusées) ; jamais la clé
    courriel: !env.EMAIL_FOURNISSEUR && !env.EMAIL_CLE_API ? "non" : env.EMAIL_FOURNISSEUR && !env.EMAIL_CLE_API ? "cle-absente" : (creerCourriel(env) || { fournisseur: "invalide" }).fournisseur
  };
}
__name(etatConfiguration, "etatConfiguration");
__name2(etatConfiguration, "etatConfiguration");
function onRequestGet({ env }) {
  const corps = { ok: true, service: "lanternes-de-nour", environnement: env.ENVIRONNEMENT || "inconnu", heure: (/* @__PURE__ */ new Date()).toISOString() };
  if (env.ENVIRONNEMENT === "preproduction")
    corps.configuration = etatConfiguration(env);
  return new Response(JSON.stringify(corps), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
__name(onRequestGet, "onRequestGet");
__name2(onRequestGet, "onRequestGet");
var NIVEAUX = { gratuit: 0, premium: 1, famille: 2, createur: 3 };
var PROFILS = { gratuit: 4, premium: 4, famille: 4, createur: Infinity };
var FORMULES = { premium_mensuel: "premium", premium_annuel: "premium", famille_annuel: "famille" };
function enMs(d) {
  if (d == null)
    return null;
  if (typeof d === "number")
    return d;
  if (typeof d.toMillis === "function")
    return d.toMillis();
  if (typeof d.seconds === "number")
    return d.seconds * 1e3;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : t;
}
__name(enMs, "enMs");
__name2(enMs, "enMs");
function estCreateur(uid, claims, env) {
  const attendu = env && typeof env.CREATOR_UID === "string" ? env.CREATOR_UID.trim() : "";
  return attendu.length > 0 && uid === attendu && !!claims && claims.role === "creator";
}
__name(estCreateur, "estCreateur");
__name2(estCreateur, "estCreateur");
function accesOffertActif(acces, maintenant = Date.now()) {
  if (!acces || acces.revoqueLe)
    return false;
  const debut = enMs(acces.debut), fin = enMs(acces.fin);
  if (debut !== null && debut > maintenant)
    return false;
  return fin === null || fin > maintenant;
}
__name(accesOffertActif, "accesOffertActif");
__name2(accesOffertActif, "accesOffertActif");
function abonnementActif(ab, maintenant = Date.now()) {
  if (!ab || !["active", "trialing"].includes(ab.statut))
    return false;
  const fin = enMs(ab.finPeriode);
  return fin !== null && fin > maintenant && !!FORMULES[ab.formule];
}
__name(abonnementActif, "abonnementActif");
__name2(abonnementActif, "abonnementActif");
function calculerDroits({ uid, claims, env, sources = {}, maintenant = Date.now() }) {
  if (estCreateur(uid, claims, env))
    return { statut: "creator", niveau: "createur", profilsMax: Infinity, synchro: true, apercu: true, admin: true, payant: false, offert: false, expire: null };
  const offerts = (sources.accesOfferts || []).filter((a) => accesOffertActif(a, maintenant) && NIVEAUX[a.niveau] >= 1 && a.niveau !== "createur");
  const meilleurOffert = offerts.sort((a, b) => NIVEAUX[b.niveau] - NIVEAUX[a.niveau] || (enMs(b.fin) ?? Infinity) - (enMs(a.fin) ?? Infinity))[0] || null;
  const ab = abonnementActif(sources.abonnement, maintenant) ? sources.abonnement : null;
  const nivOffert = meilleurOffert ? meilleurOffert.niveau : "gratuit";
  const nivPaye = ab ? FORMULES[ab.formule] : "gratuit";
  const niveau = NIVEAUX[nivOffert] >= NIVEAUX[nivPaye] ? nivOffert : nivPaye;
  const statut = niveau === "gratuit" ? "gratuit" : meilleurOffert && NIVEAUX[nivOffert] >= NIVEAUX[nivPaye] ? "invite" : "abonne";
  const expire = statut === "invite" ? enMs(meilleurOffert.fin) : statut === "abonne" ? enMs(ab.finPeriode) : null;
  return {
    statut,
    niveau,
    profilsMax: PROFILS[niveau],
    synchro: true,
    apercu: false,
    admin: false,
    payant: !!ab,
    offert: !!meilleurOffert,
    expire
  };
}
__name(calculerDroits, "calculerDroits");
__name2(calculerDroits, "calculerDroits");
function peutAcceder(niveauRequis, droits) {
  if (niveauRequis === "libre")
    return true;
  if (!droits)
    return false;
  if (niveauRequis === "apercu")
    return droits.apercu === true;
  if (!(niveauRequis in NIVEAUX))
    return false;
  return NIVEAUX[droits.niveau] >= NIVEAUX[niveauRequis];
}
__name(peutAcceder, "peutAcceder");
__name2(peutAcceder, "peutAcceder");
function verifierActivationInvitation({ invitation, compte, abonnement, maintenant = Date.now() }) {
  if (!invitation)
    return { ok: false, raison: "inconnue" };
  if (invitation.utiliseeLe)
    return { ok: false, raison: "deja-utilisee" };
  if (invitation.annuleeLe)
    return { ok: false, raison: "annulee" };
  if ((enMs(invitation.expireLe) ?? 0) <= maintenant)
    return { ok: false, raison: "expiree" };
  if (!compte || !compte.emailVerifie)
    return { ok: false, raison: "email-non-verifie" };
  if (normaliserEmail(compte.email) !== normaliserEmail(invitation.email))
    return { ok: false, raison: "autre-adresse" };
  if (abonnementActif(abonnement, maintenant))
    return { ok: false, raison: "abonnement-actif" };
  return { ok: true };
}
__name(verifierActivationInvitation, "verifierActivationInvitation");
__name2(verifierActivationInvitation, "verifierActivationInvitation");
function verifierSouscription({ droits, formule }) {
  if (!FORMULES[formule])
    return { ok: false, raison: "formule-inconnue" };
  if (droits && droits.statut === "creator")
    return { ok: false, raison: "compte-createur" };
  if (droits && droits.offert && NIVEAUX[droits.niveau] >= NIVEAUX[FORMULES[formule]])
    return { ok: false, raison: "acces-offert-actif" };
  if (droits && droits.payant)
    return { ok: false, raison: "deja-abonne" };
  return { ok: true };
}
__name(verifierSouscription, "verifierSouscription");
__name2(verifierSouscription, "verifierSouscription");
function profilsAGeler(enfants, profilsMax, garder = null) {
  if (!Array.isArray(enfants) || profilsMax === Infinity || enfants.length <= profilsMax)
    return [];
  const tries = [...enfants].sort((a, b) => (enMs(a.creeLe) ?? 0) - (enMs(b.creeLe) ?? 0) || String(a.id).localeCompare(String(b.id)));
  const actifs = [];
  if (garder && tries.some((e) => e.id === garder))
    actifs.push(garder);
  for (const e of tries) {
    if (actifs.length >= profilsMax)
      break;
    if (!actifs.includes(e.id))
      actifs.push(e.id);
  }
  return tries.map((e) => e.id).filter((id) => !actifs.includes(id));
}
__name(profilsAGeler, "profilsAGeler");
__name2(profilsAGeler, "profilsAGeler");
function normaliserEmail(e) {
  return String(e || "").trim().toLowerCase();
}
__name(normaliserEmail, "normaliserEmail");
__name2(normaliserEmail, "normaliserEmail");
function creerCodeInvitation() {
  const o = new Uint8Array(32);
  crypto.getRandomValues(o);
  return "LDN_" + btoa(String.fromCharCode(...o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(creerCodeInvitation, "creerCodeInvitation");
__name2(creerCodeInvitation, "creerCodeInvitation");
async function empreinteCode(code) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(code)));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(empreinteCode, "empreinteCode");
__name2(empreinteCode, "empreinteCode");
var NOM_COOKIE = "ldn_session";
var DUREE_S = 5 * 24 * 3600;
var enc2 = new TextEncoder();
var b64u = /* @__PURE__ */ __name2((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64u");
var deb64u = /* @__PURE__ */ __name2((s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4)
    s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}, "deb64u");
async function cle(secret) {
  if (typeof secret !== "string" || secret.length < 32)
    throw new Error("SESSION_SECRET absent ou trop court (32 caract\xE8res minimum)");
  return crypto.subtle.importKey("raw", enc2.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
__name(cle, "cle");
__name2(cle, "cle");
async function creerSession({ uid, email, emailVerifie, role, authTime, fournisseur = "password", version = 0 }, secret, maintenant = Date.now()) {
  const charge = {
    uid,
    email: email || null,
    ev: !!emailVerifie,
    role: role === "creator" ? "creator" : null,
    p: fournisseur,
    at: authTime,
    exp: Math.floor(maintenant / 1e3) + DUREE_S,
    v: version
  };
  const corps = b64u(enc2.encode(JSON.stringify(charge)));
  const sig = b64u(await crypto.subtle.sign("HMAC", await cle(secret), enc2.encode(corps)));
  return corps + "." + sig;
}
__name(creerSession, "creerSession");
__name2(creerSession, "creerSession");
async function lireSession(valeur, secret, maintenant = Date.now()) {
  if (typeof valeur !== "string" || valeur.length > 2048)
    return null;
  const [corps, sig] = valeur.split(".");
  if (!corps || !sig)
    return null;
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", await cle(secret), deb64u(sig), enc2.encode(corps));
  } catch (e) {
    return null;
  }
  if (!ok)
    return null;
  let c;
  try {
    c = JSON.parse(new TextDecoder().decode(deb64u(corps)));
  } catch (e) {
    return null;
  }
  if (!c || typeof c.uid !== "string" || !c.uid || typeof c.exp !== "number" || c.exp <= Math.floor(maintenant / 1e3))
    return null;
  return { uid: c.uid, email: c.email, emailVerifie: c.ev === true, claims: { role: c.role || void 0 }, authTime: c.at, fournisseur: c.p || "password", version: c.v || 0 };
}
__name(lireSession, "lireSession");
__name2(lireSession, "lireSession");
function lireCookie(entete, nom = NOM_COOKIE) {
  for (const p of String(entete || "").split(";")) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i).trim() === nom)
      return decodeURIComponent(p.slice(i + 1).trim());
  }
  return null;
}
__name(lireCookie, "lireCookie");
__name2(lireCookie, "lireCookie");
function enteteCookie(valeur, { secure = true, effacer = false } = {}) {
  return `${NOM_COOKIE}=${effacer ? "" : encodeURIComponent(valeur)}; Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}; Max-Age=${effacer ? 0 : DUREE_S}`;
}
__name(enteteCookie, "enteteCookie");
__name2(enteteCookie, "enteteCookie");
var TOLERANCE_S = 60;
var RECENT_S = 15 * 60;
var b64u2 = /* @__PURE__ */ __name2((s) => {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4)
    s += "=";
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}, "b64u");
var json2 = /* @__PURE__ */ __name2((s) => JSON.parse(new TextDecoder().decode(b64u2(s))), "json");
var JetonInvalide = /* @__PURE__ */ __name(class extends Error {
  constructor(raison) {
    super(raison);
    this.raison = raison;
  }
}, "JetonInvalide");
__name2(JetonInvalide, "JetonInvalide");
async function verifierJeton(jeton, { projet, type = "id", obtenirCle, maintenant = Date.now() }) {
  if (typeof jeton !== "string" || jeton.length > 8192)
    throw new JetonInvalide("format");
  const parties = jeton.split(".");
  if (parties.length !== 3)
    throw new JetonInvalide("format");
  let entete, charge;
  try {
    entete = json2(parties[0]);
    charge = json2(parties[1]);
  } catch (e) {
    throw new JetonInvalide("format");
  }
  if (entete.alg !== "RS256")
    throw new JetonInvalide("algorithme");
  if (typeof entete.kid !== "string" || !entete.kid)
    throw new JetonInvalide("cle-inconnue");
  const cle2 = await obtenirCle(entete.kid, type);
  if (!cle2)
    throw new JetonInvalide("cle-inconnue");
  let valide = false;
  try {
    valide = await crypto.subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, cle2, b64u2(parties[2]), new TextEncoder().encode(parties[0] + "." + parties[1]));
  } catch (e) {
    valide = false;
  }
  if (!valide)
    throw new JetonInvalide("signature");
  const t = Math.floor(maintenant / 1e3);
  const emetteur = (type === "session" ? "https://session.firebase.google.com/" : "https://securetoken.google.com/") + projet;
  if (!projet || charge.aud !== projet)
    throw new JetonInvalide("audience");
  if (charge.iss !== emetteur)
    throw new JetonInvalide("emetteur");
  if (typeof charge.exp !== "number" || charge.exp <= t - TOLERANCE_S)
    throw new JetonInvalide("expire");
  if (typeof charge.iat !== "number" || charge.iat > t + TOLERANCE_S)
    throw new JetonInvalide("date-emission");
  if (typeof charge.auth_time !== "number" || charge.auth_time > t + TOLERANCE_S)
    throw new JetonInvalide("date-connexion");
  if (typeof charge.sub !== "string" || !charge.sub || charge.sub.length > 128)
    throw new JetonInvalide("utilisateur");
  return {
    uid: charge.sub,
    email: charge.email || null,
    emailVerifie: charge.email_verified === true,
    fournisseur: charge.firebase && typeof charge.firebase.sign_in_provider === "string" ? charge.firebase.sign_in_provider : null,
    claims: { role: charge.role === "creator" ? "creator" : void 0 },
    authTime: charge.auth_time,
    charge
  };
}
__name(verifierJeton, "verifierJeton");
__name2(verifierJeton, "verifierJeton");
function connexionRecente(verifie, maintenant = Date.now(), limiteS = RECENT_S) {
  return !!verifie && Math.floor(maintenant / 1e3) - verifie.authTime <= limiteS;
}
__name(connexionRecente, "connexionRecente");
__name2(connexionRecente, "connexionRecente");
var URL_JWK_ID = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
var cache = { cles: null, expire: 0 };
async function cleGoogle(kid, type, { fetcher = fetch, maintenant = Date.now() } = {}) {
  if (type !== "id")
    return null;
  if (!cache.cles || cache.expire <= maintenant) {
    const r = await fetcher(URL_JWK_ID);
    if (!r.ok)
      return null;
    const age = /max-age=(\d+)/.exec(r.headers.get("Cache-Control") || "");
    const { keys } = await r.json();
    const cles = /* @__PURE__ */ new Map();
    for (const k of keys || [])
      if (k.kty === "RSA" && k.kid)
        cles.set(k.kid, await crypto.subtle.importKey("jwk", { kty: "RSA", n: k.n, e: k.e, alg: "RS256", ext: true }, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]));
    cache = { cles, expire: maintenant + (age ? Number(age[1]) * 1e3 : 36e5) };
  }
  return cache.cles.get(kid) || null;
}
__name(cleGoogle, "cleGoogle");
__name2(cleGoogle, "cleGoogle");
var CATALOGUE = {
  maisons: {
    ablutions: "libre",
    priere: "libre",
    ramadan: "libre",
    desert: "libre",
    sons: "apercu",
    jardin: "apercu",
    mots: "apercu",
    cinq: "apercu",
    etoiles: "apercu"
  },
  voyage: {
    village: "libre",
    marche: "libre",
    oasis: "libre",
    camp: "premium",
    dunes: "premium",
    col: "premium",
    montagnes: "premium",
    wadi: "premium",
    rochers: "premium"
  },
  missions: { objets: "libre", lanternes: "premium", tresor: "premium", voyageur: "premium", animaux: "premium" }
};
var ETATS = ["libre", "gratuit", "premium", "famille", "apercu"];
function catalogueEffectif(surcharge) {
  const c = JSON.parse(JSON.stringify(CATALOGUE));
  for (const [groupe, items] of Object.entries(surcharge || {}))
    if (c[groupe]) {
      for (const [id, n] of Object.entries(items || {}))
        if (id in c[groupe] && ETATS.includes(n))
          c[groupe][id] = n;
    }
  return c;
}
__name(catalogueEffectif, "catalogueEffectif");
__name2(catalogueEffectif, "catalogueEffectif");
function niveauDuFichier(chemin, cat = CATALOGUE) {
  if (typeof chemin !== "string" || !/^[a-z0-9][a-z0-9/_.-]{0,200}$/.test(chemin) || chemin.includes("..") || chemin.includes("//"))
    return null;
  const [groupe, id] = chemin.split("/");
  return cat[groupe] && cat[groupe][id] || "apercu";
}
__name(niveauDuFichier, "niveauDuFichier");
__name2(niveauDuFichier, "niveauDuFichier");
var MARQUE = { nom: "Les Lanternes de Nour", site: "https://leslanternesdenour.fr", contact: "bonjour@leslanternesdenour.fr" };
function echapper(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(echapper, "echapper");
__name2(echapper, "echapper");
function gabarit({ preambule, titre, paragraphes, bouton, note }) {
  const p = /* @__PURE__ */ __name2((t) => `<p style="margin:0 0 16px;font:16px/1.6 Arial,Helvetica,sans-serif;color:#e4dcff">${echapper(t)}</p>`, "p");
  const b = bouton ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px auto"><tr><td style="background:#f5b942;border-radius:14px"><a href="${echapper(bouton.url)}" style="display:inline-block;padding:15px 28px;font:bold 17px Arial,Helvetica,sans-serif;color:#2a1d00;text-decoration:none">${echapper(bouton.texte)}</a></td></tr></table>` : "";
  const lienBrut = bouton ? `<p style="margin:0 0 16px;font:13px/1.5 Arial,Helvetica,sans-serif;color:#c9bfe8;word-break:break-all">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${echapper(bouton.url)}" style="color:#ffd24a">${echapper(bouton.url)}</a></p>` : "";
  const n = note ? `<p style="margin:16px 0 0;font:14px/1.6 Arial,Helvetica,sans-serif;color:#c9bfe8">${echapper(note)}</p>` : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${echapper(titre)}</title></head><body style="margin:0;padding:0;background:#191345"><span style="display:none;max-height:0;overflow:hidden;opacity:0;color:#191345">${echapper(preambule)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#191345"><tr><td align="center" style="padding:28px 14px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#2a2166;border:2px solid #f5b942;border-radius:22px"><tr><td style="padding:30px 28px"><p style="margin:0 0 6px;text-align:center;font:bold 14px Arial,Helvetica,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ffd24a">${echapper(MARQUE.nom)}</p><h1 style="margin:0 0 20px;text-align:center;font:bold 26px/1.25 Arial,Helvetica,sans-serif;color:#ffffff">${echapper(titre)}</h1>` + paragraphes.map(p).join("") + b + lienBrut + n + `</td></tr></table><p style="max-width:520px;margin:18px auto 0;text-align:center;font:12px/1.6 Arial,Helvetica,sans-serif;color:#9d92c9">${echapper(MARQUE.nom)} \xB7 <a href="${MARQUE.site}" style="color:#c9bfe8">leslanternesdenour.fr</a><br>Une question ? \xC9crivez-nous : <a href="mailto:${MARQUE.contact}" style="color:#c9bfe8">${MARQUE.contact}</a></p></td></tr></table></body></html>`;
}
__name(gabarit, "gabarit");
__name2(gabarit, "gabarit");
function texteBrut({ titre, paragraphes, bouton, note }) {
  return [
    titre,
    "",
    ...paragraphes.flatMap((p) => [p, ""]),
    ...bouton ? [bouton.texte + " :", bouton.url, ""] : [],
    ...note ? [note, ""] : [],
    "\u2014 " + MARQUE.nom,
    MARQUE.site,
    "Une question ? " + MARQUE.contact
  ].join("\n");
}
__name(texteBrut, "texteBrut");
__name2(texteBrut, "texteBrut");
var fabriquer = /* @__PURE__ */ __name2((objet, d) => ({ objet, texte: texteBrut(d), html: gabarit(d) }), "fabriquer");
var VALIDITE = "Ce lien est personnel, \xE0 usage unique et valable pour une dur\xE9e limit\xE9e. S'il a expir\xE9, demandez-en un nouveau depuis l'Espace famille.";
var modeles = {
  verification({ lien }) {
    return fabriquer("V\xE9rifiez votre adresse e-mail pour Les Lanternes de Nour", {
      preambule: "Un dernier geste pour ouvrir le village de Nour \xE0 vos enfants.",
      titre: "V\xE9rifiez votre adresse e-mail",
      paragraphes: ["Bonjour,", "Merci d'avoir cr\xE9\xE9 un compte parent sur Les Lanternes de Nour. Pour prot\xE9ger les enfants, le jeu s'ouvre d\xE8s que votre adresse e-mail est v\xE9rifi\xE9e.", "Touchez le bouton ci-dessous, puis revenez sur la page \xAB Espace famille \xBB : elle se met \xE0 jour toute seule et ouvre le jeu.", VALIDITE],
      bouton: { texte: "V\xE9rifier mon adresse e-mail", url: lien },
      note: "Si vous n'\xEAtes pas \xE0 l'origine de cette demande, ignorez simplement ce message : rien ne sera activ\xE9."
    });
  },
  confirmationVerification({ lienJeu }) {
    return fabriquer("Votre adresse e-mail est v\xE9rifi\xE9e : le village de Nour vous attend", {
      preambule: "Votre compte parent est pr\xEAt.",
      titre: "Adresse v\xE9rifi\xE9e, merci !",
      paragraphes: ["Bonjour,", "Votre adresse e-mail est maintenant v\xE9rifi\xE9e. Vous pouvez cr\xE9er les profils de vos enfants (jusqu'\xE0 quatre) et ouvrir le village de Nour."],
      bouton: { texte: "Ouvrir l'Espace famille", url: lienJeu },
      note: "Si vous n'\xEAtes pas \xE0 l'origine de cette v\xE9rification, \xE9crivez-nous \xE0 " + MARQUE.contact + "."
    });
  },
  reinitialisation({ lien }) {
    return fabriquer("R\xE9initialisez votre mot de passe \u2014 Les Lanternes de Nour", {
      preambule: "Choisissez un nouveau mot de passe pour votre compte parent.",
      titre: "Choisissez un nouveau mot de passe",
      paragraphes: ["Bonjour,", "Vous avez demand\xE9 \xE0 r\xE9initialiser le mot de passe de votre compte parent Les Lanternes de Nour. Touchez le bouton ci-dessous pour en choisir un nouveau.", VALIDITE],
      bouton: { texte: "Choisir un nouveau mot de passe", url: lien },
      note: "Si vous n'\xEAtes pas \xE0 l'origine de cette demande, ignorez simplement ce message : votre mot de passe ne changera pas."
    });
  },
  changementAdresse({ nouvelleAdresse }) {
    return fabriquer("Votre adresse e-mail a \xE9t\xE9 modifi\xE9e \u2014 Les Lanternes de Nour", {
      preambule: "Information de s\xE9curit\xE9 sur votre compte parent.",
      titre: "Votre adresse e-mail a chang\xE9",
      paragraphes: ["Bonjour,", "L'adresse e-mail de votre compte parent a \xE9t\xE9 remplac\xE9e par : " + nouvelleAdresse + ".", "Si vous \xEAtes \xE0 l'origine de ce changement, vous n'avez rien \xE0 faire."],
      note: "Si vous n'\xEAtes pas \xE0 l'origine de ce changement, \xE9crivez-nous sans attendre \xE0 " + MARQUE.contact + "."
    });
  },
  motDePasseModifie() {
    return fabriquer("Votre mot de passe a \xE9t\xE9 modifi\xE9 \u2014 Les Lanternes de Nour", {
      preambule: "Information de s\xE9curit\xE9 sur votre compte parent.",
      titre: "Votre mot de passe a \xE9t\xE9 modifi\xE9",
      paragraphes: ["Bonjour,", "Le mot de passe de votre compte parent vient d'\xEAtre modifi\xE9. Si vous \xEAtes \xE0 l'origine de ce changement, vous n'avez rien \xE0 faire."],
      note: "Si vous n'\xEAtes pas \xE0 l'origine de ce changement, \xE9crivez-nous sans attendre \xE0 " + MARQUE.contact + "."
    });
  },
  compteSupprime() {
    return fabriquer("Votre compte a \xE9t\xE9 supprim\xE9 \u2014 Les Lanternes de Nour", {
      preambule: "Confirmation de la suppression de votre compte parent.",
      titre: "Votre compte a \xE9t\xE9 supprim\xE9",
      paragraphes: ["Bonjour,", "Votre compte parent, les profils de vos enfants et leur progression ont \xE9t\xE9 supprim\xE9s d\xE9finitivement, comme vous l'avez demand\xE9.", "Merci d'avoir fait un bout de chemin avec nous."],
      note: "Si vous n'\xEAtes pas \xE0 l'origine de cette suppression, \xE9crivez-nous \xE0 " + MARQUE.contact + "."
    });
  }
};
var J = 864e5;
var PAGE = 20;
var VALIDITE_INVITATION = 14 * J;
var FORMULE_PRIX = { premium_mensuel: "STRIPE_PRIX_PREMIUM_MENSUEL", premium_annuel: "STRIPE_PRIX_PREMIUM_ANNUEL", famille_annuel: "STRIPE_PRIX_FAMILLE_ANNUEL" };
var json3 = /* @__PURE__ */ __name2((data, statut = 200, entetes = {}) => new Response(JSON.stringify(data), { status: statut, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...entetes } }), "json");
var erreur = /* @__PURE__ */ __name2((statut, raison) => json3({ erreur: raison }, statut), "erreur");
var preferencesFamille = /* @__PURE__ */ __name2((f) => {
  const p = f && f.preferences || {};
  return typeof p.sansVisage === "boolean" ? { sansVisage: p.sansVisage } : {};
}, "preferencesFamille");
var CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://i.ytimg.com https://yt3.googleusercontent.com; media-src 'self' data: blob: https://cdn.islamic.network; connect-src 'self' https://cdn.jsdelivr.net https://api.alquran.cloud https://cdn.islamic.network https://www.gstatic.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com; frame-src 'self' https://www.youtube-nocookie.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'";
var TYPES_PREMIUM = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  mjs: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  mp3: "audio/mpeg",
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
  svg: "image/svg+xml",
  woff2: "font/woff2",
  txt: "text/plain; charset=utf-8"
};
function entetesPremium(fichier, type) {
  const ext = (fichier.split(".").pop() || "").toLowerCase();
  const h = {
    "Content-Type": TYPES_PREMIUM[ext] || type || "application/octet-stream",
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Robots-Tag": "noindex, nofollow"
  };
  if (ext === "html")
    Object.assign(h, { "Content-Security-Policy": CSP, "X-Frame-Options": "SAMEORIGIN" });
  return h;
}
__name(entetesPremium, "entetesPremium");
__name2(entetesPremium, "entetesPremium");
var compteurs2 = /* @__PURE__ */ new Map();
var sequence = 0;
function tropDeTentatives2(cle2, max, fenetreMs, maintenant) {
  const c = compteurs2.get(cle2);
  if (!c || c.debut + fenetreMs < maintenant) {
    compteurs2.set(cle2, { debut: maintenant, n: 1 });
    return false;
  }
  c.n++;
  return c.n > max;
}
__name(tropDeTentatives2, "tropDeTentatives2");
__name2(tropDeTentatives2, "tropDeTentatives");
async function corpsJson(req, max = 2e5) {
  const t = await req.text();
  if (t.length > max)
    throw new Error("trop-gros");
  try {
    return t ? JSON.parse(t) : {};
  } catch (e) {
    throw new Error("json");
  }
}
__name(corpsJson, "corpsJson");
__name2(corpsJson, "corpsJson");
async function sourcesDe(base2, uid) {
  const d = await base2.lire("droits", uid);
  return d ? d.sources || {} : {};
}
__name(sourcesDe, "sourcesDe");
__name2(sourcesDe, "sourcesDe");
var VUES = { visiteur: null, gratuit: "gratuit", premium: "premium", famille: "famille" };
var PROFILS_VUE = { gratuit: 1, premium: 1, famille: 5 };
function vueDemandee(req, ctx, session) {
  const v = lireCookie(req.headers.get("Cookie"), "ldn_vue");
  return v && v in VUES && session && estCreateur(session.uid, session.claims, ctx.env) ? v : null;
}
__name(vueDemandee, "vueDemandee");
__name2(vueDemandee, "vueDemandee");
function droitsSimules(vue) {
  if (vue === "visiteur")
    return null;
  return { statut: vue === "gratuit" ? "gratuit" : "abonne", niveau: vue, profilsMax: PROFILS_VUE[vue], synchro: vue === "famille", apercu: false, admin: false, payant: vue !== "gratuit", offert: false, expire: null, vue };
}
__name(droitsSimules, "droitsSimules");
__name2(droitsSimules, "droitsSimules");
async function droitsContenus(ctx, session, req) {
  const vue = vueDemandee(req, ctx, session);
  if (vue)
    return { d: droitsSimules(vue), connecte: vue !== "visiteur", vue };
  return { d: await droitsDe(ctx, session), connecte: !!session, vue: null };
}
__name(droitsContenus, "droitsContenus");
__name2(droitsContenus, "droitsContenus");
async function droitsDe(ctx, session) {
  if (!session)
    return null;
  return calculerDroits({ uid: session.uid, claims: session.claims, env: ctx.env, sources: await sourcesDe(ctx.base, session.uid), maintenant: ctx.maintenant });
}
__name(droitsDe, "droitsDe");
__name2(droitsDe, "droitsDe");
async function majDroits(ctx, uid, { claims = {} } = {}) {
  const offerts = (await ctx.base.chercher("acces_offerts", "uid", uid)).map((x) => ({ id: x.id, ...x.data }));
  const abonnement = await ctx.base.lire("abonnements", uid);
  await ctx.base.ecrire("droits", uid, { sources: { accesOfferts: offerts, abonnement: abonnement || null }, majLe: ctx.maintenant });
  const d = calculerDroits({ uid, claims, env: ctx.env, sources: { accesOfferts: offerts, abonnement }, maintenant: ctx.maintenant });
  await appliquerGel(ctx, uid, d.profilsMax);
  return d;
}
__name(majDroits, "majDroits");
__name2(majDroits, "majDroits");
async function tousLesEnfants(base2, uid) {
  const tout = [];
  let apres = null;
  do {
    const p = await base2.lister(`familles/${uid}/enfants`, { limite: 100, apres });
    tout.push(...p.docs);
    apres = p.suite;
  } while (apres);
  return tout;
}
__name(tousLesEnfants, "tousLesEnfants");
__name2(tousLesEnfants, "tousLesEnfants");
async function appliquerGel(ctx, uid, profilsMax) {
  const enfants = await tousLesEnfants(ctx.base, uid);
  const famille = await ctx.base.lire("familles", uid);
  const geler = new Set(profilsAGeler(enfants.map((e) => ({ id: e.id, creeLe: e.data.creeLe })), profilsMax, famille && famille.profilActif));
  for (const e of enfants) {
    const g = geler.has(e.id);
    if (!!e.data.gele !== g)
      await ctx.base.maj(`familles/${uid}/enfants`, e.id, { gele: g });
  }
}
__name(appliquerGel, "appliquerGel");
__name2(appliquerGel, "appliquerGel");
async function journal(ctx, action, details) {
  await ctx.base.ecrire("admin_logs", String(ctx.maintenant).padStart(15, "0") + "-" + Math.random().toString(36).slice(2, 8), { t: ctx.maintenant, action, ...details });
}
__name(journal, "journal");
__name2(journal, "journal");
var FOURNISSEURS = ["password", "google.com"];
function memeOrigine2(req) {
  if (req.headers.get("X-LDN") !== "1")
    return false;
  const o = req.headers.get("Origin");
  if (!o)
    return true;
  return o === new URL(req.url).origin;
}
__name(memeOrigine2, "memeOrigine2");
__name2(memeOrigine2, "memeOrigine");
function exigerCreateur(ctx, session, { recent = false } = {}) {
  if (!session || !estCreateur(session.uid, session.claims, ctx.env))
    return erreur(403, "reserve-createur");
  if (recent && !connexionRecente(session, ctx.maintenant))
    return erreur(401, "reconnexion-requise");
  return null;
}
__name(exigerCreateur, "exigerCreateur");
__name2(exigerCreateur, "exigerCreateur");
function validerEnfant(b) {
  const surnom = String(b.surnom || "").trim();
  if (!/^[\p{L}][\p{L} '’-]{0,19}$/u.test(surnom))
    return { erreur: "surnom-invalide" };
  if (!["3-5", "6-10"].includes(b.tranche))
    return { erreur: "tranche-invalide" };
  if (!["fille", "garcon"].includes(b.avatar))
    return { erreur: "avatar-invalide" };
  return { surnom, tranche: b.tranche, avatar: b.avatar };
}
__name(validerEnfant, "validerEnfant");
__name2(validerEnfant, "validerEnfant");
var DELAI_ENVOI_S = 90;
var MAX_PAR_JOUR = 6;
var ORIGINES_SITE = [/^https:\/\/(www\.)?leslanternesdenour\.fr$/, /^https:\/\/preproduction\.[a-z0-9-]+\.pages\.dev$/, /^http:\/\/(localhost|127\.0\.0\.1):\d+$/];
var origineSite = /* @__PURE__ */ __name2((url) => ORIGINES_SITE.some((r) => r.test(url.origin)) ? url.origin : "https://leslanternesdenour.fr", "origineSite");
var lienAction = /* @__PURE__ */ __name2((url, mode, code) => `${origineSite(url)}/compte/action/?mode=${mode}&oobCode=${encodeURIComponent(code)}&lang=fr`, "lienAction");
async function empreinteAdresse(email) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  return [...new Uint8Array(b)].slice(0, 16).map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(empreinteAdresse, "empreinteAdresse");
__name2(empreinteAdresse, "empreinteAdresse");
async function reserverEnvoi(ctx, cle2) {
  const d = await ctx.base.lire("courriers", cle2) || {}, jour = new Date(ctx.maintenant).toISOString().slice(0, 10), n = d.jour === jour ? d.n || 0 : 0;
  if (d.dernier && ctx.maintenant - d.dernier < DELAI_ENVOI_S * 1e3)
    return { ok: false, raison: "trop-tot", attente: Math.ceil((DELAI_ENVOI_S * 1e3 - (ctx.maintenant - d.dernier)) / 1e3) };
  if (n >= MAX_PAR_JOUR)
    return { ok: false, raison: "limite-journaliere", attente: 3600 };
  await ctx.base.ecrire("courriers", cle2, { dernier: ctx.maintenant, jour, n: n + 1 });
  return { ok: true };
}
__name(reserverEnvoi, "reserverEnvoi");
__name2(reserverEnvoi, "reserverEnvoi");
async function traiter(req, ctx) {
  const url = new URL(req.url), chemin = url.pathname.replace(/\/+$/, ""), m = req.method;
  ctx.maintenant = ctx.maintenant || Date.now();
  const secure = url.protocol === "https:";
  const ip = req.headers.get("CF-Connecting-IP") || "local";
  try {
    if (chemin === "/api/stripe/webhook" && m === "POST")
      return webhookStripe(req, ctx);
    if (m !== "GET" && m !== "HEAD" && !memeOrigine2(req))
      return erreur(403, "origine");
    const session = await lireSession(lireCookie(req.headers.get("Cookie")), ctx.env.SESSION_SECRET, ctx.maintenant);
    if (chemin === "/api/paiement/mode" && m === "GET")
      return json3({ mode: !ctx.stripe ? "ferme" : ctx.stripe.modeTest ? "test" : "reel" });
    if (chemin === "/api/session" && m === "POST") {
      if (tropDeTentatives2("session:" + ip, 30, 10 * 6e4, ctx.maintenant))
        return erreur(429, "trop-de-tentatives");
      const b = await corpsJson(req, 1e4);
      let v;
      try {
        v = await ctx.auth.verifierIdToken(b.idToken, ctx.maintenant);
      } catch (e) {
        return erreur(401, "jeton-invalide");
      }
      if (!FOURNISSEURS.includes(v.fournisseur))
        return erreur(403, "fournisseur-non-autorise");
      if (v.fournisseur === "google.com" && (!v.email || !v.emailVerifie))
        return erreur(403, "email-google-non-verifie");
      let famille = await ctx.base.lire("familles", v.uid);
      if (!famille) {
        const c = b.consentements || {};
        if (!(c.parent === true && c.cgu === true && c.confidentialite === true))
          return erreur(428, "consentement-requis");
        famille = { email: normaliserEmail(v.email), creeLe: ctx.maintenant, consentements: { parent: ctx.maintenant, cgu: ctx.maintenant, confidentialite: ctx.maintenant, version: ctx.env.VERSION_TEXTES || "2026-11" }, profilActif: null };
        await ctx.base.ecrire("familles", v.uid, famille);
        await majDroits(ctx, v.uid, { claims: v.claims });
      } else if (normaliserEmail(v.email) !== famille.email)
        await ctx.base.maj("familles", v.uid, { email: normaliserEmail(v.email) });
      const valeur = await creerSession({ uid: v.uid, email: v.email, emailVerifie: v.emailVerifie, role: v.claims.role, authTime: v.authTime, fournisseur: v.fournisseur }, ctx.env.SESSION_SECRET, ctx.maintenant);
      if (v.emailVerifie && ctx.courriel && famille.verifDemandeeLe && !famille.verifConfirmeeLe && v.email) {
        try {
          await ctx.base.maj("familles", v.uid, { verifConfirmeeLe: ctx.maintenant });
          await ctx.courriel.envoyer({ a: v.email, ...modeles.confirmationVerification({ lienJeu: origineSite(url) + "/compte/" }) });
        } catch (e) {
        }
      }
      return json3({ ok: true }, 200, { "Set-Cookie": enteteCookie(valeur, { secure }) });
    }
    if (chemin === "/api/session/fin" && m === "POST")
      return json3({ ok: true }, 200, { "Set-Cookie": enteteCookie("", { secure, effacer: true }) });
    if (chemin === "/api/createur/activer" && m === "POST") {
      const attendu = typeof ctx.env.CREATOR_UID === "string" ? ctx.env.CREATOR_UID.trim() : "";
      if (!session || !attendu || session.uid !== attendu)
        return erreur(403, "reserve-createur");
      if (tropDeTentatives2("createur:" + ip, 10, 60 * 6e4, ctx.maintenant))
        return erreur(429, "trop-de-tentatives");
      if (!session.emailVerifie)
        return erreur(403, "adresse-non-verifiee");
      if (estCreateur(session.uid, session.claims, ctx.env))
        return json3({ ok: true, deja: true });
      if (!connexionRecente(session, ctx.maintenant))
        return erreur(401, "reconnexion-requise");
      if (typeof ctx.base.poserRoleCreateur !== "function")
        return erreur(501, "non-disponible");
      await ctx.base.poserRoleCreateur(session.uid);
      await journal(ctx, "role-createur-pose", { uid: session.uid });
      return json3({ ok: true, reconnexion: true });
    }
    if (chemin === "/api/moi" && m === "GET") {
      if (!session)
        return json3({ connecte: false, statut: "visiteur" });
      const d2 = await droitsDe(ctx, session);
      const f = await ctx.base.lire("familles", session.uid);
      const ab = await ctx.base.lire("abonnements", session.uid);
      return json3({
        connecte: true,
        uid: session.uid,
        email: session.email,
        emailVerifie: session.emailVerifie,
        fournisseur: session.fournisseur,
        ...d2,
        vue: vueDemandee(req, ctx, session),
        abonnement: ab ? { statut: ab.statut, formule: ab.formule, finPeriode: ab.finPeriode, annulationFinPeriode: !!ab.annulationFinPeriode, aRegulariser: ["past_due", "unpaid"].includes(ab.statut) } : null,
        // pour l'affichage seulement : les droits viennent de « statut » et « niveau »
        profilsMax: d2.profilsMax === Infinity ? null : d2.profilsMax,
        illimite: d2.profilsMax === Infinity,
        profilActif: f && f.profilActif || null,
        preferences: preferencesFamille(f),
        activationCreateur: d2.statut !== "creator" && session.emailVerifie && !!String(ctx.env.CREATOR_UID || "").trim() && session.uid === String(ctx.env.CREATOR_UID).trim()
      });
    }
    if (chemin === "/api/catalogue" && m === "GET") {
      const cat = catalogueEffectif(await ctx.base.lire("catalogue", "etat") || {});
      const { d: d2, connecte, vue: simulee } = await droitsContenus(ctx, session, req);
      const vue = {};
      for (const [g, items] of Object.entries(cat))
        vue[g] = Object.fromEntries(Object.entries(items).map(([id, n]) => [id, { niveau: n, publie: n !== "apercu", ouvert: peutAcceder(n, d2) || n === "gratuit" && connecte }]));
      return json3({ catalogue: vue, vue: simulee, bandeau: (await ctx.base.lire("catalogue", "bandeau") || {}).texte || null });
    }
    if (chemin.startsWith("/api/premium/") && (m === "GET" || m === "HEAD")) {
      let fichier;
      try {
        fichier = decodeURIComponent(url.pathname.slice("/api/premium/".length));
      } catch (e) {
        return erreur(400, "chemin");
      }
      if (fichier.endsWith("/"))
        fichier += "index.html";
      const cat = catalogueEffectif(await ctx.base.lire("catalogue", "etat") || {});
      const niveau = niveauDuFichier(fichier, cat);
      if (!niveau)
        return erreur(400, "chemin");
      const { d: d2, connecte } = await droitsContenus(ctx, session, req);
      if (connecte && session && !session.emailVerifie)
        return erreur(403, "email-non-verifie");
      const ok = peutAcceder(niveau, d2) || niveau === "gratuit" && connecte;
      if (!ok)
        return erreur(connecte ? 403 : 401, connecte ? "premium-requis" : "connexion-requise");
      const obj = await ctx.stockage.get(fichier);
      if (!obj)
        return erreur(404, "introuvable");
      return new Response(m === "HEAD" ? null : obj.body, { headers: entetesPremium(fichier, obj.type) });
    }
    if (chemin === "/api/email/reinitialisation" && m === "POST") {
      if (!ctx.courriel)
        return erreur(503, "email-non-configure");
      if (tropDeTentatives2("reinit:" + ip, 8, 15 * 6e4, ctx.maintenant))
        return erreur(429, "trop-de-tentatives");
      const b = await corpsJson(req, 1e3), email = typeof b.email === "string" ? normaliserEmail(b.email) : "";
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        return erreur(400, "adresse-invalide");
      const lim = await reserverEnvoi(ctx, "r" + await empreinteAdresse(email));
      if (!lim.ok)
        return json3({ ok: true });
      try {
        const lien = await ctx.base.lienAction("PASSWORD_RESET", email);
        if (lien)
          await ctx.courriel.envoyer({ a: email, ...modeles.reinitialisation({ lien: lienAction(url, "resetPassword", lien.oobCode) }) });
      } catch (e) {
      }
      return json3({ ok: true });
    }
    if (chemin.startsWith("/api/") && !session)
      return erreur(401, "connexion-requise");
    const d = await droitsDe(ctx, session);
    if (chemin === "/api/email/verification" && m === "POST") {
      if (!ctx.courriel)
        return erreur(503, "email-non-configure");
      if (session.emailVerifie)
        return json3({ deja: true });
      if (!session.email)
        return erreur(400, "adresse-absente");
      if (tropDeTentatives2("email:" + ip, 20, 10 * 6e4, ctx.maintenant))
        return erreur(429, "trop-de-tentatives");
      const lim = await reserverEnvoi(ctx, session.uid);
      if (!lim.ok)
        return json3({ erreur: lim.raison, attente: lim.attente }, 429);
      let lien;
      try {
        lien = await ctx.base.lienAction("VERIFY_EMAIL", session.email);
      } catch (e) {
        return erreur(502, "envoi-impossible");
      }
      if (!lien)
        return erreur(404, "compte-introuvable");
      try {
        await ctx.courriel.envoyer({ a: session.email, ...modeles.verification({ lien: lienAction(url, "verifyEmail", lien.oobCode) }) });
      } catch (e) {
        return erreur(502, "envoi-impossible");
      }
      await ctx.base.maj("familles", session.uid, { verifDemandeeLe: ctx.maintenant });
      return json3({ envoye: true, delai: DELAI_ENVOI_S });
    }
    if (chemin === "/api/enfants" || chemin.startsWith("/api/enfants/")) {
      if (!session.emailVerifie)
        return erreur(403, "email-non-verifie");
    }
    if (chemin === "/api/famille/preferences" && m === "PATCH") {
      const c = await corpsJson(req, 500);
      if (typeof c.sansVisage !== "boolean")
        return erreur(400, "sansVisage-booleen-requis");
      const f = await ctx.base.lire("familles", session.uid) || {};
      await ctx.base.maj("familles", session.uid, { preferences: { ...preferencesFamille(f), sansVisage: c.sansVisage } });
      return json3({ ok: true, preferences: { sansVisage: c.sansVisage } });
    }
    if (chemin === "/api/enfants" && m === "GET") {
      const p = await ctx.base.lister(`familles/${session.uid}/enfants`, { limite: PAGE, apres: url.searchParams.get("apres") });
      return json3({ enfants: p.docs.map((x) => ({ id: x.id, ...x.data, progression: void 0 })), suite: p.suite, total: await ctx.base.compter(`familles/${session.uid}/enfants`) });
    }
    if (chemin === "/api/enfants" && m === "POST") {
      const e = validerEnfant(await corpsJson(req, 2e3));
      if (e.erreur)
        return erreur(400, e.erreur);
      const n = await ctx.base.compter(`familles/${session.uid}/enfants`);
      if (d.profilsMax !== Infinity && n >= d.profilsMax)
        return erreur(403, "limite-profils");
      const id = "e" + ctx.maintenant.toString(36).padStart(9, "0") + (sequence++ % 1679616).toString(36).padStart(4, "0") + Math.random().toString(36).slice(2, 5);
      await ctx.base.ecrire(`familles/${session.uid}/enfants`, id, { ...e, creeLe: ctx.maintenant, gele: false, progression: {}, majLe: ctx.maintenant });
      const f = await ctx.base.lire("familles", session.uid);
      if (f && !f.profilActif)
        await ctx.base.maj("familles", session.uid, { profilActif: id });
      return json3({ id }, 201);
    }
    let r = /^\/api\/enfants\/([A-Za-z0-9]{1,40})(\/progression|\/actif)?$/.exec(chemin);
    if (r) {
      const col = `familles/${session.uid}/enfants`, enfant = await ctx.base.lire(col, r[1]);
      if (!enfant)
        return erreur(404, "profil-introuvable");
      if (!r[2] && m === "GET")
        return json3({ id: r[1], ...enfant, progression: d.synchro ? enfant.progression : void 0 });
      if (r[2] === "/progression" && m === "PUT") {
        if (!d.synchro)
          return erreur(403, "synchro-famille");
        if (enfant.gele)
          return erreur(423, "profil-gele");
        const b = await corpsJson(req, 15e4);
        if (!b.progression || typeof b.progression !== "object" || Array.isArray(b.progression))
          return erreur(400, "progression");
        await ctx.base.maj(col, r[1], { progression: b.progression, majLe: ctx.maintenant });
        return json3({ ok: true });
      }
      if (r[2] === "/actif" && m === "POST") {
        await ctx.base.maj("familles", session.uid, { profilActif: r[1] });
        await appliquerGel(ctx, session.uid, d.profilsMax);
        return json3({ ok: true });
      }
      if (!r[2] && m === "PATCH") {
        const e = validerEnfant({ ...enfant, ...await corpsJson(req, 2e3) });
        if (e.erreur)
          return erreur(400, e.erreur);
        await ctx.base.maj(col, r[1], e);
        return json3({ ok: true });
      }
      if (!r[2] && m === "DELETE") {
        await ctx.base.supprimer(col, r[1]);
        return json3({ ok: true });
      }
    }
    if (chemin === "/api/invitations/activer" && m === "POST") {
      if (tropDeTentatives2("inv:" + session.uid, 10, 60 * 6e4, ctx.maintenant))
        return erreur(429, "trop-de-tentatives");
      const b = await corpsJson(req, 1e3);
      const id = await empreinteCode(String(b.code || "").trim());
      const inv = await ctx.base.lire("invitations", id);
      const abonnement = await ctx.base.lire("abonnements", session.uid);
      const verdict = verifierActivationInvitation({ invitation: inv, compte: { email: session.email, emailVerifie: session.emailVerifie }, abonnement, maintenant: ctx.maintenant });
      if (!verdict.ok) {
        if (verdict.raison === "abonnement-actif")
          await journal(ctx, "invitation-bloquee-abonnement", { uid: session.uid, invitation: id });
        return erreur(409, verdict.raison);
      }
      const accesId = "a" + id.slice(0, 20);
      const cree = await ctx.base.creerSiAbsent("acces_offerts", accesId, {
        uid: session.uid,
        email: normaliserEmail(session.email),
        niveau: inv.niveau,
        debut: ctx.maintenant,
        fin: inv.dureeJours ? ctx.maintenant + inv.dureeJours * J : null,
        libelle: inv.libelle || "",
        invitation: id,
        creeLe: ctx.maintenant,
        revoqueLe: null,
        historique: [{ t: ctx.maintenant, action: "activation" }]
      });
      if (!cree)
        return erreur(409, "deja-utilisee");
      await ctx.base.maj("invitations", id, { utiliseeLe: ctx.maintenant, utiliseePar: session.uid });
      await majDroits(ctx, session.uid, { claims: session.claims });
      await journal(ctx, "invitation-activee", { uid: session.uid, invitation: id, niveau: inv.niveau });
      return json3({ ok: true, niveau: inv.niveau });
    }
    if (chemin === "/api/paiement/session" && m === "POST") {
      if (!ctx.stripe)
        return erreur(503, "paiement-non-configure");
      if (!session.emailVerifie)
        return erreur(403, "email-non-verifie");
      const b = await corpsJson(req, 2e3);
      const v = verifierSouscription({ droits: d, formule: b.formule });
      if (!v.ok)
        return erreur(409, v.raison);
      if (!(b.consentements && b.consentements.cgv === true && b.consentements.executionImmediate === true))
        return erreur(428, "consentement-requis");
      const prix = ctx.env[FORMULE_PRIX[b.formule]];
      if (!prix)
        return erreur(503, "prix-non-configure");
      const ab = await ctx.base.lire("abonnements", session.uid);
      const s = await ctx.stripe.creerCheckout({ uid: session.uid, email: session.email, prix, client: ab && ab.stripeClient, succes: url.origin + "/compte/?paiement=ok&session_id={CHECKOUT_SESSION_ID}", annulation: url.origin + "/tarifs/?paiement=annule" });
      await ctx.base.ecrire("consentements_achat", s.id, { uid: session.uid, formule: b.formule, cgv: ctx.maintenant, executionImmediate: ctx.maintenant, version: ctx.env.VERSION_TEXTES || "2026-11" });
      return json3({ url: s.url });
    }
    if (chemin === "/api/abonnement/resilier" && m === "POST") {
      const ab = await ctx.base.lire("abonnements", session.uid);
      if (!ab || !abonnementActif(ab, ctx.maintenant))
        return erreur(404, "aucun-abonnement");
      if (ctx.stripe)
        await ctx.stripe.resilierFinPeriode(ab.stripeAbonnement);
      await ctx.base.maj("abonnements", session.uid, { annulationFinPeriode: true, resilieLe: ctx.maintenant });
      await majDroits(ctx, session.uid, { claims: session.claims });
      return json3({ ok: true, finAcces: ab.finPeriode });
    }
    if (chemin === "/api/abonnement/synchroniser" && m === "POST") {
      if (!ctx.stripe)
        return erreur(503, "paiement-non-configure");
      if (!session.emailVerifie)
        return erreur(403, "email-non-verifie");
      const b = await corpsJson(req, 1e3);
      if (b.sessionId === void 0) {
        const ab = await ctx.base.lire("abonnements", session.uid);
        let sub2 = null;
        if (ab && ab.stripeAbonnement) {
          try {
            sub2 = await ctx.stripe.lireAbonnement(ab.stripeAbonnement);
          } catch (e) {
            return erreur(404, "abonnement-inconnu");
          }
        }
        if (!sub2 || !["active", "trialing", "past_due", "unpaid"].includes(sub2.status)) {
          if (!/^[A-Za-z0-9_-]{1,128}$/.test(session.uid))
            return erreur(404, "aucun-abonnement");
          let r2 = null;
          try {
            r2 = await ctx.stripe.chercherAbonnements(session.uid, session.email);
          } catch (e) {
            if (!sub2)
              return erreur(404, "aucun-abonnement");
          }
          const plusRecent = (r2 && r2.data || []).filter((x) => x.metadata && x.metadata.uid === session.uid && ["active", "trialing"].includes(x.status)).sort((x, y) => (y.created || 0) - (x.created || 0))[0];
          if (plusRecent)
            sub2 = plusRecent;
          if (!sub2)
            return erreur(404, "aucun-abonnement");
        }
        if (sub2.metadata && sub2.metadata.uid && sub2.metadata.uid !== session.uid)
          return erreur(403, "session-autre-compte");
        const d2 = await enregistrerAbonnement(ctx, session.uid, sub2);
        return json3({ ok: true, statut: d2.statut, niveau: d2.niveau });
      }
      const id = String(b.sessionId || "");
      if (!/^cs_(test|live)_[A-Za-z0-9_]{4,200}$/.test(id))
        return erreur(400, "session-invalide");
      let s;
      try {
        s = await ctx.stripe.lireSession(id);
      } catch (e) {
        return erreur(404, "session-inconnue");
      }
      if ((s.client_reference_id || s.metadata && s.metadata.uid) !== session.uid)
        return erreur(403, "session-autre-compte");
      const sub = s.subscription && typeof s.subscription === "object" ? s.subscription : null;
      if (s.mode !== "subscription" || s.status !== "complete" || !sub)
        return erreur(409, "paiement-non-termine");
      await enregistrerAbonnement(ctx, session.uid, sub);
      return json3({ ok: true });
    }
    if (chemin === "/api/abonnement/portail" && m === "POST") {
      const ab = await ctx.base.lire("abonnements", session.uid);
      if (!ctx.stripe || !ab || !ab.stripeClient)
        return erreur(404, "aucun-abonnement");
      return json3({ url: (await ctx.stripe.creerPortail({ client: ab.stripeClient, retour: url.origin + "/compte/" })).url });
    }
    if (chemin === "/api/compte" && m === "DELETE") {
      if (!connexionRecente(session, ctx.maintenant))
        return erreur(401, "reconnexion-requise");
      const ab = await ctx.base.lire("abonnements", session.uid);
      if (ab && abonnementActif(ab, ctx.maintenant) && !ab.annulationFinPeriode)
        return erreur(409, "abonnement-actif");
      const emailSuppr = session.email;
      await supprimerToutesLesDonnees(ctx, session.uid);
      if (ctx.courriel && emailSuppr) {
        try {
          await ctx.courriel.envoyer({ a: emailSuppr, ...modeles.compteSupprime() });
        } catch (e) {
        }
      }
      return json3({ ok: true }, 200, { "Set-Cookie": enteteCookie("", { secure, effacer: true }) });
    }
    if (chemin.startsWith("/api/admin/"))
      return administration(req, ctx, session, chemin, url);
    return erreur(404, "inconnu");
  } catch (e) {
    if (e && (e.message === "json" || e.message === "trop-gros"))
      return erreur(400, e.message);
    console.error(e);
    return erreur(500, "erreur-serveur");
  }
}
__name(traiter, "traiter");
__name2(traiter, "traiter");
async function supprimerToutesLesDonnees(ctx, uid) {
  for (const e of await tousLesEnfants(ctx.base, uid))
    await ctx.base.supprimer(`familles/${uid}/enfants`, e.id);
  for (const a of await ctx.base.chercher("acces_offerts", "uid", uid))
    await ctx.base.supprimer("acces_offerts", a.id);
  for (const i of await ctx.base.chercher("invitations", "utiliseePar", uid))
    await ctx.base.maj("invitations", i.id, { email: null, utiliseePar: null });
  const famille = await ctx.base.lire("familles", uid), email = famille && famille.email;
  if (email)
    for (const i of await ctx.base.chercher("invitations", "email", email))
      await ctx.base.maj("invitations", i.id, { email: null });
  let apres = null;
  do {
    const pg = await ctx.base.lister("admin_logs", { limite: 200, apres });
    for (const l of pg.docs)
      if (l.data.uid === uid || email && l.data.email === email)
        await ctx.base.maj("admin_logs", l.id, { uid: l.data.uid === uid ? "anonymise" : l.data.uid, email: email && l.data.email === email ? null : l.data.email });
    apres = pg.suite;
  } while (apres);
  for (const c of await ctx.base.chercher("stripe_clients", "uid", uid))
    await ctx.base.supprimer("stripe_clients", c.id);
  for (const c of await ctx.base.chercher("consentements_achat", "uid", uid))
    await ctx.base.maj("consentements_achat", c.id, { uid: "anonymise" });
  await ctx.base.supprimer("courriers", uid);
  if (email)
    await ctx.base.supprimer("courriers", "r" + await empreinteAdresse(email));
  await ctx.base.supprimer("droits", uid);
  await ctx.base.supprimer("abonnements", uid);
  await ctx.base.supprimer("familles", uid);
  await ctx.base.supprimerUtilisateur(uid);
  await journal(ctx, "compte-supprime", { uid: "anonymise" });
}
__name(supprimerToutesLesDonnees, "supprimerToutesLesDonnees");
__name2(supprimerToutesLesDonnees, "supprimerToutesLesDonnees");
var TYPES_PACK_PREMIUM = ["application/json", "audio/mpeg", "text/html", "text/css", "text/javascript", "application/javascript", "image/png", "image/jpeg", "image/svg+xml", "image/webp"];
var TAILLE_MAX_PACK_PREMIUM = 25 * 1024 * 1024;
async function administration(req, ctx, session, chemin, url) {
  const m = req.method, ecriture = m !== "GET";
  const refus = exigerCreateur(ctx, session, { recent: ecriture });
  if (refus)
    return refus;
  const apres = url.searchParams.get("apres");
  if (chemin === "/api/admin/resume" && m === "GET") {
    const abos = (await ctx.base.chercher("abonnements", "statut", "active", 1e4)).concat(await ctx.base.chercher("abonnements", "statut", "trialing", 1e4)).filter((a) => abonnementActif(a.data, ctx.maintenant));
    const parFormule = {};
    for (const a of abos)
      parFormule[a.data.formule] = (parFormule[a.data.formule] || 0) + 1;
    const offerts = [];
    let p = null;
    do {
      const pg = await ctx.base.lister("acces_offerts", { limite: 100, apres: p });
      offerts.push(...pg.docs);
      p = pg.suite;
    } while (p);
    const actifs = offerts.filter((o) => accesOffertActif(o.data, ctx.maintenant));
    const familles = await ctx.base.compter("familles");
    return json3({ familles, payants: abos.length, parFormule, accesOffertsActifs: actifs.length, gratuits: Math.max(0, familles - abos.length - new Set(actifs.map((o) => o.data.uid)).size) });
  }
  if (chemin === "/api/admin/comptes" && m === "GET") {
    const pg = await ctx.base.lister("familles", { limite: PAGE, apres });
    const comptes = [];
    for (const f of pg.docs) {
      const dr = calculerDroits({ uid: f.id, claims: {}, env: ctx.env, sources: await sourcesDe(ctx.base, f.id), maintenant: ctx.maintenant });
      comptes.push({ uid: f.id, email: f.data.email, creeLe: f.data.creeLe, statut: f.id === ctx.env.CREATOR_UID ? "creator" : dr.statut, niveau: dr.niveau, expire: dr.expire, enfants: await ctx.base.compter(`familles/${f.id}/enfants`) });
    }
    return json3({ comptes, suite: pg.suite });
  }
  let r = /^\/api\/admin\/comptes\/([A-Za-z0-9_-]{1,128})$/.exec(chemin);
  if (r && m === "GET") {
    const f = await ctx.base.lire("familles", r[1]);
    if (!f)
      return erreur(404, "compte-introuvable");
    const pg = await ctx.base.lister(`familles/${r[1]}/enfants`, { limite: PAGE, apres });
    const ab = await ctx.base.lire("abonnements", r[1]);
    return json3({
      uid: r[1],
      email: f.email,
      creeLe: f.creeLe,
      consentements: f.consentements,
      abonnement: ab ? { statut: ab.statut, formule: ab.formule, finPeriode: ab.finPeriode, annulationFinPeriode: !!ab.annulationFinPeriode } : null,
      acces: (await ctx.base.chercher("acces_offerts", "uid", r[1])).map((a) => ({ id: a.id, ...a.data })),
      enfants: pg.docs.map((e) => ({ id: e.id, surnom: e.data.surnom, tranche: e.data.tranche, avatar: e.data.avatar, gele: !!e.data.gele, creeLe: e.data.creeLe })),
      suite: pg.suite,
      totalEnfants: await ctx.base.compter(`familles/${r[1]}/enfants`)
    });
  }
  if (chemin === "/api/admin/invitations" && m === "POST") {
    const b = await corpsJson(req, 2e3);
    const email = normaliserEmail(b.email);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return erreur(400, "email-invalide");
    if (!["premium", "famille"].includes(b.niveau))
      return erreur(400, "niveau-invalide");
    const duree = b.dureeJours == null ? null : Number(b.dureeJours);
    if (duree !== null && !(Number.isInteger(duree) && duree >= 1 && duree <= 3650))
      return erreur(400, "duree-invalide");
    const code = creerCodeInvitation(), id = await empreinteCode(code);
    await ctx.base.ecrire("invitations", id, { email, niveau: b.niveau, dureeJours: duree, libelle: String(b.libelle || "").slice(0, 60), creeLe: ctx.maintenant, expireLe: ctx.maintenant + VALIDITE_INVITATION, utiliseeLe: null, utiliseePar: null, annuleeLe: null });
    await journal(ctx, "invitation-creee", { invitation: id, email, niveau: b.niveau, dureeJours: duree });
    return json3({ id, lien: url.origin + "/compte/?invite=" + encodeURIComponent(code), expireLe: ctx.maintenant + VALIDITE_INVITATION }, 201);
  }
  if (chemin === "/api/admin/invitations" && m === "GET") {
    const pg = await ctx.base.lister("invitations", { limite: PAGE, apres });
    return json3({ invitations: pg.docs.map((i) => ({ id: i.id, ...i.data, etat: i.data.annuleeLe ? "annulee" : i.data.utiliseeLe ? "utilisee" : i.data.expireLe <= ctx.maintenant ? "expiree" : "en-attente" })), suite: pg.suite });
  }
  r = /^\/api\/admin\/invitations\/([0-9a-f]{64})$/.exec(chemin);
  if (r && m === "DELETE") {
    const inv = await ctx.base.lire("invitations", r[1]);
    if (!inv)
      return erreur(404, "invitation-introuvable");
    if (inv.utiliseeLe)
      return erreur(409, "deja-utilisee");
    await ctx.base.maj("invitations", r[1], { annuleeLe: ctx.maintenant });
    await journal(ctx, "invitation-annulee", { invitation: r[1] });
    return json3({ ok: true });
  }
  if (chemin === "/api/admin/acces" && m === "GET") {
    const pg = await ctx.base.lister("acces_offerts", { limite: PAGE, apres });
    return json3({ acces: pg.docs.map((a) => ({ id: a.id, ...a.data, actif: accesOffertActif(a.data, ctx.maintenant) })), suite: pg.suite });
  }
  if (chemin === "/api/admin/acces" && m === "POST") {
    const b = await corpsJson(req, 2e3), email = normaliserEmail(b.email);
    const cible = (await ctx.base.chercher("familles", "email", email, 2))[0];
    if (!cible)
      return erreur(404, "compte-introuvable");
    if (!["premium", "famille"].includes(b.niveau))
      return erreur(400, "niveau-invalide");
    if (abonnementActif(await ctx.base.lire("abonnements", cible.id), ctx.maintenant))
      return erreur(409, "abonnement-actif");
    const duree = b.dureeJours == null ? null : Number(b.dureeJours);
    if (duree !== null && !(Number.isInteger(duree) && duree >= 1 && duree <= 3650))
      return erreur(400, "duree-invalide");
    const id = "d" + ctx.maintenant.toString(36) + Math.random().toString(36).slice(2, 7);
    await ctx.base.ecrire("acces_offerts", id, { uid: cible.id, email, niveau: b.niveau, debut: ctx.maintenant, fin: duree ? ctx.maintenant + duree * J : null, libelle: String(b.libelle || "").slice(0, 60), invitation: null, creeLe: ctx.maintenant, revoqueLe: null, historique: [{ t: ctx.maintenant, action: "attribution-directe" }] });
    await majDroits(ctx, cible.id);
    await journal(ctx, "acces-attribue", { acces: id, uid: cible.id, niveau: b.niveau, dureeJours: duree });
    return json3({ id }, 201);
  }
  r = /^\/api\/admin\/acces\/([A-Za-z0-9]{1,40})\/(prolonger|revoquer)$/.exec(chemin);
  if (r && m === "POST") {
    const a = await ctx.base.lire("acces_offerts", r[1]);
    if (!a)
      return erreur(404, "acces-introuvable");
    if (r[2] === "revoquer") {
      if (a.revoqueLe)
        return json3({ ok: true });
      await ctx.base.maj("acces_offerts", r[1], { revoqueLe: ctx.maintenant, historique: [...a.historique || [], { t: ctx.maintenant, action: "revocation" }] });
      await majDroits(ctx, a.uid);
      await journal(ctx, "acces-revoque", { acces: r[1], uid: a.uid });
      return json3({ ok: true });
    }
    const b = await corpsJson(req, 500);
    const fin = b.permanent === true ? null : Number(b.fin);
    if (fin !== null && !(fin > ctx.maintenant))
      return erreur(400, "fin-invalide");
    await ctx.base.maj("acces_offerts", r[1], { fin, revoqueLe: null, historique: [...a.historique || [], { t: ctx.maintenant, action: fin === null ? "permanent" : "prolongation", fin }] });
    await majDroits(ctx, a.uid);
    await journal(ctx, "acces-prolonge", { acces: r[1], uid: a.uid, fin });
    return json3({ ok: true });
  }
  if (chemin === "/api/admin/catalogue" && m === "GET")
    return json3({ catalogue: catalogueEffectif(await ctx.base.lire("catalogue", "etat") || {}), bandeau: (await ctx.base.lire("catalogue", "bandeau") || {}).texte || null });
  if (chemin === "/api/admin/catalogue" && m === "POST") {
    const b = await corpsJson(req, 5e3), cat = catalogueEffectif({});
    if (!cat[b.groupe] || !(b.id in cat[b.groupe]) || !ETATS.includes(b.niveau))
      return erreur(400, "contenu-invalide");
    const etat = await ctx.base.lire("catalogue", "etat") || {};
    etat[b.groupe] = { ...etat[b.groupe] || {}, [b.id]: b.niveau };
    await ctx.base.ecrire("catalogue", "etat", etat);
    await journal(ctx, "catalogue", { groupe: b.groupe, id: b.id, niveau: b.niveau });
    return json3({ ok: true });
  }
  if (chemin === "/api/admin/bandeau" && m === "POST") {
    const b = await corpsJson(req, 2e3), texte = b.texte ? String(b.texte).slice(0, 200) : null;
    await ctx.base.ecrire("catalogue", "bandeau", { texte, majLe: ctx.maintenant });
    await journal(ctx, "bandeau", { texte });
    return json3({ ok: true });
  }
  if (chemin === "/api/admin/premium" && m === "GET") {
    if (!ctx.stockage.lister)
      return json3({ disponible: false, fichiers: [] });
    const cat = catalogueEffectif(await ctx.base.lire("catalogue", "etat") || {});
    const fichiers = (await ctx.stockage.lister()).map((f) => ({ ...f, niveau: niveauDuFichier(f.cle, cat) }));
    return json3({ disponible: true, fichiers });
  }
  if (chemin.startsWith("/api/admin/premium/") && (m === "PUT" || m === "DELETE")) {
    let cle2;
    try {
      cle2 = decodeURIComponent(url.pathname.slice("/api/admin/premium/".length));
    } catch (e) {
      return erreur(400, "chemin");
    }
    if (!/^[a-z0-9][a-z0-9/_.-]{0,200}$/.test(cle2) || cle2.includes("..") || cle2.includes("//") || cle2.endsWith("/"))
      return erreur(400, "chemin");
    if (!ctx.stockage.put)
      return erreur(503, "stockage-non-branche");
    if (m === "DELETE") {
      await ctx.stockage.supprimer(cle2);
      await journal(ctx, "premium-supprime", { cle: cle2 });
      return json3({ ok: true, cle: cle2 });
    }
    const type = String(req.headers.get("Content-Type") || "").split(";")[0].trim();
    if (!TYPES_PACK_PREMIUM.includes(type))
      return erreur(415, "type-non-autorise");
    if (Number(req.headers.get("Content-Length") || 0) > TAILLE_MAX_PACK_PREMIUM)
      return erreur(413, "trop-gros");
    const corps = new Uint8Array(await req.arrayBuffer());
    if (!corps.length)
      return erreur(400, "vide");
    if (corps.length > TAILLE_MAX_PACK_PREMIUM)
      return erreur(413, "trop-gros");
    await ctx.stockage.put(cle2, corps, type);
    await journal(ctx, "premium-import", { cle: cle2, taille: corps.length });
    return json3({ ok: true, cle: cle2, taille: corps.length });
  }
  if (chemin === "/api/admin/journal" && m === "GET") {
    const pg = await ctx.base.lister("admin_logs", { limite: 50, apres });
    return json3({ journal: pg.docs.map((x) => ({ id: x.id, ...x.data })), suite: pg.suite });
  }
  return erreur(404, "inconnu");
}
__name(administration, "administration");
__name2(administration, "administration");
async function enregistrerAbonnement(ctx, uid, o, supprime = false) {
  const formuleDuPrix = /* @__PURE__ */ __name2((prix2) => Object.entries(FORMULE_PRIX).find(([, cle2]) => ctx.env[cle2] === prix2)?.[0] || null, "formuleDuPrix");
  const prix = o.items && o.items.data && o.items.data[0] && o.items.data[0].price && o.items.data[0].price.id;
  const statut = supprime ? "canceled" : o.status;
  const finSecondes = o.current_period_end || o.items && o.items.data && o.items.data[0] && o.items.data[0].current_period_end || 0;
  await ctx.base.ecrire("abonnements", uid, { statut, formule: formuleDuPrix(prix), finPeriode: finSecondes * 1e3, stripeClient: o.customer, stripeAbonnement: o.id, annulationFinPeriode: !!o.cancel_at_period_end, majLe: ctx.maintenant });
  if (statut === "active" && (await ctx.base.chercher("acces_offerts", "uid", uid)).some((a) => accesOffertActif(a.data, ctx.maintenant)))
    await journal(ctx, "alerte-double-acces", { uid, abonnement: o.id });
  return majDroits(ctx, uid);
}
__name(enregistrerAbonnement, "enregistrerAbonnement");
__name2(enregistrerAbonnement, "enregistrerAbonnement");
async function webhookStripe(req, ctx) {
  const corps = await req.text();
  if (!await verifierSignatureStripe(corps, req.headers.get("Stripe-Signature"), ctx.env.STRIPE_SECRET_WEBHOOK, ctx.maintenant))
    return erreur(400, "signature");
  const ev = JSON.parse(corps);
  if (ev.livemode === true && ctx.env.STRIPE_MODE_REEL !== "autorise")
    return erreur(400, "mode-reel-refuse");
  if (!await ctx.base.creerSiAbsent("stripe_evenements", ev.id, { t: ctx.maintenant, type: ev.type }))
    return json3({ ok: true, doublon: true });
  const o = ev.data && ev.data.object || {};
  let uid = o.metadata && o.metadata.uid || o.client_reference_id || null;
  if (!uid && o.customer) {
    const c = await ctx.base.lire("stripe_clients", o.customer);
    uid = c && c.uid;
  }
  if (!uid) {
    await journal(ctx, "stripe-sans-compte", { evenement: ev.id, type: ev.type });
    return json3({ ok: true });
  }
  if (!await ctx.base.lire("familles", uid)) {
    await journal(ctx, "stripe-compte-supprime", { evenement: ev.id, type: ev.type });
    return json3({ ok: true, ignore: true });
  }
  if (o.customer)
    await ctx.base.ecrire("stripe_clients", o.customer, { uid });
  if (ev.type === "customer.subscription.created" || ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    await enregistrerAbonnement(ctx, uid, o, ev.type === "customer.subscription.deleted");
  } else if (ev.type === "checkout.session.completed") {
    await journal(ctx, "paiement-confirme", { uid, session: o.id });
  } else if (ev.type === "invoice.payment_failed") {
    await journal(ctx, "paiement-echoue", { uid, facture: o.id });
  }
  return json3({ ok: true });
}
__name(webhookStripe, "webhookStripe");
__name2(webhookStripe, "webhookStripe");
var PORTEES = "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit";
var b64u3 = /* @__PURE__ */ __name2((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64u");
var txt64u = /* @__PURE__ */ __name2((s) => b64u3(new TextEncoder().encode(s)), "txt64u");
function pemVersDer(pem) {
  const corps = String(pem).replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  return Uint8Array.from(atob(corps), (c) => c.charCodeAt(0));
}
__name(pemVersDer, "pemVersDer");
__name2(pemVersDer, "pemVersDer");
function jetonGoogle(compte, { fetcher = fetch } = {}) {
  let cache2 = { jeton: null, expire: 0 };
  return async (maintenant = Date.now()) => {
    if (cache2.jeton && cache2.expire > maintenant)
      return cache2.jeton;
    const s = Math.floor(maintenant / 1e3);
    const tete = txt64u(JSON.stringify({ alg: "RS256", typ: "JWT" })) + "." + txt64u(JSON.stringify({ iss: compte.client_email, scope: PORTEES, aud: "https://oauth2.googleapis.com/token", iat: s, exp: s + 3600 }));
    const cle2 = await crypto.subtle.importKey("pkcs8", pemVersDer(compte.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const assertion = tete + "." + b64u3(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cle2, new TextEncoder().encode(tete)));
    const r = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + assertion
    });
    if (!r.ok)
      throw new Error("jeton Google refus\xE9 : " + r.status);
    const j = await r.json();
    cache2 = { jeton: j.access_token, expire: maintenant + 55 * 6e4 };
    return cache2.jeton;
  };
}
__name(jetonGoogle, "jetonGoogle");
__name2(jetonGoogle, "jetonGoogle");
function versFs(v) {
  if (v === null || v === void 0)
    return { nullValue: null };
  if (typeof v === "boolean")
    return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string")
    return { stringValue: v };
  if (Array.isArray(v))
    return { arrayValue: { values: v.map(versFs) } };
  if (typeof v === "object")
    return { mapValue: { fields: Object.fromEntries(Object.entries(v).filter(([, x]) => x !== void 0).map(([k, x]) => [k, versFs(x)])) } };
  throw new Error("type non pris en charge");
}
__name(versFs, "versFs");
__name2(versFs, "versFs");
function depuisFs(f) {
  if (!f || "nullValue" in f)
    return null;
  if ("booleanValue" in f)
    return f.booleanValue;
  if ("integerValue" in f)
    return Number(f.integerValue);
  if ("doubleValue" in f)
    return f.doubleValue;
  if ("stringValue" in f)
    return f.stringValue;
  if ("timestampValue" in f)
    return Date.parse(f.timestampValue);
  if ("arrayValue" in f)
    return (f.arrayValue.values || []).map(depuisFs);
  if ("mapValue" in f)
    return Object.fromEntries(Object.entries(f.mapValue.fields || {}).map(([k, x]) => [k, depuisFs(x)]));
  return null;
}
__name(depuisFs, "depuisFs");
__name2(depuisFs, "depuisFs");
var champs = /* @__PURE__ */ __name2((data) => Object.fromEntries(Object.entries(data).filter(([, x]) => x !== void 0).map(([k, v]) => [k, versFs(v)])), "champs");
var docVersObjet = /* @__PURE__ */ __name2((doc) => ({ id: doc.name.split("/").pop(), data: Object.fromEntries(Object.entries(doc.fields || {}).map(([k, v]) => [k, depuisFs(v)])) }), "docVersObjet");
function baseFirestore({ projet, compte, fetcher = fetch, jeton = jetonGoogle(compte, { fetcher }) }) {
  const racine = `https://firestore.googleapis.com/v1/projects/${projet}/databases/(default)/documents`;
  const appel = /* @__PURE__ */ __name2(async (url2, opts = {}) => {
    const r = await fetcher(url2, { ...opts, headers: { Authorization: "Bearer " + await jeton(), "Content-Type": "application/json", ...opts.headers || {} } });
    if (r.status === 404)
      return null;
    if (!r.ok)
      throw new Error("Firestore " + r.status + " " + (await r.text()).slice(0, 200));
    return r.status === 204 ? {} : r.json();
  }, "appel");
  const url = /* @__PURE__ */ __name2((col, id) => `${racine}/${col}/${encodeURIComponent(id)}`, "url");
  const parent = /* @__PURE__ */ __name2((col) => {
    const p = col.split("/");
    return { parent: p.length > 1 ? racine + "/" + p.slice(0, -1).join("/") : racine, coll: p[p.length - 1] };
  }, "parent");
  return {
    type: "firestore",
    async lire(col, id) {
      const d = await appel(url(col, id));
      return d ? docVersObjet(d).data : null;
    },
    async ecrire(col, id, data) {
      await appel(url(col, id), { method: "PATCH", body: JSON.stringify({ fields: champs(data) }) });
    },
    async maj(col, id, partiel) {
      const masque = Object.keys(partiel).map((k) => "updateMask.fieldPaths=" + encodeURIComponent("`" + k + "`")).join("&");
      if (await appel(url(col, id) + "?currentDocument.exists=true&" + masque, { method: "PATCH", body: JSON.stringify({ fields: champs(partiel) }) }) === null)
        throw new Error("document absent : " + col + "/" + id);
    },
    async creerSiAbsent(col, id, data) {
      const r = await fetcher(url(col, id) + "?currentDocument.exists=false", { method: "PATCH", headers: { Authorization: "Bearer " + await jeton(), "Content-Type": "application/json" }, body: JSON.stringify({ fields: champs(data) }) });
      if (r.status === 400 || r.status === 409 || r.status === 412)
        return false;
      if (!r.ok)
        throw new Error("Firestore " + r.status);
      return true;
    },
    async supprimer(col, id) {
      await appel(url(col, id), { method: "DELETE" });
    },
    async lister(col, { limite = 20, apres = null } = {}) {
      const { parent: p, coll } = parent(col);
      const q = { structuredQuery: { from: [{ collectionId: coll }], orderBy: [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }], limit: limite + 1 } };
      if (apres)
        q.structuredQuery.startAt = { values: [{ referenceValue: `${p.replace("https://firestore.googleapis.com/v1/", "")}/${coll}/${apres}` }], before: false };
      const res = await appel(p + ":runQuery", { method: "POST", body: JSON.stringify(q) }) || [];
      const docs = res.filter((x) => x.document).map((x) => docVersObjet(x.document));
      return { docs: docs.slice(0, limite), suite: docs.length > limite ? docs[limite - 1].id : null };
    },
    async compter(col) {
      const { parent: p, coll } = parent(col);
      const res = await appel(p + ":runAggregationQuery", { method: "POST", body: JSON.stringify({ structuredAggregationQuery: { structuredQuery: { from: [{ collectionId: coll }] }, aggregations: [{ alias: "n", count: {} }] } }) });
      return Number(res && res[0] && res[0].result && res[0].result.aggregateFields.n.integerValue || 0);
    },
    async chercher(col, champ, valeur, limite = 100) {
      const { parent: p, coll } = parent(col);
      const q = { structuredQuery: { from: [{ collectionId: coll }], where: { fieldFilter: { field: { fieldPath: champ }, op: "EQUAL", value: versFs(valeur) } }, limit: limite } };
      const res = await appel(p + ":runQuery", { method: "POST", body: JSON.stringify(q) }) || [];
      return res.filter((x) => x.document).map((x) => docVersObjet(x.document));
    },
    // Pose le rôle « creator » (revendication personnalisée) sur un compte Firebase Authentication. Le jeton le contient à la prochaine reconnexion.
    async poserRoleCreateur(uid) {
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:update`, { method: "POST", headers: { Authorization: "Bearer " + await jeton(), "Content-Type": "application/json" }, body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ role: "creator" }) }) });
      if (!r.ok)
        throw new Error("pose du r\xF4le refus\xE9e : " + r.status);
    },
    // Lien d'action (vérification de l'adresse, réinitialisation du mot de passe) généré côté serveur : même appel que le SDK Firebase Admin
    // (generateEmailVerificationLink / generatePasswordResetLink). returnOobLink = Firebase N'ENVOIE PAS d'e-mail : c'est notre serveur qui l'envoie.
    // Renvoie { oobCode } (jeton Firebase à usage unique et à durée limitée) ou null si le compte n'existe pas.
    async lienAction(type, email) {
      if (!["VERIFY_EMAIL", "PASSWORD_RESET"].includes(type))
        throw new Error("type-invalide");
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
        throw new Error("adresse-invalide");
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:sendOobCode`, { method: "POST", headers: { Authorization: "Bearer " + await jeton(), "Content-Type": "application/json" }, body: JSON.stringify({ requestType: type, email, returnOobLink: true }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (/EMAIL_NOT_FOUND|USER_NOT_FOUND/.test(JSON.stringify(j)))
          return null;
        throw new Error("lien-action-refuse:" + r.status);
      }
      let code = typeof j.oobCode === "string" ? j.oobCode : null;
      if (!code && typeof j.oobLink === "string") {
        try {
          code = new URL(j.oobLink).searchParams.get("oobCode");
        } catch (e) {
        }
      }
      if (!code)
        throw new Error("lien-action-vide");
      return { oobCode: code };
    },
    // Suppression d'un compte Firebase Authentication (RGPD)
    async supprimerUtilisateur(uid) {
      const r = await fetcher(`https://identitytoolkit.googleapis.com/v1/projects/${projet}/accounts:delete`, { method: "POST", headers: { Authorization: "Bearer " + await jeton(), "Content-Type": "application/json" }, body: JSON.stringify({ localId: uid }) });
      if (r.ok || r.status === 404)
        return;
      const j = await r.json().catch(() => ({}));
      if (r.status === 400 && /USER_NOT_FOUND/.test(JSON.stringify(j)))
        return;
      throw new Error("suppression du compte refus\xE9e : " + r.status);
    }
  };
}
__name(baseFirestore, "baseFirestore");
__name2(baseFirestore, "baseFirestore");
var base = null;
var empreinteBase = null;
function stockagePremium(env) {
  if (env.R2_PREMIUM)
    return {
      type: "r2",
      async get(cle2) {
        const o = await env.R2_PREMIUM.get(cle2);
        return o && { body: o.body, type: o.httpMetadata && o.httpMetadata.contentType };
      },
      // Écriture réservée à l'import du Créateur (PUT /api/admin/premium/<chemin>) : le type du fichier est conservé avec lui.
      async put(cle2, corps, type) {
        await env.R2_PREMIUM.put(cle2, corps, { httpMetadata: { contentType: type } });
      },
      async supprimer(cle2) {
        await env.R2_PREMIUM.delete(cle2);
      },
      async lister() {
        const out = [];
        let curseur;
        do {
          const r = await env.R2_PREMIUM.list({ cursor: curseur, limit: 1e3 });
          for (const o of r.objects)
            out.push({ cle: o.key, taille: o.size, date: o.uploaded });
          curseur = r.truncated ? r.cursor : null;
        } while (curseur);
        return out;
      }
    };
  return { type: "aucun", async get() {
    return null;
  }, async lister() {
    return [];
  } };
}
__name(stockagePremium, "stockagePremium");
__name2(stockagePremium, "stockagePremium");
async function onRequest3({ request, env }) {
  if (!env.SESSION_SECRET || !env.FIREBASE_PROJET || !env.FIREBASE_COMPTE_SERVICE)
    return new Response(JSON.stringify({ erreur: "comptes-non-configures" }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  let ctx;
  try {
    const empreinte = env.FIREBASE_PROJET + "|" + env.FIREBASE_COMPTE_SERVICE;
    if (!base || empreinteBase !== empreinte) {
      base = null;
      const compte = JSON.parse(env.FIREBASE_COMPTE_SERVICE);
      if (estRevoquee(compte))
        throw new Error("cl\xE9 r\xE9voqu\xE9e");
      base = baseFirestore({ projet: env.FIREBASE_PROJET, compte });
      empreinteBase = empreinte;
    }
    ctx = {
      env,
      base,
      auth: { verifierIdToken: (jeton, maintenant) => verifierJeton(jeton, { projet: env.FIREBASE_PROJET, type: "id", obtenirCle: cleGoogle, maintenant }) },
      stockage: stockagePremium(env),
      stripe: clientStripe(env),
      courriel: creerCourriel(env)
      // null tant que le prestataire d'e-mails n'est pas configuré : l'ancien envoi Firebase reste utilisé
    };
  } catch (e) {
    console.error("Configuration des secrets invalide (d\xE9tail volontairement omis).");
    return new Response(JSON.stringify({ erreur: "configuration-invalide" }), { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  }
  return traiter(request, ctx);
}
__name(onRequest3, "onRequest3");
__name2(onRequest3, "onRequest");
var PAGES_PROTEGEES = [
  "/monde/",
  "/voyage/",
  "/ablutions/",
  "/ablutions/jeu3d/",
  "/priere/",
  "/priere/jeu3d/",
  "/calendrier/",
  "/aventures/",
  "/aventures/chasse-aux-mots/",
  "/aventures/mysteres-desert/",
  "/aventures/quiz-nour/",
  "/ecole-arabe/",
  "/ecole-arabe/lettres/",
  "/ecole-arabe/lecture/",
  "/ecole-arabe/chiffres/"
];
function estPageProtegee(chemin) {
  let p = String(chemin || "").split("?")[0].split("#")[0];
  p = p.replace(/\/index\.html$/, "/");
  if (!p.endsWith("/"))
    p += "/";
  return PAGES_PROTEGEES.includes(p);
}
__name(estPageProtegee, "estPageProtegee");
__name2(estPageProtegee, "estPageProtegee");
var comptesConfigures = /* @__PURE__ */ __name2((env) => !!(env && env.SESSION_SECRET && env.FIREBASE_PROJET && env.FIREBASE_COMPTE_SERVICE), "comptesConfigures");
async function garde(requete, env, maintenant = Date.now()) {
  const url = new URL(requete.url);
  if (!estPageProtegee(url.pathname))
    return { action: "passer" };
  if (!comptesConfigures(env))
    return { action: "indisponible" };
  let session = null;
  try {
    session = await lireSession(lireCookie(requete.headers.get("Cookie"), NOM_COOKIE), env.SESSION_SECRET, maintenant);
  } catch (e) {
    return { action: "indisponible" };
  }
  if (!session)
    return { action: "rediriger", location: "/compte/?retour=" + encodeURIComponent(url.pathname + url.search) + "#connexion" };
  if (!session.emailVerifie)
    return { action: "rediriger", location: "/compte/?retour=" + encodeURIComponent(url.pathname + url.search) + "&verification=1#verification" };
  return { action: "passer", protegee: true };
}
__name(garde, "garde");
__name2(garde, "garde");
var PAGE_INDISPONIBLE = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Service momentan\xE9ment indisponible \xB7 Les Lanternes de Nour</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#191345;color:#f4efff;font:18px/1.55 Nunito,system-ui,sans-serif;padding:20px;box-sizing:border-box}main{max-width:460px;background:#2a2166;border:2px solid rgba(245,185,66,.8);border-radius:24px;padding:28px 24px;text-align:center}h1{font-size:26px;color:#ffd24a;margin:8px 0 12px}a{display:inline-block;margin:6px;padding:12px 18px;border-radius:14px;border:2px solid #ffd666;color:#ffd666;text-decoration:none;font-weight:800}a.p{background:#ffd666;color:#2a1d00}</style></head><body><main><div style="font-size:42px">\u{1F3EE}</div><h1>Le village est momentan\xE9ment ferm\xE9</h1><p>Le service des comptes parents ne r\xE9pond pas pour l'instant. Par s\xE9curit\xE9, le jeu reste ferm\xE9. R\xE9essayez dans quelques minutes.</p><p><a class="p" href="">R\xE9essayer</a><a href="/decouvrir/">Voir la pr\xE9sentation</a><a href="/">Accueil</a></p></main></body></html>`;
function reponseIndisponible() {
  return new Response(PAGE_INDISPONIBLE, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "120", "X-Robots-Tag": "noindex" } });
}
__name(reponseIndisponible, "reponseIndisponible");
__name2(reponseIndisponible, "reponseIndisponible");
function reponseRedirection(location) {
  return new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } });
}
__name(reponseRedirection, "reponseRedirection");
__name2(reponseRedirection, "reponseRedirection");
async function onRequest4({ request, env, next }) {
  const chemin = new URL(request.url).pathname;
  if (!estPageProtegee(chemin))
    return next();
  let r;
  try {
    r = await garde(request, env);
  } catch (e) {
    return reponseIndisponible();
  }
  if (r.action === "indisponible")
    return reponseIndisponible();
  if (r.action === "rediriger")
    return reponseRedirection(r.location);
  const rep = await next();
  const h = new Headers(rep.headers);
  h.set("Cache-Control", "private, no-store");
  return new Response(rep.body, { status: rep.status, statusText: rep.statusText, headers: h });
}
__name(onRequest4, "onRequest4");
__name2(onRequest4, "onRequest");
var routes = [
  {
    routePath: "/api/don/config",
    mountPath: "/api/don",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/api/don/session",
    mountPath: "/api/don",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/api/sante",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/:route*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest4],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = /* @__PURE__ */ __name(class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
}, "__Facade_ScheduledController__");
__name2(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../../tmp/claude-0/w/node_modules/wrangler/templates/pages-dev-util.ts
function isRoutingRuleMatch(pathname, routingRule) {
  if (!pathname) {
    throw new Error("Pathname is undefined.");
  }
  if (!routingRule) {
    throw new Error("Routing rule is undefined.");
  }
  const ruleRegExp = transformRoutingRuleToRegExp(routingRule);
  return pathname.match(ruleRegExp) !== null;
}
__name(isRoutingRuleMatch, "isRoutingRuleMatch");
function transformRoutingRuleToRegExp(rule) {
  let transformedRule;
  if (rule === "/" || rule === "/*") {
    transformedRule = rule;
  } else if (rule.endsWith("/*")) {
    transformedRule = `${rule.substring(0, rule.length - 2)}(/*)?`;
  } else if (rule.endsWith("/")) {
    transformedRule = `${rule.substring(0, rule.length - 1)}(/)?`;
  } else if (rule.endsWith("*")) {
    transformedRule = rule;
  } else {
    transformedRule = `${rule}(/)?`;
  }
  transformedRule = `^${transformedRule.replaceAll(/\./g, "\\.").replaceAll(/\*/g, ".*")}$`;
  return new RegExp(transformedRule);
}
__name(transformRoutingRuleToRegExp, "transformRoutingRuleToRegExp");

// .wrangler/tmp/pages-ctJRsu/dqi1vemzd3s.js
var define_ROUTES_default = {
  version: 1,
  include: [
    "/api/*",
    "/monde",
    "/monde/",
    "/monde/index.html",
    "/voyage",
    "/voyage/",
    "/voyage/index.html",
    "/ablutions",
    "/ablutions/",
    "/ablutions/index.html",
    "/ablutions/jeu3d",
    "/ablutions/jeu3d/",
    "/ablutions/jeu3d/index.html",
    "/priere",
    "/priere/",
    "/priere/index.html",
    "/priere/jeu3d",
    "/priere/jeu3d/",
    "/priere/jeu3d/index.html",
    "/calendrier",
    "/calendrier/",
    "/calendrier/index.html",
    "/aventures",
    "/aventures/",
    "/aventures/index.html",
    "/aventures/chasse-aux-mots",
    "/aventures/chasse-aux-mots/",
    "/aventures/chasse-aux-mots/index.html",
    "/aventures/mysteres-desert",
    "/aventures/mysteres-desert/",
    "/aventures/mysteres-desert/index.html",
    "/aventures/quiz-nour",
    "/aventures/quiz-nour/",
    "/aventures/quiz-nour/index.html",
    "/ecole-arabe",
    "/ecole-arabe/",
    "/ecole-arabe/index.html",
    "/ecole-arabe/lettres",
    "/ecole-arabe/lettres/",
    "/ecole-arabe/lettres/index.html",
    "/ecole-arabe/lecture",
    "/ecole-arabe/lecture/",
    "/ecole-arabe/lecture/index.html",
    "/ecole-arabe/chiffres",
    "/ecole-arabe/chiffres/",
    "/ecole-arabe/chiffres/index.html"
  ],
  exclude: []
};
var routes2 = define_ROUTES_default;
var pages_dev_pipeline_default = {
  fetch(request, env, context) {
    const { pathname } = new URL(request.url);
    for (const exclude of routes2.exclude) {
      if (isRoutingRuleMatch(pathname, exclude)) {
        return env.ASSETS.fetch(request);
      }
    }
    for (const include of routes2.include) {
      if (isRoutingRuleMatch(pathname, include)) {
        const workerAsHandler = middleware_loader_entry_default;
        if (workerAsHandler.fetch === void 0) {
          throw new TypeError("Entry point missing `fetch` handler");
        }
        return workerAsHandler.fetch(request, env, context);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../../tmp/claude-0/w/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../../tmp/claude-0/w/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-ZxUVjY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = pages_dev_pipeline_default;

// ../../../tmp/claude-0/w/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-ZxUVjY/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__2, "__Facade_ScheduledController__");
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=dqi1vemzd3s.js.map
