// LES AVENTURES DES LANTERNES — socle commun des nouveaux jeux : scène 3D légère, caméra qui tourne, toucher, voix + sous-titres, icônes d'objets, sauvegarde.
// Réutilise la voix et la table de mixage du socle (monde/socle/*) : un seul gestionnaire audio, une seule voix à la fois. Aucune synthèse vocale du navigateur.
import * as THREE from 'three';
import { chargerVoix, ajouterVoix, existe, dire as direVoix, arreterVoix } from '../../monde/socle/voix.js?v=1';
import { reveiller, reglerVolume } from '../../monde/socle/audio.js?v=1';
export { THREE, existe, arreterVoix, reglerVolume };

export const $ = id => document.getElementById(id);
export const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

// dossierAudio : « audio/jeux/<jeu> » (manifeste.json + mp3 générés à l'avance) ; seuls les fichiers réellement présents sont déclarés
export function creerBase({ canvas, dossierAudio, brume = '#f3dfb5', rayonCamera = [11.5, 12.5], hauteur = 6.4, centre = [0, 0.8, 1], sousTitresActifs = () => true }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(brume, 16, 40);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
  scene.add(new THREE.HemisphereLight('#fff6e0', '#8a7a5a', 1.5)); const soleil = new THREE.DirectionalLight('#ffe9c0', 1.5); soleil.position.set(6, 12, 8); scene.add(soleil);
  const sol = new THREE.Mesh(new THREE.CircleGeometry(14, 40), new THREE.MeshLambertMaterial({ color: '#e0b878' })); sol.rotation.x = -Math.PI / 2; scene.add(sol);
  const monde = new THREE.Group(); scene.add(monde);
  const C = new THREE.Vector3(...centre), ray = new THREE.Raycaster(), pt = new THREE.Vector2();
  const B = { THREE, renderer, scene, camera, sol, monde, az: 0, azCible: 0, t: 0, onTap: null, onFrame: null };

  const dimensionner = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 62 : 50; camera.updateProjectionMatrix(); };
  addEventListener('resize', dimensionner); dimensionner();
  const placer = () => { const R = camera.aspect < 0.8 ? rayonCamera[1] : rayonCamera[0]; camera.position.set(Math.sin(B.az) * R, hauteur, centre[2] + Math.cos(B.az) * R); camera.lookAt(C); };

  // orbite au doigt / à la souris ; un toucher sans glissement = onTap
  let glisse = null;
  canvas.addEventListener('pointerdown', e => { glisse = { x: e.clientX, az0: B.azCible, bouge: false }; canvas.setPointerCapture?.(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!glisse) return; const dx = e.clientX - glisse.x; if (Math.abs(dx) > 6) glisse.bouge = true; if (glisse.bouge) B.azCible = glisse.az0 - dx * 0.006; });
  canvas.addEventListener('pointerup', e => { if (glisse && !glisse.bouge && B.onTap) B.onTap(e); glisse = null; });
  B.tourner = d => { B.azCible += d; };
  B.versAngle = th => { B.azCible = th + Math.PI * 2 * Math.round((B.az - th) / (Math.PI * 2)); };
  B.toucher = (e, cibles) => { const r = canvas.getBoundingClientRect(); pt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(pt, camera); const h = ray.intersectObjects(cibles); return h.length ? h[0].object : null; };
  B.ecran = (x, y, z) => { const v = new THREE.Vector3(x, y, z).project(camera), r = canvas.getBoundingClientRect(); return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height, derriere: v.z > 1 }; };
  B.vider = () => { while (monde.children.length) { const o = monde.children[0]; monde.remove(o); o.traverse?.(c => { if (c.geometry) c.geometry.dispose?.(); }); } };
  B.ambiance = (ciel, solCouleur, brumeCouleur) => { scene.background = new THREE.Color(ciel); sol.material.color.set(solCouleur); scene.fog.color.set(brumeCouleur); };

  // icônes d'objets (rendu 3D → image) pour les boutons des énigmes
  const cache = new Map(); let rt = null, sc = null, cam = null;
  B.icone = (creer, id, taille = 128) => {
    if (cache.has(id)) return cache.get(id);
    if (!rt) { rt = new THREE.WebGLRenderTarget(taille, taille); sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight('#fff6e0', '#8a7a5a', 2.2)); const d = new THREE.DirectionalLight('#fff', 1.2); d.position.set(2, 4, 3); sc.add(d); cam = new THREE.PerspectiveCamera(30, 1, 0.1, 20); cam.position.set(0.9, 1.4, 2.6); cam.lookAt(0, 0.34, 0); }
    const o = creer(id); sc.add(o); renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam); renderer.setRenderTarget(null); sc.remove(o);
    const px = new Uint8Array(taille * taille * 4); renderer.readRenderTargetPixels(rt, 0, 0, taille, taille, px);
    const c = document.createElement('canvas'); c.width = c.height = taille; const g = c.getContext('2d'), im = g.createImageData(taille, taille);
    for (let y = 0; y < taille; y++) im.data.set(px.subarray((taille - 1 - y) * taille * 4, (taille - y) * taille * 4), y * taille * 4);
    g.putImageData(im, 0, 0); renderer.setClearColor(0x000000, 1); const u = c.toDataURL(); cache.set(id, u); return u;
  };

  // voix : manifeste généré à l'avance ; une phrase sans fichier reste SOUS-TITRÉE (jamais muette ET invisible)
  const dispo = new Set(); B.dispo = dispo;
  B.chargerAudio = async () => { try { await chargerVoix('voix/'); const r = await fetch('../../' + dossierAudio + '/manifeste.json', { cache: 'no-cache' }); if (!r.ok) return; const m = await r.json(); const e = {};
    for (const p of m.phrases || []) if (p.fichier && p.duree > 0) { e[p.id] = ['/' + dossierAudio + '/' + p.fichier, 0, p.duree]; dispo.add(p.id); } ajouterVoix(e); } catch (er) {} };
  let st = 0;
  B.sousTitre = (texte, qui, ms = 4500) => { const el = $('sous-titres'); clearTimeout(st); if (!texte) { el.classList.add('cache'); return; } el.innerHTML = (qui ? `<b>${qui}</b> ` : '') + texte; el.classList.remove('cache'); st = setTimeout(() => el.classList.add('cache'), ms); };
  B.parler = (id, texte, qui, fini) => { const voix = existe(id); reveiller(); if (voix) direVoix(id, fini); if (sousTitresActifs() || !voix) B.sousTitre(texte, qui, voix ? 4500 : Math.max(3500, texte.length * 55)); return voix; };

  let der = performance.now();
  (function boucle(now) { const dt = Math.min(0.05, (now - der) / 1000); der = now; B.t += dt; requestAnimationFrame(boucle); B.az += (B.azCible - B.az) * Math.min(1, dt * 5); placer(); if (B.onFrame) B.onFrame(dt, B.t); renderer.render(scene, camera); })(der);
  return B;
}
