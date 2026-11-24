// Le guidage de la Route en 3D : de petites lumières dorées posées au sol, qui mènent à la destination choisie sur la carte (comme le guide du village), à la place d'une simple flèche.
// Une seule géométrie répétée (24 instances) ; elles s'allument en vague vers la destination ; seule la partie proche de l'enfant est dessinée.
import * as THREE from 'three';
import { DEC } from './relief.js';
import { traceLumineuse } from './trace-plan.js';

const NB = 24;
export function creerGuidage3D({ scene, hauteur }) {
  const groupe = new THREE.Group(); groupe.name = 'route-guidage'; scene.add(groupe);
  const mat = new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: 0.95, depthWrite: false, fog: true });
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.42, 8, 6), mat, NB); im.frustumCulled = false; im.count = 0; im.renderOrder = 3; groupe.add(im);
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  let trace = [], tMaj = 99;
  function poser(t) {
    im.count = trace.length;
    trace.forEach((p, k) => { const x = p.t, z = DEC + p.s, e = 0.55 + 0.45 * Math.max(0, Math.sin(t * 4 - k * 0.7)); _m.compose(_p.set(x, hauteur(x, z) + 0.28, z), _q, _s.set(e, e * 0.55, e)); im.setMatrixAt(k, _m); });
    im.instanceMatrix.needsUpdate = true;
  }
  return { groupe,
    // j : l'enfant (x, z du monde) ; cible : { s, t } de la destination choisie sur la carte, ou null
    maj(dt, t, J, cible) {
      if (!cible) { im.count = 0; trace = []; return; }
      tMaj += dt; if (tMaj > 0.4) { tMaj = 0; trace = traceLumineuse({ s: J.z - DEC, t: J.x }, cible).slice(0, NB); }
      poser(t);
    } };
}
