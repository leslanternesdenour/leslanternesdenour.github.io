// Démarrage du Monde des Lanternes : écrans, réglages, sons, panneaux, jeux, liaison avec la scène 3D.
import { sauvegarde } from './socle/sauvegarde.js?v=3';
import { calculerRecompenses, lireLocal } from './socle/recompenses.js?v=2';
import { reveiller, reglerVolume, retirer } from './socle/audio.js?v=1';
import { prechargerMusique, jouerMusique, arreterMusique, musiqueIndisponible } from './socle/musique.js?v=1';
import { demarrerAmbiance, goutte, majAmbiance } from './socle/ambiance.js?v=2';
import { chargerVoix, dire, arreterVoix } from './socle/voix.js?v=3';
// voix enregistrées du village (identifiants du catalogue des voix NOUR-VOIX-…)
const VOIX_MAISON = { ablutions: 'VIL-003', priere: 'VIL-004', ramadan: 'VIL-005', sons: 'VIL-006', jardin: 'VIL-007', mots: 'VIL-008', cinq: 'VIL-009', etoiles: 'VIL-010', desert: 'VIL-011' };
import { qualiteAuto, reglages, surveillerFluidite } from './socle/qualite.js?v=2';
import { BATIMENTS } from './batiments.js?v=3';
import { chargerMaisons, TEXTE_RESERVE } from './maisons-premium.js?v=1';
import { mascotte } from './mascottes.js?v=2';
import { PEAUX, NOMS_PEAUX, indicePeau, visageSVG } from './socle/peaux.js?v=2';

const ICO_SON = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#3b4a7a" stroke="#1f2a52" stroke-width="1.600" stroke-linejoin="round"/><path d="M21 11c2.500 2.600 2.500 7.400 0 10M24.500 8c4.500 4.500 4.500 11.500 0 16" fill="none" stroke="#3b4a7a" stroke-width="2.400" stroke-linecap="round"/></svg>', ICO_SON_OFF = '<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><path d="M5 12h5l7-6v20l-7-6H5z" fill="#8a8fa8" stroke="#555a75" stroke-width="1.600" stroke-linejoin="round"/><path d="M22 12l7 8M29 12l-7 8" stroke="#d6455a" stroke-width="2.800" stroke-linecap="round"/></svg>';

const $ = id => document.getElementById(id);
const S = sauvegarde.get();
// Portail d'entrée (socle/portail.js) et profil enfant actif (Espace famille) : voir socle/portail-logique.js
const PL = window.PortailLogique;
const profilEnfant = () => { try { return JSON.parse(localStorage.getItem('ldn_profil_actif') || 'null'); } catch (e) { return null; } };
const portailJoue = !!(window.__portail && window.__portail.actif);
// Le travail lourd (création de la scène 3D) attend que le portail soit prêt : l'animation du portail et la voix restent fluides,
// même sur un vieux téléphone ; le village se prépare pendant que l'enfant lit le bouton « Entrer dans le Monde de Nour ».
const portailPret = () => new Promise(r => {
  const pret = () => !(window.__portail && window.__portail.actif) || window.__portail.etat === 'pret';
  if (pret()) return r();
  const f = () => { if (pret()) { removeEventListener('ldn:portail-pret', f); removeEventListener('ldn:portail-fin', f); r(); } };
  addEventListener('ldn:portail-pret', f); addEventListener('ldn:portail-fin', f);
});
const apresPortail = f => (window.__portail && window.__portail.actif) ? addEventListener('ldn:portail-fin', f, { once: true }) : f();
// Le profil enfant fournit l'âge et le personnage SEULEMENT s'ils ne sont pas déjà enregistrés : aucune donnée n'est jamais écrasée.
function appliquerProfilEnfant(profil) {
  if (!PL || !profil) return;
  const r = PL.reglagesDepuisProfil(profil, sauvegarde.get());
  if (r.age) sauvegarde.regler('age', r.age);
  if (r.genre) sauvegarde.regler('personnage', { ...(sauvegarde.get().personnage || { tenue: 'ecru', peau: 1 }), genre: r.genre, choisi: Date.now() });
}
const qualite = S.qualite || qualiteAuto();
const R = reglages(qualite);
let village = null;
let choisi = null;
let dansLeVillage = false;

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

function montrerErreur(e) {
  if (e) console.error(e);
  $('chargement').classList.add('cache');
  $('accueil').classList.add('cache');
  $('erreur').classList.remove('cache');
}

