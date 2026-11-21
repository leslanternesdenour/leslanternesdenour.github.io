// Socle commun — voix de la maîtresse.
// Même système que le reste du site : quelques mp3 + un voix.json
// { id: [fichier, debut, fin] }. Les textes islamiques sont générés à partir
// de l'alphabet arabe et vérifiés avant d'être mis en ligne.
// Les voix passent par leur propre piste : baisser la musique ne les baisse pas,
// et pendant qu'elles parlent, la musique et les effets s'effacent.
// Règle : aucune synthèse vocale du téléphone n'est jamais utilisée ici.
// Si une phrase n'existe pas encore, on ne dit rien : l'image guide l'enfant.
import { contexte, sortie, retirer } from './audio.js?v=1';

let table = null, base = 'voix/';
const enAttente = {};   // voix ajoutées avant le chargement de la table (contenus Premium)
const tampons = new Map(); // fichier -> Promise<AudioBuffer>
let enCours = null;

export async function chargerVoix(dossier = 'voix/') {
  base = dossier;
  try {
    const r = await fetch(base + 'voix.json', { cache: 'no-cache' });
    if (!r.ok) return false;
    table = Object.assign(await r.json(), enAttente);
    return true;
  } catch (e) { table = null; return false; }
}

// Ajoute des voix (identifiant → [fichier, début, fin]). Un fichier qui commence par « / » est une adresse du site :
// c'est le cas des voix Premium, servies par /api/premium/ (jamais gardées en cache).
export function ajouterVoix(entrees) {
  for (const [id, v] of Object.entries(entrees || {})) {
    if (!Array.isArray(v) || typeof v[0] !== 'string' || !(v[2] > v[1])) continue;
    const e = [v[0], v[1], v[2]];
    enAttente[id] = e; if (table) table[id] = e;
  }
}

function tampon(fichier) {
  if (!tampons.has(fichier)) {
    const ctx = contexte();
    tampons.set(fichier, fetch(fichier.startsWith('/') ? fichier : base + fichier).then(r => r.arrayBuffer())
      .then(ab => new Promise((ok, ko) => { const p = ctx.decodeAudioData(ab, ok, ko); if (p && p.then) p.then(ok, ko); })));
  }
  return tampons.get(fichier);
}

export function existe(id) { return !!(table && table[id]); }

export async function dire(id, fini) {
  if (!existe(id) || !contexte()) { fini && fini(false); return false; }
  arreterVoix();
  const [f, debut, finPhrase] = table[id];
  const jeton = {};
  enCours = jeton;
  let b;
  try { b = await tampon(f); } catch (e) { enCours = null; fini && fini(false); return false; }
  if (enCours !== jeton) return false;
  const ctx = contexte();
  const s = ctx.createBufferSource();
  s.buffer = b;
  s.connect(sortie('voix'));
  retirer('musique', 'voix', 0.3);
  retirer('effets', 'voix', 0.45);
  s.onended = () => {
    if (enCours === jeton) { enCours = null; retirer('musique', 'voix', 1); retirer('effets', 'voix', 1); }
    fini && fini(true);
  };
  jeton.source = s;
  s.start(ctx.currentTime + 0.02, debut, Math.max(0.05, finPhrase - debut));
  return true;
}

export function arreterVoix() {
  if (enCours && enCours.source) { try { enCours.source.stop(); } catch (e) {} }
  enCours = null;
  retirer('musique', 'voix', 1);
  retirer('effets', 'voix', 1);
}
