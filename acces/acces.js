// Calcul du niveau d'accès d'un compte. Aucune dépendance : le même code est testé avec Node
// et utilisé dans le navigateur. IMPORTANT : ce calcul sert à l'AFFICHAGE. La vérité côté serveur
// vient des règles Firestore (firestore.rules), qui décident qui peut écrire un statut d'accès.
import { REGLAGES_PAR_DEFAUT } from './reglages.js';

export const NIVEAUX = ['gratuit', 'essai', 'offert', 'payant', 'admin'];
const JOUR = 86400000;

// Convertit une date Firestore, un nombre ou une chaîne en millisecondes (null si absente).
export function enMs(d) {
  if (d == null) return null;
  if (typeof d === 'number') return d;
  if (typeof d.toMillis === 'function') return d.toMillis();
  if (typeof d.seconds === 'number') return d.seconds * 1000;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : t;
}

// profil : { admin?, suspendu?, essai?: {debut, fin}, offert?: {debut, fin|null (permanent), revoque?},
//            payant?: {formule: 'mensuel'|'annuel', fin, statut} }
// Retourne { niveau, premium, source, jusqua, suspendu }
export function niveauAcces(profil, maintenant = Date.now()) {
  const p = profil || {};
  if (p.suspendu) return { niveau: 'gratuit', premium: false, source: 'suspendu', jusqua: null, suspendu: true };
  if (p.admin === true) return { niveau: 'admin', premium: true, source: 'admin', jusqua: null, suspendu: false };

  const o = p.offert;
  if (o && !o.revoque) {
    const fin = enMs(o.fin);
    if (fin === null || fin > maintenant) return { niveau: 'offert', premium: true, source: 'offert', jusqua: fin, suspendu: false };
  }
  const a = p.payant;
  if (a && (a.statut === 'actif' || a.statut === 'resilie-en-cours')) {
    const fin = enMs(a.fin);
    if (fin !== null && fin > maintenant) return { niveau: 'payant', premium: true, source: 'payant:' + (a.formule || '?'), jusqua: fin, suspendu: false };
  }
  const e = p.essai;
  if (e) {
    const fin = enMs(e.fin);
    if (fin !== null && fin > maintenant) return { niveau: 'essai', premium: true, source: 'essai', jusqua: fin, suspendu: false };
  }
  return { niveau: 'gratuit', premium: false, source: 'gratuit', jusqua: null, suspendu: false };
}

// Peut-on ouvrir cette fonctionnalité ? connecte = un parent est connecté.
// Retourne { ok, raison, limite } : raison = 'libre' | 'gratuit' | 'premium' | 'deblocage' | 'compte-requis' | 'premium-requis' | 'bientot' | 'inconnue'
export function acces(fonctionnalite, profil, { reglages = REGLAGES_PAR_DEFAUT, connecte = !!profil, maintenant = Date.now() } = {}) {
  const f = reglages.fonctionnalites && reglages.fonctionnalites[fonctionnalite];
  if (!f) return { ok: false, raison: 'inconnue', limite: null };
  if (f.niveau === 'bientot') return { ok: false, raison: 'bientot', limite: null };

  const n = niveauAcces(profil, maintenant);
  if (n.premium) return { ok: true, raison: 'premium', limite: null };   // admin, offert, payant et essai : tout, sans limite

  if (f.niveau === 'libre') return { ok: true, raison: 'libre', limite: null };

  const deb = reglages.deblocagesTemporaires && reglages.deblocagesTemporaires[fonctionnalite];
  const finDeb = enMs(deb);
  if (finDeb !== null && finDeb > maintenant) return { ok: true, raison: 'deblocage', limite: null };

  if (f.niveau === 'gratuit') {
    if (!connecte) return { ok: false, raison: 'compte-requis', limite: f.limite ?? null };
    return { ok: true, raison: 'gratuit', limite: f.limite ?? null };
  }
  return { ok: false, raison: 'premium-requis', limite: null };
}

// Un essai de 7 jours : un seul par compte, sauf nouvel essai accordé par l'administrateur.
export function peutDemarrerEssai(profil, { reglages = REGLAGES_PAR_DEFAUT, maintenant = Date.now() } = {}) {
  if (!reglages.essai || !reglages.essai.actif) return { ok: false, raison: 'essais-desactives' };
  const p = profil || {};
  if (p.suspendu) return { ok: false, raison: 'suspendu' };
  if (niveauAcces(p, maintenant).premium) return { ok: false, raison: 'deja-premium' };
  if (p.essai && !p.essai.nouvelEssaiAutorise) return { ok: false, raison: 'essai-deja-utilise' };
  return { ok: true, raison: 'ok' };
}

export function nouvelEssai(profil, { reglages = REGLAGES_PAR_DEFAUT, maintenant = Date.now() } = {}) {
  const r = peutDemarrerEssai(profil, { reglages, maintenant });
  if (!r.ok) return { ok: false, raison: r.raison };
  return { ok: true, essai: { debut: maintenant, fin: maintenant + reglages.essai.jours * JOUR, jours: reglages.essai.jours } };
}

// Durées proposées pour un abonnement offert. null = accès Premium permanent.
export const DUREES_OFFERTES = { '1': 1, '3': 3, '6': 6, '12': 12, 'permanent': null };

function ajouterMois(ms, mois) { const d = new Date(ms); d.setUTCMonth(d.getUTCMonth() + mois); return d.getTime(); }

// Prépare un accès offert. Si un accès offert est encore valable, on prolonge à partir de sa fin.
export function accesOffert(profil, duree, { maintenant = Date.now() } = {}) {
  if (!(duree in DUREES_OFFERTES)) return { ok: false, raison: 'duree-invalide' };
  const mois = DUREES_OFFERTES[duree];
  if (mois === null) return { ok: true, offert: { debut: maintenant, fin: null, permanent: true } };
  const actuel = profil && profil.offert && !profil.offert.revoque ? enMs(profil.offert.fin) : null;
  const depart = actuel !== null && actuel > maintenant ? actuel : maintenant;
  return { ok: true, offert: { debut: (profil && profil.offert && actuel > maintenant) ? enMs(profil.offert.debut) : maintenant, fin: ajouterMois(depart, mois), permanent: false } };
}

// Prix à afficher. Le prix habituel barré n'apparaît que s'il a été validé ET que la promotion est active et en cours.
export function prixAffiches(reglages = REGLAGES_PAR_DEFAUT, maintenant = Date.now()) {
  const t = reglages.tarifs, pr = reglages.promotion;
  const debut = enMs(pr.debut), fin = enMs(pr.fin);
  const enCours = !!pr.active && debut !== null && fin !== null && debut <= maintenant && maintenant < fin + JOUR;
  const f = (k) => {
    const x = t[k];
    const prix = enCours ? x.promo : x.habituel;
    return { prix, barre: enCours && pr.prixHabituelValide ? x.habituel : null, promo: enCours };
  };
  const m = f('mensuel'), a = f('annuel');
  const parMois = Math.round((a.prix / 12) * 100) / 100;
  const economie = a.barre !== null ? Math.round((a.barre - a.prix) * 100) / 100 : null;
  return { enCours, debut: pr.debut, fin: pr.fin, mensuel: m, annuel: a, annuelParMois: parMois, economieAnnuelle: economie };
}

export function formaterEuros(x) {
  return (Math.round(x * 100) / 100).toFixed(2).replace('.', ',') + ' €';
}
