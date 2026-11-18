// Le marché du village : trois étals, trois marchands (personnages fictifs), des objets utiles et des parures.
// On paie uniquement avec des Pièces de Nour gagnées en jouant. Prix affichés, confirmation avant chaque achat.
// Aucun hasard, aucune boîte mystère, aucun argent réel.
import * as THREE from 'three';
import { piece, fusion, materiau } from './formes.js?v=2';
import { Enfant } from './personnages.js?v=2';

const mat = materiau({ finesse: 1.4 });
const B = () => new THREE.BoxGeometry(1, 1, 1);
const CYL = (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s);
const SPH = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

export const MARCHANDS = {
  karim: { nom: 'Karim, le marchand de voyage', icone: '🧭', accueil: 'Bienvenue ! Tout pour bien voyager dans le désert.' },
  amina: { nom: 'Amina, tapis et lanternes', icone: '🧶', accueil: 'Regarde ces jolis tapis pour Sablo, tissés à la main !' },
  hassan: { nom: 'Hassan, l\'artisan du chameau', icone: '🐪', accueil: 'Des selles, des sacoches… et des habits pour toi aussi !' }
};

export const ARTICLES = [
  { id: 'boussole', marchand: 'karim', nom: 'La boussole', icone: '🧭', prix: 20, type: 'outil', desc: 'Une vraie boussole de voyageur.', effet: 'Une aiguille à l\'écran montre où aller pour ta mission.' },
  { id: 'carte', marchand: 'karim', nom: 'La carte du pays', icone: '🗺️', prix: 25, type: 'outil', desc: 'Une grande carte dessinée à la main.', effet: 'Bouton 🗺️ : voir tout le pays, les lieux à découvrir et un endroit secret.' },
  { id: 'sac', marchand: 'karim', nom: 'Le grand sac de voyage', icone: '🎒', prix: 25, type: 'outil', desc: 'Un sac solide en toile.', effet: 'Tu peux porter 6 objets au lieu de 3.' },
  { id: 'jumelles', marchand: 'karim', nom: 'Les jumelles', icone: '🔭', prix: 35, type: 'outil', desc: 'Pour observer très loin.', effet: 'Bouton 🔭 : regarder au loin. Les lanternes cachées brillent plus fort.' },
  { id: 'lanterne', marchand: 'karim', nom: 'La lanterne de voyage', icone: '🪔', prix: 20, type: 'outil', desc: 'Une lanterne en cuivre.', effet: 'Éclaire autour de toi la nuit, et permet d\'explorer la grotte des montagnes.' },
  { id: 'tapis-rouge', marchand: 'amina', nom: 'Tapis rouge et or', icone: '🟥', prix: 10, type: 'tapis', couleurs: ['#c94f3c', '#f5b942'], desc: 'Le tapis de selle de Sablo.', effet: 'Change le tapis de Sablo.' },
  { id: 'tapis-turquoise', marchand: 'amina', nom: 'Tapis turquoise', icone: '🟦', prix: 10, type: 'tapis', couleurs: ['#2bb3c0', '#fff8e7'], desc: 'Le tapis de selle de Sablo.', effet: 'Change le tapis de Sablo.' },
  { id: 'tapis-violet', marchand: 'amina', nom: 'Tapis violet', icone: '🟪', prix: 12, type: 'tapis', couleurs: ['#7b4fa0', '#f5b942'], desc: 'Le tapis de selle de Sablo.', effet: 'Change le tapis de Sablo.' },
  { id: 'tapis-nuit', marchand: 'amina', nom: 'Tapis bleu nuit étoilé', icone: '🌙', prix: 15, type: 'tapis', couleurs: ['#2d3a7a', '#ffe3a3'], desc: 'Bleu comme le ciel du soir.', effet: 'Change le tapis de Sablo.' },
  { id: 'lanterne-sablo', marchand: 'amina', nom: 'Petite lanterne de selle', icone: '🏮', prix: 12, type: 'deco', desc: 'Elle se balance quand Sablo marche.', effet: 'Une lanterne accrochée à la selle de Sablo.' },
  { id: 'selle-doree', marchand: 'hassan', nom: 'Selle dorée', icone: '🪑', prix: 18, type: 'selle', couleur: '#f5b942', desc: 'Une selle qui brille au soleil.', effet: 'Change la selle de Sablo.' },
  { id: 'selle-cuir', marchand: 'hassan', nom: 'Selle de cuir', icone: '🟫', prix: 12, type: 'selle', couleur: '#8a5a35', desc: 'Solide et confortable.', effet: 'Change la selle de Sablo.' },
  { id: 'sacoches', marchand: 'hassan', nom: 'Sacoches brodées', icone: '👜', prix: 15, type: 'sacoches', desc: 'Deux sacoches de chaque côté.', effet: 'Sablo porte de jolies sacoches.' },
  { id: 'pompons', marchand: 'hassan', nom: 'Collier à pompons', icone: '🎀', prix: 10, type: 'pompons', desc: 'Des pompons de toutes les couleurs.', effet: 'Un collier de fête pour Sablo.' },
  { id: 'cheche-bleu', marchand: 'hassan', nom: 'Chèche bleu', icone: '🧣', prix: 8, type: 'cheche', couleur: '#5d8fd6', desc: 'Un foulard qui protège du soleil.', effet: 'Change ton chèche.' },
  { id: 'cheche-vert', marchand: 'hassan', nom: 'Chèche vert', icone: '🧣', prix: 8, type: 'cheche', couleur: '#5fae7a', desc: 'Un foulard qui protège du soleil.', effet: 'Change ton chèche.' },
  { id: 'tunique-sable', marchand: 'hassan', nom: 'Tunique couleur sable', icone: '👘', prix: 10, type: 'tunique', couleur: '#cfa36a', desc: 'Une tunique légère.', effet: 'Change ta tunique.' },
  { id: 'tunique-indigo', marchand: 'hassan', nom: 'Tunique indigo', icone: '👘', prix: 10, type: 'tunique', couleur: '#4a5aa8', desc: 'Une tunique bleu profond.', effet: 'Change ta tunique.' }
];
export const article = id => ARTICLES.find(a => a.id === id);

