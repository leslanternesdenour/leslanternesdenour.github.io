// La prière en 3D : l'enfant fait les positions sur son tapis, en accompagnant un ami (personnage imaginaire) qui prie devant lui.
// Trois modes : Guidé (l'ami montre, l'enfant fait pareil), S'entraîner (une prière de 2 rak‘at dans l'ordre), Libre.
// Les textes, les paroles, les sources et les voix sont ceux de la leçon /priere/ (rien n'est inventé ici).
import * as THREE from 'three';
import { Voyageur } from '../../voyage/js/voyageur.js?v=5';
import { creerPersonnage as creerNouveau } from '../../personnages3d/fabrique.js?v=2';
import { mascotte } from '../../monde/mascottes.js?v=2';
import { Gestes } from '../../ablutions/jeu3d/gestes.js?v=2';
import { creerSalle } from './salle.js?v=1';
import { POSTURES, chemin, SALAM } from './postures.js?v=2';
import { ST, DH, SUR, ayUrl, H1, NOTE_ECOLES } from './contenu.js?v=1';

const $ = id => document.getElementById(id);
const lisse = (a, b, k) => a + (b - a) * k;

// ---------- les positions que l'enfant peut prendre ----------
const POS = {
  takbir: { ic: '🙌', l: 'Allâhou akbar' },
  mains: { ic: '📖', l: 'Debout, je récite' },
  roukou: { ic: '🙇', l: 'Roukoû‘' },
  debout: { ic: '🧍', l: 'Je me redresse' },
  soujoud: { ic: '🙏', l: 'Soujoûd' },
  assis: { ic: '🧎', l: 'Assis' },
  tachahhoud: { ic: '☝️', l: 'Tachahhoud' },
  salam: { ic: '👋', l: 'Salut final' }
};
// pour chaque étape de la leçon : la position à prendre, et le bouton de l'enfant
const ACTION = {
  niyya: { p: null, b: '💛 J\'ai l\'intention' }, qiyam: { p: 'debout', b: '🧍 Je me tiens debout' }, takbir: { p: 'takbir', b: '🙌 Allâhou akbar' },
  fatiha: { p: 'mains', b: '📖 Je récite Al-Fâtiha' }, sourate: { p: 'mains', b: '📖 Je récite la sourate' }, roukou: { p: 'roukou', b: '🙇 Je m\'incline' },
  itidal: { p: 'debout', b: '🧍 Je me redresse' }, soujoud1: { p: 'soujoud', b: '🙏 Je me prosterne' }, jalsa: { p: 'assis', b: '🧎 Je m\'assois' },
  soujoud2: { p: 'soujoud', b: '🙏 Je me prosterne' }, rakaa: { p: 'mains', b: '🔁 Je me relève' }, tachahhoud: { p: 'tachahhoud', b: '☝️ Le tachahhoud' },
  taslim: { p: 'salam', b: '👋 Le salut' }
};
// une prière de 2 rak‘at, pour l'entraînement (les indices 0 à 6 sont ceux du jeu de la leçon, avec leur voix h1_…)
const PRIERE2 = [
  { p: 'takbir', h: 0 }, { p: 'mains', h: 1 }, { p: 'roukou', h: 2 }, { p: 'debout', h: 3 }, { p: 'soujoud', h: 4 }, { p: 'assis', h: 5 }, { p: 'soujoud', h: 6 },
  { p: 'mains', t: 'Pour la deuxième rak‘a, on se relève et on récite…', v: 'j3_h7' }, { p: 'roukou', h: 2 }, { p: 'debout', h: 3 }, { p: 'soujoud', h: 4 }, { p: 'assis', h: 5 }, { p: 'soujoud', h: 6 },
  { p: 'tachahhoud', t: 'Après la deuxième rak‘a, on reste assis pour le tachahhoud…', v: 'j3_h13' }, { p: 'salam', t: 'Pour finir, on tourne la tête à droite, puis à gauche…', v: 'j3_h14' }
];

