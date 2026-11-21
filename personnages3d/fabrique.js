// Fabrique de personnages : renvoie le nouveau personnage N1 ou, au moindre problème, l'ancien (secours automatique).
// Secours si : chargement impossible (réseau, 404), délai dépassé (8 s), WebGL absent, interrupteur coupé, ou ?perso=ancien dans l'adresse.
import { urlModele, decisionSecours, creerAvecSecours } from './logique.js';

// INTERRUPTEUR GÉNÉRAL : mettre false remet partout l'ancien personnage (arrêt d'urgence). Défaut : true.
export const INTERRUPTEUR = true;
export const DELAI_MS = 8000;

const cache = new Map();   // genre → Promise<gltf> : un seul chargement par genre, partagé entre l'enfant et l'ami
async function lireReseau(url) { const r = await fetch(url); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url); return r.arrayBuffer(); }

export function chargerModele(genre, { lire = lireReseau, dossier = new URL('./modeles/', import.meta.url).href, GLTFLoader } = {}) {
  const cle = urlModele(genre);
  if (!cache.has(cle)) {
    const p = (async () => {
      const Loader = GLTFLoader || (await import('three/addons/loaders/GLTFLoader.js')).GLTFLoader;
      const donnees = await lire(dossier + cle);
      return new Promise((ok, ko) => new Loader().parse(donnees, dossier, ok, ko));
    })();
    p.catch(() => cache.delete(cle));                       // un échec n'est pas gardé : le prochain essai peut réussir
    cache.set(cle, p);
  }
  return cache.get(cle);
}
export const viderCache = () => cache.clear();

// creerAncien() : fabrique l'ancien personnage (Voyageur), fournie par le jeu (la fabrique n'importe pas le Grand Voyage).
export async function creerPersonnage({ genre, peau = 1, ombres = false, creerAncien, parametre, webgl = true, interrupteur = INTERRUPTEUR, delaiMs = DELAI_MS, options } = {}) {
  const decision = decisionSecours({ parametre, interrupteur, webgl });
  return creerAvecSecours({
    // import dynamique : si three/addons (CDN) est indisponible, l'échec est attrapé ici et le secours prend le relais (un import statique casserait tout le jeu)
    charger: async () => { const { PersonnageGLB } = await import('./personnage-glb.js'); return new PersonnageGLB(await chargerModele(genre, options), { genre, peau, ombres }); },
    creerAncien, delaiMs, forcer: decision === 'ancien' ? 'ancien' : undefined });
}
