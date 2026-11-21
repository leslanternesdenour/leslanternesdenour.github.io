// Les ablutions en 3D : l'enfant s'assoit devant un robinet et fait lui-même chaque geste.
// Trois modes : Apprendre (Nour montre, puis l'enfant fait), S'entraîner (l'enfant trouve l'ordre), Libre.
// Les textes, les sources et les voix sont ceux de la leçon /ablutions/ (rien n'est inventé ici).
import * as THREE from 'three';
import { Voyageur } from '../../voyage/js/voyageur.js?v=4';
import { mascotte } from '../../monde/mascottes.js?v=1';
import { creerLieu, STATIONS } from './lieu.js?v=2';
import { Gestes, SEQUENCES, POSTURES } from './gestes.js?v=2';
import { creerPersonnage as creerNouveau } from '../../personnages3d/fabrique.js?v=1';
import { ST, HINT } from './etapes.js?v=1';

const $ = id => document.getElementById(id);
const lisse = (a, b, k) => a + (b - a) * k;

// ---------- les gestes de chaque étape (les nombres de fois viennent de la leçon) ----------
const ICONES = { intention: '💛', bismillah: '🗣️', mains: '🤲', bouche: '👄', nez: '👃', visage: '😊', bras: '💪', tete: '🙆', pieds: '🦶' };
const SEQ = { intention: ['intention'], bismillah: ['bismillah'], mains: ['mains'], bouche: ['bouche'], nez: ['nez'], visage: ['visage'],
  bras: ['brasDroit', 'brasGauche'], tete: ['tete', 'oreilles'], pieds: ['piedDroit', 'piedGauche'] };
const ICO_PARTIE = { oreilles: '👂' };
const LIB_UN = { intention: "J'ai l'intention", bismillah: 'Bismillâh' };
const ETAPES = ST.map((s, i) => ({ ...s, i, ic: ICONES[s.k],
  parties: SEQ[s.k].map((seq, j) => ({ seq, n: s.ph[j] ? s.ph[j].k : 1, l: s.ph[j] ? s.ph[j].l : LIB_UN[s.k], ic: ICO_PARTIE[seq] || ICONES[s.k] })) }));

// ---------- la caméra : un point de vue par geste ----------
// yaw : angle autour du personnage (0 = devant lui, ±π = derrière) ; le mur est devant, la caméra reste sur le côté ou derrière
const VUES = {
  assis: { c: [0, 0.6, 0.18], yaw: -2.0, pitch: 0.36, d: 2.2 },
  mains: { c: [0, 0.62, 0.24], yaw: -1.45, pitch: 0.24, d: 1.7 },
  tetes: { c: [0, 0.82, 0.16], yaw: -1.42, pitch: 0.16, d: 1.6 },
  brasDroit: { c: [-0.05, 0.6, 0.24], yaw: -1.55, pitch: 0.3, d: 1.7 },
  brasGauche: { c: [0.05, 0.6, 0.24], yaw: 1.55, pitch: 0.3, d: 1.7 },
  piedDroit: { c: [-0.04, 0.42, 0.24], yaw: -1.55, pitch: 0.3, d: 1.8 },
  piedGauche: { c: [0.04, 0.42, 0.24], yaw: 1.55, pitch: 0.3, d: 1.8 },
  marche: { c: [0, 0.9, 0], yaw: Math.PI, pitch: 0.38, d: 3.6, suit: true },
  accueil: { c: [0, 0.8, -1.0], yaw: -2.55, pitch: 0.3, d: 3.4, tourne: true }
};
const VUE_DE = { intention: 'tetes', bismillah: 'tetes', mains: 'mains', bouche: 'tetes', nez: 'tetes', visage: 'tetes', tete: 'tetes', oreilles: 'tetes',
  brasDroit: 'brasDroit', brasGauche: 'brasGauche', piedDroit: 'piedDroit', piedGauche: 'piedGauche' };

// ---------- profil graphique (comme le Grand Voyage) ----------
const params = new URLSearchParams(location.search);
function choisirProfil() {
  const p = params.get('p'); if (['faible', 'equilibre', 'eleve'].includes(p)) return p;
  const tactile = matchMedia('(pointer: coarse)').matches, mem = navigator.deviceMemory || 4;
  if (mem <= 2) return 'faible';
  return tactile || mem < 6 ? 'equilibre' : 'eleve';
}
const PROFIL = choisirProfil();
const Q = { faible: { pr: 1, ombres: false, aa: false }, equilibre: { pr: Math.min(devicePixelRatio || 1, 1.5), ombres: 'normale', aa: false }, eleve: { pr: Math.min(devicePixelRatio || 1, 2), ombres: 'haute', aa: true } }[PROFIL];