function majCompteurs() {
  const s = sauvegarde.get();
  $('nb-etoiles').textContent = s.etoiles;
  $('nb-lanternes').textContent = s.lanternes;
}

// Si le mode automatique rame, on retient le mode léger pour la prochaine fois (sans recharger en pleine partie)
const image = (!S.qualite && qualite === 'beau')
  ? surveillerFluidite(() => sauvegarde.regler('qualite', 'leger'))
  : null;

// ---------- sons : réglages mémorisés, appliqués dès le départ ----------
const sons = () => sauvegarde.get().sons;
function appliquerVolumes() {
  const s = sons();
  reglerVolume('musique', s.musique);
  reglerVolume('voix', s.voix);
  reglerVolume('effets', s.effets);
}
appliquerVolumes();

// Les étoiles et lanternes du village viennent des jeux eux-mêmes (relues à chaque retour au village)
function synchroRecompenses() {
  try { sauvegarde.appliquerRecompenses(calculerRecompenses(lireLocal)); } catch (e) { /* stockage illisible : on garde l'affichage actuel */ }
  majCompteurs();
}
addEventListener('pageshow', synchroRecompenses);
addEventListener('storage', e => { if (!e.key || /^(ablutions|priere|lanternes2|monde_voyage|maison_mots)$/.test(e.key)) synchroRecompenses(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) synchroRecompenses(); });

async function init() {
  synchroRecompenses();
  sauvegarde.abonner(majCompteurs);
  majPanneauSon();
  if (!webglOK()) return montrerErreur();
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch (e) {}

  const profil = profilEnfant();
  appliquerProfilEnfant(profil);
  let mod;
  try { mod = await import('./scene.js?v=9'); }
  catch (e) { return montrerErreur(e); }
  await portailPret();

  try {
    const p = new URLSearchParams(location.search);
    village = window.__village = mod.creerVillage($('scene'), {
      reglages: R,
      heure: p.has('heure') ? parseFloat(p.get('heure')) : null,
      noms: true,                       // les noms restent sous les icônes pour tous les âges (plaques lisibles)
      surTap,
      surImage: image,
      surAmbiance: majAmbiance
    });
    window.__village = village;
  } catch (e) { return montrerErreur(e); }

  $('chargement').classList.add('cache');
  document.querySelectorAll('#accueil [data-age]').forEach(b => b.classList.toggle('dernier', b.dataset.age === S.age));
  // Un enfant dont le profil est connu entre directement dans son village (jamais de « Qui joue ? » à chaque connexion).
  const direct = !!(PL && PL.entreeDirecte(profil, sauvegarde.get()));
  apresPortail(() => { if (direct) entrerDansLeVillage(sauvegarde.get().age); else $('accueil').classList.remove('cache'); });

  // Préchargement discret de la musique, une fois le village affiché (seulement si elle est active)
  const plusTard = window.requestIdleCallback || (f => setTimeout(f, 1200));
  plusTard(() => { if (sons().musiqueActive) prechargerMusique().then(majPanneauSon); });
}

// Tout toucher réveille le son si le navigateur l'avait mis en veille
addEventListener('pointerdown', () => { if (dansLeVillage) reveiller(); }, { capture: true, passive: true });

// ---------- accueil : le personnage (fille ou garçon), gardé dans le profil et jamais changé tout seul ----------
function majChoixPerso() { const g = (S.personnage || {}).genre; document.querySelectorAll('#accueil [data-genre]').forEach(b => b.setAttribute('aria-pressed', b.dataset.genre === g)); }
document.querySelectorAll('#accueil [data-genre]').forEach(btn => btn.addEventListener('click', () => {
  const p = S.personnage || { tenue: 'ecru', peau: 1 };
  sauvegarde.regler('personnage', { ...p, genre: btn.dataset.genre, choisi: Date.now() });
  majChoixPerso();

  chargerVoix('voix/').then(() => dire(btn.dataset.genre === 'fille' ? 'NOUR-VOIX-ACC-004' : 'NOUR-VOIX-ACC-005'));
}));
majChoixPerso();

