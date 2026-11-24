// Le plan de l'atelier du potier (pur, sans Three.js) : un bâtiment ouvert sur l'avant (+z local), avec un mur de fond, deux murs latéraux, un tour de potier et un four.
// Les mêmes nombres servent à dessiner le bâtiment (lieux-3d.js) et à le rendre solide ou traversable (collisions) : ce qu'on voit est ce qui bloque.
export const ATELIER = {
  fond: { z: -2.6, xs: [-3.0, -1.5, 0, 1.5, 3.0], r: 1.0 },                 // le mur du fond
  cotes: { x: 3.3, zs: [-1.2, 0.2, 1.6], r: 0.9 },                          // les deux murs latéraux (x = ±3,3)
  poteaux: { x: 3.3, z: 2.7, r: 0.5 },                                       // les deux poteaux de l'entrée
  tour: { x: -0.9, z: -1.0, r: 0.55, pose: { x: -0.9, z: 0.3 } },           // le tour du potier
  four: { x: 2.1, z: -1.2, r: 1.0, pose: { x: 1.5, z: 0.3 } },              // le four à argile
  entree: { x: 0, z: 3.6 }
};

// passage du repère de l'atelier (avant = +z) au monde : même rotation que dans lieux-3d.js (mesh.rotation.y = rot)
const monde = (cx, cz, rot) => (lx, lz) => ({ x: cx + lx * Math.cos(rot) + lz * Math.sin(rot), z: cz - lx * Math.sin(rot) + lz * Math.cos(rot) });

export function planAtelier(cx, cz, rot = 0) {
  const w = monde(cx, cz, rot), A = ATELIER, colliders = [];
  const ajoute = (lx, lz, r) => { colliders.push({ ...w(lx, lz), r }); };
  for (const x of A.fond.xs) ajoute(x, A.fond.z, A.fond.r);
  for (const s of [-1, 1]) { for (const z of A.cotes.zs) ajoute(s * A.cotes.x, z, A.cotes.r); ajoute(s * A.poteaux.x, A.poteaux.z, A.poteaux.r); }
  ajoute(A.tour.x, A.tour.z, A.tour.r); ajoute(A.four.x, A.four.z, A.four.r);
  const objet = (id, o) => ({ id, ...w(o.x, o.z), poseX: w(o.pose.x, o.pose.z).x, poseZ: w(o.pose.x, o.pose.z).z });
  // l'enfant est-il dans le bâtiment ? (repère de l'atelier : on remonte la rotation)
  const dedans = (x, z) => { const dx = x - cx, dz = z - cz, lx = dx * Math.cos(rot) - dz * Math.sin(rot), lz = dx * Math.sin(rot) + dz * Math.cos(rot); return Math.abs(lx) < 3.5 && lz > A.fond.z && lz < 3.0; };
  return { colliders, dedans, entree: w(A.entree.x, A.entree.z), objets: [objet('tour', A.tour), objet('four', A.four)],
    mur: { fond: w(0, A.fond.z), gauche: w(-A.cotes.x, 0.2), droit: w(A.cotes.x, 0.2) } };
}