// ---------- la voix : les enregistrements de la leçon, sinon la voix du navigateur ----------
let son = true; try { son = localStorage.getItem('ablutions_son') !== '0'; } catch (e) {}
let VX = null; try { fetch('../voix/voix.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { VX = j; }).catch(() => {}); } catch (e) {}
const AU = new Audio(); AU.preload = 'auto'; let AUt = 0;
const ISL = /[âîûÂÎÛ‘ʿʾ]|\b(allah|bismi|coran|sal[aâ]t|wudu|mach|inch|assal)/i;
function tts(t) { if (ISL.test(String(t))) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, '')); u.lang = 'fr-FR'; u.rate = 0.92; u.pitch = 1.15; speechSynthesis.speak(u); } catch (e) {} }
function taire() { clearTimeout(AUt); try { AU.pause(); } catch (e) {} try { speechSynthesis.cancel(); } catch (e) {} }
function dire(t, id) {
  if (!son) return; taire();
  const c = id && VX && VX[id];
  if (c) {
    const go = () => { try { AU.currentTime = c[1]; } catch (e) {} const p = AU.play(); if (p && p.catch) p.catch(() => tts(t)); AUt = setTimeout(() => AU.pause(), (c[2] - c[1]) * 1000 + 120); };
    if (AU.dataset.f !== c[0]) { AU.dataset.f = c[0]; AU.src = '../voix/' + c[0]; AU.addEventListener('loadedmetadata', go, { once: true }); AU.load(); } else go();
    return;
  }
  tts(t);
}

// ---------- le bruit de l'eau (un souffle doux fabriqué par le navigateur) ----------
let audio = null;
function demarrerAudio() {
  if (audio) return; try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = new AC(), b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = b.getChannelData(0);
    let x = 0; for (let i = 0; i < d.length; i++) { x = x * 0.97 + (Math.random() * 2 - 1) * 0.03; d[i] = x * 3 + (Math.random() * 2 - 1) * 0.05; }
    const src = ctx.createBufferSource(); src.buffer = b; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6;
    const g = ctx.createGain(); g.gain.value = 0; src.connect(f).connect(g).connect(ctx.destination); src.start();
    audio = { ctx, g };
  } catch (e) {}
}

// ---------- la sauvegarde : on AJOUTE « jeu3d » à la progression des ablutions, sans toucher au reste ----------
function lireProg() { try { return JSON.parse(localStorage.getItem('ablutions')) || {}; } catch (e) { return {}; } }
function sauver(f) {
  try { const p = lireProg(); p.jeu3d = Object.assign({ appris: false, entrainements: 0, libre: 0 }, p.jeu3d); f(p.jeu3d); localStorage.setItem('ablutions', JSON.stringify(p)); } catch (e) {}
}
function persoChoisi() {
  let m = {}; try { m = (JSON.parse(localStorage.getItem('monde')) || {}).personnage || {}; } catch (e) {}
  const j = lireProg().jeu3d || {};
  return { genre: j.genre || m.genre || 'fille', tenue: m.tenue || 'ecru', peau: m.peau ?? 1 };
}

// ---------- la scène ----------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('scene'), antialias: Q.aa, powerPreference: 'high-performance' });
} catch (e) { $('chargement').classList.add('cache'); $('erreur').classList.remove('cache'); throw e; }
renderer.setPixelRatio(Q.pr); renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
if (Q.ombres) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 60);
const lieu = creerLieu(scene, { ombres: Q.ombres });

