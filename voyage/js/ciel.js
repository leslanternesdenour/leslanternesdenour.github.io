// Le ciel et la lumière : lever du soleil, plein jour, coucher doré, nuit étoilée douce.
// Une journée complète dure environ 9 minutes ; la nuit est courte et jamais noire.
import * as THREE from 'three';

const DUREE = 540;                    // secondes pour une journée entière
const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const C = (h) => new THREE.Color(h);
// Les ambiances de la journée (p = moment de la journée). Entre deux ambiances, tout se mélange en douceur.
const AMB = [
  { p: 0.00, nom: 'nuit',        haut: '#0f1848', horizon: '#34449a', soleil: '#a8bcff', si: 1.05, hemiCiel: '#7f92ec', hemiSol: '#4f5c9c', hi: 1.25, brume: '#2a3a80', nuage: '#5a64a8', nuit: 1 },
  { p: 0.205, nom: 'nuit',       haut: '#0f1848', horizon: '#34449a', soleil: '#a8bcff', si: 1.05, hemiCiel: '#7f92ec', hemiSol: '#4f5c9c', hi: 1.25, brume: '#2a3a80', nuage: '#5a64a8', nuit: 1 },
  { p: 0.245, nom: 'aube',       haut: '#2c2f7a', horizon: '#e7a0a8', soleil: '#ffb7a0', si: 0.9, hemiCiel: '#b7a8d8', hemiSol: '#8a6f78', hi: 1.0, brume: '#c99aae', nuage: '#f4b6b8', nuit: 0.35 },
  { p: 0.285, nom: 'lever',      haut: '#4a74c8', horizon: '#ffd2a1', soleil: '#ffd7a8', si: 1.8, hemiCiel: '#cfe0ff', hemiSol: '#d9b38a', hi: 1.25, brume: '#f3d6bd', nuage: '#ffe1c8', nuit: 0 },
  { p: 0.34, nom: 'matin',       haut: '#3f8fdc', horizon: '#d9eef6', soleil: '#fff6e6', si: 2.3, hemiCiel: '#d8eeff', hemiSol: '#e3c79a', hi: 1.4, brume: '#dcedf4', nuage: '#ffffff', nuit: 0 },
  { p: 0.50, nom: 'midi',        haut: '#2f7fd6', horizon: '#cfe9f4', soleil: '#fff3dc', si: 2.6, hemiCiel: '#d4ebff', hemiSol: '#e2c38e', hi: 1.45, brume: '#d7ecf4', nuage: '#ffffff', nuit: 0 },
  { p: 0.62, nom: 'après-midi',  haut: '#3f83cf', horizon: '#f0e2c4', soleil: '#ffe8bf', si: 2.5, hemiCiel: '#e6e6f0', hemiSol: '#e6be86', hi: 1.4, brume: '#ecdfc6', nuage: '#fff6e6', nuit: 0 },
  { p: 0.69, nom: 'fin de journée', haut: '#4f6fbe', horizon: '#ffc777', soleil: '#ffc070', si: 2.2, hemiCiel: '#e3d4cc', hemiSol: '#c99a6e', hi: 1.25, brume: '#f0d2a4', nuage: '#ffe0b0', nuit: 0 },
  { p: 0.735, nom: 'coucher',    haut: '#4b4aa0', horizon: '#ff8a52', soleil: '#ff9a5c', si: 1.75, hemiCiel: '#d4adbf', hemiSol: '#b08068', hi: 1.15, brume: '#eba88c', nuage: '#ffa98a', nuit: 0.1 },
  { p: 0.775, nom: 'crépuscule', haut: '#2a2466', horizon: '#b0658e', soleil: '#c99ad8', si: 0.8, hemiCiel: '#8f80c8', hemiSol: '#6e5a80', hi: 1.05, brume: '#7d5a8e', nuage: '#9a78b0', nuit: 0.6 },
  { p: 0.82, nom: 'nuit',        haut: '#0f1848', horizon: '#34449a', soleil: '#a8bcff', si: 1.05, hemiCiel: '#7f92ec', hemiSol: '#4f5c9c', hi: 1.25, brume: '#2a3a80', nuage: '#5a64a8', nuit: 1 },
  { p: 1.00, nom: 'nuit',        haut: '#0f1848', horizon: '#34449a', soleil: '#a8bcff', si: 1.05, hemiCiel: '#7f92ec', hemiSol: '#4f5c9c', hi: 1.25, brume: '#2a3a80', nuage: '#5a64a8', nuit: 1 }
].map(a => ({ ...a, haut: C(a.haut), horizon: C(a.horizon), soleil: C(a.soleil), hemiCiel: C(a.hemiCiel), hemiSol: C(a.hemiSol), brume: C(a.brume), nuage: C(a.nuage) }));
const JOUR = AMB[5];

