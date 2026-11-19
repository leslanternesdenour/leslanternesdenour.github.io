// Briques de géométrie pour construire les personnages : formes lisses, avec les poids de peau (skinning) calculés à la construction.
import * as THREE from 'three';

// Un tube lisse qui suit un chemin (liste de points), de rayon variable.
// os : pour chaque point du chemin, [os A, os B, part de B entre 0 et 1] : le sommet est attaché à A et à B (mélange doux aux articulations).
export function tube({ chemin, rayons, os, cotes = 14 }) {
  // bouts arrondis : deux anneaux de plus à chaque extrémité, de plus en plus petits, dans le prolongement du chemin
  const bout = (i, voisin) => {
    const p = chemin[i], q = chemin[voisin], d = p.map((v, k) => v - q[k]), l = Math.hypot(...d) || 1;
    return [[0.55, 0.8], [0.9, 0.4]].map(([av, ray]) => ({ p: p.map((v, k) => v + d[k] / l * rayons[i] * av), r: rayons[i] * ray, b: os[i] }));
  };
  const n = chemin.length, debut = bout(0, 1), fin = bout(n - 1, n - 2);
  chemin = [debut[1].p, debut[0].p, ...chemin, fin[0].p, fin[1].p];
  rayons = [debut[1].r, debut[0].r, ...rayons, fin[0].r, fin[1].r];
  os = [debut[1].b, debut[0].b, ...os, fin[0].b, fin[1].b];
  const pos = [], uv = [], si = [], sw = [], idx = [];
  chemin.forEach(([x, y, z], i) => {
    const [A, B, part] = os[i];
    for (let j = 0; j < cotes; j++) {
      const ang = (j / cotes) * Math.PI * 2;
      pos.push(x + Math.cos(ang) * rayons[i], y, z + Math.sin(ang) * rayons[i]);
      uv.push(j / cotes, i / (chemin.length - 1));
      si.push(A, B, 0, 0); sw.push(1 - part, part, 0, 0);
    }
  });
  for (let i = 0; i < chemin.length - 1; i++) for (let j = 0; j < cotes; j++) {
    const a = i * cotes + j, b = i * cotes + (j + 1) % cotes, c = a + cotes, d = b + cotes;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