// le personnage
let perso = null, gestes = null, persoInfo = persoChoisi();
const J = { x: 0, z: -3.2, a: 0, vit: 0, cible: null, station: null, assis: false, transition: 0 };
// Personnage : le nouveau modèle N1 (personnages3d/) ou, en secours automatique, l'ancien Voyageur.
// PAR_DEFAUT = 'ancien' : les formes de tissu pour l'assise sur tabouret et le pied levé n'existent pas encore (voir docs/personnages-3d/ABLUTIONS-ADAPTATIONS-NECESSAIRES.md).
// L'adresse ?perso=nouveau permet de voir et d'essayer les nouveaux modèles dès maintenant.
const PAR_DEFAUT = 'ancien';
const PERSO = (() => { const p = new URLSearchParams(location.search).get('perso'); return p === 'nouveau' || p === 'ancien' ? p : PAR_DEFAUT; })();
let numeroCreation = 0, typePerso = null;
function retirerPerso(p) { scene.remove(p.racine); if (p.liberer) p.liberer(); else p.racine.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
async function creerPerso() {
  const mien = ++numeroCreation;
  const r = await creerNouveau({ genre: persoInfo.genre, peau: persoInfo.peau, ombres: !!Q.ombres, parametre: PERSO, creerAncien: () => new Voyageur(!!Q.ombres, persoInfo, {}) });
  if (mien !== numeroCreation) { if (r.personnage.liberer) r.personnage.liberer(); return; }     // un changement de genre plus récent a pris le relais
  const ancien = perso; perso = r.personnage; typePerso = r.type;                                  // l'échange se fait quand le nouveau est prêt : jamais de personnage nul dans la boucle
  if (ancien) retirerPerso(ancien);
  scene.add(perso.racine);
  gestes = new Gestes(perso);
  gestes.surImage = surImage;
  if (perso.lier) perso.lier(gestes, POSTURES, { sansTissu: true });      // clignement des yeux ; pas de formes de tissu de la Prière
  if (J.assis) { gestes.activer(true); gestes.etat = gestes.copie(gestes.cible); }
}
await creerPerso();
// une ombre douce sous le personnage
const ombreDouce = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#3a2a18', alphaMap: ombreDouce, transparent: true, opacity: Q.ombres ? 0.22 : 0.38, depthWrite: false }));
blob.position.y = 0.012; scene.add(blob);

// les cercles lumineux devant chaque tabouret (on les touche pour s'asseoir)
const cercles = STATIONS.map(s => {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.27, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f5b942', transparent: true, opacity: 0.8, depthWrite: false }));
  m.position.set(s.x, 0.015, -0.42); m.userData.station = s; scene.add(m); return m;
});

// Nour, la petite goutte (la mascotte de la leçon), flotte près du robinet
let nourSprite = null;
(function () {
  const svg = mascotte('ablutions'); if (!svg) return;
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="300" ')], { type: 'image/svg+xml' }));
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = 240; c.height = 300; c.getContext('2d').drawImage(img, 0, 0, 240, 300); URL.revokeObjectURL(url);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    nourSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true })); nourSprite.scale.set(0.32, 0.4, 1); nourSprite.visible = false; scene.add(nourSprite);
  };
  img.src = url;
  for (const id of ['accueil-nour', 'mini-nour', 'fin-nour']) $(id).innerHTML = svg;
})();

// ---------- caméra ----------
const cam = { yaw: VUES.accueil.yaw, pitch: VUES.accueil.pitch, d: VUES.accueil.d, c: new THREE.Vector3(...VUES.accueil.c), vue: 'accueil', dYaw: 0, dPitch: 0, zoom: 1 };
function vue(nom) { if (cam.vue !== nom) { cam.vue = nom; cam.dYaw = 0; cam.dPitch = 0; cam.zoom = 1; } }
function majCamera(dt, t) {
  const v = VUES[cam.vue] || VUES.assis, k = 1 - Math.exp(-dt * 2.8);
  const base = J.station && !v.suit && cam.vue !== 'accueil' ? new THREE.Vector3(J.station.x, 0, J.station.z) : new THREE.Vector3(v.suit ? J.x : 0, 0, v.suit ? J.z : 0);
  const cible = base.add(new THREE.Vector3(...v.c));
  let yaw = v.yaw + cam.dYaw; if (v.suit) yaw = J.a + Math.PI + cam.dYaw; if (v.tourne) yaw += Math.sin(t * 0.12) * 0.5;
  let dy = yaw - cam.yaw; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
  cam.yaw += dy * k; cam.pitch = lisse(cam.pitch, Math.max(-0.05, Math.min(1.1, v.pitch + cam.dPitch)), k); const panH = $('panneau').classList.contains('cache') ? 0 : $('panneau').offsetHeight / innerHeight;
  cam.d = lisse(cam.d, Math.min(1.95, v.d * cam.zoom * (1 + panH * 0.45)), k);
  cam.c.lerp(cible, k);
  const p = new THREE.Vector3(Math.sin(cam.yaw) * Math.cos(cam.pitch), Math.sin(cam.pitch), Math.cos(cam.yaw) * Math.cos(cam.pitch)).multiplyScalar(cam.d).add(cam.c);
  p.z = Math.min(p.z, lieu.MUR_Z - 0.12); p.y = Math.max(0.15, p.y); p.x = Math.max(-3.7, Math.min(3.7, p.x));
  camera.position.copy(p); camera.lookAt(cam.c);
  // le panneau du bas ne doit pas cacher le geste : on remonte l'image d'autant
  const pan = $('panneau'), ph = pan.classList.contains('cache') ? 0 : pan.offsetHeight;
  cam.decal = lisse(cam.decal || 0, Math.min(innerHeight * 0.22, ph * 0.3), k * 2);
  camera.setViewOffset(innerWidth, innerHeight, 0, cam.decal, innerWidth, innerHeight);
}