// ---------- profil graphique ----------
const params = new URLSearchParams(location.search);
function choisirProfil() {
  const p = params.get('p'); if (['faible', 'equilibre', 'eleve'].includes(p)) return p;
  const tactile = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 4;
  if (mem <= 2) return 'faible';
  return tactile || mem < 6 ? 'equilibre' : 'eleve';
}
const PROFIL = choisirProfil();
const Q = { faible: { pr: 1, ombres: false, aa: false }, equilibre: { pr: Math.min(devicePixelRatio || 1, 1.5), ombres: 'normale', aa: false }, eleve: { pr: Math.min(devicePixelRatio || 1, 2), ombres: 'haute', aa: true } }[PROFIL];

// ---------- voix : les enregistrements de la leçon, la récitation du Coran, sinon la voix du navigateur ----------
const V = LDNSon.bibliotheque('../voix/');   // les enregistrements de la leçon ; voix du navigateur seulement en dernier recours (français)
const sonActif = () => !LDNSon.etat().muet;    // réglage commun à tout le site (socle/son.js)
function taire() { LDNSon.arreter(); }
function dire(t, id, fini) { return V.dire(id, { texte: t, fini }); }
// la récitation d'une sourate, verset par verset (même récitateur que la leçon)
function reciter(s, surVerset) {
  taire(); let i = 0;
  const suivant = () => {
    if (i >= SUR[s].ay) { if (surVerset) surVerset(-1); return; }
    if (surVerset) surVerset(i);
    LDNSon.url(ayUrl(s, i++), { fini: ok => { if (ok === false) { if (surVerset) surVerset(-1); return; } setTimeout(suivant, 350); } });
  };
  suivant();
}

// ---------- sauvegarde : on AJOUTE « jeu3d » à la progression de la prière ----------
function lireProg() { try { return JSON.parse(localStorage.getItem('priere')) || {}; } catch (e) { return {}; } }
function sauver(f) { try { const p = lireProg(); p.jeu3d = Object.assign({ appris: false, entrainements: 0, libre: 0 }, p.jeu3d); f(p.jeu3d); localStorage.setItem('priere', JSON.stringify(p)); } catch (e) {} }
const j3 = lireProg().jeu3d || {};
let mainsVariante = j3.mains === 'cotes' ? 'cotes' : 'poitrine';
function persoChoisi() {
  let m = {}; try { m = (JSON.parse(localStorage.getItem('monde')) || {}).personnage || {}; } catch (e) {}
  return { genre: j3.genre || m.genre || 'fille', tenue: m.tenue || 'ecru', peau: m.peau ?? 1 };
}

// ---------- la scène ----------
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: Q.aa, powerPreference: 'high-performance' }); }
catch (e) { $('chargement').classList.add('cache'); $('erreur').classList.remove('cache'); throw e; }
renderer.setPixelRatio(Q.pr); renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
if (Q.ombres) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 60);
const salle = creerSalle(scene, { ombres: Q.ombres });

