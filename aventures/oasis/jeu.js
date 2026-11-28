// LES BÂTISSEURS DE L'OASIS — interface : une grille de neuf parcelles, une gourde, trois dunes à explorer pour trouver la source. Pas de voix, pas de 3D.
import { $, lsGet, lsSet, h, profil, etoilesTexte } from '../commun/mini.js?v=1';
import * as L from './logique.js?v=1';
const CLE = 'aventure_oasis';
let etat = L.lire(lsGet(CLE)), source = L.cacherSource();
const grille = $('grille'), msg = $('msg'), dunes = $('dunes');
const SYMBOLES = ['', '🌱', '🌿', '🌴', '🌴'], NOMS = ['vide : touche pour planter', 'une graine : touche pour arroser', 'une jeune pousse : touche pour arroser', 'un palmier chargé de dattes : touche pour récolter', 'un palmier qui se repose : touche pour l\'arroser'];
const sauver = () => lsSet(CLE, etat);
function dire(texte, bien) { msg.textContent = texte; msg.classList.toggle('bien', !!bien); }
function dessiner() {
  grille.replaceChildren(...etat.parcelles.map((p, i) => h('button', { type: 'button', classe: 'parcelle p' + p, 'aria-label': 'Parcelle ' + (i + 1) + ' : ' + NOMS[p], onclick: () => { const r = L.agir(etat, i); dire(r.msg, r.ok); if (r.ok) sauver(); dessiner(); } }, SYMBOLES[p] || '·')));
  const n = L.palmiers(etat), et = L.etoiles(etat);
  $('gourde').textContent = '💧 ' + etat.gouttes + ' / ' + L.GOURDE_MAX;
  $('bilan').textContent = '🌴 ' + n + ' / ' + L.NB_PARCELLES + ' palmiers · 🟤 ' + etat.dattes + ' datte(s) · ' + etoilesTexte(et) + (L.termine(etat) ? ' · 🎓 Bâtisseur de l\'oasis !' : '');
  $('invites').textContent = L.invites(etat) ? '🤝 ' + L.invites(etat) + ' voyageur(s) accueilli(s) avec tes dattes.' : '';
}
function monterDunes() {
  dunes.replaceChildren(...[0, 1, 2].map(d => h('button', { type: 'button', 'aria-label': 'Explorer la dune ' + (d + 1), onclick: () => { const r = L.chercherEau(etat, d, source); dire(r.msg, r.ok); if (r.trouve) { source = L.cacherSource(); sauver(); dessiner(); } } }, '🏜️')));
}
$('recommencer').addEventListener('click', () => { if (confirm('Recommencer une oasis toute neuve ? Tes palmiers actuels seront effacés.')) { etat = L.etatInitial(); source = L.cacherSource(); sauver(); dire('Une oasis toute neuve t\'attend !', true); dessiner(); } });
profil(); monterDunes(); dessiner();
dire("Cherche de l'eau sous les dunes, puis touche une parcelle pour planter.");