// ---------- les étals ----------
function geoEtal(c1, c2, marchandises) {
  const p = [];
  p.push(piece(B(), '#8a5a35', { p: [0, 0.85, 0], s: [3.2, 0.12, 1.2] }));
  p.push(piece(B(), '#a77a4e', { p: [0, 0.45, 0.55], s: [3.2, 0.8, 0.08] }));
  for (const [x, z] of [[-1.5, -0.55], [1.5, -0.55], [-1.5, 0.55], [1.5, 0.55]]) p.push(piece(CYL(0.06, 0.07, 2.8, 6), '#6b4428', { p: [x, 1.4, z] }));
  for (let i = 0; i < 8; i++) p.push(piece(B(), i % 2 ? c1 : c2, { p: [-1.6 + i * 0.4 + 0.2, 2.75, 0.1], r: [0.28, 0, 0], s: [0.4, 0.05, 1.7] }));
  for (let i = 0; i < 8; i++) p.push(piece(new THREE.ConeGeometry(0.12, 0.25, 4), i % 2 ? c2 : c1, { p: [-1.6 + i * 0.4 + 0.2, 2.42, 0.98], r: [Math.PI, 0, 0] }));
  p.push(...marchandises);
  return fusion(p);
}
function marchandisesVoyage() {
  return [
    piece(CYL(0.16, 0.16, 0.05, 14), '#c9a14a', { p: [-1.1, 0.94, 0.1] }), piece(CYL(0.12, 0.12, 0.06, 14), '#fff8e7', { p: [-1.1, 0.96, 0.1] }),
    piece(B(), '#c94f3c', { p: [-1.1, 0.99, 0.1], s: [0.02, 0.01, 0.18] }),
    piece(B(), '#efe0bf', { p: [-0.4, 0.93, 0.15], r: [0, 0.3, 0], s: [0.6, 0.02, 0.45] }),                // carte
    piece(B(), '#a7744a', { p: [0.4, 1.1, 0.1], s: [0.4, 0.45, 0.25] }), piece(B(), '#8a5a35', { p: [0.4, 1.35, 0.1], s: [0.42, 0.06, 0.27] }), // sac
    piece(CYL(0.06, 0.06, 0.25, 8), '#3a3a4a', { p: [1.0, 0.98, 0.0], r: [0, 0, Math.PI / 2] }), piece(CYL(0.06, 0.06, 0.25, 8), '#3a3a4a', { p: [1.0, 0.98, 0.15], r: [0, 0, Math.PI / 2] }), // jumelles
    piece(CYL(0.1, 0.12, 0.25, 6), '#ffd36b', { p: [1.3, 1.95, 0.5] }), piece(new THREE.ConeGeometry(0.15, 0.15, 6), '#b8741f', { p: [1.3, 2.15, 0.5] })
  ];
}
function marchandisesTapis() {
  const t = [];
  [['#c94f3c', '#f5b942'], ['#2bb3c0', '#fff8e7'], ['#7b4fa0', '#f5b942'], ['#2d3a7a', '#ffe3a3']].forEach(([a, b], i) => {
    t.push(piece(CYL(0.13, 0.13, 1.0, 10), a, { p: [-1.2 + i * 0.5, 1.05, 0.1], r: [Math.PI / 2, 0, 0] }));
    t.push(piece(CYL(0.135, 0.135, 0.15, 10), b, { p: [-1.2 + i * 0.5, 1.05, 0.1], r: [Math.PI / 2, 0, 0] }));
  });
  for (let i = 0; i < 4; i++) { t.push(piece(CYL(0.1, 0.12, 0.25, 6), ['#ffd36b', '#ff9fb2', '#9fe1cb', '#ffe3a3'][i], { p: [-1.2 + i * 0.8, 2.2, 0.5] })); t.push(piece(new THREE.ConeGeometry(0.15, 0.15, 6), '#b8741f', { p: [-1.2 + i * 0.8, 2.4, 0.5] })); }
  t.push(piece(B(), '#c94f3c', { p: [0, 1.6, -0.62], s: [2.6, 1.3, 0.04] }), piece(B(), '#f5b942', { p: [0, 1.6, -0.6], s: [2.0, 0.9, 0.04] }));
  return t;
}
function marchandisesChameau() {
  return [
    piece(B(), '#f5b942', { p: [-0.9, 1.05, 0.1], s: [0.8, 0.25, 0.6] }), piece(B(), '#c94f3c', { p: [-0.9, 0.95, 0.1], s: [0.95, 0.06, 0.7] }),
    piece(B(), '#a7744a', { p: [0.2, 1.05, 0.1], s: [0.5, 0.35, 0.2] }), piece(B(), '#2bb3c0', { p: [0.2, 1.05, 0.21], s: [0.3, 0.15, 0.02] }),
    ...[0, 1, 2, 3, 4].map(i => piece(SPH(0.07, 6, 5), ['#c94f3c', '#f5b942', '#2bb3c0', '#7b4fa0', '#ff9fb2'][i], { p: [0.8 + i * 0.13, 0.96, 0.15] })),
    piece(B(), '#5d8fd6', { p: [1.0, 1.8, -0.6], s: [0.5, 0.9, 0.03] }), piece(B(), '#5fae7a', { p: [1.3, 1.8, -0.6], s: [0.4, 0.9, 0.03] })
  ];
}