// ---------- déplacement : toucher le sol pour marcher, toucher un cercle pour s'asseoir ----------
const ray = new THREE.Raycaster(), souris = new THREE.Vector2(), sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const touches = {};
addEventListener('keydown', e => { touches[e.code] = true; if (e.code === 'Escape') ouvrirMenu(); });
addEventListener('keyup', e => { touches[e.code] = false; });
let glisse = null;
$('scene').addEventListener('pointerdown', e => {
  demarrerAudio();
  glisse = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, id: e.pointerId, bouge: false };
  try { $('scene').setPointerCapture(e.pointerId); } catch (er) {}
});
$('scene').addEventListener('pointermove', e => {
  if (!glisse || e.pointerId !== glisse.id) return;
  const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y; glisse.x = e.clientX; glisse.y = e.clientY;
  if (Math.hypot(e.clientX - glisse.x0, e.clientY - glisse.y0) > 8) glisse.bouge = true;
  if (glisse.bouge) { cam.dYaw -= dx * 0.008; cam.dPitch += dy * 0.005; }
});
$('scene').addEventListener('pointerup', e => {
  if (!glisse || e.pointerId !== glisse.id) return;
  const g = glisse; glisse = null; if (g.bouge) return;
  // un simple toucher : marcher, ou choisir un robinet
  souris.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(souris, camera);
  if (J.assis || !jeuEnCours) return;
  const hit = ray.intersectObjects(cercles)[0];
  const p = new THREE.Vector3(); ray.ray.intersectPlane(sol, p);
  let st = hit ? hit.object.userData.station : null;
  if (!st && p) for (const s of STATIONS) if (Math.hypot(p.x - s.x, p.z - s.z) < 0.55) st = s;
  if (st) allerA(st); else if (p) { J.cible = { x: Math.max(-3.5, Math.min(3.5, p.x)), z: Math.max(-4.2, Math.min(-0.5, p.z)) }; J.versStation = null; }
});
$('scene').addEventListener('wheel', e => { e.preventDefault(); cam.zoom = Math.max(0.6, Math.min(1.6, cam.zoom + Math.sign(e.deltaY) * 0.08)); }, { passive: false });
$('scene').addEventListener('pointercancel', () => { glisse = null; });

function allerA(s) { J.cible = { x: s.x, z: s.z - 0.34 }; J.versStation = s; consigne(''); }
function marcher(dt) {
  let vx = 0, vz = 0;
  const av = (touches.KeyW || touches.KeyZ || touches.ArrowUp ? 1 : 0) - (touches.KeyS || touches.ArrowDown ? 1 : 0);
  const cote = (touches.KeyD || touches.ArrowRight ? 1 : 0) - (touches.KeyA || touches.KeyQ || touches.ArrowLeft ? 1 : 0);
  if (av || cote) {
    J.cible = null; J.versStation = null;
    const fx = -Math.sin(cam.yaw), fz = -Math.cos(cam.yaw), rx = Math.cos(cam.yaw), rz = -Math.sin(cam.yaw);
    vx = fx * av + rx * cote; vz = fz * av + rz * cote; const l = Math.hypot(vx, vz); vx /= l; vz /= l;
  } else if (J.cible) {
    const dx = J.cible.x - J.x, dz = J.cible.z - J.z, l = Math.hypot(dx, dz);
    if (l < 0.06) {
      J.cible = null;
      if (J.versStation) { s_asseoir(J.versStation); J.versStation = null; return; }
    } else { vx = dx / l; vz = dz / l; }
  }
  const vitCible = vx || vz ? 1.5 : 0;
  J.vit = lisse(J.vit, vitCible, 1 - Math.exp(-dt * 8));
  if (vx || vz) { let da = Math.atan2(vx, vz) - J.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; J.a += da * Math.min(1, dt * 10); }
  if (J.vit > 0.01) {
    J.x += Math.sin(J.a) * J.vit * dt; J.z += Math.cos(J.a) * J.vit * dt;
    J.x = Math.max(-3.6, Math.min(3.6, J.x)); J.z = Math.max(-4.3, Math.min(-0.3, J.z));
    for (const s of STATIONS) { const dx = J.x - s.x, dz = J.z - (s.z - 0.03), d = Math.hypot(dx, dz); if (d < 0.33 && !(J.versStation === s)) { J.x = s.x + dx / d * 0.33; J.z = s.z - 0.03 + dz / d * 0.33; } }
  }
  perso.racine.position.set(J.x, 0, J.z); perso.racine.rotation.y = J.a;
  perso.animer(dt, J.vit, tTotal);
}
function s_asseoir(s) {
  J.station = s; J.assis = true; J.x = s.x; J.z = s.z; J.a = 0; J.vit = 0;
  perso.racine.position.set(s.x, 0, s.z); perso.racine.rotation.y = 0;
  gestes.activer(true);
  for (const c of cercles) c.visible = false;
  vue('assis');
  setTimeout(() => { if (surAssis) { const f = surAssis; surAssis = null; f(); } }, 750);
}
function seLever() {
  if (!J.assis || gestes.enCours()) return;
  gestes.poser('debout');
  setTimeout(() => {
    gestes.activer(false); J.assis = false; const s = J.station; J.station = null;
    J.x = s.x; J.z = s.z - 0.34; J.a = 0; perso.racine.position.set(J.x, 0, J.z);
    for (const c of cercles) c.visible = true;
    vue('marche'); consigne('Touche un cercle doré pour t\'asseoir devant un robinet.');
  }, 650);
}

