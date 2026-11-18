// La salle de prière : rangées de tapis, le tapis de l'enfant, le mur de la qibla avec sa niche, des fenêtres et des lanternes.
// Pas de dôme ni de minaret, aucun texte religieux en décoration. Tout est dessiné par le code.
import * as THREE from 'three';

const alea = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(11);
function toile(l, h, dessin) { const c = document.createElement('canvas'); c.width = l; c.height = h; dessin(c.getContext('2d'), l, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// les rangées de tapis : une bande par personne, avec un petit arc qui montre la direction de la qibla
function texRangees() {
  return toile(256, 512, (x, l, h) => {
    x.fillStyle = '#7d2f3a'; x.fillRect(0, 0, l, h);
    x.strokeStyle = '#e8c27a'; x.lineWidth = 6; x.strokeRect(10, 10, l - 20, h - 20);
    x.strokeStyle = '#5c1f2a'; x.lineWidth = 3; x.strokeRect(22, 22, l - 44, h - 44);
    x.fillStyle = '#93404b'; x.beginPath(); x.moveTo(50, h - 60); x.lineTo(50, 170); x.quadraticCurveTo(50, 70, l / 2, 50); x.quadraticCurveTo(l - 50, 70, l - 50, 170); x.lineTo(l - 50, h - 60); x.closePath(); x.fill();
    x.strokeStyle = '#e8c27a'; x.lineWidth = 3; x.stroke();
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,220,170,${0.03 + alea() * 0.05})`; x.fillRect(alea() * l, alea() * h, 2, 2 + alea() * 4); }
  });
}
// le tapis de l'enfant : turquoise et or, comme Sajjadou
function texTapis() {
  return toile(256, 512, (x, l, h) => {
    x.fillStyle = '#2bb3c0'; x.fillRect(0, 0, l, h);
    x.fillStyle = '#fff8e7'; x.fillRect(14, 14, l - 28, h - 28);
    x.fillStyle = '#1d8f9c'; x.fillRect(24, 24, l - 48, h - 48);
    x.fillStyle = '#fff8e7'; x.beginPath(); x.moveTo(52, h - 70); x.lineTo(52, 190); x.quadraticCurveTo(52, 80, l / 2, 52); x.quadraticCurveTo(l - 52, 80, l - 52, 190); x.lineTo(l - 52, h - 70); x.closePath(); x.fill();
    x.strokeStyle = '#f5b942'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#f5b942'; for (let i = 0; i < 5; i++) { x.save(); x.translate(l / 2, 150 + i * 62); x.rotate(Math.PI / 4); x.fillRect(-9, -9, 18, 18); x.restore(); }
    x.strokeStyle = '#f5b942'; x.lineWidth = 3; x.setLineDash([4, 8]); x.strokeRect(30, 30, l - 60, h - 60);
  });
}
function texEnduit(c1) {
  return toile(256, 256, (x, l, h) => {
    x.fillStyle = c1; x.fillRect(0, 0, l, h);
    for (let k = 0; k < 800; k++) { x.fillStyle = alea() > 0.5 ? 'rgba(255,255,255,.14)' : 'rgba(150,120,90,.08)'; x.fillRect(alea() * l, alea() * h, 1 + alea() * 3, 1 + alea() * 3); }
  });
}
function texFrise() {
  return toile(512, 64, (x, l, h) => {
    x.fillStyle = '#1d8f9c'; x.fillRect(0, 0, l, h);
    for (let i = 0; i < l / 32; i++) { x.save(); x.translate(i * 32 + 16, h / 2); x.rotate(Math.PI / 4); x.fillStyle = i % 2 ? '#f5b942' : '#fff8e7'; x.fillRect(-8, -8, 16, 16); x.restore(); }
    x.fillStyle = '#f5b942'; x.fillRect(0, 0, l, 4); x.fillRect(0, h - 4, l, 4);
  });
}

export function creerSalle(scene, { ombres }) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
  const ajout = (g, m, p, r, ombre = true) => { const o = new THREE.Mesh(g, m); if (p) o.position.set(...p); if (r) o.rotation.set(...r); o.castShadow = ombres && ombre; o.receiveShadow = ombres; scene.add(o); return o; };
  const L = 9, P = 9, H = 3.4, MUR_Z = 2.6;      // la salle : 9 m × 9 m ; le mur de la qibla est devant (z = 2,6)
  const cuivre = M('#c9893f', { metalness: 0.55, roughness: 0.38 }), bois = M('#7a4a2a'), boisClair = M('#a06a3c');

  // le sol : des rangées de tapis
  const tR = texRangees(); tR.wrapS = tR.wrapT = THREE.RepeatWrapping; tR.repeat.set(L / 0.9, P / 1.6); tR.anisotropy = 4;
  ajout(new THREE.PlaneGeometry(L, P), M('#ffffff', { map: tR, roughness: 0.95 }), [0, 0, MUR_Z - P / 2], [-Math.PI / 2, 0, 0], false);
  // le tapis de l'enfant
  ajout(new THREE.BoxGeometry(0.72, 0.012, 1.32), M('#ffffff', { map: texTapis(), roughness: 0.9 }), [0, 0.006, 0.18], null, false);
  for (const z of [-0.48, 0.84]) for (let i = 0; i < 7; i++) ajout(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 5), M('#f5b942'), [-0.3 + i * 0.1, 0.008, z + (z < 0 ? -0.03 : 0.03)], [Math.PI / 2, 0, 0], false);

  // les murs
  const tE = texEnduit('#f3e6cc'); tE.wrapS = tE.wrapT = THREE.RepeatWrapping; tE.repeat.set(4, 1.5);
  const mur = M('#ffffff', { map: tE });
  ajout(new THREE.BoxGeometry(L, H, 0.3), mur, [0, H / 2, MUR_Z + 0.15]);                              // le mur de la qibla
  ajout(new THREE.BoxGeometry(L, H, 0.3), mur, [0, H / 2, MUR_Z - P - 0.15]);                          // le mur du fond
  for (const sx of [-1, 1]) ajout(new THREE.BoxGeometry(0.3, H, P), mur, [sx * (L / 2 + 0.15), H / 2, MUR_Z - P / 2]);
  // le bas des murs en bois, et une frise
  const tF = texFrise(); tF.wrapS = THREE.RepeatWrapping; tF.repeat.set(6, 1);
  ajout(new THREE.BoxGeometry(L, 0.9, 0.04), boisClair, [0, 0.45, MUR_Z - 0.02]);
  ajout(new THREE.PlaneGeometry(L, 0.16), M('#ffffff', { map: tF, roughness: 0.5 }), [0, 0.98, MUR_Z - 0.006], [0, Math.PI, 0], false);
  for (const sx of [-1, 1]) {
    ajout(new THREE.BoxGeometry(0.04, 0.9, P), boisClair, [sx * (L / 2 - 0.02), 0.45, MUR_Z - P / 2]);
    const f = ajout(new THREE.PlaneGeometry(P, 0.16), M('#ffffff', { map: tF.clone(), roughness: 0.5 }), [sx * (L / 2 - 0.006), 0.98, MUR_Z - P / 2], [0, -sx * Math.PI / 2, 0], false);
    f.material.map.repeat.set(6, 1); f.material.map.wrapS = THREE.RepeatWrapping;
  }
  // la niche de la qibla : un arc simple, creusé dans le mur (sans inscription)
  {
    const arc = (r, h) => { const s = new THREE.Shape(); s.moveTo(-r, 0); s.lineTo(-r, h); s.absarc(0, h, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0); return s; };
    ajout(new THREE.ShapeGeometry(arc(0.62, 1.6), 20), M('#2bb3c0', { roughness: 0.5, side: THREE.DoubleSide }), [0, 0, MUR_Z - 0.012], [0, Math.PI, 0], false);
    ajout(new THREE.ShapeGeometry(arc(0.52, 1.55), 20), M('#f7ecd6', { side: THREE.DoubleSide }), [0, 0.02, MUR_Z - 0.016], [0, Math.PI, 0], false);
    ajout(new THREE.ShapeGeometry(arc(0.42, 1.5), 20), M('#e9d6b4', { side: THREE.DoubleSide }), [0, 0.04, MUR_Z - 0.02], [0, Math.PI, 0], false);
    for (const sx of [-1, 1]) ajout(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 12), M('#e8c27a'), [sx * 0.58, 0.8, MUR_Z - 0.05]);
  }
  // les fenêtres (la lumière entre par les côtés)
  const verre = new THREE.MeshBasicMaterial({ color: '#dff3ff' });
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
    const z = MUR_Z - 1.6 - i * 2.4, x = sx * (L / 2 - 0.005);
    const f = new THREE.Shape(); f.moveTo(-0.45, 0); f.lineTo(-0.45, 1.1); f.absarc(0, 1.1, 0.45, Math.PI, 0, true); f.lineTo(0.45, 0); f.lineTo(-0.45, 0);
    ajout(new THREE.ShapeGeometry(f, 14), verre, [x, 1.3, z], [0, -sx * Math.PI / 2, 0], false);
    ajout(new THREE.BoxGeometry(0.06, 0.05, 1.0), bois, [x - sx * 0.02, 1.3, z]);
    ajout(new THREE.BoxGeometry(0.05, 1.5, 0.04), bois, [x - sx * 0.02, 1.95, z]);
  }
  // le plafond et ses poutres de bois
  ajout(new THREE.PlaneGeometry(L, P), M('#efe0c4'), [0, H, MUR_Z - P / 2], [Math.PI / 2, 0, 0], false);
  for (let i = 0; i < 7; i++) ajout(new THREE.BoxGeometry(L, 0.14, 0.16), bois, [0, H - 0.07, MUR_Z - 0.6 - i * 1.3], null, false);
  // des lanternes suspendues
  const lueurs = [];
  for (const [x, z] of [[-2.2, 0.6], [2.2, 0.6], [-2.2, -2.2], [2.2, -2.2], [0, -1.0]]) {
    ajout(new THREE.CylinderGeometry(0.005, 0.005, 1.1, 4), cuivre, [x, H - 0.55, z], null, false);
    ajout(new THREE.CylinderGeometry(0.09, 0.12, 0.26, 8), M('#e3ad62', { metalness: 0.45, roughness: 0.4 }), [x, H - 1.2, z], null, false);
    ajout(new THREE.ConeGeometry(0.11, 0.12, 8), cuivre, [x, H - 1.02, z], null, false);
    lueurs.push(ajout(new THREE.SphereGeometry(0.06, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd98a' }), [x, H - 1.22, z], null, false));
  }
  // des plantes en pot et une étagère basse avec des coussins
  for (const [x, z] of [[-3.8, 2.1], [3.8, 2.1]]) {
    ajout(new THREE.CylinderGeometry(0.24, 0.18, 0.44, 14), M('#c26a3d'), [x, 0.22, z]);
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, f = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.8, 4), M('#5a9a44')); f.scale.set(1, 1, 0.3); f.position.set(x + Math.sin(a) * 0.2, 0.75, z + Math.cos(a) * 0.2); f.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); f.castShadow = ombres; scene.add(f); }
  }
  ajout(new THREE.BoxGeometry(1.6, 0.42, 0.42), bois, [-3.9, 0.21, -3.6], [0, Math.PI / 2, 0]);
  const coussins = ['#2bb3c0', '#f5b942', '#7d2f3a'];
  for (let i = 0; i < 3; i++) ajout(new THREE.SphereGeometry(0.2, 12, 8), M(coussins[i]), [-3.85, 0.5, -3.1 - i * 0.48], null).scale.set(1, 0.45, 1);

  // la lumière : douce et chaude
  scene.background = new THREE.Color('#f3e6cc');
  const hemi = new THREE.HemisphereLight('#fff6e6', '#b98c64', 1.25); scene.add(hemi);
  const soleil = new THREE.DirectionalLight('#fff0d6', 1.6); soleil.position.set(-4, 5, 1); scene.add(soleil); scene.add(soleil.target);
  if (ombres) { soleil.castShadow = true; soleil.shadow.mapSize.set(ombres === 'haute' ? 2048 : 1024, ombres === 'haute' ? 2048 : 1024); const c = soleil.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = 1; c.far = 14; soleil.shadow.bias = -0.0005; soleil.shadow.normalBias = 0.02; }
  const doux = new THREE.PointLight('#ffd9a0', 1.2, 6, 1.6); doux.position.set(0, 2.2, 1.6); scene.add(doux);

  function maj(dt, t) { for (const l of lueurs) l.material.color.setHSL(0.11, 1, 0.72 + Math.sin(t * 2.4 + l.position.x) * 0.03); }
  return { maj, MUR_Z, L, P };
}
