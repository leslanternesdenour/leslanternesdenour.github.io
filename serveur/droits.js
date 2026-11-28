// LA fonction unique qui décide des droits d'un compte (exécutée UNIQUEMENT côté serveur : Cloudflare Worker).
// Le navigateur n'a qu'une copie pour l'affichage ; il ne décide jamais.
// Aucune dépendance : fonctionne dans un Worker Cloudflare et dans Node (tests).
//
// Quatre statuts : creator > invite > abonne > gratuit.
//  - creator : rôle « creator » dans le jeton Firebase ET uid === CREATOR_UID (secret serveur). Jamais lié à Stripe.
//  - invite  : un accès offert actif (non révoqué, non expiré).
//  - abonne  : un abonnement Stripe actif (active / trialing) et non échu.
//  - gratuit : tout le reste.
// Si un compte a à la fois un accès offert et un abonnement payé, il reçoit le niveau le plus élevé des deux ;
// les garde-fous ci-dessous empêchent que cela arrive (double facturation).

export const NIVEAUX = { gratuit: 0, premium: 1, famille: 2, createur: 3 };
const PROFILS = { gratuit: 4, premium: 4, famille: 4, createur: Infinity };   // organisation du 24/11/2026 : 4 profils pour tout compte parent
const FORMULES = { premium_mensuel: 'premium', premium_annuel: 'premium', famille_annuel: 'famille' };

export function enMs(d) {
  if (d == null) return null;
  if (typeof d === 'number') return d;
  if (typeof d.toMillis === 'function') return d.toMillis();
  if (typeof d.seconds === 'number') return d.seconds * 1000;
  const t = Date.parse(d); return Number.isNaN(t) ? null : t;
}

// Lecture STRICTE d'une date de droit (correctif du 28/11/2026). Quatre issues, jamais confondues :
//   undefined = champ absent ; null = « aucune date » écrit EXPLICITEMENT (seul cas qui signifie « permanent » pour une fin) ;
//   nombre fini = instant en millisecondes ; NaN = date ILLISIBLE (texte quelconque, booléen, objet inconnu, infini…) → le droit est refusé.
export function dateStricte(d) {
  if (d === undefined) return undefined;
  if (d === null) return null;
  let t = NaN;
  try {
    if (typeof d === 'number') t = d;
    else if (d instanceof Date) t = d.getTime();
    else if (typeof d === 'string') t = d.trim() === '' ? NaN : Date.parse(d);
    else if (typeof d === 'object' && typeof d.toMillis === 'function') t = d.toMillis();
    else if (typeof d === 'object' && typeof d.seconds === 'number') t = d.seconds * 1000;
  } catch (e) { t = NaN; }
  return Number.isFinite(t) ? t : NaN;
}

export function estCreateur(uid, claims, env) {
  const attendu = env && typeof env.CREATOR_UID === 'string' ? env.CREATOR_UID.trim() : '';
  return attendu.length > 0 && uid === attendu && !!claims && claims.role === 'creator';
}

export function accesOffertActif(acces, maintenant = Date.now()) {
  if (!acces || acces.revoqueLe) return false;
  const debut = dateStricte(acces.debut), fin = dateStricte(acces.fin);
  if (Number.isNaN(debut) || Number.isNaN(fin)) return false;     // date illisible : JAMAIS d'accès (fail-closed)
  if (fin === undefined) return false;                            // champ « fin » absent : pas un accès permanent explicite
  if (typeof debut === 'number' && debut > maintenant) return false;
  return fin === null || fin > maintenant;                        // fin === null écrit explicitement = permanent
}

export function abonnementActif(ab, maintenant = Date.now()) {
  if (!ab || !['active', 'trialing'].includes(ab.statut)) return false;
  const fin = dateStricte(ab.finPeriode);
  return typeof fin === 'number' && fin > maintenant && !!FORMULES[ab.formule];
}

