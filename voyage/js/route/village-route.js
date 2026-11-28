// Côté village : le relais de la grande route (guide fictif, carte ancienne, étal du sac), le panneau du seuil et l'éboulis qui ferme la piste
// tant que la Route n'est pas ouverte. L'éboulis a la même forme que decor.barrieres (ouvrir()) : regions.js l'ouvre au bon moment.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { Enfant } from '../personnages.js?v=4';
import { RELAIS_VILLAGE as RELAIS, SEUIL_VILLAGE } from './donnees.js';
import { creerPortail3D } from './portail-3d.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), DOD = r => new THREE.DodecahedronGeometry(r, 0), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s);

export function creerVillageRoute({ scene, H, colliders, ombres }) {
  const mat = materiau({ finesse: 1.4 }), matVent = materiau({ balance: 1.2 });
  const poser = (geo, m, x, z, rot = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, H(x, z), z); o.rotation.y = rot; o.castShadow = ombres; o.receiveShadow = ombres; scene.add(o); return o; };
  const gr = new THREE.Group(); gr.name = 'route-relais'; scene.add(gr);

  // le relais : un auvent de toile, une table avec la carte ancienne, un sac et des gourdes
  { const g = [];
    for (const [dx, dz] of [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]]) g.push(piece(CYL(0.09, 0.11, 2.6, 6), '#6b4a30', { p: [dx, 1.3, dz], m: M.bois }));
    g.push(piece(B(), '#c9a26a', { p: [0, 2.7, 0], s: [5.2, 0.08, 3.9], r: [0.09, 0, 0], m: M.tissu }), piece(B(), '#b5654a', { p: [0, 2.72, 0], s: [1.4, 0.09, 3.95], r: [0.09, 0, 0], m: M.tissu }));
    g.push(piece(B(), '#8a6440', { p: [0, 0.8, -0.6], s: [2.2, 0.1, 1.0], m: M.bois }), piece(B(), '#6b4a30', { p: [-0.95, 0.4, -0.6], s: [0.1, 0.8, 0.9] }), piece(B(), '#6b4a30', { p: [0.95, 0.4, -0.6], s: [0.1, 0.8, 0.9] }));
    g.push(piece(B(), '#efe0b8', { p: [-0.2, 0.87, -0.6], s: [0.9, 0.02, 0.6], r: [0, 0.15, 0] }), piece(B(), '#a7744a', { p: [0.7, 0.98, -0.6], s: [0.4, 0.22, 0.28], m: M.cuir }));
    g.push(piece(B(), '#c0504a', { p: [0, 0.03, 0.6], s: [3, 0.05, 1.6], m: M.laine }), piece(CYL(0.13, 0.15, 0.4, 8), '#b0643c', { p: [-1.8, 0.2, 0.4], m: M.terre }), piece(B(), '#8a6440', { p: [1.7, 0.3, 0.5], s: [0.7, 0.6, 0.5], m: M.cuir }));
    const o = poser(fusion(g), matVent, RELAIS.x, RELAIS.z, -0.3);
    for (const [dx, dz] of [[-2.2, -1.6], [2.2, -1.6], [-2.2, 1.6], [2.2, 1.6]]) colliders.push({ x: RELAIS.x + Math.cos(-0.3) * dx + Math.sin(-0.3) * dz, z: RELAIS.z - Math.sin(-0.3) * dx + Math.cos(-0.3) * dz, r: 0.3 });
    colliders.push({ x: RELAIS.x, z: RELAIS.z - 0.6, r: 1.2 });
    gr.userData.auvent = o; }
  // le panneau : « La grande route vers La Mecque »
  { const x = RELAIS.x - 4, z = RELAIS.z + 3, g = [piece(B(), '#6b4a30', { p: [0, 1.4, 0], s: [0.16, 2.8, 0.16], m: M.bois }), piece(B(), '#c9a26a', { p: [0.55, 2.35, 0], s: [1.9, 0.7, 0.07], m: M.bois }), piece(B(), '#8a6440', { p: [0.55, 2.35, 0.05], s: [1.7, 0.5, 0.03] }), piece(B(), '#c9a26a', { p: [-0.5, 1.6, 0], s: [1.2, 0.4, 0.07], r: [0, 0, 0.08], m: M.bois })];
    poser(fusion(g), mat, x, z, 0.2); colliders.push({ x, z, r: 0.35 }); gr.userData.panneau = { x, z }; }
  // le guide : un personnage fictif
  const guide = new Enfant(ombres, { tunique: '#7a5a3a', pantalon: '#cfc2a8', cheche: '#e8dcc4', peau: '#b57e58', sac: true, barbe: '#3a2a20' });
  { const x = RELAIS.x + 1.2, z = RELAIS.z + 1.8; guide.racine.position.set(x, H(x, z), z); guide.racine.rotation.y = Math.PI * 0.2; scene.add(guide.racine); colliders.push({ x, z, r: 0.6 }); gr.userData.guide = { x, z }; }

  // l'éboulis du seuil : ferme la piste tant que la route n'est pas ouverte (même forme que decor.barrieres)
  const cx = SEUIL_VILLAGE.x - 28, cz = SEUIL_VILLAGE.z + 2, cols = [];
  const g = [];
  for (let i = 0; i < 11; i++) g.push(piece(DOD(0.7 + (i % 3) * 0.35), i % 2 ? '#a8926f' : '#8f7d62', { p: [-6 + i * 1.2, 0.5 + (i % 4) * 0.25, (i % 2) * 0.6], r: [i, i * 0.7, 0], s: [1, 0.85, 1] }));
  g.push(piece(B(), '#8a6440', { p: [0, 1.2, 1.6], s: [0.14, 2.4, 0.14], m: M.bois }), piece(B(), '#c9a26a', { p: [0, 2.15, 1.65], s: [1.5, 0.6, 0.07], m: M.bois }));
  const eb = poser(fusion(g), mat, cx, cz, Math.PI / 2);
  for (let i = 0; i < 6; i++) { const c = { x: cx, z: cz - 6 + i * 2.4, r: 1.7 }; cols.push(c); colliders.push(c); }
  const barriere = { mesh: eb, cols, ouvert: false, ouvrir() { if (this.ouvert) return; this.ouvert = true; scene.remove(eb); for (const c of cols) { const k = colliders.indexOf(c); if (k >= 0) colliders.splice(k, 1); } } };

  // le portail de pierre : on le franchit pour arriver directement au départ de la grande route (voir portail-plan.js)
  const portail = creerPortail3D({ scene, H, colliders, ombres });

  return { RELAIS, guide, groupe: gr, barriere, panneau: gr.userData.panneau, positionGuide: gr.userData.guide, seuil: { x: cx, z: cz }, portail,
    animer(dt, t) { guide.animer(dt, 0, t); portail.animer(dt, t); } };
}
