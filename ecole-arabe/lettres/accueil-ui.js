// ACCUEIL ILLUSTRÉ DE L'ÉCOLE DES LETTRES — la grande porte (bouton principal), les salles en vignettes, la progression en lanternes.
// Conçu pour un enfant de 3 ans : peu de texte, de grandes images, une seule action évidente (toucher la porte).
import { svgSalle } from '../commun/decor.js?v=2';
const OR = '#e8b53a', OR2 = '#b9822a';
// La grande porte de l'école : bois sculpté, cadre doré, deux lanternes, marches, lumière chaude qui s'échappe.
export function svgPorte() {
  const studs = (x0, y, n, step) => Array.from({ length: n }, (_, i) => `<circle cx="${x0 + i * step}" cy="${y}" r="3.6" fill="${OR}"/>`).join('');
  const lanterne = x => `<g class="lant" style="--d:3.6s;transform-origin:${x}px 40px"><path d="M${x} 20v36" stroke="${OR2}" stroke-width="3"/><path d="M${x - 11} 56h22l4 8h-30z" fill="${OR}"/><path d="M${x - 15} 64h30v44q-15 14 -30 0z" fill="#ffd666" stroke="${OR2}" stroke-width="3"/><path d="M${x} 64v48M${x - 8} 66v40M${x + 8} 66v40" stroke="${OR2}" stroke-width="1.8" fill="none"/><circle cx="${x}" cy="90" r="46" fill="#ffe29a" opacity=".35"/></g>`;
  return `<svg class="porte-svg" viewBox="0 0 320 400" role="img" aria-label="La grande porte de l'école" xmlns="http://www.w3.org/2000/svg"><defs>
  <linearGradient id="pOr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset=".55" stop-color="${OR}"/><stop offset="1" stop-color="${OR2}"/></linearGradient>
  <linearGradient id="pBois" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4a2a"/><stop offset=".5" stop-color="#a86f40"/><stop offset="1" stop-color="#6a4126"/></linearGradient>
  <radialGradient id="pLum" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff3c2"/><stop offset="1" stop-color="#ffb347"/></radialGradient></defs>
  <ellipse cx="160" cy="372" rx="150" ry="16" fill="#000" opacity=".25"/>
  <path d="M40 374V150Q40 40 160 20Q280 40 280 150V374Z" fill="url(#pOr)" stroke="${OR2}" stroke-width="4"/>
  <path d="M58 374V152Q58 62 160 42Q262 62 262 152V374Z" fill="url(#pLum)"/>
  <path d="M80 374V158Q80 82 160 64Q240 82 240 158V374Z" fill="#fff6d0" opacity=".5"/>
  <g class="battant-g"><path d="M62 374V156Q62 86 160 66V374Z" fill="url(#pBois)" stroke="#4a2814" stroke-width="3"/></g><g class="battant-d"><path d="M258 374V156Q258 86 160 66V374Z" fill="url(#pBois)" stroke="#4a2814" stroke-width="3"/></g>
  <g fill="none" stroke="#3e2414" stroke-opacity=".6" stroke-width="3"><rect x="76" y="150" width="64" height="86" rx="12"/><rect x="76" y="252" width="64" height="100" rx="12"/><rect x="180" y="150" width="64" height="86" rx="12"/><rect x="180" y="252" width="64" height="100" rx="12"/>
   <path d="M108 164l14 14-14 14-14-14zM212 164l14 14-14 14-14-14z"/><path d="M108 268l14 14-14 14-14-14zM212 268l14 14-14 14-14-14z"/></g>
  ${studs(74, 246, 4, 20)}${studs(190, 246, 4, 20)}
  <path d="M160 66V374" stroke="#3a200e" stroke-width="5"/>
  <circle cx="146" cy="270" r="9" fill="${OR}" stroke="${OR2}" stroke-width="2"/><circle cx="174" cy="270" r="9" fill="${OR}" stroke="${OR2}" stroke-width="2"/>
  <path d="M160 6l7 12 13-4-4 13 12 6-12 6 4 13-13-4-7 12-7-12-13 4 4-13-12-6 12-6-4-13 13 4z" fill="url(#pOr)" stroke="${OR2}" stroke-width="2"/>
  <rect x="20" y="368" width="280" height="14" rx="4" fill="#c9a06a" stroke="#8a6a3a" stroke-width="2"/><rect x="6" y="380" width="308" height="14" rx="4" fill="#d9b47a" stroke="#8a6a3a" stroke-width="2"/>
  ${lanterne(14)}${lanterne(306)}</svg>`;
}
export const COURT = { decouvrir: 'Les 28 lettres', chasse: 'Trouve la lettre', formes: 'Les formes', trace: 'Dessine la lettre', puzzle: 'Le puzzle', son: 'Écoute et choisis', 'parcours-sons': 'Suis les sons', jumelles: 'Lettres jumelles', intrus: "Trouve l'intrus", defi: 'Le grand défi', collection: 'Ma collection' };
export const NOMS_COURTS = { jardin: 'Les lettres', atelier: 'Les formes', galerie: 'Les sons', defis: 'Les défis', palais: 'Ma bibliothèque', parcours: 'Le chemin' };
const SALLE_VIGN = { jardin: 'lettres', atelier: 'formes', galerie: 'sons', defis: 'defis', palais: 'biblio' };
export const vignette = id => SALLE_VIGN[id] ? svgSalle(SALLE_VIGN[id], 560, 420) : '';
// Chemin des 8 lanternes : allumée = chapitre terminé
export const lanternes = (fait) => `<span class="chemin-l" role="img" aria-label="Lanternes allumées">${fait.map(f => `<i class="${f ? 'on' : ''}"></i>`).join('')}</span>`;
