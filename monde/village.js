// Démarrage du Monde des Lanternes : écrans, réglages, panneaux, liaison avec la scène 3D.
import { sauvegarde } from './socle/sauvegarde.js';
import { demarrerAmbiance, goutte, majAmbiance, sonActif } from './socle/ambiance.js';
import { chargerVoix, voixActive } from './socle/voix.js';
import { qualiteAuto, reglages, surveillerFluidite } from './socle/qualite.js';

const $ = id => document.getElementById(id);
const S = sauvegarde.get();
const qualite = S.qualite || qualiteAuto();
const R = reglages(qualite);
let village = null;
let choisi = null;

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

async function init() {
  majCompteurs();
  sauvegarde.abonner(majCompteurs);
  if (!webglOK()) return montrerErreur();
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]); } catch (e) {}

  let mod;
  try { mod = await import('./scene.js?v=1'); }
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
}

// ---------- accueil : qui joue ? (ce toucher débloque aussi le son) ----------
document.querySelectorAll('#accueil [data-age]').forEach(btn => btn.addEventListener('click', () => {
  sauvegarde.regler('age', btn.dataset.age);
  village && village.noms(btn.dataset.age === 'grands');
  $('accueil').classList.add('cache');
  $('hud').classList.remove('cache');
  $('bulle').classList.remove('cache');
  demarrerAmbiance();
  sonActif(sauvegarde.get().son);
  voixActive(sauvegarde.get().son);
  chargerVoix('voix/');
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
  $('pan-icone').textContent = b.icone;
  $('pan-nom').textContent = b.nom;
  $('pan-texte').textContent = b.texte;
  const n = sauvegarde.jeu(b.id).etoiles || 0;
  $('pan-etoiles').textContent = n ? '⭐'.repeat(Math.min(n, 5)) : '';
  const ouvert = b.etat === 'ouvert';
  $('pan-entrer').classList.toggle('cache', !ouvert);
  $('pan-bientot').classList.toggle('cache', ouvert);
  if (ouvert) $('pan-entrer').href = b.lien;
  $('panneau').classList.remove('cache');
  $('bulle').classList.add('cache');
}

function fermerPanneau() {
  if (!choisi) return;
  choisi = null;
  village.deselectionner();
  $('panneau').classList.add('cache');
  $('bulle').classList.remove('cache');
}

$('pan-fermer').addEventListener('click', () => { goutte(0.8); fermerPanneau(); });
$('pan-entrer').addEventListener('click', e => {
  if (!choisi) return;
  e.preventDefault();
  const lien = choisi.lien;
  sauvegarde.gagner(choisi.id, 'visite', 1);
  goutte(1.4);
  setTimeout(() => { location.href = lien; }, 180);
});
addEventListener('keydown', e => { if (e.key === 'Escape') { fermerPanneau(); fermerReglages(); } });

// ---------- réglages (pour les parents) ----------
function majBascules() {
  const s = sauvegarde.get();
  document.querySelectorAll('#reglages [data-son]').forEach(b => b.classList.toggle('actif', (b.dataset.son === '1') === !!s.son));
  document.querySelectorAll('#reglages [data-age]').forEach(b => b.classList.toggle('actif', b.dataset.age === s.age));
  document.querySelectorAll('#reglages [data-qualite]').forEach(b => b.classList.toggle('actif', b.dataset.qualite === qualite));
}
function fermerReglages() { $('reglages').classList.add('cache'); }
$('btn-reglages').addEventListener('click', () => { goutte(); majBascules(); $('reglages').classList.remove('cache'); });
$('reg-fermer').addEventListener('click', fermerReglages);
$('reglages').addEventListener('click', e => { if (e.target.id === 'reglages') fermerReglages(); });
document.querySelectorAll('#reglages [data-son]').forEach(b => b.addEventListener('click', () => {
  const oui = b.dataset.son === '1';
  sauvegarde.regler('son', oui); sonActif(oui); voixActive(oui); majBascules(); goutte();
}));
document.querySelectorAll('#reglages [data-age]').forEach(b => b.addEventListener('click', () => {
  sauvegarde.regler('age', b.dataset.age); village && village.noms(b.dataset.age === 'grands'); majBascules(); goutte();
}));
document.querySelectorAll('#reglages [data-qualite]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.qualite === qualite) return;
  sauvegarde.regler('qualite', b.dataset.qualite);
  location.reload();
}));

init();
