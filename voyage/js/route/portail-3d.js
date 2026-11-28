// Le portail de la grande route, en 3D : deux piliers de pierre (assises de briques, losanges de turquoise), un linteau avec une poutre de palmier et des créneaux,
// deux lanternes, deux bandes de laine, et — entre les piliers — un voile de lumière doré qui montre le début de la piste, au loin.
// Époque : Arabie du VIIe siècle → pierre, brique de terre, bois de palmier, laine, lampes à huile. Aucun écrit, aucune figure : seulement des motifs géométriques.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';
import { PORTAIL, obstacles } from './portail-plan.js';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);

// Ce que l'on voit à travers le voile : un ciel doré, des dunes, et la piste claire qui s'enfonce vers l'horizon
function textureVoile() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  const ciel = g.createLinearGradient(0, 0, 0, 300); ciel.addColorStop(0, '#74c7d2'); ciel.addColorStop(0.55, '#f6dc9a'); ciel.addColorStop(1, '#f2b866');
  g.fillStyle = ciel; g.fillRect(0, 0, 256, 512);
  g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(150, 215, 34, 0, 6.283); g.fill();                                   // le soleil, bas sur l'horizon
  g.fillStyle = '#d9a257'; g.beginPath(); g.moveTo(0, 300); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 292 - Math.sin(x * 0.034) * 16); g.lineTo(256, 330); g.lineTo(0, 330); g.fill();   // dunes lointaines
  g.fillStyle = '#c28a45'; g.beginPath(); g.moveTo(0, 318); for (let x = 0; x <= 256; x += 8) g.lineTo(x, 316 - Math.sin(x * 0.05 + 2) * 12); g.lineTo(256, 340); g.lineTo(0, 340); g.fill();
  const sable = g.createLinearGradient(0, 320, 0, 512); sable.addColorStop(0, '#e8c98c'); sable.addColorStop(1, '#d4a965'); g.fillStyle = sable; g.fillRect(0, 322, 256, 190);
  g.fillStyle = '#f6e3b4'; g.beginPath(); g.moveTo(121, 324); g.lineTo(135, 324); g.lineTo(206, 512); g.lineTo(50, 512); g.closePath(); g.fill();   // la piste, claire, qui part vers l'horizon
  g.fillStyle = '#6b4a30'; for (let k = 0; k < 6; k++) { const u = k / 6, y = 330 + u * u * 170, x = 128 + (k % 2 ? 1 : -1) * (6 + u * 62), h = 5 + u * 26; g.fillRect(x - 1.5 - u, y - h, 3 + u * 2, h); }   // les poteaux du balisage
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function creerPortail3D({ scene, H, colliders, ombres }) {
  const mat = materiau({ finesse: 1.4 });
  const groupe = new THREE.Group(); groupe.name = 'route-portail'; scene.add(groupe);
  const { x, z, cap } = PORTAIL;
  // le sol monte doucement vers l'est : on pose le portail sur son point le plus HAUT et on enfonce un socle de pierre dans la pente
  let y0 = -1e9; for (const dx of [-4, 0, 4]) for (const dz of [-1.5, 0, 1.5]) y0 = Math.max(y0, H(x + dz * Math.sin(cap) + dx * Math.cos(cap), z + dz * Math.cos(cap) - dx * Math.sin(cap)));
  groupe.position.set(x, y0, z); groupe.rotation.y = cap;        // repère local : z = sens de la traversée, x = de gauche à droite

  const pierre = '#b8a07a', pierreSombre = '#a58c64', brique = '#c4ab80', g = [];
  g.push(piece(B(), '#9a8062', { p: [0, -0.6, 0], s: [8.6, 2.2, 3.0], m: M.pierre }), piece(B(), pierreSombre, { p: [0, 0.2, -1.9], s: [6.2, 0.4, 1.4], m: M.pierre }), piece(B(), brique, { p: [0, 0.05, -2.8], s: [4.4, 0.3, 1.0], m: M.pierre }));   // le socle et deux marches
  for (const s of [-1, 1]) {
    g.push(piece(B(), pierreSombre, { p: [s * 2.5, 0.45, 0], s: [1.95, 0.5, 1.95], m: M.pierre }), piece(B(), pierre, { p: [s * 2.5, 2.7, 0], s: [1.5, 4.0, 1.5], m: M.pierre }),
      piece(B(), pierreSombre, { p: [s * 2.5, 4.9, 0], s: [1.85, 0.36, 1.85], m: M.pierre }));
    for (const y of [1.4, 2.4, 3.4]) g.push(piece(B(), brique, { p: [s * 2.5, y, 0], s: [1.56, 0.1, 1.56], m: M.pierre }));                       // les assises de briques
    for (const y of [1.9, 3.0, 4.1]) g.push(piece(B(), '#2bb3c0', { p: [s * 2.5, y, -0.77], s: [0.34, 0.34, 0.06], r: [0, 0, Math.PI / 4], m: M.terre }), piece(B(), '#c0504a', { p: [s * 2.5, y, -0.8], s: [0.14, 0.14, 0.06], r: [0, 0, Math.PI / 4], m: M.terre }));   // losanges de turquoise
  }
  g.push(piece(B(), pierreSombre, { p: [0, 5.4, 0], s: [6.9, 0.75, 1.6], m: M.pierre }), piece(B(), brique, { p: [0, 5.82, 0], s: [7.0, 0.1, 1.7], m: M.pierre }),
    piece(CYL(0.17, 0.19, 7.8, 7), '#6b4a30', { p: [0, 5.15, -0.95], r: [0, 0, Math.PI / 2], m: M.bois }));                                           // la poutre de palmier
  for (let k = 0; k < 6; k++) g.push(piece(B(), pierre, { p: [-3.0 + k * 1.2, 6.2, 0], s: [0.6, 0.6, 1.5], m: M.pierre }));                         // les créneaux
  for (const s of [-1, 1]) {            // les bandes de laine suspendues à la poutre
    g.push(piece(B(), s < 0 ? '#b5352a' : '#2bb3c0', { p: [s * 3.45, 4.15, -1.0], s: [0.5, 1.9, 0.04], m: M.laine }), piece(B(), '#e8d6a0', { p: [s * 3.45, 3.1, -1.0], s: [0.5, 0.14, 0.05], m: M.laine }));
    g.push(piece(CYL(0.015, 0.015, 0.6, 4), '#2b2320', { p: [s * 1.2, 4.7, -0.95] }));
  }
  const m = new THREE.Mesh(fusion(g), mat); m.castShadow = ombres; m.receiveShadow = ombres; groupe.add(m);

  // les deux lanternes (lampes à huile) et le voile de lumière : ce qui vit
  const lampes = [-1.2, 1.2].map(dx => { const l = new THREE.Mesh(SPH(0.17, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })); l.position.set(dx, 4.35, -0.95); groupe.add(l);
    const cage = new THREE.Mesh(CYL(0.2, 0.2, 0.34, 6), new THREE.MeshLambertMaterial({ color: '#5a3f28', wireframe: true })); cage.position.copy(l.position); groupe.add(cage); return l; });
  const voile = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.5), new THREE.MeshBasicMaterial({ map: textureVoile(), transparent: true, opacity: 0.94, side: THREE.DoubleSide, depthWrite: false }));
  voile.position.set(0, 2.45, 0); groupe.add(voile);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), new THREE.MeshBasicMaterial({ color: '#ffd98a', transparent: true, opacity: 0.35, depthWrite: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.set(0, 0.28, -2.9); groupe.add(halo);

  for (const o of obstacles()) colliders.push(o);
  return {
    groupe, y0,
    animer(dt, t) {
      voile.material.opacity = 0.9 + Math.sin(t * 1.3) * 0.05; voile.scale.set(1 + Math.sin(t * 0.9) * 0.012, 1 + Math.sin(t * 1.1 + 1) * 0.012, 1);
      halo.material.opacity = 0.3 + Math.sin(t * 1.6) * 0.08;
      lampes.forEach((l, i) => l.scale.setScalar(1 + Math.sin(t * 7 + i * 2) * 0.07));
    }
  };
}
