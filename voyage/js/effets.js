// Petits effets qui rendent le désert vivant :
// - les traces de pas de l'enfant et les empreintes de Sablo dans le sable (elles s'effacent doucement) ;
// - des grains de sable qui volent avec le vent autour de l'enfant (désert et montagnes).
import * as THREE from 'three';
import { textureEmpreinte, texturePoussiere } from './textures.js?v=3';

export function creerEffets(scene, terrain, Q) {
  const H = (x, z) => terrain.hauteur(x, z);

  // ---------- empreintes ----------
  const N = Q.empreintes ?? 140, VIE = 45;
  const types = {};
  for (const [nom, taille, opa] of [['enfant', [0.19, 0.3], 0.45], ['chameau', [0.36, 0.38], 0.5]]) {
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2); geo.rotateY(Math.PI);
    const mat = new THREE.MeshBasicMaterial({ map: textureEmpreinte(nom), transparent: true, opacity: opa, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, color: '#6b4a2a' });
    const im = new THREE.InstancedMesh(geo, mat, N);
    im.frustumCulled = false; im.renderOrder = 1;
    const vide = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < N; i++) im.setMatrixAt(i, vide);
    scene.add(im);
    types[nom] = { im, taille, suivant: 0, vies: new Float32Array(N).fill(-1), poses: [] };
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  function poser(nom, x, z, angle, cote) {
    const t = types[nom]; if (!t || N === 0) return;
    const mat = terrain.matiere(x, z);
    if (mat.herbe > 0.35 || mat.roche > 0.5) return;           // pas d'empreinte sur l'herbe ni sur la roche
    const i = t.suivant; t.suivant = (i + 1) % N;
    const ox = Math.cos(angle) * cote, oz = -Math.sin(angle) * cote;
    const px = x + ox, pz = z + oz;
    // incliner l'empreinte comme la pente
    const dx = H(px + 0.3, pz) - H(px - 0.3, pz), dz = H(px, pz + 0.3) - H(px, pz - 0.3);
    e.set(Math.atan2(dz, 0.6), angle, -Math.atan2(dx, 0.6), 'YXZ');
    t.poses[i] = { x: px, y: H(px, pz) + 0.03, z: pz, e: e.clone() };
    t.vies[i] = 0;
  }
  function majEmpreintes(dt) {
    for (const nom in types) {
      const t = types[nom]; let change = false;
      for (let i = 0; i < N; i++) {
        if (t.vies[i] < 0) continue;
        t.vies[i] += dt;
        const p = t.poses[i];
        const k = t.vies[i] > VIE ? 0 : 1 - Math.max(0, (t.vies[i] - VIE + 8) / 8);   // s'efface sur les 8 dernières secondes
        if (k <= 0) { t.vies[i] = -1; m4.makeScale(0, 0, 0); }
        else m4.compose(v.set(p.x, p.y, p.z), q.setFromEuler(p.e), s.set(t.taille[0] * (0.6 + 0.4 * k), 1, t.taille[1] * (0.6 + 0.4 * k)));
        t.im.setMatrixAt(i, m4); change = true;
      }
      if (change) t.im.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------- grains de sable dans le vent ----------
  const NP = Q.particules ?? 0;
  let nuage = null, pos = null, vit = null;
  if (NP > 0) {
    const geo = new THREE.BufferGeometry();
    pos = new Float32Array(NP * 3); vit = new Float32Array(NP);
    for (let i = 0; i < NP; i++) { pos[i * 3] = (Math.random() - 0.5) * 50; pos[i * 3 + 1] = Math.random() * 3; pos[i * 3 + 2] = (Math.random() - 0.5) * 50; vit[i] = 0.6 + Math.random(); }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    nuage = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: texturePoussiere(), transparent: true, opacity: 0, depthWrite: false, color: '#f3dcae' }));
    nuage.frustumCulled = false; scene.add(nuage);
  }
  let ventX = 1, ventZ = 0.35;
  function majSable(dt, centre, force, t) {
    if (!nuage) return;
    nuage.material.opacity += ((force > 0.05 ? 0.55 * force : 0) - nuage.material.opacity) * Math.min(1, dt * 1.5);
    if (nuage.material.opacity < 0.01) { nuage.visible = false; return; }
    nuage.visible = true;
    const rafale = 3 + Math.sin(t * 0.4) * 1.5;
    for (let i = 0; i < NP; i++) {
      let x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      x += ventX * rafale * vit[i] * dt; z += ventZ * rafale * vit[i] * dt;
      y += Math.sin(t * 3 + i) * 0.3 * dt;
      // les grains restent autour de l'enfant
      if (x - centre.x > 25) x -= 50; if (x - centre.x < -25) x += 50;
      if (z - centre.z > 25) z -= 50; if (z - centre.z < -25) z += 50;
      const sol = H(x, z);
      if (y < sol + 0.05 || y > sol + 3) y = sol + 0.1 + Math.random() * 1.2;
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    nuage.geometry.attributes.position.needsUpdate = true;
  }

  return { poser, maj(dt, centre, forceSable, t) { majEmpreintes(dt); majSable(dt, centre, forceSable, t); } };
}
