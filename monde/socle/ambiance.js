// Socle commun — ambiance sonore naturelle, fabriquée dans le navigateur.
// Eau de la fontaine, vent, oiseaux le jour, grillons la nuit, petites gouttes.
// Tout passe par la piste « effets » (volume réglable par les parents).
import { contexte, sortie } from './audio.js?v=1';

let ctx = null, piste = null;
let eau = null, vent = null, ventLfo = null;
let jour = 1, nuit = 0, minuterie = null;

function bruit(ctx, secondes = 2, brun = false) {
  const n = Math.floor(ctx.sampleRate * secondes);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let dernier = 0;
  for (let i = 0; i < n; i++) {
    const b = Math.random() * 2 - 1;
    if (brun) { dernier = (dernier + 0.02 * b) / 1.02; d[i] = dernier * 3.5; } else d[i] = b;
  }
  // raccord doux entre la fin et le début du bruit en boucle
  const r = Math.min(2000, n >> 3);
  for (let i = 0; i < r; i++) { const k = i / r; d[n - r + i] = d[n - r + i] * (1 - k) + d[i] * k; }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true; src.loopEnd = (n - r) / ctx.sampleRate;
  return src;
}

export function demarrerAmbiance() {
  if (ctx) return;
  ctx = contexte();
  if (!ctx) return;
  piste = sortie('effets');

  // Fontaine : bruit blanc filtré
  const sEau = bruit(ctx, 3);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 0.6;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  eau = ctx.createGain(); eau.gain.value = 0;
  eau.gain.setTargetAtTime(0.05, ctx.currentTime, 1.5);
  sEau.connect(bp).connect(lp).connect(eau).connect(piste); sEau.start();

  // Vent : bruit brun très doux qui respire
  const sVent = bruit(ctx, 4, true);
  const lpv = ctx.createBiquadFilter(); lpv.type = 'lowpass'; lpv.frequency.value = 420;
  vent = ctx.createGain(); vent.gain.value = 0.05;
  ventLfo = ctx.createOscillator(); ventLfo.frequency.value = 0.07;
  const prof = ctx.createGain(); prof.gain.value = 0.035;
  ventLfo.connect(prof).connect(vent.gain); ventLfo.start();
  sVent.connect(lpv).connect(vent).connect(piste); sVent.start();

  planifier();
}

function planifier() {
  clearTimeout(minuterie);
  minuterie = setTimeout(() => {
    if (ctx && ctx.state === 'running') {
      if (Math.random() < jour) oiseau();
      if (Math.random() < nuit) grillon();
    }
    planifier();
  }, 2500 + Math.random() * 4500);
}

function oiseau() {
  const t0 = ctx.currentTime;
  const notes = 2 + Math.floor(Math.random() * 4);
  const base = 2300 + Math.random() * 1400;
  const g = ctx.createGain(); g.gain.value = 0;
  if (ctx.createStereoPanner) {
    const pan = ctx.createStereoPanner(); pan.pan.value = Math.random() * 1.6 - 0.8;
    g.connect(pan).connect(piste);
  } else g.connect(piste);
  const o = ctx.createOscillator(); o.type = 'sine'; o.connect(g);
  for (let i = 0; i < notes; i++) {
    const t = t0 + i * 0.13;
    o.frequency.setValueAtTime(base * (0.9 + Math.random() * 0.25), t);
    o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t + 0.08);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.025 * jour, t + 0.015);
    g.gain.linearRampToValueAtTime(0, t + 0.1);
  }
  o.start(t0); o.stop(t0 + notes * 0.13 + 0.1);
}

function grillon() {
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 4300 + Math.random() * 500;
  const g = ctx.createGain(); g.gain.value = 0;
  o.connect(g).connect(piste);
  const salves = 3 + Math.floor(Math.random() * 3);
  for (let s = 0; s < salves; s++) {
    for (let i = 0; i < 4; i++) {
      const t = t0 + s * 0.42 + i * 0.045;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.012 * nuit, t + 0.008);
      g.gain.linearRampToValueAtTime(0, t + 0.03);
    }
  }
  o.start(t0); o.stop(t0 + salves * 0.42 + 0.1);
}

// Petite goutte d'eau (retour quand on touche quelque chose)
export function goutte(aigu = 1) {
  if (!ctx || ctx.state !== 'running') return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(900 * aigu, t);
  o.frequency.exponentialRampToValueAtTime(380 * aigu, t + 0.12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  o.connect(g).connect(piste); o.start(t); o.stop(t + 0.22);
}

// La scène informe l'ambiance : moment de la journée et distance à la fontaine
export function majAmbiance({ facteurJour, facteurNuit, procheFontaine }) {
  jour = facteurJour; nuit = facteurNuit;
  if (!ctx || !eau) return;
  eau.gain.setTargetAtTime(0.015 + 0.07 * procheFontaine, ctx.currentTime, 0.4);
}