// deux personnages : l'enfant (sur son tapis) et son ami, devant lui sur un autre tapis
const AMI_Z = 1.25;
let info = persoChoisi(), enfant = null, ami = null;
function variante(p) { return p === 'mains' && mainsVariante === 'cotes' ? 'debout' : p; }
// Personnages : les nouveaux modèles N1 (personnages3d/) ou, en secours automatique, l'ancien Voyageur.
// PAR_DEFAUT = 'ancien' tant que le test sur téléphone n'est pas validé ; l'adresse ?perso=nouveau (ou ?perso=ancien) force l'un ou l'autre.
const PAR_DEFAUT = 'ancien';
const PERSO = (() => { const p = new URLSearchParams(location.search).get('perso'); return p === 'nouveau' || p === 'ancien' ? p : PAR_DEFAUT; })();
async function creerPersonnage(perso, x, z) {
  const r = await creerNouveau({ genre: perso.genre, peau: perso.peau, ombres: !!Q.ombres, parametre: PERSO, creerAncien: () => new Voyageur(!!Q.ombres, perso, {}) });
  const v = r.personnage; v.racine.position.set(x, 0, z); scene.add(v.racine);
  const g = new Gestes(v, { postures: POSTURES, sequences: {}, depart: 'debout', repos: 'debout' }); g.activer(true);
  if (v.lier) v.lier(g, POSTURES);   // le nouveau personnage suit la posture du moteur (formes du tissu)
  return { v, g, pos: 'debout', type: r.type, raison: r.raison };
}
function retirer(p) { scene.remove(p.v.racine); if (p.v.liberer) p.v.liberer(); else p.v.racine.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
let numeroCreation = 0;
async function creerPersonnages() {
  const mien = ++numeroCreation;
  // l'ami : même genre, une autre tenue et une autre couleur de peau (personnage imaginaire)
  const [e, a] = await Promise.all([creerPersonnage(info, 0, 0), creerPersonnage({ genre: info.genre, tenue: info.tenue === 'bleu' ? 'vert' : 'bleu', peau: (info.peau + 2) % 4 }, 0, AMI_Z)]);
  if (mien !== numeroCreation) { retirer(e); retirer(a); return; }      // un changement de genre plus récent a pris le relais
  if (ami) a.v.racine.visible = ami.v.racine.visible;
  const anciens = [enfant, ami]; enfant = e; ami = a;                   // l'échange se fait seulement quand les nouveaux sont prêts : jamais d'enfant nul dans la boucle
  for (const p of anciens) if (p) retirer(p);
}
await creerPersonnages();
// le tapis de l'ami
{ const m = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.012, 1.32), new THREE.MeshStandardMaterial({ color: '#f5b942', roughness: 0.9 })); m.position.set(0, 0.006, AMI_Z + 0.18); scene.add(m);
  const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.014, 1.2), new THREE.MeshStandardMaterial({ color: '#7d2f3a', roughness: 0.9 })); m2.position.set(0, 0.008, AMI_Z + 0.18); scene.add(m2); }

// faire bouger un personnage vers une position, par un chemin naturel (plier les genoux, s'agenouiller, se relever…)
function bouger(p, vers, fini) {
  const cible = variante(vers);
  let L;
  if (vers === 'salam') L = [...chemin(p.pos, 'assis'), ...SALAM];
  else L = chemin(p.pos, cible);
  if (p.pos === cible && vers !== 'salam') L = [[cible, 0.6]];
  p.g.S = { _c: L }; p.g.jouer('_c', () => { p.pos = vers === 'salam' ? 'assis' : cible; if (fini) fini(); }, true);
}
const occupe = () => enfant.g.enCours() || ami.g.enCours();

// Sajjadou, le petit tapis (mascotte de la leçon), dans le panneau
const svgSJ = mascotte('priere') || '';
for (const id of ['accueil-sj', 'mini-sj', 'fin-sj']) $(id).innerHTML = svgSJ;
$('note-ecoles').innerHTML = NOTE_ECOLES;