// ---------- effets pendant les gestes (étoiles, gouttes) ----------
const _w = new THREE.Vector3();
function pointPartie(nom) {
  const v = perso;
  const tete = (x, y, z) => v.tete.localToWorld(_w.set(x, y, z)).clone();
  switch (nom) {
    case 'coeur': return v.buste.localToWorld(_w.set(0.04, 0.3, 0.17)).clone();
    case 'bouche': return tete(0, -0.08, 0.2); case 'nez': return tete(0, -0.02, 0.21); case 'visage': return tete(0, 0.02, 0.2);
    case 'tete': return tete(0, 0.2, 0); case 'oreilles': return tete(-0.2, 0, 0);
    case 'mains': return gestes.mainsMonde[0].clone().lerp(gestes.mainsMonde[1], 0.5);
    case 'brasD': return v.bras[0].bas.localToWorld(_w.set(0, -0.1, 0)).clone();
    case 'brasG': return v.bras[1].bas.localToWorld(_w.set(0, -0.1, 0)).clone();
    case 'piedD': return gestes.piedsMonde[0].clone(); case 'piedG': return gestes.piedsMonde[1].clone();
  }
  return null;
}
function surImage(o) {
  if (o.brille) { const p = pointPartie(o.brille); if (p) lieu.briller(p); }
  if (o.gouttes) for (const m of gestes.mainsMonde) lieu.emettre(m, 4, 0.35);
  if (o.crache) { const p = pointPartie('bouche'); p.y -= 0.05; p.z += 0.08; lieu.emettre(p, 5, 0.4); }
}

// ---------- l'interface ----------
let mode = null, jeuEnCours = false, surAssis = null;
const E = { i: 0, comptes: {}, indices: 0, faites: new Set(), courante: null, ordre: [], jeton: 0 };   // jeton : une démonstration en cours s'arrête si on change d'étape ou de mode
function consigne(t) { $('consigne').textContent = t; $('consigne').classList.toggle('cache', !t); }
function bulle(html, c = '', clic = null) { const b = $('bulle'); b.innerHTML = html; b.className = 'bulle ' + c; b.onclick = clic; }
function points() {
  $('points').innerHTML = ETAPES.map((e, j) => `<i class="${mode === 'entrainer' ? (E.faites.has(j) ? 'fait' : '') : j < E.i ? 'fait' : j === E.i ? 'ici' : ''}"></i>`).join('');
}
function titre(t) { $('titre-etape').textContent = t; }
function compteHtml(n, f) { return `<span class="compte">${Array.from({ length: n }, (_, k) => `<i class="${k < f ? 'f' : ''}"></i>`).join('')}</span>`; }

// un bouton par geste : chaque appui = une fois
function boutonsGestes(et, { gaucheApresDroite = true, apres } = {}) {
  const z = $('actions'); z.innerHTML = '';
  et.parties.forEach((p, j) => {
    const b = document.createElement('button'); b.className = 'geste'; b.dataset.seq = p.seq;
    const maj = () => { const f = E.comptes[p.seq] || 0; b.innerHTML = `<span>${p.ic} ${p.l}</span>${compteHtml(p.n, f)}`; b.classList.toggle('fini', f >= p.n); };
    maj();
    b.onclick = () => {
      if (gestes.enCours()) return;
      // la droite d'abord (Apprendre) : on guide doucement, sans rien compter faux
      if (j === 1 && et.parties.length === 2 && (et.k === 'bras' || et.k === 'pieds') && !(E.comptes[et.parties[0].seq] > 0)) {
        if (gaucheApresDroite) { bulle(et.tip, 'ko', () => dire(et.tip, 't' + et.i)); dire(et.tip, 't' + et.i); return; }
        bulle(et.tip, 'ko', () => dire(et.tip, 't' + et.i));
      }
      vue(VUE_DE[p.seq] || 'assis');
      tousBoutons(false);
      gestes.jouer(p.seq, () => {
        E.comptes[p.seq] = (E.comptes[p.seq] || 0) + 1; maj(); tousBoutons(true);
        if (apres) apres(et);
      });
    };
    z.appendChild(b);
  });
}
function tousBoutons(oui) { for (const b of $('actions').querySelectorAll('button')) b.disabled = !oui; }
const partiesFaites = (et, toutes) => et.parties.every(p => (E.comptes[p.seq] || 0) >= (toutes ? p.n : 1));

