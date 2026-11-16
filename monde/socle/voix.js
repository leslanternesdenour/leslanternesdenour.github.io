// Socle commun — voix de la maîtresse.
// Même système que le reste du site : quelques mp3 + un voix.json
// { id: [fichier, debut, fin] }. Les textes islamiques sont générés à partir
// de l'alphabet arabe et vérifiés avant d'être mis en ligne.
// Règle : aucune synthèse vocale du téléphone n'est jamais utilisée ici.
// Si une phrase n'existe pas encore, on ne dit rien : l'image guide l'enfant.

let table = null;
const fichiers = new Map();
let enCours = null;
let actif = true;

export async function chargerVoix(base = 'voix/') {
  try {
    const r = await fetch(base + 'voix.json', { cache: 'no-cache' });
    if (!r.ok) return false;
    table = await r.json();
    for (const id in table) {
      const f = table[id][0];
      if (!fichiers.has(f)) {
        const a = new Audio(base + f);
        a.preload = 'auto';
        fichiers.set(f, a);
      }
    }
    return true;
  } catch (e) {
    table = null;
    return false;
  }
}

export function voixActive(oui) { actif = !!oui; if (!actif) arreterVoix(); }

export function existe(id) { return !!(table && table[id]); }

export function dire(id, fini) {
  if (!actif || !existe(id)) { fini && fini(false); return false; }
  arreterVoix();
  const [f, debut, fin] = table[id];
  const a = fichiers.get(f);
  if (!a) { fini && fini(false); return false; }
  const jeton = {};
  enCours = jeton;
  a.currentTime = debut;
  const surveiller = () => {
    if (enCours !== jeton) return;
    if (a.currentTime >= fin || a.ended) { a.pause(); enCours = null; fini && fini(true); return; }
    requestAnimationFrame(surveiller);
  };
  a.play().then(surveiller).catch(() => { enCours = null; fini && fini(false); });
  return true;
}

export function arreterVoix() {
  enCours = null;
  fichiers.forEach(a => { try { a.pause(); } catch (e) {} });
}