// ---------- caméra : de profil, pour bien voir les deux enfants ----------
const VUES = {
  profil: { c: [0, 0.42, 0.75], yaw: 1.42, pitch: 0.3, d: 3.3 },
  enfant: { c: [0, 0.42, 0.25], yaw: 1.3, pitch: 0.3, d: 2.5 },
  accueil: { c: [0, 0.7, 0.6], yaw: 0.9, pitch: 0.22, d: 4.2, tourne: true }
};
const cam = { yaw: VUES.accueil.yaw, pitch: VUES.accueil.pitch, d: VUES.accueil.d, c: new THREE.Vector3(...VUES.accueil.c), vue: 'accueil', dYaw: 0, dPitch: 0, zoom: 1, decal: 0 };
function vue(nom) { if (cam.vue !== nom) { cam.vue = nom; cam.dYaw = 0; cam.dPitch = 0; cam.zoom = 1; } }
function majCamera(dt, t) {
  const v = VUES[cam.vue], k = 1 - Math.exp(-dt * 2.8);
  let yaw = v.yaw + cam.dYaw; if (v.tourne) yaw += Math.sin(t * 0.12) * 0.6;
  let dy = yaw - cam.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
  const panH = $('panneau').classList.contains('cache') ? 0 : $('panneau').offsetHeight / innerHeight;
  cam.yaw += dy * k; cam.pitch = lisse(cam.pitch, Math.max(-0.05, Math.min(1.1, v.pitch + cam.dPitch)), k);
  cam.d = lisse(cam.d, Math.min(4.2, v.d * cam.zoom * (1 + panH * 0.45)), k);
  cam.c.lerp(new THREE.Vector3(...v.c), k);
  const p = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.d).add(cam.c);
  p.z = Math.min(p.z, salle.MUR_Z - 0.2); p.x = Math.max(-salle.L / 2 + 0.3, Math.min(salle.L / 2 - 0.3, p.x)); p.y = Math.max(0.15, Math.min(3.1, p.y));
  camera.position.copy(p); camera.lookAt(cam.c);
  const ph = $('panneau').classList.contains('cache') ? 0 : $('panneau').offsetHeight;
  cam.decal = lisse(cam.decal, Math.min(innerHeight * 0.22, ph * 0.3), k * 2);
  camera.setViewOffset(innerWidth, innerHeight, 0, cam.decal, innerWidth, innerHeight);
}
// glisser pour tourner la caméra, molette pour zoomer
let glisse = null;
$('scene').addEventListener('pointerdown', e => { glisse = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { $('scene').setPointerCapture(e.pointerId); } catch (er) {} });
$('scene').addEventListener('pointermove', e => { if (!glisse || e.pointerId !== glisse.id) return; cam.dYaw -= (e.clientX - glisse.x) * 0.008; cam.dPitch += (e.clientY - glisse.y) * 0.005; glisse.x = e.clientX; glisse.y = e.clientY; });
const lacher = () => { glisse = null; };
$('scene').addEventListener('pointerup', lacher); $('scene').addEventListener('pointercancel', lacher);
$('scene').addEventListener('wheel', e => { e.preventDefault(); cam.zoom = Math.max(0.6, Math.min(1.5, cam.zoom + Math.sign(e.deltaY) * 0.08)); }, { passive: false });
addEventListener('keydown', e => { if (e.code === 'Escape') ouvrirMenu(); });

// ---------- l'interface ----------
let mode = null, jeuEnCours = false;
const E = { i: 0, n: 0, indices: 0, jeton: 0 };
function consigne(t) { $('consigne').textContent = t; $('consigne').classList.toggle('cache', !t); }
function bulle(html, c = '', clic = null) { const b = $('bulle'); b.innerHTML = html; b.className = 'bulle ' + c; b.onclick = clic; }
function titre(t) { $('titre-etape').textContent = t; }
function points(total, fait, ici) { $('points').innerHTML = Array.from({ length: total }, (_, j) => `<i class="${j < fait ? 'fait' : j === ici ? 'ici' : ''}"></i>`).join(''); }
// la carte d'une parole : arabe, phonétique, sens, source ; écouter et comprendre (voix de la leçon)
function carteParole(id) {
  const d = DH[id];
  return `<div class="dh"><div class="ar" lang="ar" dir="rtl">${d.ar}</div><div class="trl">${d.tr}</div><div class="frm cache" data-fr="${id}">« ${d.fr} »</div>
    <div class="acts2"><button class="mini b" data-ecoute="${id}">▶ Écouter</button><button class="mini" data-sens="${id}">💬 Ça veut dire…</button></div><div class="src">Source : ${d.src}</div></div>`;
}
function carteSourate(s) {
  const S = SUR[s];
  return `<div class="dh"><div class="trl">Sourate ${S.n}</div><div class="versets">${S.tr.map((t, i) => `<p data-v="${i}"><b>${t}</b><br><span>${S.fr[i]}</span></p>`).join('')}</div>
    <div class="acts2"><button class="mini b" data-reciter="${s}">▶ Écouter la récitation</button></div><div class="src">Voix : Mahmoud Khalil Al-Housary</div></div>`;
}
function brancherParoles() {
  for (const b of $('parole').querySelectorAll('[data-ecoute]')) b.onclick = () => dire(DH[b.dataset.ecoute].tr, 'd_' + b.dataset.ecoute);
  for (const b of $('parole').querySelectorAll('[data-sens]')) b.onclick = () => { const f = $('parole').querySelector(`[data-fr="${b.dataset.sens}"]`); if (f) f.classList.remove('cache'); dire(DH[b.dataset.sens].fr, 'f_' + b.dataset.sens); };
  for (const b of $('parole').querySelectorAll('[data-reciter]')) b.onclick = () => reciter(+b.dataset.reciter, i => { for (const p of $('parole').querySelectorAll('[data-v]')) p.classList.toggle('on', +p.dataset.v === i); });
}