export class Ciel {
  constructor(scene, Q) {
    this.scene = scene;
    this.p = 0.30;                 // moment de la journée (0,25 = lever, 0,5 = midi, 0,75 = coucher)
    this.hemi = new THREE.HemisphereLight('#d4ebff', '#e2c38e', 1.4);
    scene.add(this.hemi);
    this.soleil = new THREE.DirectionalLight('#fff3dc', 2.4);
    this.soleil.castShadow = !!Q.ombres;
    if (Q.ombres) {
      const s = this.soleil.shadow;
      s.mapSize.set(Q.ombresTaille || 2048, Q.ombresTaille || 2048);
      Object.assign(s.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 260 });
      s.bias = -0.0006; s.normalBias = 0.04;
    }
    scene.add(this.soleil, this.soleil.target);

    // dôme du ciel (dégradé) : il suit la caméra
    this.uni = { haut: { value: JOUR.haut.clone() }, horizon: { value: JOUR.horizon.clone() }, dirSoleil: { value: new THREE.Vector3() }, lueur: { value: 1 }, teinteSoleil: { value: JOUR.soleil.clone() } };
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: this.uni,
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 haut; uniform vec3 horizon; uniform vec3 dirSoleil; uniform float lueur; uniform vec3 teinteSoleil; varying vec3 vD;
        void main(){ vec3 d = normalize(vD); float h = clamp(d.y, -0.25, 1.0);
          // dégradé en trois temps : horizon clair et un peu brumeux, milieu lumineux, zénith profond
          vec3 milieu = mix(horizon, haut, 0.45) * 1.06;
          vec3 c = mix(horizon, milieu, smoothstep(0.0, 0.22, h));
          c = mix(c, haut, smoothstep(0.18, 0.95, h));
          c = mix(c, horizon * 1.08 + 0.04, exp(-max(h, 0.0) * 14.0) * 0.55 * lueur);         // voile de brume sur l'horizon
          c = mix(c, horizon * 0.82, smoothstep(0.0, -0.25, h));                                 // sous l'horizon, un peu plus sombre
          float s = max(dot(d, dirSoleil), 0.0), bas = 1.0 - clamp(dirSoleil.y * 2.5, 0.0, 1.0);
          c += teinteSoleil * (pow(s, 900.0) * 3.0 + pow(s, 40.0) * 0.35 + pow(s, 6.0) * (0.12 + 0.35 * bas)) * lueur;   // disque, halo et lueur du couchant
          c += teinteSoleil * exp(-max(h, 0.0) * 6.0) * pow(s, 2.0) * 0.35 * bas * lueur;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`
    }));
    this.dome.renderOrder = -10; this.dome.frustumCulled = false;
    scene.add(this.dome);

    // étoiles
    const n = Q.etoiles, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, y = Math.abs(u) * 0.9 + 0.08, r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(a) * r * 850; pos[i * 3 + 1] = y * 850; pos[i * 3 + 2] = Math.sin(a) * r * 850;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.matEtoiles = new THREE.PointsMaterial({ color: '#fff6d6', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.etoiles = new THREE.Points(g, this.matEtoiles); this.etoiles.frustumCulled = false;
    scene.add(this.etoiles);

    // la lune (un croissant doré, comme sur le site)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const x = cv.getContext('2d');
    x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(64, 64, 44, 0, Math.PI * 2); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(84, 52, 40, 0, Math.PI * 2); x.fill();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    this.lune = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false, opacity: 0 }));
    this.lune.scale.setScalar(70); scene.add(this.lune);

    scene.fog = new THREE.Fog(JOUR.brume.clone(), Q.brumeProche ?? 110, Q.brumeLoin ?? 470);

    // les nuages : ils glissent doucement avec le vent
    this.nuages = [];
    const nbNuages = Q.nuages ?? 14;
    for (let i = 0; i < nbNuages; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: Q.texNuage ? Q.texNuage(i) : null, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
      const a = i / nbNuages * Math.PI * 2 + Math.random(), d = 300 + Math.random() * 380, loin = d > 520;
      s.userData = { x: Math.cos(a) * d, z: Math.sin(a) * d, y: (loin ? 110 : 160) + Math.random() * 90, v: 1.0 + Math.random() * 1.6 };
      const L = (loin ? 260 : 190) + Math.random() * 160; s.scale.set(L, L * 0.5, 1);
      s.renderOrder = -5; this.nuages.push(s); scene.add(s);
    }
    this.nuit = 0;
    this._c = new THREE.Color(); this._d = new THREE.Vector3();
  }

  regler(p) { this.p = ((p % 1) + 1) % 1; }

  // Renvoie « nuit » entre 0 (plein jour) et 1 (nuit)
  maj(dt, centre, cycle) {
    if (cycle) this.p = (this.p + dt / DUREE) % 1;
    else this.p += (0.36 - this.p) * Math.min(1, dt * 0.5); // jour fixe : lumière douce du matin
    const a = (this.p - 0.25) * Math.PI * 2;                 // 0 au lever, π/2 à midi
    const elev = Math.sin(a);
    const dir = this._d.set(Math.cos(a) * 0.8, elev, 0.35).normalize();
    // les deux ambiances qui entourent le moment présent
    let k = 0; while (k < AMB.length - 2 && AMB[k + 1].p <= this.p) k++;
    const A = AMB[k], Bm = AMB[k + 1], f = lisse(0, 1, (this.p - A.p) / Math.max(1e-6, Bm.p - A.p));
    const mix = (c) => this._c.copy(A[c]).lerp(Bm[c], f);
    const nuit = A.nuit + (Bm.nuit - A.nuit) * f;
    this.nuit = nuit; this.ambiance = f < 0.5 ? A.nom : Bm.nom;
    this.uni.haut.value.copy(mix('haut'));
    this.uni.horizon.value.copy(mix('horizon'));
    this.uni.dirSoleil.value.copy(dir);
    this.uni.lueur.value = 1 - nuit; this.uni.teinteSoleil.value.copy(mix('soleil'));
    this.scene.fog.color.copy(mix('brume'));
    this.hemi.color.copy(mix('hemiCiel')); this.hemi.groundColor.copy(mix('hemiSol'));
    this.hemi.intensity = A.hi + (Bm.hi - A.hi) * f;
    const intensiteSoleil = A.si + (Bm.si - A.si) * f;
    const teinteNuage = mix('nuage').clone();
    for (const s of this.nuages) {
      const u = s.userData; u.x += u.v * dt; if (u.x > 700) u.x = -700;
      s.position.set(centre.x + u.x, u.y, centre.z + u.z);
      s.material.color.copy(teinteNuage); s.material.opacity = 0.95 - nuit * 0.5;
    }
    // le soleil le jour, la lune la nuit (lumière douce venant d'en haut)
    const lumDir = nuit > 0.5 ? this._d.set(-dir.x, Math.max(0.45, -dir.y), -dir.z * 0.5 + 0.3).normalize() : dir.clone().setY(Math.max(dir.y, 0.12)).normalize();
    this.soleil.color.copy(mix('soleil'));
    this.soleil.intensity = intensiteSoleil;
    this.soleil.position.set(centre.x + lumDir.x * 120, centre.y + lumDir.y * 120, centre.z + lumDir.z * 120);
    this.soleil.target.position.set(centre.x, centre.y, centre.z);
    this.dome.position.copy(centre); this.etoiles.position.copy(centre);
    this.matEtoiles.opacity = lisse(0.45, 0.9, nuit);
    this.lune.material.opacity = lisse(0.3, 0.8, nuit);
    this.lune.position.set(centre.x - dir.x * 700, centre.y + Math.max(0.25, -dir.y) * 700, centre.z - 260);
    return nuit;
  }
}
