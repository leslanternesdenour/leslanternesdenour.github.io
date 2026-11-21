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
import { mascotte } from './mascottes.js?v=1';

const $ = id => document.getElementById(id);
const S = sauvegarde.get();
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

  let mod;
  try { mod = await import('./scene.js?v=7'); }
  catch (e) { return montrerErreur(e); }

  try {
    const p = new URLSearchParams(location.search);
    village = mod.creerVillage($('scene'), {
      reglages: R,
      heure: p.has('heure') ? parseFloat(p.get('heure')) : null,
      noms: S.age === 'grands',
      surTap,
      surImage: image,
      surAmbiance: majAmbiance
    });
    window.__village = village;
  } catch (e) { return montrerErreur(e); }

  $('chargement').classList.add('cache');
  document.querySelectorAll('#accueil [data-age]').forEach(b => b.classList.toggle('dernier', b.dataset.age === S.age));
  $('accueil').classList.remove('cache');

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

// ---------- accueil : qui joue ? (ce toucher débloque aussi le son) ----------
document.querySelectorAll('#accueil [data-age]').forEach(btn => btn.addEventListener('click', () => {
  sauvegarde.regler('age', btn.dataset.age);
  village && village.noms(btn.dataset.age === 'grands');
  $('accueil').classList.add('cache');
  $('hud').classList.remove('cache');
  $('bulle').classList.remove('cache');
  dansLeVillage = true;
  reveiller();
  demarrerAmbiance();
  if (sons().musiqueActive) jouerMusique().then(majPanneauSon);
  chargerVoix('voix/').then(() => dire('NOUR-VOIX-ACC-002', ok => { if (ok && dansLeVillage && !choisi) dire('NOUR-VOIX-VIL-001'); }));
  goutte();
}));

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
  if (m) $('pan-icone').innerHTML = m; else $('pan-icone').textContent = b.icone;
  $('pan-nom').textContent = b.nom;
  $('pan-texte').textContent = b.texte;
  const n = sauvegarde.jeu(b.id).etoiles || 0;
  $('pan-etoiles').textContent = n ? '⭐'.repeat(Math.min(n, 5)) : '';
  const ouvert = b.etat === 'ouvert';
  $('pan-entrer').classList.toggle('cache', !ouvert);
  $('pan-bientot').classList.toggle('cache', ouvert);
  $('pan-bientot').lastElementChild.textContent = b.etat === 'reserve' ? TEXTE_RESERVE : 'Bientôt ! Cette maison se prépare.';
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
  $('btn-son').textContent = on && s.musique > 0 ? '🔊' : '🔇';
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
  sauvegarde.regler('age', b.dataset.age); village && village.noms(b.dataset.age === 'grands'); majBascules(); goutte();
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