// ---------- mode Guidé : l'ami montre, l'enfant fait pareil ----------
function etapeGuide(i) {
  E.i = i; const s = ST[i], a = ACTION[s.k], jeton = ++E.jeton;
  titre(`Étape ${i + 1} / ${ST.length} · ${s.t}`); points(ST.length, i, i);
  bulle(s.x, '', () => dire(s.t + '. ' + s.x, 'e_' + s.k));
  $('parole').innerHTML = (s.d ? carteParole(s.d) : '') + (s.d2 ? carteParole(s.d2) : '') + (s.s ? carteSourate(s.s) : '');
  brancherParoles();
  $('detail').innerHTML = `<span class="src">Source : ${s.src}</span>`;
  dire(s.t + '. ' + s.x, 'e_' + s.k);
  const z = $('actions'); z.innerHTML = '';
  const b = document.createElement('button'); b.className = 'geste'; b.innerHTML = `<span>${a.b}</span>`; b.disabled = true; z.appendChild(b);
  const suite = () => {
    if (jeton !== E.jeton) return;
    consigne('À toi ! Fais pareil.'); b.disabled = false;
    b.onclick = () => {
      if (occupe()) return; b.disabled = true; consigne('');
      const fini = () => {
        if (jeton !== E.jeton) return;
        b.classList.add('fini');
        const n = document.createElement('button'); n.className = 'suivant attire'; n.textContent = i < ST.length - 1 ? 'Étape suivante ▶' : 'J\'ai fini ✓';
        n.onclick = () => { if (occupe()) return; i < ST.length - 1 ? etapeGuide(i + 1) : finGuide(); };
        z.appendChild(n);
        if (s.d) setTimeout(() => { if (jeton === E.jeton) dire(DH[s.d].tr, 'd_' + s.d); }, 300);
      };
      if (a.p) bouger(enfant, a.p, fini); else { setTimeout(fini, 400); }
    };
  };
  // l'ami montre d'abord la position
  if (a.p) { consigne('Regarde ton ami…'); setTimeout(() => { if (jeton === E.jeton) bouger(ami, a.p, () => setTimeout(suite, 300)); }, 500); }
  else setTimeout(suite, 600);
}
function finGuide() {
  sauver(j => { j.appris = true; });
  fin('Machâ’Allah !', 'Tu connais toutes les étapes de la prière ! Maintenant, on joue ?', 'done', "Machâ'Allah ! Tu connais toutes les étapes de la prière ! Maintenant, on joue ?");
}

