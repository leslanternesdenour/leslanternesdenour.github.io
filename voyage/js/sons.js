// Les sons du voyage, fabriqués dans le navigateur (aucun fichier sauf la musique) :
// vent, eau, oiseaux le jour, grillons la nuit, feu de camp, pas de l'enfant et du chameau.
// Ils passent par la table de mixage du village (pistes « effets » et « musique »).
import { contexte, sortie, reveiller, reglerVolume } from '../../monde/socle/audio.js?v=1';

let ctx = null, bruitBlanc = null;
let vent = null, eau = null, feu = null;
let musique = { source: null, gain: null, piste: null, voulue: false };

function tamponBruit(c) {
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function boucleBruit(filtre, freq, q) {
  const s = ctx.createBufferSource(); s.buffer = bruitBlanc; s.loop = true;
  const f = ctx.createBiquadFilter(); f.type = filtre; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = 0;
  s.connect(f).connect(g).connect(sortie('effets')); s.start();
  return { s, f, g };
}

export function demarrerSons() {
  if (ctx) { reveiller(); return; }
  ctx = contexte(); if (!ctx) return;
  reveiller();
  bruitBlanc = tamponBruit(ctx);
  vent = boucleBruit('bandpass', 420, 0.7);
  eau = boucleBruit('lowpass', 900, 0.8);
  feu = boucleBruit('highpass', 2500, 0.5);
}

export function reglerSons(sons) {
  reglerVolume('effets', sons.effets ?? 0.7);
  reglerVolume('voix', sons.voix ?? 1);
  reglerVolume('musique', (sons.musiqueActive ? sons.musique : 0) ?? 0.5);
  musique.voulue = !!sons.musiqueActive && (sons.musique ?? 0.5) > 0;
  if (musique.voulue) jouerMusique(); else arreterMusique();
}

// ---------- ambiance qui suit l'endroit et l'heure ----------
let prochainOiseau = 2, prochainGrillon = 1, prochainCrepit = 0;
export function majSons(dt, { nuit, procheEau, procheFeu, altitude, desert, procheVert }) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const rafale = 0.5 + 0.5 * Math.sin(t * 0.23) * Math.sin(t * 0.071 + 1);
  vent.g.gain.setTargetAtTime((0.05 + desert * 0.08 + Math.min(1, altitude / 30) * 0.12) * (0.4 + rafale * 0.8), t, 0.6);
  vent.f.frequency.setTargetAtTime(300 + rafale * 380, t, 0.8);
  eau.g.gain.setTargetAtTime(procheEau * 0.16, t, 0.4);
  feu.g.gain.setTargetAtTime(procheFeu * 0.03, t, 0.3);
  prochainOiseau -= dt; prochainGrillon -= dt; prochainCrepit -= dt;
  if (prochainOiseau < 0) { prochainOiseau = 1.5 + Math.random() * 4; if (nuit < 0.4 && procheVert > 0.2) oiseau(procheVert); }
  if (prochainGrillon < 0) { prochainGrillon = 0.4 + Math.random() * 0.9; if (nuit > 0.6) grillon(0.5 + procheVert * 0.5); }
  if (prochainCrepit < 0) { prochainCrepit = 0.05 + Math.random() * 0.25; if (procheFeu > 0.1) crepit(procheFeu); }
}

function bip(freq0, freq1, duree, vol, type = 'sine', depart = 0) {
  const t = ctx.currentTime + depart, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq0, t); o.frequency.exponentialRampToValueAtTime(freq1, t + duree);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + duree * 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  o.connect(g).connect(sortie('effets')); o.start(t); o.stop(t + duree + 0.05);
}
function oiseau(f) {
  const base = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) bip(base * (1 + Math.random() * 0.2), base * (1.25 + Math.random() * 0.3), 0.09 + Math.random() * 0.05, 0.035 * f, 'sine', i * 0.13);
}
function grillon(f) { for (let i = 0; i < 3; i++) bip(4300, 4200, 0.04, 0.012 * f, 'triangle', i * 0.07); }
function souffle(freq, q, duree, vol, type = 'bandpass') {
  const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = bruitBlanc;
  const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = freq; fl.Q.value = q;
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  s.connect(fl).connect(g).connect(sortie('effets')); s.start(t, Math.random() * 1.5); s.stop(t + duree + 0.05);
}
function crepit(f) { souffle(3000 + Math.random() * 2000, 3, 0.03, 0.05 * f); }

