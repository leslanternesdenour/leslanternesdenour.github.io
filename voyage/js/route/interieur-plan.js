// Le plan de l'intérieur d'une maison (pur, sans Three.js) : une seule pièce, posée sur le plateau plat (relief.js PLATEAU_INTERIEURS), invisible tant qu'on n'y entre pas.
// Repère : axes du monde. La porte est sur la face +z (« façade ») ; le fond est à -z. Les mêmes nombres dessinent la pièce et la rendent solide.
export const PIECE = {
  demiL: 3.8, demiP: 3.0,                       // la pièce : 7,6 m sur 6 m
  porte: 1.0,                                    // demi-largeur de l'ouverture de la porte
  objets: [{ x: -2.1, z: -1.7 }, { x: 2.1, z: -1.7 }],    // les deux emplacements d'objets (meubles) ; on se tient 1,6 m devant
  entree: { x: 0, z: 0.4 }, sortie: { x: 0, z: 2.5 }, dehors: { x: 0, z: 4.2 }
};

export function planInterieur(cx, cz) {
  const A = PIECE, colliders = [], w = (x, z) => ({ x: cx + x, z: cz + z });
  const ajoute = (x, z, r) => colliders.push({ ...w(x, z), r });
  for (let x = -A.demiL + 0.2; x <= A.demiL - 0.19; x += 1.2) { ajoute(x, -A.demiP, 0.7); if (Math.abs(x) > A.porte + 0.5) ajoute(x, A.demiP, 0.7); }   // le fond et la façade (avec l'ouverture de la porte)
  for (let z = -A.demiP + 1.0; z <= A.demiP - 0.9; z += 1.2) { ajoute(-A.demiL, z, 0.7); ajoute(A.demiL, z, 0.7); }                                         // les deux côtés
  for (const o of A.objets) ajoute(o.x, o.z, 0.7);                                                                                                         // les meubles
  return { colliders, entree: w(A.entree.x, A.entree.z), sortie: w(A.sortie.x, A.sortie.z), dehors: w(A.dehors.x, A.dehors.z),
    objets: A.objets.map((o, slot) => ({ slot, ...w(o.x, o.z), poseX: cx + o.x, poseZ: cz + o.z + 1.6 })),
    mur: { fond: w(0, -A.demiP), gauche: w(-A.demiL, 0), droit: w(A.demiL, 0), facade: w(A.demiL - 0.4, A.demiP) },
    dedans: (x, z) => Math.abs(x - cx) < A.demiL && Math.abs(z - cz) < A.demiP };
}