// ---------- mode S'entraîner : une prière de 2 rak‘at, dans l'ordre ----------
function choixEntrainer(msg, c = '') {
  if (E.n >= PRIERE2.length) return finEntrainer();
  const rk = E.n < 7 ? 1 : 2;
  titre(`S'entraîner · rak‘a ${rk}`); points(PRIERE2.length, E.n, E.n);
  bulle(msg || (E.n === 0 ? 'Par quoi commence la prière ?' : 'Et maintenant ?'), c);
  $('parole').innerHTML = ''; $('detail').innerHTML = '';
  const z = $('actions'); z.innerHTML = '<div class="positions"></div>'; const g = z.firstChild;
  for (const [k, p] of Object.entries(POS)) {
    const b = document.createElement('button'); b.className = 'position'; b.dataset.pos = k; b.innerHTML = `<b>${p.ic}</b>${p.l}`;
    b.onclick = () => {
      if (occupe()) return;
      const att = PRIERE2[E.n];
      if (k !== att.p) {
        E.indices++; b.classList.remove('secoue'); void b.offsetWidth; b.classList.add('secoue');
        const ind = att.h != null ? H1[att.h] : att.t, m = 'Pas encore ! Petit indice : ' + ind;
        bulle(m, 'ko'); dire(m, att.h != null ? 'h1_' + att.h : att.v); return;   // j3_h… : voix à enregistrer (facultatif)
      }
      for (const x of g.querySelectorAll('button')) x.disabled = true;
      bouger(enfant, k, () => { E.n++; choixEntrainer(['Bravo !', 'Oui !', 'C\'est ça !', 'Super !'][E.n % 4], 'ok'); });
    };
    g.appendChild(b);
  }
}
function finEntrainer() {
  sauver(j => { j.entrainements = (j.entrainements || 0) + 1; });
  const t = E.indices === 0 ? 'Tu as fait une prière de 2 rak‘at dans le bon ordre, sans aucun indice !' : `Tu as fait une prière de 2 rak‘at dans le bon ordre. Tu as utilisé ${E.indices} petit${E.indices > 1 ? 's' : ''} indice${E.indices > 1 ? 's' : ''}.`;
  fin('Bravo !', t, 'j3_fin', 'Bravo ! Tu as fait une prière de 2 rak‘at dans le bon ordre.');   // j3_fin : voix à enregistrer (facultatif)
}

// ---------- mode Libre ----------
function panneauLibre() {
  titre('Libre · à ton rythme'); $('points').classList.add('cache');
  bulle('Prends les positions que tu veux, à ton rythme. Tu peux tourner la caméra en glissant le doigt.', '');
  $('parole').innerHTML = ''; $('detail').innerHTML = '';
  const z = $('actions'); z.innerHTML = '<div class="libre-liste"></div>'; const l = z.firstChild;
  for (const [k, p] of Object.entries(POS)) {
    const b = document.createElement('button'); b.className = 'position'; b.innerHTML = `<b>${p.ic}</b>${p.l}`;
    b.onclick = () => { if (occupe()) return; bouger(enfant, k); };
    l.appendChild(b);
  }
}

