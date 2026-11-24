// VUE 3D d'une lettre : le relief est extrudé à partir du contour EXACT de la lettre (police Amiri) — jamais déformé. Matières dorées, points turquoise, éclairage doux,
// rotation lente et manipulation au doigt (limitée pour que la lettre reste toujours lisible). Un seul rendu à la fois (léger sur téléphone) ; libère tout à la fermeture.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { glyphes } from './rendu.js?v=3';
export function creerVue3d(conteneur) {
  const canvas = document.createElement('canvas'); canvas.className = 'vue3d'; canvas.setAttribute('aria-label', 'Lettre en 3D : tourne-la avec ton doigt'); conteneur.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); camera.position.set(0, 0, 9.5);
  scene.add(new THREE.HemisphereLight('#fff1d0', '#5a4a8a', 1.35)); const cle = new THREE.DirectionalLight('#ffffff', 2.2); cle.position.set(3, 5, 6); scene.add(cle); const contre = new THREE.DirectionalLight('#9fe8ff', 0.8); contre.position.set(-4, -2, 3); scene.add(contre);
  const pivot = new THREE.Group(); scene.add(pivot);
  const matOr = new THREE.MeshStandardMaterial({ color: '#e8b53a', metalness: 0.75, roughness: 0.32 }), matPoint = new THREE.MeshStandardMaterial({ color: '#38d3c4', metalness: 0.35, roughness: 0.28, emissive: '#0b5f58', emissiveIntensity: 0.4 });
  const loader = new SVGLoader(); let courant = null, t0 = performance.now(), yaw = 0, yawCible = 0, pitch = 0, glisse = null, auto = true, vivant = true, apparition = 0, raf = 0;
  function dimensionner() { const r = conteneur.getBoundingClientRect(), w = Math.max(120, r.width), h = Math.max(120, r.height); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(dimensionner); ro.observe(conteneur); dimensionner();
  function geometrie(d, profondeur) {
    const svg = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`), formes = svg.paths.flatMap(p => SVGLoader.createShapes(p));
    const g = new THREE.ExtrudeGeometry(formes, { depth: profondeur, bevelEnabled: true, bevelThickness: 14, bevelSize: 9, bevelSegments: 3, curveSegments: 10 }); return g;
  }
  function definir(id, forme = 'isolee') {
    if (courant) { pivot.remove(courant); courant.traverse(o => o.geometry && o.geometry.dispose()); } const f = glyphes().lettres[id][forme], g = new THREE.Group(); let b = f.bb;
    for (const p of f.parties) { const m = new THREE.Mesh(geometrie(p.d, p.type === 'corps' ? 90 : 120), p.type === 'corps' ? matOr : matPoint); g.add(m); }
    const echelle = 5.2 / Math.max(b[2] - b[0], b[3] - b[1]); g.scale.set(echelle, -echelle, echelle);               // le SVG a l'axe y vers le bas : on le retourne, sans déformer
    g.position.set(-((b[0] + b[2]) / 2) * echelle, ((b[1] + b[3]) / 2) * echelle, -45 * echelle); courant = g; pivot.add(g); apparition = 0; yaw = -1.2; yawCible = 0; auto = true;
  }
  canvas.addEventListener('pointerdown', e => { glisse = { x: e.clientX, y: e.clientY, yaw0: yawCible, pitch0: pitch }; auto = false; canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!glisse) return; yawCible = Math.max(-1.1, Math.min(1.1, glisse.yaw0 + (e.clientX - glisse.x) * 0.012)); pitch = Math.max(-0.5, Math.min(0.5, glisse.pitch0 + (e.clientY - glisse.y) * 0.008)); });
  canvas.addEventListener('pointerup', () => { glisse = null; setTimeout(() => { if (!glisse) auto = true; }, 2500); });
  function boucle(now) {
    if (!vivant) return; raf = requestAnimationFrame(boucle); const dt = Math.min(0.05, (now - t0) / 1000); t0 = now; apparition = Math.min(1, apparition + dt * 1.6);
    if (auto) yawCible = Math.sin(now / 1800) * 0.45; yaw += (yawCible - yaw) * Math.min(1, dt * 4); pivot.rotation.y = yaw; pivot.rotation.x += (pitch - pivot.rotation.x) * Math.min(1, dt * 6);
    const k = 1 - Math.pow(1 - apparition, 3); pivot.scale.setScalar(0.4 + 0.6 * k); pivot.position.y = (1 - k) * -1.2; renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(boucle);
  return { definir, fermer() { vivant = false; cancelAnimationFrame(raf); ro.disconnect(); if (courant) courant.traverse(o => o.geometry && o.geometry.dispose()); renderer.dispose(); canvas.remove(); }, canvas };
}