// ---------- mode Apprendre ----------
function etapeApprendre(i) {
  E.i = i; const et = ETAPES[i]; points(); const jeton = ++E.jeton; gestes.poser('assis');
  titre(`Étape ${i + 1} / ${ETAPES.length} · ${et.t}`);
  const conseil = () => { bulle(`💡 ${et.tip}<small>Touche encore pour relire l'étape</small>`, '', () => { bulle(texteEt, '', conseil); dire(`Étape ${i + 1}. ${et.t}. ${et.txt} ${et.c}.`, 's' + i); }); dire(et.tip, 't' + i); };
  const texteEt = `${et.txt}<small>${et.c} · 💡 touche ici pour un petit conseil</small>`;
  bulle(texteEt, '', conseil);
  $('detail').innerHTML = `<span class="src">${et.src}</span>`;
  dire(`Étape ${i + 1}. ${et.t}. ${et.txt} ${et.c}.`, 's' + i);
  // Nour montre d'abord : le personnage fait une fois chaque geste, puis c'est à l'enfant
  $('actions').innerHTML = '<button class="petit" disabled>👀 Regarde bien…</button>';
  consigne('Regarde bien !');
  const demo = et.parties.slice();
  const suite = () => {
    if (jeton !== E.jeton) return;
    const p = demo.shift();
    if (!p) { consigne('À toi ! Touche le bouton pour faire le geste.'); actionsApprendre(et); return; }
    vue(VUE_DE[p.seq] || 'assis'); gestes.jouer(p.seq, () => setTimeout(suite, 300));
  };
  setTimeout(suite, 600);
}
function actionsApprendre(et) {
  boutonsGestes(et, { gaucheApresDroite: true, apres: () => {
    consigne('');
    const z = $('actions'); let s = z.querySelector('.suivant');
    if (partiesFaites(et, false) && !s) {
      s = document.createElement('button'); s.className = 'suivant'; s.textContent = et.i < ETAPES.length - 1 ? 'Étape suivante ▶' : 'Terminer ✓';
      s.onclick = () => { if (gestes.enCours()) return; E.i < ETAPES.length - 1 ? etapeApprendre(E.i + 1) : finApprendre(); };
      z.appendChild(s);
    }
    if (s) s.classList.toggle('attire', partiesFaites(et, true));
    if (partiesFaites(et, true)) bulle(['Bravo !', 'Très bien !', 'Super !'][et.i % 3] + `<small>Touche « ${et.i < ETAPES.length - 1 ? 'Étape suivante' : 'Terminer'} » quand tu es prêt.</small>`, 'ok');
  } });
  const rev = document.createElement('button'); rev.className = 'petit'; rev.textContent = '👀 Revoir';
  rev.onclick = () => { if (gestes.enCours()) return; const ps = et.parties.slice(), jeton = E.jeton; tousBoutons(false); const s = () => { if (jeton !== E.jeton) return; const p = ps.shift(); if (!p) { tousBoutons(true); return; } vue(VUE_DE[p.seq] || 'assis'); gestes.jouer(p.seq, () => setTimeout(s, 250)); }; s(); };
  $('actions').appendChild(rev);
}
function finApprendre() {
  sauver(j => { j.appris = true; });
  fin("Machâ'Allah !", "Tu connais maintenant les ablutions. Tu es tout propre et prêt pour la prière !", 'done',
    "Machâ'Allah ! Tu connais maintenant les ablutions. Après les ablutions, on dit l'attestation de foi. Demande à tes parents de la répéter avec toi.");
}