// ---------- début, fin, menu ----------
function remettre() { for (const p of [enfant, ami]) { p.g.poser('debout'); p.pos = 'debout'; } }
function fin(t, texte, voixId, voixTexte) {
  jeuEnCours = false;
  $('fin-titre').textContent = t; $('fin-texte').textContent = texte;
  const z = $('fin-boutons'); z.innerHTML = '';
  const bt = (cl, txt, f) => { const b = document.createElement('button'); b.className = cl; b.textContent = txt; b.onclick = f; z.appendChild(b); };
  bt('gros', '🔁 Recommencer', () => { $('fin').classList.add('cache'); lancer(mode); });
  if (mode === 'guide') bt('moyen', '🎯 Je m\'entraîne', () => { $('fin').classList.add('cache'); lancer('entrainer'); });
  if (mode === 'entrainer') bt('moyen', '🌿 Mode libre', () => { $('fin').classList.add('cache'); lancer('libre'); });
  bt('moyen', '🏠 Les modes', () => { $('fin').classList.add('cache'); accueil(); });
  $('panneau').classList.add('cache'); $('points').classList.add('cache'); consigne('');
  $('fin').classList.remove('cache'); dire(voixTexte || texte, voixId);
}
function lancer(m) {
  mode = m; jeuEnCours = true; E.jeton++; taire(); E.i = 0; E.n = 0; E.indices = 0;
  if (m === 'libre') sauver(j => { j.libre = (j.libre || 0) + 1; });
  remettre();
  ami.v.racine.visible = m === 'guide';
  $('accueil').classList.add('cache'); $('haut').classList.remove('cache'); $('panneau').classList.remove('cache');
  $('points').classList.toggle('cache', m === 'libre');
  vue(m === 'guide' ? 'profil' : 'enfant');
  if (m === 'guide') etapeGuide(0); else if (m === 'entrainer') choixEntrainer(); else panneauLibre();
}
function accueil() {
  jeuEnCours = false; taire(); E.jeton++; remettre(); ami.v.racine.visible = true;
  vue('accueil');
  for (const id of ['haut', 'points', 'panneau', 'fin', 'menu']) $(id).classList.add('cache'); consigne('');
  $('accueil').classList.remove('cache');
  for (const b of document.querySelectorAll('.choix-perso')) b.classList.toggle('oui', b.dataset.genre === info.genre);
  for (const b of document.querySelectorAll('.choix-mains')) b.classList.toggle('oui', b.dataset.mains === mainsVariante);
}
function ouvrirMenu() { if (!jeuEnCours) return; $('menu').classList.remove('cache'); }
$('btn-menu').onclick = ouvrirMenu;
$('menu-reprendre').onclick = () => $('menu').classList.add('cache');
$('menu-modes').onclick = () => { $('menu').classList.add('cache'); accueil(); };
LDNSon.surEtat(() => { $('btn-son').textContent = sonActif() ? '🔊' : '🔇'; });
$('btn-son').onclick = () => { LDNSon.couper(sonActif()); };
for (const b of document.querySelectorAll('.choix-perso')) b.onclick = () => {
  info = { ...info, genre: b.dataset.genre }; sauver(j => { j.genre = b.dataset.genre; }); creerPersonnages();
  for (const x of document.querySelectorAll('.choix-perso')) x.classList.toggle('oui', x === b);
};
for (const b of document.querySelectorAll('.choix-mains')) b.onclick = () => {
  mainsVariante = b.dataset.mains; sauver(j => { j.mains = mainsVariante; });
  for (const x of document.querySelectorAll('.choix-mains')) x.classList.toggle('oui', x === b);
};
for (const b of document.querySelectorAll('.mode')) b.onclick = () => lancer(b.dataset.mode);

// ---------- redimensionnement et rotation ----------
let tailleEcran = '';
function ajuster() {
  const t = innerWidth + 'x' + innerHeight; if (t === tailleEcran || !innerWidth || !innerHeight) return; tailleEcran = t;
  camera.aspect = innerWidth / innerHeight;
  camera.fov = camera.aspect < 1 ? Math.min(78, 2 * Math.atan(Math.tan(22 * Math.PI / 180) / camera.aspect) * 180 / Math.PI) : 50;
  camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight, false);
}
const ajusterBientot = () => { ajuster(); setTimeout(ajuster, 250); setTimeout(ajuster, 700); };
addEventListener('resize', ajusterBientot); addEventListener('orientationchange', ajusterBientot);
if (window.visualViewport) visualViewport.addEventListener('resize', ajusterBientot);

// ---------- la boucle ----------
const horloge = new THREE.Clock(); let tTotal = 0;
function image() {
  requestAnimationFrame(image);
  const dt = Math.min(0.05, horloge.getDelta()); tTotal += dt;
  enfant.g.maj(dt, tTotal); if (enfant.v.suivre) enfant.v.suivre(dt);
  if (ami.v.racine.visible) { ami.g.maj(dt, tTotal); if (ami.v.suivre) ami.v.suivre(dt); }
  salle.maj(dt, tTotal);
  majCamera(dt, tTotal);
  renderer.render(scene, camera);
}
ajuster();
$('chargement').classList.add('cache');
accueil();
image();

// pour les tests
window.__pri = { enfant: () => enfant, ami: () => ami, perso: () => ({ enfant: enfant.type, ami: ami.type }), bouger, E, cam, vue, lancer, mode: () => mode, renderer, etape: i => etapeGuide(i),
  poser(nom) { for (const p of [enfant, ami]) { p.g.poser(nom); p.pos = nom; } } };
