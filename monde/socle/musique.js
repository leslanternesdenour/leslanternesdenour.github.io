// Socle commun — musique de fond du village (nasheed).
// Une seule lecture à la fois, en boucle sans coupure (Web Audio, boucle à l'échantillon près).
// Le fichier a été préparé avec un fondu enchaîné entre la fin et le début.
// Si on quitte puis revient sur la page, la musique reprend où elle en était.
import { contexte, sortie } from './audio.js?v=1';

const FICHIER = 'musique/village-nasheed.mp3?v=1';
const CLE_POSITION = 'monde_musique_position';

let tampon = null, debutBoucle = 0, finBoucle = 0;
let chargement = null, indisponible = false;
let source = null, fondu = null, departCtx = 0, departPos = 0;
let voulue = false;

function decoder(ctx, ab) {
  return new Promise((ok, ko) => {
    const p = ctx.decodeAudioData(ab, ok, ko); // forme ancienne (vieux Safari) et nouvelle
    if (p && p.then) p.then(ok, ko);
  });
}

// Les encodeurs ajoutent parfois quelques échantillons silencieux au début et à la fin :
// on les écarte pour que la boucle ne laisse aucun trou.
function bornes(b) {
  const n = b.length, seuil = 1e-4, d = [];
  for (let c = 0; c < b.numberOfChannels; c++) d.push(b.getChannelData(c));
  const fort = i => d.some(x => Math.abs(x[i]) > seuil);
  let a = 0; while (a < Math.min(n, 6000) && !fort(a)) a++;
  let z = n - 1; while (z > n - 6000 && z > a && !fort(z)) z--;
  return [a / b.sampleRate, (z + 1) / b.sampleRate];
}

export function prechargerMusique() {
  if (chargement) return chargement;
  const ctx = contexte();
  if (!ctx) { indisponible = true; return Promise.resolve(false); }
  chargement = fetch(FICHIER)
    .then(r => { if (!r.ok) throw new Error('musique ' + r.status); return r.arrayBuffer(); })
    .then(ab => decoder(ctx, ab))
    .then(b => { tampon = b; [debutBoucle, finBoucle] = bornes(b); return true; })
    .catch(e => { console.warn('Musique indisponible, le village reste en mode silencieux.', e); indisponible = true; return false; });
  return chargement;
}

export const musiqueIndisponible = () => indisponible;
export const musiqueEnCours = () => !!source;

function positionActuelle() {
  if (!source) return lirePosition();
  const lg = finBoucle - debutBoucle;
  return debutBoucle + ((departPos - debutBoucle) + (contexte().currentTime - departCtx)) % lg;
}
function lirePosition() {
  try { return parseFloat(sessionStorage.getItem(CLE_POSITION)) || 0; } catch (e) { return 0; }
}
function noterPosition() {
  try { sessionStorage.setItem(CLE_POSITION, String(positionActuelle())); } catch (e) {}
}

export async function jouerMusique() {
  voulue = true;
  const ok = await prechargerMusique();
  if (!ok || !voulue || source) return;
  const ctx = contexte();
  const t = ctx.currentTime;
  let pos = lirePosition();
  if (!(pos >= debutBoucle && pos < finBoucle)) pos = debutBoucle;
  source = ctx.createBufferSource();
  source.buffer = tampon;
  source.loop = true;
  source.loopStart = debutBoucle;
  source.loopEnd = finBoucle;
  fondu = ctx.createGain();
  fondu.gain.setValueAtTime(0, t);
  fondu.gain.linearRampToValueAtTime(1, t + 4); // arrivée douce, jamais brutale
  source.connect(fondu).connect(sortie('musique'));
  source.start(t, pos);
  departCtx = t; departPos = pos;
}

export function arreterMusique(duree = 1.2) {
  voulue = false;
  if (!source) return;
  noterPosition();
  const ctx = contexte(), t = ctx.currentTime;
  const s = source, f = fondu;
  f.gain.cancelScheduledValues(t);
  f.gain.setValueAtTime(f.gain.value, t);
  f.gain.linearRampToValueAtTime(0, t + duree);
  try { s.stop(t + duree + 0.05); } catch (e) {}
  s.onended = () => { try { s.disconnect(); f.disconnect(); } catch (e) {} };
  source = null; fondu = null;
}

// La position est retenue pour reprendre au même endroit après un changement de page
setInterval(() => { if (source) noterPosition(); }, 3000);
addEventListener('pagehide', () => { if (source) noterPosition(); });