export function pasEnfant(sol) { if (ctx && ctx.state === 'running') souffle(sol === 'herbe' ? 1800 : 1100, 1.2, 0.09, 0.07); }
export function pasChameau(fort) {
  if (!ctx || ctx.state !== 'running') return;
  souffle(160, 1.5, 0.16, 0.22 * fort, 'lowpass');
  souffle(900, 0.8, 0.12, 0.05 * fort);
}
export function sonDecouverte() {
  if (!ctx || ctx.state !== 'running') return;
  [523, 659, 784, 1046].forEach((f, i) => bip(f, f * 1.01, 0.5, 0.06, 'sine', i * 0.12));
}
export function sonPorte() {
  if (!ctx || ctx.state !== 'running') return;
  souffle(220, 1, 0.9, 0.12, 'lowpass');
  [392, 523, 659].forEach((f, i) => bip(f, f, 0.6, 0.05, 'triangle', 0.3 + i * 0.15));
}
export function sonPiece(v = 10) {
  if (!ctx || ctx.state !== 'running') return;
  const f = v >= 100 ? 1.0 : v >= 50 ? 1.12 : v >= 10 ? 1.25 : 1.4, j = 0.97 + Math.random() * 0.06;   // les grosses pièces sonnent plus grave
  bip(1318 * f * j, 1320 * f * j, 0.1, 0.04, 'triangle'); bip(1760 * f * j, 1762 * f * j, 0.22, 0.04, 'triangle', 0.06);
}
export function sonRamasser() {
  if (!ctx || ctx.state !== 'running') return;
  bip(660, 990, 0.18, 0.05, 'sine'); bip(990, 1320, 0.2, 0.04, 'sine', 0.09);
}
export function sonChameau() { // petit « blatèrement » doux, pas effrayant
  if (!ctx || ctx.state !== 'running') return;
  bip(190, 140, 0.45, 0.05, 'sawtooth'); bip(200, 150, 0.4, 0.03, 'triangle', 0.05);
}