// ---------- mode S'entraîner ----------
function choixEntrainer(msg, c = '') {
  const reste = ETAPES.length - E.faites.size;
  if (!reste) return finEntrainer();
  E.courante = null; points(); titre('S\'entraîner · ' + E.faites.size + ' / ' + ETAPES.length);
  vue('assis');
  bulle(msg || (E.faites.size === 0 ? 'Par quoi on commence ?' : 'Et maintenant, quelle étape ?'), c);
  $('detail').innerHTML = '';
  const z = $('actions'); z.innerHTML = '<div class="grille"></div>'; const g = z.firstChild;
  for (const j of E.ordre) {
    const et = ETAPES[j], b = document.createElement('button'); b.className = 'etape' + (E.faites.has(j) ? ' faite' : '');
    b.innerHTML = `<b>${et.ic}</b>${et.t}`; b.disabled = E.faites.has(j);
    b.onclick = () => {
      const attendu = ETAPES.findIndex((x, k) => !E.faites.has(k));
      if (j !== attendu) {
        E.indices++; b.classList.remove('secoue'); void b.offsetWidth; b.classList.add('secoue');
        const m = 'Pas encore ! Petit indice : ' + HINT[attendu];
        bulle(m, 'ko'); dire(m, 'h' + attendu); return;
      }
      faireEntrainer(j);
    };
    g.appendChild(b);
  }
}
function faireEntrainer(j) {
  const et = ETAPES[j]; E.courante = j;
  titre(`${et.ic} ${et.t}`);
  bulle(`Oui ! ${et.t}. À toi de faire le geste.<small>${et.c}</small>`, 'ok', () => dire(et.tip, 't' + j));
  $('detail').innerHTML = '';
  boutonsGestes(et, { gaucheApresDroite: false, apres: () => {
    if (!partiesFaites(et, false)) return;
    const z = $('actions'); let s = z.querySelector('.suivant');
    if (!s) { s = document.createElement('button'); s.className = 'suivant'; s.textContent = 'J\'ai fini cette étape ✓'; s.onclick = () => { if (gestes.enCours()) return; E.faites.add(j); choixEntrainer(['Bravo !', 'Oui !', 'C\'est ça !', 'Super !'][E.faites.size % 4], 'ok'); }; z.appendChild(s); }
    s.classList.toggle('attire', partiesFaites(et, true));
  } });
}
function finEntrainer() {
  sauver(j => { j.entrainements = (j.entrainements || 0) + 1; });
  const t = E.indices === 0 ? 'Tu as trouvé toi-même l\'ordre des ablutions, sans aucun indice !' : `Tu as fait toutes les étapes des ablutions, dans l'ordre. Tu as utilisé ${E.indices} petit${E.indices > 1 ? 's' : ''} indice${E.indices > 1 ? 's' : ''}.`;
  // voix à enregistrer (facultatif) : j3_fin0 et j3_fin — en attendant, la voix du navigateur lit le texte
  if (E.indices === 0) fin('Bravo !', t, 'j3_fin0', 'Bravo ! ' + t);
  else fin('Bravo !', t, 'j3_fin', 'Bravo ! Tu as fait toutes les étapes des ablutions, dans l\'ordre.');
}

// ---------- mode Libre ----------
function panneauLibre() {
  titre('Libre · à ton rythme'); points(); $('points').classList.add('cache');
  bulle('Fais les gestes que tu veux, à ton rythme. Tu peux tourner la caméra en glissant le doigt.', '');
  $('detail').innerHTML = '';
  const z = $('actions'); z.innerHTML = '<div class="libre-liste"></div>'; const l = z.firstChild;
  for (const et of ETAPES) for (const p of et.parties) {
    const b = document.createElement('button'); b.className = 'geste'; b.dataset.seq = p.seq; b.innerHTML = `<span>${p.ic} ${p.l}</span>`;
    b.onclick = () => { if (gestes.enCours() || !J.assis) return; vue(VUE_DE[p.seq] || 'assis'); gestes.jouer(p.seq); };
    l.appendChild(b);
  }
  const lev = document.createElement('button'); lev.className = 'petit'; lev.textContent = '🚶 Changer de robinet';
  lev.onclick = () => { seLever(); $('panneau').classList.add('cache'); surAssis = () => { $('panneau').classList.remove('cache'); consigne(''); }; };
  z.appendChild(lev);
}

