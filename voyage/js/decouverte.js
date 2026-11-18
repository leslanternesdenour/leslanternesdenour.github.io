// L'effet lumineux d'une découverte dans le monde : un anneau doré qui s'ouvre au sol, une colonne de lumière douce
// et des petites étincelles qui montent. Discret et chaleureux (jamais agressif).
import * as THREE from 'three';

export const texRonde = (() => { let t = null; return () => {
  if (t) return t;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,240,190,.85)'); g.addColorStop(1, 'rgba(255,220,140,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }; })();

export function creerEffetDecouverte(scene, H) {
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  const add = THREE.AdditiveBlending;
  const anneaux = [0, 1].map(i => { const m = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 48), new THREE.MeshBasicMaterial({ color: i ? '#fff1b8' : '#ffd36b', transparent: true, depthWrite: false, blending: add, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.12; g.add(m); return m; });
  const texCol = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(255,230,160,0)'); gr.addColorStop(0.6, 'rgba(255,225,150,.45)'); gr.addColorStop(1, 'rgba(255,245,210,.8)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 7, 20, 1, true), new THREE.MeshBasicMaterial({ map: texCol, transparent: true, depthWrite: false, blending: add, side: THREE.DoubleSide }));
  colonne.position.y = 3.5; g.add(colonne);
  const N = 46, pos = new Float32Array(N * 3), vit = [];
  for (let i = 0; i < N; i++) vit.push({ a: Math.random() * 6.28, r: 0.3 + Math.random() * 1.2, v: 0.8 + Math.random() * 1.6, d: Math.random() * 0.6 });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const etincelles = new THREE.Points(geo, new THREE.PointsMaterial({ map: texRonde(), size: 0.35, transparent: true, depthWrite: false, blending: add, color: '#ffe7a0' }));
  etincelles.frustumCulled = false; g.add(etincelles);
  let t = -1, duree = 2.6;
  return {
    jouer(x, z, y = null) { g.position.set(x, y ?? H(x, z), z); g.visible = true; t = 0; },
    maj(dt) {
      if (t < 0) return;
      t += dt; const k = t / duree;
      if (k >= 1) { g.visible = false; t = -1; return; }
      anneaux.forEach((m, i) => { const kk = Math.max(0, Math.min(1, (t - i * 0.25) / 1.4)); m.scale.setScalar(0.4 + kk * 3.4); m.material.opacity = (1 - kk) * 0.9; });
      colonne.material.opacity = Math.sin(Math.min(1, k * 1.6) * Math.PI) * 0.9; colonne.scale.set(1 + k * 0.4, 0.6 + Math.min(1, k * 3) * 0.4, 1 + k * 0.4);
      for (let i = 0; i < N; i++) { const p = vit[i], tt = Math.max(0, t - p.d); pos[i * 3] = Math.cos(p.a + tt * 1.6) * (p.r + tt * 0.3); pos[i * 3 + 1] = 0.2 + tt * p.v; pos[i * 3 + 2] = Math.sin(p.a + tt * 1.6) * (p.r + tt * 0.3); }
      geo.attributes.position.needsUpdate = true;
      etincelles.material.opacity = Math.min(1, t * 3) * (1 - k);
    }
  };
}