// sources : { accesOfferts: [...], abonnement: {...} } lues dans Firestore par le serveur
export function calculerDroits({ uid, claims, env, sources = {}, maintenant = Date.now() }) {
  if (estCreateur(uid, claims, env))
    return { statut: 'creator', niveau: 'createur', profilsMax: Infinity, synchro: true, apercu: true, admin: true, payant: false, offert: false, expire: null };

  const offerts = (sources.accesOfferts || []).filter(a => accesOffertActif(a, maintenant) && NIVEAUX[a.niveau] >= 1 && a.niveau !== 'createur');
  const meilleurOffert = offerts.sort((a, b) => NIVEAUX[b.niveau] - NIVEAUX[a.niveau] || ((enMs(b.fin) ?? Infinity) - (enMs(a.fin) ?? Infinity)))[0] || null;
  const ab = abonnementActif(sources.abonnement, maintenant) ? sources.abonnement : null;
  const nivOffert = meilleurOffert ? meilleurOffert.niveau : 'gratuit';
  const nivPaye = ab ? FORMULES[ab.formule] : 'gratuit';
  const niveau = NIVEAUX[nivOffert] >= NIVEAUX[nivPaye] ? nivOffert : nivPaye;
  const statut = niveau === 'gratuit' ? 'gratuit' : (meilleurOffert && NIVEAUX[nivOffert] >= NIVEAUX[nivPaye] ? 'invite' : 'abonne');
  const expire = statut === 'invite' ? enMs(meilleurOffert.fin) : statut === 'abonne' ? enMs(ab.finPeriode) : null;
  return { statut, niveau, profilsMax: PROFILS[niveau], synchro: true, apercu: false, admin: false,
    payant: !!ab, offert: !!meilleurOffert, expire };
}

// Niveau requis d'un contenu : 'libre' (sans compte) | 'gratuit' | 'premium' | 'famille' | 'apercu' (en préparation : Créateur seul)
export function peutAcceder(niveauRequis, droits) {
  if (niveauRequis === 'libre') return true;
  if (!droits) return false;
  if (niveauRequis === 'apercu') return droits.apercu === true;
  if (!(niveauRequis in NIVEAUX)) return false;                   // inconnu = refusé
  return NIVEAUX[droits.niveau] >= NIVEAUX[niveauRequis];
}

// Garde-fou : activation d'une invitation (14 jours, réservée à une adresse, usage unique, pas de double facturation)
export function verifierActivationInvitation({ invitation, compte, abonnement, maintenant = Date.now() }) {
  if (!invitation) return { ok: false, raison: 'inconnue' };
  if (invitation.utiliseeLe) return { ok: false, raison: 'deja-utilisee' };
  if (invitation.annuleeLe) return { ok: false, raison: 'annulee' };
  if ((enMs(invitation.expireLe) ?? 0) <= maintenant) return { ok: false, raison: 'expiree' };
  if (!compte || !compte.emailVerifie) return { ok: false, raison: 'email-non-verifie' };
  if (normaliserEmail(compte.email) !== normaliserEmail(invitation.email)) return { ok: false, raison: 'autre-adresse' };
  if (abonnementActif(abonnement, maintenant)) return { ok: false, raison: 'abonnement-actif' };   // éviter un double prélèvement
  return { ok: true };
}

// Garde-fou inverse : ne pas laisser payer quelqu'un qui a déjà accès gratuitement à ce niveau
export function verifierSouscription({ droits, formule }) {
  if (!FORMULES[formule]) return { ok: false, raison: 'formule-inconnue' };
  if (droits && droits.statut === 'creator') return { ok: false, raison: 'compte-createur' };
  if (droits && droits.offert && NIVEAUX[droits.niveau] >= NIVEAUX[FORMULES[formule]]) return { ok: false, raison: 'acces-offert-actif' };
  if (droits && droits.payant) return { ok: false, raison: 'deja-abonne' };   // changement de formule : portail Stripe
  return { ok: true };
}

// À la baisse de formule : on GÈLE les profils en trop (lecture seule), on n'en supprime jamais.
// enfants : [{ id, creeLe }] ; garder : id choisi par le parent (sinon le plus ancien).
export function profilsAGeler(enfants, profilsMax, garder = null) {
  if (!Array.isArray(enfants) || profilsMax === Infinity || enfants.length <= profilsMax) return [];
  const tries = [...enfants].sort((a, b) => ((enMs(a.creeLe) ?? 0) - (enMs(b.creeLe) ?? 0)) || String(a.id).localeCompare(String(b.id)));
  const actifs = [];
  if (garder && tries.some(e => e.id === garder)) actifs.push(garder);
  for (const e of tries) { if (actifs.length >= profilsMax) break; if (!actifs.includes(e.id)) actifs.push(e.id); }
  return tries.map(e => e.id).filter(id => !actifs.includes(id));
}

export function normaliserEmail(e) { return String(e || '').trim().toLowerCase(); }

// Codes d'invitation : 256 bits aléatoires ; seule l'EMPREINTE est enregistrée en base.
export function creerCodeInvitation() {
  const o = new Uint8Array(32); crypto.getRandomValues(o);
  return 'LDN_' + btoa(String.fromCharCode(...o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export async function empreinteCode(code) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(code)));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