// ---------- début, fin, menu ----------
function fin(t, texte, voixId, voixTexte) {
  jeuEnCours = false;
  $('fin-titre').textContent = t; $('fin-texte').textContent = texte;
  const z = $('fin-boutons'); z.innerHTML = '';
  const bt = (cl, txt, f) => { const b = document.createElement('button'); b.className = cl; b.textContent = txt; b.onclick = f; z.appendChild(b); };
  bt('gros', '🔁 Recommencer', () => { $('fin').classList.add('cache'); lancer(mode); });
  if (mode === 'apprendre') bt('moyen', '🎯 Je m\'entraîne', () => { $('fin').classList.add('cache'); lancer('entrainer'); });
  if (mode === 'entrainer') bt('moyen', '🌿 Mode libre', () => { $('fin').classList.add('cache'); lancer('libre'); });
  bt('moyen', '🏠 Les modes', () => { $('fin').classList.add('cache'); accueil(); });
  $('panneau').classList.add('cache'); $('points').classList.add('cache'); consigne('');
  $('fin').classList.remove('cache'); dire(voixTexte || texte, voixId);
}
function lancer(m) {
  mode = m; jeuEnCours = true; demarrerAudio(); E.jeton++; taire();
  E.i = 0; E.comptes = {}; E.indices = 0; E.faites = new Set(); E.courante = null;
  E.ordre = ETAPES.map((_, j) => j).sort(() => Math.random() - 0.5);
  if (m === 'libre') sauver(j => { j.libre = (j.libre || 0) + 1; });
  $('accueil').classList.add('cache'); $('haut').classList.remove('cache');
  $('points').classList.toggle('cache', m === 'libre');
  $('panneau').classList.add('cache');
  titre({ apprendre: 'Apprendre', entrainer: 'S\'entraîner', libre: 'Libre' }[m]);
  const commencer = () => {
    $('panneau').classList.remove('cache'); consigne('');
    if (m === 'apprendre') etapeApprendre(0); else if (m === 'entrainer') choixEntrainer(); else panneauLibre();
  };
  if (J.assis) { gestes.poser('assis'); vue('assis'); commencer(); return; }
  // on choisit d'abord un robinet
  vue('marche'); for (const c of cercles) c.visible = true;
  consigne('Touche un cercle doré pour t\'asseoir devant un robinet.');
  surAssis = commencer;
}
function accueil() {
  jeuEnCours = false; taire(); E.jeton++;
  if (J.assis) { gestes.activer(false); J.assis = false; J.station = null; }
  J.x = 0; J.z = -3.2; J.a = 0; J.cible = null; J.versStation = null;
  for (const c of cercles) c.visible = true;
  vue('accueil');
  for (const id of ['haut', 'points', 'panneau', 'fin', 'menu']) $(id).classList.add('cache'); consigne('');
  $('accueil').classList.remove('cache');
  for (const b of document.querySelectorAll('.choix-perso')) b.classList.toggle('oui', b.dataset.genre === persoInfo.genre);
}
function ouvrirMenu() { if (!jeuEnCours) return; $('menu').classList.remove('cache'); }
$('btn-menu').onclick = ouvrirMenu;
$('menu-reprendre').onclick = () => $('menu').classList.add('cache');
$('menu-modes').onclick = () => { $('menu').classList.add('cache'); accueil(); };
$('btn-son').textContent = son ? '🔊' : '🔇';
$('btn-son').onclick = () => { son = !son; try { localStorage.setItem('ablutions_son', son ? '1' : '0'); } catch (e) {} $('btn-son').textContent = son ? '🔊' : '🔇'; if (!son) taire(); };
for (const b of document.querySelectorAll('.choix-perso')) b.onclick = () => {
  persoInfo = { ...persoInfo, genre: b.dataset.genre }; sauver(j => { j.genre = b.dataset.genre; }); creerPerso();
  for (const x of document.querySelectorAll('.choix-perso')) x.classList.toggle('oui', x === b);
};
for (const b of document.querySelectorAll('.mode')) b.onclick = () => lancer(b.dataset.mode);

// ---------- redimensionnement et rotation du téléphone ----------
let tailleEcran = '';
function ajuster() {
  const t = innerWidth + 'x' + innerHeight; if (t === tailleEcran || !innerWidth || !innerHeight) return; tailleEcran = t;
  camera.aspect = innerWidth / innerHeight;
  // en portrait, on élargit le champ pour voir tout le geste sans reculer la caméra
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
  if (J.assis) gestes.maj(dt, tTotal); else marcher(dt);
  if (perso.suivre) perso.suivre(dt);
  blob.position.set(perso.racine.position.x, 0.012, perso.racine.position.z + (J.assis ? 0.08 : 0));
  const coule = J.assis && gestes.enCours() && !!gestes.opt.eau;
  lieu.maj(dt, tTotal, { station: J.station, coule, mains: gestes.mainsMonde, pieds: gestes.piedsMonde });
  if (audio) audio.g.gain.value = lisse(audio.g.gain.value, coule && son ? 0.09 : 0, Math.min(1, dt * 6));
  for (const c of cercles) { c.material.opacity = 0.55 + Math.sin(tTotal * 3) * 0.25; }
  if (nourSprite) {
    nourSprite.visible = !!(jeuEnCours && J.station && mode === 'apprendre');
    if (J.station) nourSprite.position.set(J.station.x + 0.05, 1.42 + Math.sin(tTotal * 1.8) * 0.04, J.station.z + 0.42);
  }
  majCamera(dt, tTotal);
  renderer.render(scene, camera);
}
ajuster();
$('chargement').classList.add('cache');
accueil();
image();

// pour les tests
window.__abl = {
  gestes: () => gestes, perso: () => perso, type: () => typePerso, J, cam, E, ETAPES, SEQUENCES, lieu, renderer,
  asseoir(i = 1) { s_asseoir(STATIONS[i]); },
  vue, lancer, mode: () => mode, etape: i => etapeApprendre(i), allerA: i => allerA(STATIONS[i])
};