export function creerMarche({ scene, terrain, colliders, ombres }) {
  const H = (x, z) => terrain.hauteur(x, z);
  const ux = -0.928, uz = 0.371, px = -uz, pz = ux;      // le long du chemin du camp, juste après la porte ouest
  const etals = [
    { id: 'karim', d: 57, cote: 1, c: ['#2bb3c0', '#fff8e7'], m: marchandisesVoyage(), habit: { tunique: '#2d5b8a', cheche: '#fff3dc' } },
    { id: 'amina', d: 64, cote: -1, c: ['#c94f3c', '#f3e3c3'], m: marchandisesTapis(), habit: { tunique: '#7b4fa0', cheche: '#f6dbe6', peau: '#c98e66' } },
    { id: 'hassan', d: 71, cote: 1, c: ['#f5b942', '#fff3dc'], m: marchandisesChameau(), habit: { tunique: '#8a5a35', cheche: '#f6f0e2', peau: '#b97f58' } }
  ];
  const points = [];
  for (const e of etals) {
    const x = ux * e.d + px * 5.5 * e.cote, z = uz * e.d + pz * 5.5 * e.cote;
    const rot = Math.atan2(-px * e.cote, -pz * e.cote);   // l'étal regarde le chemin
    const m = new THREE.Mesh(geoEtal(e.c[0], e.c[1], e.m), mat);
    m.position.set(x, H(x, z), z); m.rotation.y = rot; m.castShadow = ombres; m.receiveShadow = ombres; scene.add(m);
    const v = new Enfant(ombres, { ...e.habit, pantalon: '#4a3a2a', sac: false });
    v.racine.scale.setScalar(1.25);
    const bx = x + px * e.cote * 1.0, bz = z + pz * e.cote * 1.0;
    v.racine.position.set(bx, H(bx, bz), bz); v.racine.rotation.y = rot; scene.add(v.racine);
    colliders.push({ x, z, r: 1.7 }, { x: bx, z: bz, r: 0.5 });
    points.push({ id: e.id, x: x - px * e.cote * 1.6, z: z - pz * e.cote * 1.6, r: 3, vendeur: v, rot });
  }
  return {
    centre: { x: ux * 64, z: uz * 64 },
    points,
    maj(dt, t, J) { for (const p of points) { p.vendeur.animer(dt, 0, t); const d = Math.hypot(J.x - p.x, J.z - p.z); if (d < 7) p.vendeur.tete.rotation.y = Math.max(-0.8, Math.min(0.8, Math.sin(t * 0.3) * 0.2)); } }
  };
}
