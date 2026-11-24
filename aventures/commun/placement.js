// Placement des objets à chercher : jamais enfouis dans un relief ni cachés derrière un élément du décor (dune, étal, colonne, rocher, passage…).
// Un rayon descend du ciel sur le décor : si le sol n'est pas plat et bas autour d'un emplacement, il est déplacé vers le point libre le plus proche.
import * as THREE from 'three';
const bas = new THREE.Raycaster(), bas_dir = new THREE.Vector3(0, -1, 0);
export function hauteurDecor(x, z, maillages) { bas.set(new THREE.Vector3(x, 30, z), bas_dir); const h = bas.intersectObjects(maillages, true); return h.length ? h[0].point.y : 0; }
export function emplacementLibre(x, z, maillages, autres = [], marge = 0.9, ecart = 2.3) {
  for (const [dx, dz] of [[0, 0], [marge, 0], [-marge, 0], [0, marge], [0, -marge], [marge * 0.7, marge * 0.7], [-marge * 0.7, -marge * 0.7]]) if (hauteurDecor(x + dx, z + dz, maillages) > 0.22) return false;
  return autres.every(a => Math.hypot(a.x - x, a.z - z) >= ecart);
}
// centreZ : z du centre de la scène (1). reserves : points à garder libres (guide, piédestal…).
export function placerSurSol(slots, maillages, reserves = [], centreZ = 1) {
  const res = [], toutes = [...reserves];
  for (const s of slots) {
    let choix = null; const a0 = Math.atan2(s.x, s.z - centreZ), r0 = Math.hypot(s.x, s.z - centreZ);
    for (const dr of [0, -0.8, 0.8, -1.6, 1.6, -2.4, 2.4]) { for (const da of [0, 0.25, -0.25, 0.5, -0.5, 0.8, -0.8, 1.1, -1.1, 1.5, -1.5]) { const r = Math.max(2.4, Math.min(7.2, r0 + dr)), a = a0 + da, x = Math.sin(a) * r, z = centreZ + Math.cos(a) * r;
      if (emplacementLibre(x, z, maillages, toutes)) { choix = { ...s, x, z }; break; } } if (choix) break; }
    choix = choix || { ...s }; res.push(choix); toutes.push(choix);
  }
  return res;
}
