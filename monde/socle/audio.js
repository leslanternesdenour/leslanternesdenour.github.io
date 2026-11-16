// Socle commun — table de mixage du village.
// Un seul AudioContext pour tout le monde 3D, avec trois pistes indépendantes :
//   musique  → la musique de fond
//   voix     → la voix de la maîtresse
//   effets   → gouttes, fontaine, vent, oiseaux, grillons
// Chaque piste a son volume (réglé par les parents) et un « retrait » automatique
// (la musique et les effets s'effacent pendant que la maîtresse parle).

const PISTES = ['musique', 'voix', 'effets'];
let ctx = null;
const volume = {}, retrait = {};
const retraitsActifs = { musique: new Map(), voix: new Map(), effets: new Map() };
let maitre = null;

export function contexte() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC({ latencyHint: 'playback' });
  maitre = ctx.createGain();
  maitre.connect(ctx.destination);
  for (const p of PISTES) {
    volume[p] = ctx.createGain();
    retrait[p] = ctx.createGain();
    volume[p].connect(retrait[p]).connect(maitre);
    volume[p].gain.value = valeursEnAttente[p] ?? 1;
    retrait[p].gain.value = Math.min(1, ...retraitsActifs[p].values());
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) ctx.suspend(); else reveiller();
  });
  return ctx;
}

// Appelé à chaque toucher : les navigateurs exigent un geste avant de jouer un son
export function reveiller() {
  const c = contexte();
  if (c && c.state !== 'running' && !document.hidden) c.resume().catch(() => {});
  return c;
}

export function sortie(piste) { contexte(); return volume[piste] || null; }

const valeursEnAttente = {};
// Volume d'une piste, 0 à 1, changé en douceur (pas de saut brutal)
export function reglerVolume(piste, v) {
  v = Math.max(0, Math.min(1, v));
  valeursEnAttente[piste] = v;
  if (!ctx) return;
  volume[piste].gain.cancelScheduledValues(ctx.currentTime);
  volume[piste].gain.setTargetAtTime(v, ctx.currentTime, 0.08);
}

// Retrait temporaire d'une piste (cle = qui le demande). Le plus fort retrait l'emporte.
export function retirer(piste, cle, facteur) {
  const m = retraitsActifs[piste];
  if (facteur == null || facteur >= 1) m.delete(cle); else m.set(cle, facteur);
  if (!ctx) return;
  const f = Math.min(1, ...m.values());
  retrait[piste].gain.cancelScheduledValues(ctx.currentTime);
  retrait[piste].gain.setTargetAtTime(f, ctx.currentTime, f < 1 ? 0.12 : 0.6);
}
