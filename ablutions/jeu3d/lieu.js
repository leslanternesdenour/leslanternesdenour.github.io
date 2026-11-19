// La cour des ablutions : sol dallé, mur décoré, robinets en cuivre, tabourets de pierre, rigole d'eau, plantes et lanternes.
// Tout est dessiné par le code (aucune image à télécharger).
import * as THREE from 'three';
import { ROBINET } from './gestes.js?v=2';

const STATION_ECART = 2.2, NB = 3, MUR_Z = 0.64;              // le mur est à 0,64 m devant le tabouret
export const STATIONS = Array.from({ length: NB }, (_, i) => ({ i, x: (i - (NB - 1) / 2) * STATION_ECART, z: 0 }));

function toile(l, h, dessin) { const c = document.createElement('canvas'); c.width = l; c.height = h; dessin(c.getContext('2d'), l, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const alea = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);

// ---------- textures ----------
function texDalles() {
  return toile(512, 512, (x, l, h) => {
    x.fillStyle = '#e9dcc3'; x.fillRect(0, 0, l, h);
    const n = 4, c = l / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = 228 + Math.floor(alea() * 14) - 7;
      x.fillStyle = `rgb(${v},${v - 12},${v - 34})`; x.fillRect(i * c + 3, j * c + 3, c - 6, c - 6);
      for (let k = 0; k < 40; k++) { x.fillStyle = `rgba(150,120,80,${0.04 + alea() * 0.05})`; x.fillRect(i * c + alea() * c, j * c + alea() * c, 2 + alea() * 4, 2 + alea() * 3); }
    }
    x.strokeStyle = '#c7b391'; x.lineWidth = 6; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * c, 0); x.lineTo(i * c, h); x.stroke(); x.beginPath(); x.moveTo(0, i * c); x.lineTo(l, i * c); x.stroke(); }
    // une petite étoile turquoise aux croisements
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) { x.save(); x.translate(i * c, j * c); x.rotate(Math.PI / 4); x.fillStyle = '#2bb3c0'; x.fillRect(-9, -9, 18, 18); x.fillStyle = '#fff8e7'; x.fillRect(-4, -4, 8, 8); x.restore(); }
  });
}
function texZellige() {
  return toile(512, 128, (x, l, h) => {
    x.fillStyle = '#fff8e7'; x.fillRect(0, 0, l, h);
    const c = 64;
    for (let i = 0; i < l / c; i++) {
      x.save(); x.translate(i * c + c / 2, h / 2);
      x.fillStyle = '#1d8f9c'; for (let k = 0; k < 8; k++) { x.rotate(Math.PI / 4); x.fillRect(-6, -28, 12, 22); }
      x.fillStyle = '#f5b942'; x.beginPath(); x.arc(0, 0, 9, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2bb3c0'; x.beginPath(); x.arc(0, 0, 4, 0, Math.PI * 2); x.fill();
      x.restore();
    }
    x.fillStyle = '#1d8f9c'; x.fillRect(0, 0, l, 7); x.fillRect(0, h - 7, l, 7);
  });
}
function texEnduit() {
  return toile(256, 256, (x, l, h) => {
    x.fillStyle = '#f1e4c9'; x.fillRect(0, 0, l, h);
    for (let k = 0; k < 900; k++) { const v = alea(); x.fillStyle = v > 0.5 ? 'rgba(255,255,255,.18)' : 'rgba(170,140,100,.10)'; x.fillRect(alea() * l, alea() * h, 1 + alea() * 3, 1 + alea() * 3); }
  });
}
// des stries qui défilent : le filet d'eau et l'eau de la rigole
export function texEau() {
  const t = toile(64, 256, (x, l, h) => {
    const g = x.createLinearGradient(0, 0, l, 0); g.addColorStop(0, 'rgba(160,225,240,.25)'); g.addColorStop(0.5, 'rgba(235,252,255,.95)'); g.addColorStop(1, 'rgba(160,225,240,.25)');
    x.fillStyle = g; x.fillRect(0, 0, l, h);
    for (let k = 0; k < 26; k++) { x.fillStyle = `rgba(255,255,255,${0.3 + alea() * 0.5})`; x.fillRect(8 + alea() * 48, alea() * h, 2 + alea() * 4, 10 + alea() * 30); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
export function texRond() {
  return toile(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
}
function texEtoile() {
  return toile(64, 64, (x) => {
    x.translate(32, 32); x.fillStyle = '#fff6c8';
    x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 7 : 30, a = i * Math.PI / 4; x.lineTo(Math.sin(a) * r, Math.cos(a) * r); } x.closePath(); x.fill();
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 22); g.addColorStop(0, 'rgba(255,240,180,.9)'); g.addColorStop(1, 'rgba(255,240,180,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.fill();
  });
}

// ---------- la cour ----------
export function creerLieu(scene, { ombres }) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
  const ajout = (g, m, p, r, ombre = true) => { const o = new THREE.Mesh(g, m); if (p) o.position.set(...p); if (r) o.rotation.set(...r); o.castShadow = ombres && ombre; o.receiveShadow = ombres; scene.add(o); return o; };
  const cuivre = M('#c9893f', { metalness: 0.55, roughness: 0.38 }), cuivreClair = M('#e3ad62', { metalness: 0.5, roughness: 0.35 });
  const pierre = M('#d7c4a2'), pierreSombre = M('#bba584'), bois = M('#8a5a34');

  // le sol
  const tD = texDalles(); tD.wrapS = tD.wrapT = THREE.RepeatWrapping; tD.repeat.set(6, 4); tD.anisotropy = 4;
  ajout(new THREE.PlaneGeometry(13, 8.5), M('#ffffff', { map: tD }), [0, 0, -2.6], [-Math.PI / 2, 0, 0], false);

  // le mur du fond, avec une bande de zellige et des arcs au-dessus de chaque robinet
  const tE = texEnduit(); tE.wrapS = tE.wrapT = THREE.RepeatWrapping; tE.repeat.set(5, 1.2);
  const mur = M('#ffffff', { map: tE });
  ajout(new THREE.BoxGeometry(7.6, 2.9, 0.3), mur, [0, 1.45, MUR_Z + 0.15]);
  const tZ = texZellige(); tZ.wrapS = THREE.RepeatWrapping; tZ.repeat.set(8, 1);
  ajout(new THREE.PlaneGeometry(7.6, 0.3), M('#ffffff', { map: tZ, roughness: 0.4 }), [0, 0.95, MUR_Z - 0.005], [0, Math.PI, 0], false);   // tournée vers la cour
  ajout(new THREE.BoxGeometry(7.7, 0.12, 0.42), pierreSombre, [0, 2.92, MUR_Z + 0.12]);         // le chaperon du mur
  for (const s of STATIONS) {
    // un arc creusé au-dessus du robinet
    const forme = new THREE.Shape(); forme.moveTo(-0.38, 0); forme.lineTo(-0.38, 0.75); forme.absarc(0, 0.75, 0.38, Math.PI, 0, true); forme.lineTo(0.38, 0); forme.lineTo(-0.38, 0);
    const niche = ajout(new THREE.ShapeGeometry(forme, 16), M('#e4d1ad'), [s.x, 1.12, MUR_Z - 0.006], [0, Math.PI, 0], false);
    const bord = new THREE.Shape(); bord.moveTo(-0.44, 0); bord.lineTo(-0.44, 0.75); bord.absarc(0, 0.75, 0.44, Math.PI, 0, true); bord.lineTo(0.44, 0); bord.lineTo(0.38, 0); bord.lineTo(0.38, 0.75); bord.absarc(0, 0.75, 0.38, 0, Math.PI, false); bord.lineTo(-0.38, 0);
    ajout(new THREE.ShapeGeometry(bord, 16), M('#2bb3c0', { roughness: 0.5, side: THREE.DoubleSide }), [s.x, 1.12, MUR_Z - 0.008], [0, Math.PI, 0], false);
    // le robinet en cuivre : le tuyau qui sort du mur, le bec, la manette
    const r = { x: s.x + ROBINET.x, y: ROBINET.y, z: ROBINET.z };
    ajout(new THREE.CylinderGeometry(0.03, 0.03, MUR_Z - r.z + 0.02, 12), cuivre, [r.x, r.y + 0.06, (MUR_Z + r.z) / 2], [Math.PI / 2, 0, 0]);
    ajout(new THREE.SphereGeometry(0.035, 12, 10), cuivre, [r.x, r.y + 0.06, r.z]);
    ajout(new THREE.CylinderGeometry(0.022, 0.016, 0.07, 12), cuivreClair, [r.x, r.y + 0.02, r.z]);
    ajout(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), cuivre, [r.x, r.y + 0.06, MUR_Z - 0.01], [Math.PI / 2, 0, 0]);   // la rosace au mur
    const manette = new THREE.Group(); manette.position.set(r.x, r.y + 0.11, r.z + 0.08); scene.add(manette);
    for (const a of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.12, 8), cuivreClair); m.rotation.set(Math.PI / 2, 0, 0); m.rotation.y = a; manette.add(m); }
    { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), cuivre); m.position.y = -0.025; manette.add(m); }
    s.manette = manette; s.robinet = r;
    // le tabouret de pierre
    ajout(new THREE.CylinderGeometry(0.16, 0.18, 0.26, 18), pierre, [s.x, 0.13, s.z - 0.03]);
    ajout(new THREE.CylinderGeometry(0.17, 0.17, 0.03, 18), pierreSombre, [s.x, 0.275, s.z - 0.03]);
  }
  // la rigole au pied du mur, avec sa bordure et l'eau qui coule doucement
  const rigZ0 = 0.36, rigZ1 = MUR_Z;
  ajout(new THREE.BoxGeometry(7.6, 0.06, 0.05), pierreSombre, [0, 0.03, rigZ0 - 0.025]);
  ajout(new THREE.PlaneGeometry(7.6, rigZ1 - rigZ0), M('#8ccbd3', { roughness: 0.3 }), [0, 0.004, (rigZ0 + rigZ1) / 2], [-Math.PI / 2, 0, 0], false);
  const tEauR = texEau(); tEauR.repeat.set(30, 1); tEauR.rotation = Math.PI / 2;
  const eauRigole = ajout(new THREE.PlaneGeometry(7.6, rigZ1 - rigZ0), new THREE.MeshBasicMaterial({ map: tEauR, transparent: true, opacity: 0.45, depthWrite: false }), [0, 0.008, (rigZ0 + rigZ1) / 2], [-Math.PI / 2, 0, 0], false);

  // les côtés : deux murets bas, des plantes en pot, un banc pour les chaussures et les serviettes, des lanternes
  for (const sx of [-1, 1]) {
    ajout(new THREE.BoxGeometry(0.3, 1.1, 5.2), mur, [sx * 3.95, 0.55, -1.9]);
    ajout(new THREE.BoxGeometry(0.36, 0.08, 5.3), pierreSombre, [sx * 3.95, 1.12, -1.9]);
    // un palmier en pot
    const px = sx * 3.35, pz = 0.25;
    ajout(new THREE.CylinderGeometry(0.22, 0.16, 0.4, 14), M('#c26a3d'), [px, 0.2, pz]);
    ajout(new THREE.TorusGeometry(0.21, 0.025, 6, 18), M('#a8552c'), [px, 0.39, pz], [Math.PI / 2, 0, 0]);
    for (let k = 0; k < 4; k++) ajout(new THREE.CylinderGeometry(0.045 - k * 0.006, 0.05 - k * 0.006, 0.42, 8), M('#8a6a43'), [px + Math.sin(k) * 0.02, 0.6 + k * 0.4, pz], [0, 0, Math.sin(k * 1.7) * 0.06]);
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.95, 4), M('#5a9a44')); f.scale.set(1, 1, 0.25);
      f.position.set(px + Math.sin(a) * 0.38, 2.0, pz + Math.cos(a) * 0.38); f.rotation.set(Math.cos(a) * 1.25, 0, -Math.sin(a) * 1.25); f.castShadow = ombres; scene.add(f);
    }
  }
  // le banc en bois (à gauche), avec des sandales posées dessous et des serviettes pliées
  {
    const bx = -2.6, bz = -1.6;
    ajout(new THREE.BoxGeometry(1.4, 0.06, 0.4), bois, [bx, 0.42, bz]);
    for (const dx of [-0.6, 0.6]) ajout(new THREE.BoxGeometry(0.06, 0.42, 0.36), bois, [bx + dx, 0.21, bz]);
    const serv = ['#2bb3c0', '#f5b942', '#fff8e7'];
    for (let i = 0; i < 3; i++) ajout(new THREE.BoxGeometry(0.3, 0.06, 0.24), M(serv[i]), [bx - 0.35 + i * 0.04, 0.48 + i * 0.06, bz], [0, i * 0.12, 0]);
    for (let i = 0; i < 3; i++) for (const dx of [-0.06, 0.06]) ajout(new THREE.BoxGeometry(0.09, 0.025, 0.22), M('#7a5232'), [bx + 0.1 + i * 0.3 + dx, 0.013, bz + 0.05], [0, 0.1 * i, 0]);
  }
  // des lanternes de cuivre accrochées au mur, entre les robinets
  const lueurs = [];
  for (let i = 0; i < NB + 1; i++) {
    const x = (i - NB / 2) * STATION_ECART;
    ajout(new THREE.BoxGeometry(0.03, 0.03, 0.22), cuivre, [x, 2.12, MUR_Z - 0.11]);
    ajout(new THREE.CylinderGeometry(0.004, 0.004, 0.14, 4), cuivre, [x, 2.05, MUR_Z - 0.22]);
    ajout(new THREE.CylinderGeometry(0.06, 0.08, 0.18, 6), cuivreClair, [x, 1.9, MUR_Z - 0.22]);
    ajout(new THREE.ConeGeometry(0.075, 0.08, 6), cuivre, [x, 2.02, MUR_Z - 0.22]);
    const l = ajout(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd98a' }), [x, 1.9, MUR_Z - 0.22], null, false);
    lueurs.push(l);
  }
  // l'arcade d'entrée derrière (on voit le ciel et un peu de jardin)
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    const x = sx * (0.9 + k * 1.15);
    ajout(new THREE.CylinderGeometry(0.11, 0.13, 2.3, 12), pierre, [x, 1.15, -4.6]);
  }
  ajout(new THREE.BoxGeometry(7.6, 0.35, 0.35), pierre, [0, 2.45, -4.6]);

  // le ciel (un dégradé doux) et la lumière du matin
  scene.background = new THREE.Color('#bfe6f2');
  scene.fog = new THREE.Fog('#e9f4f2', 9, 22);
  const hemi = new THREE.HemisphereLight('#e8f5ff', '#e2c79a', 1.35); scene.add(hemi);
  const soleil = new THREE.DirectionalLight('#fff1d8', 2.2); soleil.position.set(-3.5, 6, -4); scene.add(soleil); scene.add(soleil.target);
  if (ombres) { soleil.castShadow = true; soleil.shadow.mapSize.set(ombres === 'haute' ? 2048 : 1024, ombres === 'haute' ? 2048 : 1024); const c = soleil.shadow.camera; c.left = -5; c.right = 5; c.top = 4; c.bottom = -4; c.near = 1; c.far = 18; soleil.shadow.bias = -0.0005; soleil.shadow.normalBias = 0.02; }

  // ---------- l'eau qui coule du robinet ----------
  const tFilet = texEau();
  const matFilet = new THREE.MeshBasicMaterial({ map: tFilet, transparent: true, opacity: 0.95, depthWrite: false, color: '#bfeaf7' });
  const filet = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.021, 1, 12, 1, true), matFilet); filet.visible = false; scene.add(filet);
  // les éclaboussures et les gouttes (petites particules rondes, jamais des carrés)
  const N = 90, pos = new Float32Array(N * 3), vit = new Float32Array(N * 3), vie = new Float32Array(N);
  const geoG = new THREE.BufferGeometry(); geoG.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const gouttes = new THREE.Points(geoG, new THREE.PointsMaterial({ map: texRond(), color: '#cdeffa', size: 0.05, transparent: true, depthWrite: false, opacity: 0.9 }));
  gouttes.frustumCulled = false; scene.add(gouttes);
  for (let i = 0; i < N; i++) pos[i * 3 + 1] = -10;
  let prochaine = 0;
  function emettre(p, n, force = 1) {
    for (let k = 0; k < n; k++) {
      const i = prochaine; prochaine = (prochaine + 1) % N;
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      const a = Math.random() * Math.PI * 2, v = (0.25 + Math.random() * 0.5) * force;
      vit[i * 3] = Math.cos(a) * v; vit[i * 3 + 1] = (0.4 + Math.random() * 0.6) * force; vit[i * 3 + 2] = Math.sin(a) * v; vie[i] = 0.5 + Math.random() * 0.4;
    }
  }
  // de petites étoiles qui brillent sur la partie lavée
  const matBrille = new THREE.SpriteMaterial({ map: texEtoile(), transparent: true, depthWrite: false, depthTest: false });
  const brillants = Array.from({ length: 6 }, () => { const s = new THREE.Sprite(matBrille.clone()); s.visible = false; s.renderOrder = 10; scene.add(s); return { s, t: 0 }; });
  function briller(p) {
    brillants.forEach((b, k) => { b.t = 0.9 + k * 0.08; b.base = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.18)); b.s.visible = true; });
  }

  function maj(dt, t, { station, coule, mains, pieds }) {
    tEauR.offset.x -= dt * 0.25;
    for (const l of lueurs) l.material.color.setHSL(0.11, 1, 0.72 + Math.sin(t * 3 + l.position.x) * 0.03);
    // le filet d'eau : il tombe du bec jusqu'aux mains, au pied, ou jusqu'à la rigole
    if (station && coule) {
      const r = station.robinet; let bas = 0.01;
      for (const p of [...mains, ...pieds]) if (Math.hypot(p.x - r.x, p.z - r.z) < 0.09 && p.y < r.y && p.y > bas) bas = p.y + 0.03;
      const haut = r.y - 0.012, h = Math.max(0.02, haut - bas);
      filet.visible = true; filet.scale.set(1, h, 1); filet.position.set(r.x, bas + h / 2, r.z);
      tFilet.offset.y += dt * 2.2; tFilet.repeat.set(1, h * 2);
      if (Math.random() < dt * 35) emettre(new THREE.Vector3(r.x, bas, r.z), 1, 0.7);
      station.manette.rotation.y += (Math.PI / 2 - station.manette.rotation.y) * Math.min(1, dt * 8);
    } else {
      filet.visible = false;
      if (station) station.manette.rotation.y += (0 - station.manette.rotation.y) * Math.min(1, dt * 8);
    }
    for (let i = 0; i < N; i++) {
      if (vie[i] <= 0) { pos[i * 3 + 1] = -10; continue; }
      vie[i] -= dt; vit[i * 3 + 1] -= 4.5 * dt;
      pos[i * 3] += vit[i * 3] * dt; pos[i * 3 + 1] += vit[i * 3 + 1] * dt; pos[i * 3 + 2] += vit[i * 3 + 2] * dt;
      if (pos[i * 3 + 1] < 0.005) vie[i] = 0;
    }
    geoG.attributes.position.needsUpdate = true;
    for (const b of brillants) {
      if (!b.s.visible) continue;
      b.t -= dt; if (b.t <= 0) { b.s.visible = false; continue; }
      const k = Math.min(1, b.t / 0.4), e = Math.sin(Math.min(1, (1.2 - b.t) * 3) * Math.PI / 2);
      b.s.position.copy(b.base).y += (1 - k) * 0.06; b.s.scale.setScalar(0.09 * e * (0.8 + 0.2 * Math.sin(t * 20))); b.s.material.opacity = k;
    }
  }
  return { maj, emettre, briller, soleil, hemi, MUR_Z };
}