// ---------- musique du Grand Voyage (chant à voix seules, facultatif ; le village garde son nasheed) ----------
// Le fichier a été préparé avec un fondu enchaîné entre la fin et le début : la boucle est sans coupure.
// Les encodeurs ajoutent parfois un peu de silence au début et à la fin : on les écarte pour qu'aucun trou n'apparaisse.
function bornesBoucle(b) {
  const n = b.length, seuil = 1e-4, d = [];
  for (let c = 0; c < b.numberOfChannels; c++) d.push(b.getChannelData(c));
  const fort = i => d.some(x => Math.abs(x[i]) > seuil);
  let a = 0; while (a < Math.min(n, 6000) && !fort(a)) a++;
  let z = n - 1; while (z > n - 6000 && z > a && !fort(z)) z--;
  return [a / b.sampleRate, (z + 1) / b.sampleRate];
}
// Trois musiques, chemins relatifs à la page /voyage/ (voir musique-zone.js pour savoir laquelle joue où) :
//   jeu    = « Glowing Village », le nasheed du village : le jeu habituel, au début
//   route  = « Golden Hour Hum » : dès qu'on arrive sur la Route vers La Mecque
//   mecque = « Sacred City at Dusk » : l'arrivée à La Mecque
const PISTES = {
  jeu: '../monde/musique/village-nasheed.mp3?v=1',
  route: 'musique/grand-voyage-golden-hour.mp3?v=2',
  mecque: 'musique/mecque-sacred-city-at-dusk.mp3?v=2'
};
const chargees = {};                       // nom → promesse de { tampon, bornes }, ou false si le fichier est indisponible
let pisteVoulue = 'jeu', dernierChangement = -1e9;
const PAUSE_ENTRE_CHANGEMENTS = 6;         // secondes : pas d'aller-retour entre deux musiques à la frontière d'une région
function chargerPiste(nom) {
  if (!chargees[nom]) {
    chargees[nom] = fetch(PISTES[nom])
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((ok, ko) => { const p = ctx.decodeAudioData(ab, ok, ko); if (p && p.then) p.then(ok, ko); }))
      .then(b => ({ tampon: b, bornes: bornesBoucle(b) }))
      .catch(() => false);
  }
  return chargees[nom];
}
const DUREE_FONDU = 5;                     // secondes : fondu enchaîné entre deux musiques (l'une baisse pendant que l'autre monte, sans creux)
async function jouerMusique(croise = false) {
  if (!ctx || musique.source || !musique.voulue) return;
  const nom = pisteVoulue, p = await chargerPiste(nom);
  if (!p || !musique.voulue || musique.source) return;
  if (nom !== pisteVoulue) { jouerMusique(croise); return; }   // la musique voulue a changé pendant le chargement
  const s = ctx.createBufferSource(); s.buffer = p.tampon; s.loop = true;
  s.loopStart = p.bornes[0]; s.loopEnd = p.bornes[1];
  const t = ctx.currentTime, g = ctx.createGain();
  if (croise) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + DUREE_FONDU); }
  else { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(1, t + 3); }
  s.connect(g).connect(sortie('musique')); s.start();
  musique.source = s; musique.gain = g; musique.piste = nom;
}
function arreterMusique(croise = false) {
  if (!musique.source) return;
  const s = musique.source, g = musique.gain, t = ctx.currentTime; musique.source = null; musique.piste = null;
  if (croise) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + DUREE_FONDU); }
  else g.gain.setTargetAtTime(0.0001, t, 0.4);
  setTimeout(() => { try { s.stop(); } catch (e) {} }, croise ? (DUREE_FONDU + 0.5) * 1000 : 1600);
}
// Change de musique en douce (appelée souvent, ne fait rien si rien ne change). On attend d'avoir chargé la nouvelle musique
// avant de baisser l'ancienne : jamais de silence, et si le fichier est indisponible on garde l'ancienne.
export async function choisirMusique(nom) {
  if (!PISTES[nom] || nom === pisteVoulue) return;
  if (ctx && ctx.currentTime - dernierChangement < PAUSE_ENTRE_CHANGEMENTS) return;   // on réessaiera au prochain appel
  pisteVoulue = nom; if (ctx) dernierChangement = ctx.currentTime;
  if (!musique.voulue) return;
  if (!musique.source) { jouerMusique(); return; }
  if (musique.piste === nom) return;
  const p = await chargerPiste(nom);
  if (!p || pisteVoulue !== nom || !musique.source || musique.piste === nom) return;
  arreterMusique(true); jouerMusique(true);
}
export function sonCheval() { // petit hennissement doux
  if (!ctx || ctx.state !== 'running') return;
  for (let i = 0; i < 5; i++) bip(620 - i * 40, 560 - i * 50, 0.12, 0.035, 'triangle', i * 0.09);
  souffle(500, 1, 0.3, 0.04, 'lowpass');
}
export function sonElephant() { // un barrissement tout doux
  if (!ctx || ctx.state !== 'running') return;
  bip(260, 520, 0.6, 0.04, 'sawtooth'); bip(270, 540, 0.55, 0.03, 'triangle', 0.04);
}
export function pasCheval(fort) { // cloc-cloc des sabots sur le sable
  if (!ctx || ctx.state !== 'running') return;
  souffle(1400, 3, 0.05, 0.08 * fort); souffle(700, 2, 0.06, 0.06 * fort, 'lowpass');
}
// une découverte : un carillon doux, une petite montée de notes et un léger souffle (jamais fort)
export function sonMerveille() {
  if (!ctx || ctx.state !== 'running') return;
  souffle(1800, 0.7, 1.4, 0.025);
  [587, 740, 880, 1175].forEach((f, i) => bip(f, f, 1.2, 0.045, 'sine', i * 0.11));
  [1760, 2350].forEach((f, i) => bip(f, f * 1.003, 0.8, 0.018, 'triangle', 0.5 + i * 0.12));
  bip(294, 296, 1.6, 0.03, 'sine', 0.05);
}