// ---------- accueil : visages d'enfants dans la couleur de peau choisie (jamais d'émoji jaune) ----------
function majPeau() {
  const i = indicePeau((S.personnage || {}).peau);
  $('accueil').style.setProperty('--peau', PEAUX[i]);
  document.querySelectorAll('#choix-peau [data-peau]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.peau === i));
}
document.querySelectorAll('#accueil .visage').forEach(e => { e.innerHTML = visageSVG(e.dataset.visage); });
$('choix-peau').innerHTML = PEAUX.map((c, i) => `<button type="button" data-peau="${i}" aria-pressed="false" style="background:${c}" aria-label="${NOMS_PEAUX[i]}"></button>`).join('');
document.querySelectorAll('#choix-peau [data-peau]').forEach(b => b.addEventListener('click', () => {
  sauvegarde.regler('personnage', { ...(S.personnage || { tenue: 'ecru' }), peau: +b.dataset.peau });   // la teinte seule : on ne marque pas le personnage comme « choisi »
  majPeau();
}));
majPeau();

// ---------- accueil : qui joue ? (ce toucher débloque aussi le son) ----------
function entrerDansLeVillage(age) {
  if (dansLeVillage) return;
  sauvegarde.regler('age', age);
  village && village.noms(true);
  $('accueil').classList.add('cache');
  $('hud').classList.remove('cache');
  $('bulle').classList.remove('cache');
  dansLeVillage = true;
  reveiller();
  demarrerAmbiance();
  if (sons().musiqueActive) jouerMusique().then(majPanneauSon);
  // Après le portail, la maîtresse a déjà souhaité la bienvenue : on ne répète pas l'accueil, on explique seulement le village.
  chargerVoix('voix/').then(() => portailJoue ? dire('NOUR-VOIX-VIL-001') : dire('NOUR-VOIX-ACC-002', ok => { if (ok && dansLeVillage && !choisi) dire('NOUR-VOIX-VIL-001'); }));
  goutte();
}
document.querySelectorAll('#accueil [data-age]').forEach(btn => btn.addEventListener('click', () => entrerDansLeVillage(btn.dataset.age)));

// ---------- panneau d'un bâtiment ----------
function surTap(b) {
  goutte(b ? 1.2 : 0.8);
  if (!b) return fermerPanneau();
  ouvrirPanneau(b);
}

function ouvrirPanneau(b) {
  choisi = b;
  village.selectionner(b.id);
  fermerPanneauSon();
  // Chaque maison ouvre son univers : couleurs, décor et mascotte de l'activité
  const pan = $('panneau');
  pan.dataset.univers = b.univers || 'jeux';
  pan.querySelectorAll('.u-deco').forEach(d => d.remove());
  if (window.decorerUnivers) window.decorerUnivers(pan, pan.dataset.univers);
  const m = mascotte(b.univers);
  $('pan-icone').classList.toggle('avec-mascotte', !!m);
  if (m) $('pan-icone').innerHTML = m; else { const v = vignettes.get(b.id) || (village && village.vignette ? village.vignette(b.id) : null); if (v) { vignettes.set(b.id, v); $('pan-icone').innerHTML = `<img alt="" src="${v}">`; } else $('pan-icone').textContent = b.icone; }
  $('pan-nom').textContent = b.nom;
  $('pan-texte').textContent = b.texte;
  const n = sauvegarde.jeu(b.id).etoiles || 0;
  $('pan-etoiles').textContent = n ? '⭐'.repeat(Math.min(n, 5)) : '';
  const ouvert = b.etat === 'ouvert';
  $('pan-entrer').classList.toggle('cache', !ouvert);
  $('pan-bientot').classList.toggle('cache', ouvert);
  $('pan-bientot').lastElementChild.textContent = b.etat === 'reserve' ? TEXTE_RESERVE : 'Bientôt ! Cette maison se prépare.';
  $('pan-compte').classList.toggle('cache', b.etat !== 'reserve');   // maison Premium : les parents sont orientés vers la connexion / les formules
  $('pan-entrer').lastElementChild.textContent = b.apercu ? 'Entrer (aperçu Créateur)' : 'Entrer';
  if (ouvert) $('pan-entrer').href = b.lien;
  $('panneau').classList.remove('cache');
  $('bulle').classList.add('cache');
  const v = VOIX_MAISON[b.id];
  if (v) dire('NOUR-VOIX-' + v, ok => { if (ok && !ouvert && choisi === b) dire('NOUR-VOIX-VIL-002'); });
}

function fermerPanneau() {
  if (!choisi) return;
  choisi = null;
  arreterVoix();
  village.deselectionner();
  $('panneau').classList.add('cache');
  $('bulle').classList.remove('cache');
}

$('pan-fermer').addEventListener('click', () => { goutte(0.8); fermerPanneau(); });
$('pan-entrer').addEventListener('click', e => {
  e.preventDefault(); // l'activité s'ouvre toujours dans le village, jamais en quittant la page
  if (!choisi) return;
  sauvegarde.gagner(choisi.id, 'visite', 1);
  goutte(1.4);
  if (choisi.pleinePage) { arreterMusique(0.6); setTimeout(() => { location.href = choisi.lien; }, 250); return; } // le Grand Voyage : un monde 3D à part entière
  ouvrirJeu(choisi);
});

// ---------- jeux ouverts DANS le village : la page reste chargée, la musique continue ----------
const cheminsJeux = () => BATIMENTS.filter(b => b.lien).map(b => new URL(b.lien, location.href).pathname);
// maisons du stockage privé : leur état (ouverte, réservée, bientôt) vient du serveur, sans bloquer l'ouverture du village
chargerMaisons(BATIMENTS).catch(() => null);
let cadre = null;
const vignettes = new Map();   // vignettes 2D des icônes 3D (panneau d'information)
const mediasJeu = new Set();

function ouvrirJeu(b) {
  fermerJeu(false);
  cadre = document.createElement('iframe'); // un cadre neuf à chaque fois : pas d'historique parasite
  cadre.src = b.lien;
  cadre.title = b.nom;
  cadre.allow = 'autoplay';
  cadre.addEventListener('load', surChargementJeu);
  $('jeu').prepend(cadre);
  $('jeu').dataset.univers = b.univers || 'jeux'; // le fond de l'univers apparaît pendant le chargement
  $('jeu').classList.remove('cache', 'sortie');
  ['hud', 'bulle', 'panneau'].forEach(id => $(id).classList.add('cache'));
  fermerPanneauSon();
  village.pause(true);
  arreterMusique(1); // silence dans les jeux : on entend bien la prière, les explications et les questions
  retirer('effets', 'jeu', 0);     // la nature du village se tait dans les jeux
  try { history.pushState({ monde: 'jeu' }, ''); } catch (e) {}
}

function surChargementJeu() {
  let w, chemin;
  try { w = cadre.contentWindow; chemin = w.location.pathname; } catch (e) { return fermerJeu(); }
  // Le jeu renvoie vers l'accueil du site (bouton maison) : on revient au village
  if (!cheminsJeux().some(c => chemin.startsWith(c))) return fermerJeu();
  brancherJeu(w);
}

// Les voix des jeux : la musique s'efface pendant qu'elles parlent, et leur volume suit le réglage « voix »
function brancherJeu(w) {
  try {
    if (w.__mondeBranche) return;
    w.__mondeBranche = true;
    const P = w.HTMLMediaElement.prototype, jouer = P.play;
    P.play = function () {
      try { this.volume = sons().voix; } catch (e) {}
      mediasJeu.add(this);
      retirer('musique', 'jeu-voix', 0.3);
      const fini = () => { mediasJeu.delete(this); if (!mediasJeu.size) retirer('musique', 'jeu-voix', 1); };
      this.addEventListener('ended', fini, { once: true });
      this.addEventListener('pause', fini, { once: true });
      return jouer.apply(this, arguments);
    };
    const ss = w.speechSynthesis;
    if (ss && ss.speak) {
      const parler = ss.speak.bind(ss);
      ss.speak = u => {
        try { u.volume = sons().voix; } catch (e) {}
        retirer('musique', 'jeu-tts', 0.3);
        const fin = () => retirer('musique', 'jeu-tts', 1);
        u.addEventListener('end', fin); u.addEventListener('error', fin);
        parler(u);
      };
    }
  } catch (e) { /* jeu inaccessible : la musique reste simplement plus basse */ }
}

function fermerJeu(rendreLeVillage = true) {
  if (!cadre) return;
  const ancien = cadre;
  cadre = null;
  mediasJeu.clear();
  ['jeu', 'jeu-voix', 'jeu-tts'].forEach(k => retirer('musique', k, 1));
  retirer('effets', 'jeu', 1);
  if (!rendreLeVillage) { try { ancien.remove(); } catch (e) {} $('jeu').classList.add('cache'); return; }
  // sortie douce : le jeu s'efface et laisse réapparaître le village
  $('jeu').classList.add('sortie');
  setTimeout(() => { try { ancien.remove(); } catch (e) {} if (!cadre) $('jeu').classList.add('cache'); $('jeu').classList.remove('sortie'); }, 280);
  $('hud').classList.remove('cache');
  $('bulle').classList.remove('cache');
  try { dispatchEvent(new Event('ldn:fin-activite')); } catch (e) {}   // retour au village : l'Espace famille enregistre (si synchronisation)
  choisi = null;
  village.deselectionner();
  village.pause(false);
  synchroRecompenses(); // les étoiles gagnées dans le jeu apparaissent tout de suite
  if (sons().musiqueActive) jouerMusique().then(majPanneauSon); // reprend là où elle s'était arrêtée
  goutte(0.9);
}
$('jeu-retour').addEventListener('click', () => fermerJeu());
addEventListener('popstate', () => { if (cadre) fermerJeu(); });

// ---------- panneau des sons ----------
const curseurs = { musique: $('vol-musique'), voix: $('vol-voix'), effets: $('vol-effets') };

function majPanneauSon() {
  const s = sons();
  for (const k in curseurs) {
    const v = Math.round(s[k] * 100);
    curseurs[k].value = v;
    curseurs[k].style.setProperty('--pct', v + '%');
    $('val-' + k).textContent = v + ' %';
  }
  const on = !!s.musiqueActive;
  $('musique-bascule').setAttribute('aria-pressed', String(on));
  $('btn-son').innerHTML = on && s.musique > 0 ? ICO_SON : ICO_SON_OFF;
  $('btn-son').setAttribute('aria-label', on ? 'Sons et musique (musique activée)' : 'Sons et musique (musique coupée)');
  $('musique-absente').classList.toggle('cache', !musiqueIndisponible());
}

function ouvrirPanneauSon() { majPanneauSon(); $('panneau-son').classList.remove('cache'); }
function fermerPanneauSon() { $('panneau-son').classList.add('cache'); }

$('btn-son').addEventListener('click', () => {
  goutte();
  $('panneau-son').classList.contains('cache') ? ouvrirPanneauSon() : fermerPanneauSon();
});
$('son-fermer').addEventListener('click', fermerPanneauSon);

for (const k in curseurs) {
  curseurs[k].addEventListener('input', () => {
    const v = curseurs[k].value / 100;
    reglerVolume(k, v);
    curseurs[k].style.setProperty('--pct', curseurs[k].value + '%');
    $('val-' + k).textContent = curseurs[k].value + ' %';
    if (k === 'voix') mediasJeu.forEach(m => { try { m.volume = v; } catch (e) {} });
  });
  // mémorisé quand le doigt lâche le curseur
  curseurs[k].addEventListener('change', () => {
    sauvegarde.regler('sons', Object.assign({}, sons(), { [k]: curseurs[k].value / 100 }));
    majPanneauSon();
    if (k === 'effets') goutte();
  });
}

$('musique-bascule').addEventListener('click', () => {
  const on = !sons().musiqueActive;
  sauvegarde.regler('sons', Object.assign({}, sons(), { musiqueActive: on }));
  reveiller();
  if (on) jouerMusique().then(majPanneauSon); else arreterMusique();
  majPanneauSon();
});

// ---------- réglages (pour les parents) ----------
function majBascules() {
  const s = sauvegarde.get();
  document.querySelectorAll('#reglages [data-age]').forEach(b => b.classList.toggle('actif', b.dataset.age === s.age));
  document.querySelectorAll('#reglages [data-qualite]').forEach(b => b.classList.toggle('actif', b.dataset.qualite === qualite));
}
function fermerReglages() { $('reglages').classList.add('cache'); }
$('btn-reglages').addEventListener('click', () => { goutte(); fermerPanneauSon(); majBascules(); $('reglages').classList.remove('cache'); });
$('reg-fermer').addEventListener('click', fermerReglages);
$('reglages').addEventListener('click', e => { if (e.target.id === 'reglages') fermerReglages(); });
$('reg-sons').addEventListener('click', () => { fermerReglages(); ouvrirPanneauSon(); });
document.querySelectorAll('#reglages [data-age]').forEach(b => b.addEventListener('click', () => {
  sauvegarde.regler('age', b.dataset.age); village && village.noms(true); majBascules(); goutte();
}));
document.querySelectorAll('#reglages [data-qualite]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.qualite === qualite) return;
  sauvegarde.regler('qualite', b.dataset.qualite);
  location.reload();
}));

addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (cadre) return fermerJeu();
  fermerPanneauSon(); fermerPanneau(); fermerReglages();
});

init();
