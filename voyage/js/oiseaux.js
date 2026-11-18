// Des vols d'oiseaux qui tournent au-dessus du village, de l'oasis et des montagnes (le jour).
import * as THREE from 'three';

export function creerOiseaux(scene, H) {
  const aile = new THREE.BufferGeometry();
  aile.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.12, 0.55, 0, 0.05, 0, 0, 0.18], 3));
  aile.computeVertexNormals();
  const mat = new THREE.MeshBasicMaterial({ color: '#3a3550', side: THREE.DoubleSide, transparent: true });
  const corpsGeo = new THREE.SphereGeometry(0.09, 6, 4); corpsGeo.scale(1, 0.8, 2.2);
  const vols = [
    { x: 0, z: 0, r: 34, y: 26, n: 7 },
    { x: 190, z: 30, r: 28, y: 22, n: 9 },
    { x: -20, z: -240, r: 60, y: 70, n: 5 },
    { x: -175, z: 60, r: 26, y: 24, n: 4 }
  ];
  const oiseaux = [];
  for (const v of vols) {
    for (let i = 0; i < v.n; i++) {
      const g = new THREE.Group();
      const c = new THREE.Mesh(corpsGeo, mat), a1 = new THREE.Mesh(aile, mat), a2 = new THREE.Mesh(aile, mat);
      a2.scale.x = -1; g.add(c, a1, a2); g.scale.setScalar(1.6);
      scene.add(g);
      oiseaux.push({ g, a1, a2, v, ph: i * 0.55 + Math.random() * 0.4, dr: (Math.random() - 0.5) * 8, dy: (Math.random() - 0.5) * 5, vit: 0.16 + Math.random() * 0.05 });
    }
  }
  return {
    maj(dt, t, nuit) {
      mat.opacity = 1 - nuit;
      const visible = nuit < 0.95;
      for (const o of oiseaux) {
        o.g.visible = visible; if (!visible) continue;
        const a = t * o.vit + o.ph, r = o.v.r + o.dr + Math.sin(t * 0.3 + o.ph) * 4;
        const x = o.v.x + Math.cos(a) * r, z = o.v.z + Math.sin(a) * r;
        o.g.position.set(x, Math.max(H(x, z) + 8, o.v.y + o.dy + Math.sin(t * 0.7 + o.ph) * 1.5), z);
        o.g.rotation.y = -a;                       // regarde dans le sens du vol
        const battement = Math.sin(t * 9 + o.ph * 7);
        const plane = Math.sin(t * 0.5 + o.ph) > 0.3;
        const f = plane ? 0.15 : battement * 0.7;
        o.a1.rotation.z = f; o.a2.rotation.z = -f;
      }
    }
  };
}
