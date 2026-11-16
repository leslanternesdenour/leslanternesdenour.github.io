// Le village 3D : sol, fontaine, maisons, jardins, rempart, ciel selon l'heure, Nour.
// Tout est construit par code (pas de modèle à télécharger) pour rester léger.
import * as THREE from 'three';
import { BATIMENTS } from './batiments.js';

const R_MAISONS = 20;          // rayon du cercle des maisons
const R_REMPART = 31;
const PAS = Math.PI * 2 / 10;  // 10 emplacements : 0 = porte, 1..9 = maisons

// ---------- outils ----------
function alea(graine) {
  return function () {
    graine |= 0; graine = graine + 0x6D2B79F5 | 0;
    let t = Math.imul(graine ^ graine >>> 15, 1 | graine);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = alea(20261116);

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function M(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e);
  return new THREE.Matrix4().compose(_v.set(x, y, z), _q, _s.set(sx, sy, sz));
}

// Fusionne des morceaux colorés en une seule géométrie (moins d'appels de dessin)
function fusionner(parts) {
  let n = 0;
  const geos = [];
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    g.applyMatrix4(p.m);
    if (!g.attributes.normal) g.computeVertexNormals();
    geos.push([g, p.c]);
    n += g.attributes.position.count;
  }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const c = new THREE.Color();
  let o = 0;
  for (const [g, hex] of geos) {
    const k = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    c.set(hex);
    for (let i = 0; i < k; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
    o += k;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere();
  return out;
}

function arche(larg, hautDroit) {
  const s = new THREE.Shape();
  const r = larg / 2;
  s.moveTo(-r, 0); s.lineTo(-r, hautDroit);
  s.absarc(0, hautDroit, r, Math.PI, 0, true);
  s.lineTo(r, 0); s.lineTo(-r, 0);
  return new THREE.ShapeGeometry(s, 8);
}

function etoile8(rExt, rInt) {
  const s = new THREE.Shape();
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8, r = i % 2 ? rInt : rExt;
    const x = Math.sin(a) * r, y = Math.cos(a) * r;
    i ? s.lineTo(x, y) : s.moveTo(x, y);
  }
  return new THREE.ShapeGeometry(s);
}

function eclaircir(hex, f) { return '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), f).getHexString(); }
function assombrir(hex, f) { return '#' + new THREE.Color(hex).lerp(new THREE.Color('#000000'), f).getHexString(); }

// Textures dessinées sur canvas
function texHalo() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.25, 'rgba(255,255,255,.55)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function texIcone(emoji, couleur, bientot) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2);
  g.fillStyle = '#fff8e7'; g.fill();
  g.lineWidth = 16; g.strokeStyle = couleur; g.stroke();
  g.font = '128px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.globalAlpha = bientot ? 0.55 : 1;
  g.fillText(emoji, 128, 138);
  g.globalAlpha = 1;
  if (bientot) {
    g.beginPath(); g.arc(200, 200, 44, 0, Math.PI * 2); g.fillStyle = '#efe3c4'; g.fill();
    g.font = '56px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    g.fillText('⏳', 200, 204);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return t;
}

function texNom(texte) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  g.font = '700 54px Nunito, system-ui, sans-serif';
  const l = Math.min(1000, g.measureText(texte).width + 60);
  g.fillStyle = 'rgba(25,19,69,.78)';
  const x = (1024 - l) / 2;
  g.beginPath(); g.roundRect ? g.roundRect(x, 22, l, 84, 42) : g.rect(x, 22, l, 84); g.fill();
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(texte, 512, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- couleurs ----------
const C = {
  mur: ['#f3e6c8', '#efd9b0', '#f6ecd8', '#ead2a6'],
  socle: '#d9c29a', porte: '#6b3f2a', fenetre: '#3a2a5a', pierre: '#e6d3ad', dalle: '#efe0bf',
  sable: '#e3cf9c', herbe: '#9bc76d', or: '#f5b942', bois: '#7a5636', tronc: '#9a7046',
  palme: '#4f9a4a', cypres: '#2f6f45', buisson: '#5aa85a', eau: '#5cc6d6', fontaine: '#e2d2b8', turquoise: '#2bb3c0'
};

// Moments de la journée (heure locale)
const CLES = [
  { h: 0, haut: '#070a26', hor: '#1b1f55', lum: 0.18 },
  { h: 4.8, haut: '#0b1035', hor: '#2a2a6a', lum: 0.2 },
  { h: 6.2, haut: '#3a4f9a', hor: '#f7b58a', lum: 0.6 },
  { h: 8, haut: '#4aa3e8', hor: '#cdeefc', lum: 1 },
  { h: 16.5, haut: '#4aa3e8', hor: '#cdeefc', lum: 1 },
  { h: 18.3, haut: '#4b4a9a', hor: '#f59a5a', lum: 0.65 },
  { h: 19.8, haut: '#1d1a5a', hor: '#6a3f7a', lum: 0.3 },
  { h: 21, haut: '#0b1035', hor: '#2a2a6a', lum: 0.2 },
  { h: 24, haut: '#070a26', hor: '#1b1f55', lum: 0.18 }
];

export function creerVillage(canvas, opts) {
  const R = opts.reglages;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: R.antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(R.pixelRatio);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = R.ombres;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcdeefc, 60, 170);
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.5, 600);

  const matVC = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  const halo = texHalo();
  const halos = [];   // sprites lumineux des lanternes
  const lanternes = []; // { p: Vector3, c: hex }
  const ombre = o => { o.castShadow = R.ombres; o.receiveShadow = R.ombres; return o; };

  // ---------- ciel ----------
  const ciel = new THREE.Mesh(
    new THREE.SphereGeometry(400, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: {
        haut: { value: new THREE.Color() }, hor: { value: new THREE.Color() },
        bas: { value: new THREE.Color(C.sable) },
        soleilDir: { value: new THREE.Vector3(0, 1, 0) }, soleilCoul: { value: new THREE.Color('#fff4dc') },
        soleilForce: { value: 1 }
      },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 haut; uniform vec3 hor; uniform vec3 bas; uniform vec3 soleilDir; uniform vec3 soleilCoul; uniform float soleilForce;
        varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = mix(hor, haut, smoothstep(0.0, 0.55, h));
          c = mix(c, bas, smoothstep(0.0, -0.12, h));
          float s = max(dot(normalize(vDir), soleilDir), 0.0);
          c += soleilCoul * (pow(s, 900.0) * 2.0 + pow(s, 12.0) * 0.22) * soleilForce;
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`
    })
  );
  ciel.renderOrder = -10;
  scene.add(ciel);

  // étoiles
  const nbE = R.etoiles, pe = new Float32Array(nbE * 3);
  for (let i = 0; i < nbE; i++) {
    const a = rnd() * Math.PI * 2, y = 0.08 + rnd() * 0.92, r = Math.sqrt(1 - y * y);
    pe[i * 3] = Math.cos(a) * r * 380; pe[i * 3 + 1] = y * 380; pe[i * 3 + 2] = Math.sin(a) * r * 380;
  }
  const gEt = new THREE.BufferGeometry(); gEt.setAttribute('position', new THREE.BufferAttribute(pe, 3));
  const matEt = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
  const etoiles = new THREE.Points(gEt, matEt);
  scene.add(etoiles);
  const lune = new THREE.Mesh(new THREE.SphereGeometry(7, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf4f1dc, fog: false, transparent: true }));
  scene.add(lune);

  // ---------- lumières ----------
  const hemi = new THREE.HemisphereLight(0xcdeefc, 0xd9c39a, 1.6);
  scene.add(hemi);
  const astre = new THREE.DirectionalLight(0xfff4dc, 2.2);
  astre.castShadow = R.ombres;
  if (R.ombres) {
    astre.shadow.mapSize.set(1024, 1024);
    const sc = astre.shadow.camera; sc.left = -36; sc.right = 36; sc.top = 36; sc.bottom = -36; sc.near = 1; sc.far = 160;
    astre.shadow.bias = -0.0008;
  }
  scene.add(astre, astre.target);

  // ---------- sol ----------
  const sol = [];
  const plat = (geo, c, y, ry = 0, x = 0, z = 0) => sol.push({ geo, c, m: M(x, y, z, -Math.PI / 2, 0, 0).premultiply(M(0, 0, 0, 0, ry, 0)) });
  plat(new THREE.CircleGeometry(160, 48), C.sable, 0);
  plat(new THREE.CircleGeometry(R_REMPART - 0.3, 64), C.herbe, 0.02);
  plat(new THREE.CircleGeometry(10, 48), C.dalle, 0.04);
  plat(new THREE.RingGeometry(9.3, 10, 48), C.turquoise, 0.06);
  plat(etoile8(7.2, 5.6), '#f6ecd8', 0.05);
  plat(new THREE.RingGeometry(6.6, 6.9, 8, 1), C.turquoise, 0.06, Math.PI / 8);
  // allées vers chaque maison et vers la porte
  for (let k = 0; k < 10; k++) {
    const a = k * PAS, fin = k === 0 ? R_REMPART + 2 : R_MAISONS - 3;
    const lg = fin - 9.8;
    sol.push({ geo: new THREE.PlaneGeometry(2.6, lg), c: C.pierre, m: M(0, 0.05, 9.8 + lg / 2, -Math.PI / 2, 0, 0).premultiply(M(0, 0, 0, 0, a, 0)) });
  }
  // petits jardins entre les maisons
  const jardins = [];
  for (let k = 0; k < 10; k++) {
    const a = (k + 0.5) * PAS;
    const x = Math.sin(a) * (R_MAISONS + 1), z = Math.cos(a) * (R_MAISONS + 1);
    jardins.push({ a, x, z });
    plat(new THREE.CircleGeometry(2.6, 20), '#7fb85a', 0.05, 0, x, z);
  }
  const mSol = new THREE.Mesh(fusionner(sol), matVC);
  mSol.receiveShadow = R.ombres;
  scene.add(mSol);

  // ---------- fontaine ----------
  const ft = [];
  ft.push({ geo: new THREE.CylinderGeometry(4, 4.3, 0.9, 8), c: C.fontaine, m: M(0, 0.45, 0, 0, Math.PI / 8) });
  ft.push({ geo: new THREE.CylinderGeometry(4.25, 4.25, 0.18, 8), c: C.turquoise, m: M(0, 0.95, 0, 0, Math.PI / 8) });
  ft.push({ geo: new THREE.CylinderGeometry(0.5, 0.75, 2.1, 8), c: C.fontaine, m: M(0, 1.05, 0) });
  ft.push({ geo: new THREE.CylinderGeometry(1.5, 0.6, 0.45, 8), c: C.fontaine, m: M(0, 2.2, 0, 0, Math.PI / 8) });
  ft.push({ geo: new THREE.SphereGeometry(0.28, 8, 6), c: C.or, m: M(0, 2.7, 0) });
  const mFont = ombre(new THREE.Mesh(fusionner(ft), matVC));
  scene.add(mFont);
  const matEau = new THREE.MeshLambertMaterial({ color: C.eau, emissive: 0x1a6f7a, emissiveIntensity: 0.4, transparent: true, opacity: 0.88 });
  const eau1 = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 0.08, 8), matEau);
  eau1.position.y = 0.82; eau1.rotation.y = Math.PI / 8;
  const eau2 = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 0.06, 8), matEau);
  eau2.position.y = 2.38;
  scene.add(eau1, eau2);
  // gouttes du jet
  const NG = R.gouttes, pg = new Float32Array(NG * 3), vg = new Float32Array(NG * 3);
  const relance = i => {
    const a = rnd() * Math.PI * 2, f = 0.6 + rnd() * 0.9;
    pg[i * 3] = 0; pg[i * 3 + 1] = 2.5; pg[i * 3 + 2] = 0;
    vg[i * 3] = Math.cos(a) * f; vg[i * 3 + 1] = 2.2 + rnd() * 1.2; vg[i * 3 + 2] = Math.sin(a) * f;
  };
  for (let i = 0; i < NG; i++) { relance(i); const t = rnd() * 1.2; pg[i * 3] += vg[i * 3] * t; pg[i * 3 + 2] += vg[i * 3 + 2] * t; pg[i * 3 + 1] += vg[i * 3 + 1] * t - 4.9 * t * t; }
  const gG = new THREE.BufferGeometry(); gG.setAttribute('position', new THREE.BufferAttribute(pg, 3));
  const gouttes = new THREE.Points(gG, new THREE.PointsMaterial({ color: 0xbfefff, size: 0.14, transparent: true, opacity: 0.85, depthWrite: false }));
  scene.add(gouttes);

  // ---------- maisons ----------
  const maisons = []; // { b, mesh, pos, a, icone, nom, hTot }
  const cibles = [];
  for (const b of BATIMENTS) {
    const a = b.emplacement * PAS;
    const pos = new THREE.Vector3(Math.sin(a) * R_MAISONS, 0, Math.cos(a) * R_MAISONS);
    const ry = Math.atan2(-pos.x, -pos.z);
    const base = M(pos.x, 0, pos.z, 0, ry, 0);
    const { parts, hTot, lant } = construireMaison(b);
    parts.forEach(p => p.m.premultiply(base));
    const mesh = ombre(new THREE.Mesh(fusionner(parts), matVC));
    mesh.userData.b = b;
    scene.add(mesh);
    cibles.push(mesh);
    lant.forEach(l => lanternes.push({ p: l.p.applyMatrix4(base), c: l.c, halo: l.halo }));

    const icone = new THREE.Sprite(new THREE.SpriteMaterial({ map: texIcone(b.icone, b.couleur, b.etat !== 'ouvert'), depthWrite: false }));
    icone.scale.set(3.2, 3.2, 1);
    icone.position.set(pos.x, hTot + 2.4, pos.z);
    icone.userData.b = b;
    icone.renderOrder = 5;
    scene.add(icone);
    cibles.push(icone);

    const nom = new THREE.Sprite(new THREE.SpriteMaterial({ map: texNom(b.nom), depthWrite: false, transparent: true }));
    nom.scale.set(8, 1, 1);
    nom.position.set(pos.x, hTot + 0.55, pos.z);
    nom.renderOrder = 6;
    nom.visible = !!opts.noms;
    scene.add(nom);

    maisons.push({ b, mesh, pos, a, icone, nom, hTot, phase: rnd() * 6 });
  }

  // ---------- porte du village, rempart, lampadaires ----------
  const deco = [];
  const zp = R_REMPART;
  deco.push({ geo: new THREE.BoxGeometry(1.1, 3.6, 1.1), c: C.mur[1], m: M(-2.4, 1.8, zp) });
  deco.push({ geo: new THREE.BoxGeometry(1.1, 3.6, 1.1), c: C.mur[1], m: M(2.4, 1.8, zp) });
  deco.push({ geo: new THREE.TorusGeometry(2.4, 0.42, 6, 14, Math.PI), c: C.mur[0], m: M(0, 3.6, zp) });
  deco.push({ geo: new THREE.TorusGeometry(2.4, 0.2, 4, 14, Math.PI), c: C.turquoise, m: M(0, 3.6, zp + 0.35) });
  deco.push({ geo: new THREE.BoxGeometry(1.4, 0.3, 1.4), c: C.or, m: M(-2.4, 3.75, zp) });
  deco.push({ geo: new THREE.BoxGeometry(1.4, 0.3, 1.4), c: C.or, m: M(2.4, 3.75, zp) });
  deco.push({ geo: new THREE.CylinderGeometry(0.04, 0.04, 0.9, 4), c: C.bois, m: M(0, 5.2, zp) });
  lanternes.push({ p: new THREE.Vector3(0, 4.55, zp), c: C.or, halo: true, gros: true });
  const nbSeg = 90;
  for (let i = 0; i < nbSeg; i++) {
    const a = (i + 0.5) / nbSeg * Math.PI * 2;
    if (a < 0.13 || a > Math.PI * 2 - 0.13) continue; // ouverture de la porte
    const lg = 2 * Math.PI * R_REMPART / nbSeg + 0.05;
    deco.push({ geo: new THREE.BoxGeometry(lg, 1.4, 0.7), c: C.mur[i % 2 ? 0 : 3], m: M(Math.sin(a) * R_REMPART, 0.7, Math.cos(a) * R_REMPART, 0, a, 0) });
    if (i % 2 === 0) deco.push({ geo: new THREE.BoxGeometry(lg * 0.55, 0.45, 0.72), c: C.mur[0], m: M(Math.sin(a) * R_REMPART, 1.62, Math.cos(a) * R_REMPART, 0, a, 0) });
  }
  // lampadaires le long des allées
  for (let k = 0; k < 10; k++) {
    const a = k * PAS;
    const d = k === 0 ? 22 : 14.2;
    const m0 = M(0, 0, 0, 0, a, 0);
    const local = new THREE.Vector3(1.8, 0, d);
    const p = local.clone().applyMatrix4(m0);
    deco.push({ geo: new THREE.CylinderGeometry(0.08, 0.11, 2.4, 6), c: '#4a3a5a', m: M(p.x, 1.2, p.z) });
    deco.push({ geo: new THREE.ConeGeometry(0.26, 0.28, 6), c: C.or, m: M(p.x, 2.95, p.z) });
    lanternes.push({ p: new THREE.Vector3(p.x, 2.62, p.z), c: C.or, halo: true });
  }
  // dunes au loin
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2 + rnd() * 0.3, r = 75 + rnd() * 35;
    deco.push({ geo: new THREE.SphereGeometry(1, 12, 6), c: i % 2 ? '#e8d3a0' : '#dcc28a', m: M(Math.sin(a) * r, -1, Math.cos(a) * r, 0, a, 0, 14 + rnd() * 12, 4 + rnd() * 4, 8 + rnd() * 6) });
  }
  const mDeco = ombre(new THREE.Mesh(fusionner(deco), matVC));
  scene.add(mDeco);

  // ---------- végétation (instances) ----------
  const geoPalmier = (() => {
    const p = [];
    let x = 0;
    for (let i = 0; i < 5; i++) {
      p.push({ geo: new THREE.CylinderGeometry(0.2 - i * 0.012, 0.25 - i * 0.012, 1.25, 6), c: i % 2 ? C.tronc : '#8a6340', m: M(x, 0.6 + i * 1.2, 0, 0, 0, -0.04) });
      x += 0.06 * i;
    }
    for (let k = 0; k < 7; k++) {
      const ry = k / 7 * Math.PI * 2;
      p.push({ geo: new THREE.ConeGeometry(0.42, 2.8, 4), c: k % 2 ? C.palme : '#5fae54', m: M(x, 6.1, 0, 0, ry, -(Math.PI / 2 + 0.38)).multiply(M(0, 1.25, 0)) });
    }
    for (let k = 0; k < 3; k++) p.push({ geo: new THREE.SphereGeometry(0.2, 6, 4), c: '#7a5232', m: M(x + Math.cos(k * 2.1) * 0.3, 5.8, Math.sin(k * 2.1) * 0.3) });
    return fusionner(p);
  })();
  const geoCypres = fusionner([
    { geo: new THREE.CylinderGeometry(0.15, 0.2, 0.8, 5), c: C.tronc, m: M(0, 0.4, 0) },
    { geo: new THREE.ConeGeometry(0.95, 4.6, 7), c: C.cypres, m: M(0, 2.9, 0) }
  ]);
  const geoBuisson = fusionner([{ geo: new THREE.IcosahedronGeometry(0.7, 0), c: C.buisson, m: M(0, 0.45, 0) }]);
  const geoFleur = new THREE.IcosahedronGeometry(0.17, 0);

  const palmiers = [], cypres = [], buissons = [], fleurs = [];
  const D = R.densiteDeco;
  jardins.forEach((j, i) => {
    (i % 2 ? cypres : palmiers).push(M(j.x, 0, j.z, 0, rnd() * 6, 0, 0.85 + rnd() * 0.3));
    for (let k = 0; k < 2; k++) buissons.push(M(j.x + Math.cos(i + k * 3) * 1.6, 0, j.z + Math.sin(i + k * 3) * 1.6, 0, rnd() * 6, 0, 0.7 + rnd() * 0.5));
    const nf = Math.round(10 * D);
    for (let k = 0; k < nf; k++) {
      const a = k / nf * Math.PI * 2, r = 2.1 + rnd() * 0.3;
      fleurs.push({ m: M(j.x + Math.cos(a) * r, 0.2, j.z + Math.sin(a) * r), c: ['#ff6b8a', '#ffd166', '#ffffff', '#c58cff', '#ff8a3d'][(k + i) % 5] });
    }
  });
  // parterres autour de la place
  for (let i = 0; i < Math.round(70 * D); i++) {
    let a = rnd() * Math.PI * 2;
    const d = ((a / PAS) % 1 + 1) % 1;
    if (d < 0.18 || d > 0.82) a += PAS * 0.5; // pas sur les allées
    const r = 11 + rnd() * 3.5;
    fleurs.push({ m: M(Math.sin(a) * r, 0.2, Math.cos(a) * r), c: ['#ff6b8a', '#ffd166', '#ffffff', '#c58cff', '#ff8a3d'][i % 5] });
  }
  // palmeraie hors des remparts
  for (let i = 0; i < Math.round(30 * D); i++) {
    let a = rnd() * Math.PI * 2;
    if (a < 0.35 || a > Math.PI * 2 - 0.35) a += 0.7;
    const r = R_REMPART + 3 + rnd() * 14;
    palmiers.push(M(Math.sin(a) * r, 0, Math.cos(a) * r, 0, rnd() * 6, 0, 0.9 + rnd() * 0.5));
  }
  // deux palmiers de part et d'autre de la porte
  palmiers.push(M(-5.5, 0, R_REMPART + 1.5, 0, 1, 0, 1.15), M(5.5, 0, R_REMPART + 1.5, 0, 4, 0, 1.05));

  const inst = (geo, mats, mat = matVC) => {
    const m = new THREE.InstancedMesh(geo, mat, mats.length);
    mats.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    ombre(m); m.receiveShadow = false;
    scene.add(m);
    return m;
  };
  inst(geoPalmier, palmiers); inst(geoCypres, cypres); inst(geoBuisson, buissons);
  const mFl = new THREE.InstancedMesh(geoFleur, new THREE.MeshLambertMaterial({ flatShading: true }), fleurs.length);
  const cf = new THREE.Color();
  fleurs.forEach((f, i) => { mFl.setMatrixAt(i, f.m); mFl.setColorAt(i, cf.set(f.c)); });
  scene.add(mFl);

  // ---------- lanternes (verre lumineux + halo la nuit) ----------
  const geoVerre = new THREE.CylinderGeometry(0.17, 0.15, 0.42, 6);
  const mVerre = new THREE.InstancedMesh(geoVerre, new THREE.MeshBasicMaterial({ color: 0xffffff }), lanternes.length);
  const cacheHalo = new Map();
  lanternes.forEach((l, i) => {
    const s = l.gros ? 1.9 : 1;
    mVerre.setMatrixAt(i, M(l.p.x, l.p.y, l.p.z, 0, 0, 0, s));
    mVerre.setColorAt(i, cf.set(eclaircir(l.c, 0.25)));
    if (l.halo && (!R.leger || l.gros || lanternes.length < 60)) {
      if (!cacheHalo.has(l.c)) cacheHalo.set(l.c, new THREE.SpriteMaterial({ map: halo, color: l.c, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      const sp = new THREE.Sprite(cacheHalo.get(l.c));
      sp.position.copy(l.p); sp.scale.setScalar(l.gros ? 5 : 2.6);
      scene.add(sp); halos.push(sp);
    }
  });
  scene.add(mVerre);

  // ---------- Nour, la goutte de lumière ----------
  const nour = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 10; i++) { const a = -Math.PI / 2 + i / 10 * Math.PI / 2; prof.push(new THREE.Vector2(Math.cos(a) * 0.36, Math.sin(a) * 0.36)); }
  for (let i = 1; i <= 6; i++) { const t = i / 6; prof.push(new THREE.Vector2(0.36 * (1 - t) * (1 - t * 0.25), t * 0.42)); }
  const corps = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), new THREE.MeshBasicMaterial({ color: 0xffd45e }));
  const haloNour = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0xffd36a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.85 }));
  haloNour.scale.setScalar(3.2);
  nour.add(corps, haloNour);
  const etincelles = [];
  for (let i = 0; i < 3; i++) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
    nour.add(e); etincelles.push(e);
  }
  const lumNour = R.leger ? null : new THREE.PointLight(0xffd36a, 6, 9, 1.6);
  if (lumNour) nour.add(lumNour);
  nour.scale.setScalar(1.6);
  scene.add(nour);
  const nourRepos = new THREE.Vector3(0, 5, 6.5);
  const nourBut = nourRepos.clone();
  nour.position.copy(nourRepos);

  // anneau sous la maison choisie
  const anneau = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 32), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0, depthWrite: false }));
  anneau.rotation.x = -Math.PI / 2; anneau.position.y = 0.09;
  scene.add(anneau);

  // ---------- caméra : tourner, zoomer, toucher ----------
  const portrait = () => innerWidth / innerHeight < 0.85;
  const rDefaut = () => portrait() ? 58 : 50;
  const PHI = 0.85;
  const phiDefaut = () => portrait() ? 0.72 : PHI;
  const cam = { theta: 0.5, phi: 1.1, r: 80, cible: new THREE.Vector3() };
  const but = { theta: 0, phi: phiDefaut(), r: rDefaut(), cible: new THREE.Vector3() };
  let choisie = null, inactif = 0;

  const pointeurs = new Map();
  let depart = null, distPince = 0;
  canvas.addEventListener('pointerdown', e => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* pointeur simulé */ }
    pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointeurs.size === 1) depart = { x: e.clientX, y: e.clientY, t: performance.now(), bouge: 0 };
    else { depart = null; distPince = ecart(); }
    inactif = 0;
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointeurs.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pointeurs.size === 1) {
      if (depart) depart.bouge += Math.abs(dx) + Math.abs(dy);
      but.theta -= dx * 0.006;
      but.phi = THREE.MathUtils.clamp(but.phi - dy * 0.004, 0.55, 1.32);
    } else if (pointeurs.size === 2) {
      const d = ecart();
      if (distPince > 0) but.r = THREE.MathUtils.clamp(but.r * distPince / d, 12, 75);
      distPince = d;
    }
    inactif = 0;
  });
  const fin = e => {
    const p = pointeurs.get(e.pointerId);
    pointeurs.delete(e.pointerId);
    if (p && depart && pointeurs.size === 0 && depart.bouge < 12 && performance.now() - depart.t < 600) toucher(e.clientX, e.clientY);
    if (pointeurs.size < 2) distPince = 0;
    if (pointeurs.size === 0) depart = null;
  };
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', e => { pointeurs.delete(e.pointerId); depart = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); but.r = THREE.MathUtils.clamp(but.r * (1 + e.deltaY * 0.001), 12, 75); inactif = 0; }, { passive: false });
  function ecart() { const [a, b] = [...pointeurs.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  ray.camera = camera;
  function toucher(x, y) {
    ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(cibles, false)[0];
    opts.surTap && opts.surTap(hit ? hit.object.userData.b : null);
  }

  function selectionner(id) {
    const m = maisons.find(x => x.b.id === id);
    if (!m) return;
    choisie = m;
    but.cible.copy(m.pos).multiplyScalar(0.62).setY(0.5);
    let t = m.a + Math.PI;
    while (t - but.theta > Math.PI) t -= Math.PI * 2;
    while (t - but.theta < -Math.PI) t += Math.PI * 2;
    but.theta = t; but.phi = 1.0; but.r = portrait() ? 30 : 22;
    nourBut.copy(m.pos).multiplyScalar(0.74).setY(3.2).add(new THREE.Vector3(Math.cos(m.a) * 2.6, 0, -Math.sin(m.a) * 2.6));
    anneau.position.x = m.pos.x * 0.86; anneau.position.z = m.pos.z * 0.86;
  }
  function deselectionner() {
    choisie = null;
    but.cible.set(0, 0, 0); but.r = rDefaut(); but.phi = phiDefaut();
    nourBut.copy(nourRepos);
  }

  // ---------- heure ----------
  const forcee = opts.heure;
  const ca = new THREE.Color(), cb = new THREE.Color();
  let facteurJour = 1, facteurNuit = 0;
  function heureActuelle() {
    if (forcee != null && !isNaN(forcee)) return ((forcee % 24) + 24) % 24;
    const d = new Date(); return d.getHours() + d.getMinutes() / 60;
  }
  function majHeure() {
    const h = heureActuelle();
    let i = 0; while (i < CLES.length - 2 && CLES[i + 1].h <= h) i++;
    const k0 = CLES[i], k1 = CLES[i + 1], f = (h - k0.h) / (k1.h - k0.h || 1);
    const u = ciel.material.uniforms;
    u.haut.value.copy(ca.set(k0.haut)).lerp(cb.set(k1.haut), f);
    u.hor.value.copy(ca.set(k0.hor)).lerp(cb.set(k1.hor), f);
    const lum = k0.lum + (k1.lum - k0.lum) * f;
    facteurNuit = THREE.MathUtils.clamp((0.62 - lum) / 0.4, 0, 1);
    facteurJour = THREE.MathUtils.clamp((lum - 0.45) / 0.5, 0, 1);
    scene.fog.color.copy(u.hor.value);
    u.bas.value.copy(u.hor.value);
    hemi.color.copy(u.hor.value).lerp(ca.set('#ffffff'), 0.3);
    hemi.intensity = 0.55 + 1.25 * lum;
    // soleil ou lune
    const jour = h >= 5.6 && h <= 19;
    const t = jour ? (h - 5.6) / 13.4 * Math.PI : (((h - 19) + 24) % 24) / 10.6 * Math.PI;
    const dir = new THREE.Vector3(-Math.cos(t) * 0.85, Math.max(Math.sin(t), 0.18), -0.5).normalize();
    u.soleilDir.value.copy(dir);
    u.soleilForce.value = jour ? 1 : 0;
    u.soleilCoul.value.set(h < 8 || h > 17 ? '#ffb27a' : '#fff4dc');
    astre.position.copy(dir).multiplyScalar(70);
    astre.color.set(jour ? (h < 7.5 || h > 17.5 ? '#ffc08a' : '#fff4dc') : '#9fb4ff');
    astre.intensity = jour ? 0.6 + 1.9 * lum : 0.45;
    lune.visible = !jour;
    lune.position.copy(dir).multiplyScalar(300);
    matEt.opacity = facteurNuit * 0.95;
    halos.forEach(s => { s.material.opacity = 0.12 + 0.78 * facteurNuit; });
    haloNour.material.opacity = 0.45 + 0.45 * facteurNuit;
    matEau.emissiveIntensity = 0.3 + 0.5 * facteurNuit;
    renderer.toneMappingExposure = 1;
  }
  majHeure();
  let prochainHeure = 0;

  // ---------- boucle ----------
  const horloge = new THREE.Clock();
  let tTotal = 0, enMarche = true;
  function image() {
    if (!enMarche) return;
    requestAnimationFrame(image);
    const dt = Math.min(horloge.getDelta(), 0.05);
    tTotal += dt;
    inactif += dt;

    if (!choisie && inactif > 15 && pointeurs.size === 0) but.theta += dt * 0.035;
    const k = Math.min(1, dt * 4.5);
    cam.theta += (but.theta - cam.theta) * k;
    cam.phi += (but.phi - cam.phi) * k;
    cam.r += (but.r - cam.r) * Math.min(1, dt * (cam.r > 60 ? 1.6 : 3.5));
    cam.cible.lerp(but.cible, k);
    const sp = Math.sin(cam.phi);
    camera.position.set(cam.cible.x + cam.r * sp * Math.sin(cam.theta), cam.cible.y + cam.r * Math.cos(cam.phi), cam.cible.z + cam.r * sp * Math.cos(cam.theta));
    camera.lookAt(cam.cible);
    ciel.position.copy(camera.position);
    etoiles.position.copy(camera.position);

    // gouttes de la fontaine
    for (let i = 0; i < NG; i++) {
      vg[i * 3 + 1] -= 9.8 * dt;
      pg[i * 3] += vg[i * 3] * dt; pg[i * 3 + 1] += vg[i * 3 + 1] * dt; pg[i * 3 + 2] += vg[i * 3 + 2] * dt;
      if (pg[i * 3 + 1] < 0.85) relance(i);
    }
    gG.attributes.position.needsUpdate = true;

    // Nour flotte et rejoint sa destination
    nour.position.lerp(nourBut, Math.min(1, dt * 2.2));
    corps.position.y = Math.sin(tTotal * 2.2) * 0.18;
    haloNour.position.y = corps.position.y;
    etincelles.forEach((e, i) => {
      const a = tTotal * 1.8 + i * 2.094;
      e.position.set(Math.cos(a) * 0.75, corps.position.y + Math.sin(a * 1.7) * 0.25, Math.sin(a) * 0.75);
    });

    // icônes qui respirent
    maisons.forEach(m => {
      const actif = m === choisie;
      const s = (actif ? 4.6 : 4) + Math.sin(tTotal * (actif ? 4 : 1.6) + m.phase) * (actif ? 0.25 : 0.1);
      m.icone.scale.set(s, s, 1);
      m.icone.position.y = m.hTot + 2.8 + Math.sin(tTotal * 1.3 + m.phase) * 0.15;
    });
    anneau.material.opacity += ((choisie ? 0.55 + Math.sin(tTotal * 4) * 0.2 : 0) - anneau.material.opacity) * k;

    if (tTotal > prochainHeure) {
      majHeure(); prochainHeure = tTotal + 20;
    }
    opts.surAmbiance && opts.surAmbiance({ facteurJour, facteurNuit, procheFontaine: THREE.MathUtils.clamp(1 - (camera.position.length() - 12) / 45, 0, 1) });
    renderer.render(scene, camera);
    opts.surImage && opts.surImage();
  }

  function redim() {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = portrait() ? 62 : 50;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    if (!choisie) { but.r = rDefaut(); but.phi = phiDefaut(); }
  }
  addEventListener('resize', redim);
  redim();
  image();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) enMarche = false;
    else if (!enMarche) { enMarche = true; horloge.getDelta(); image(); }
  });

  return {
    selectionner, deselectionner,
    noms(oui) { maisons.forEach(m => { m.nom.visible = !!oui; }); },
    ecran(id) {
      const m = maisons.find(x => x.b.id === id);
      if (!m) return null;
      const v = m.mesh.geometry.boundingSphere.center.clone().project(camera);
      return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight };
    },
    infos: () => ({ appels: renderer.info.render.calls, triangles: renderer.info.render.triangles, maisons: maisons.length })
  };
}

// ---------- une maison ----------
function construireMaison(b) {
  const p = [], lant = [];
  const add = (geo, c, m) => p.push({ geo, c, m });
  const mur = C.mur[b.emplacement % 4];
  const accent = b.couleur;

  if (b.forme === 'tente') {
    add(new THREE.ConeGeometry(3.6, 4.4, 6), b.couleur, M(0, 2.2, 0, 0, Math.PI / 6));
    add(new THREE.ConeGeometry(3.66, 0.9, 6, 1, true), eclaircir(b.couleur, 0.45), M(0, 0.9, 0, 0, Math.PI / 6));
    add(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 4), C.bois, M(0, 4.8, 0));
    add(new THREE.BoxGeometry(1.5, 1.9, 1.6), '#4a2418', M(0, 0.95, 2.4));
    add(new THREE.BoxGeometry(2.8, 0.12, 2), eclaircir(b.couleur, 0.3), M(0, 2.15, 3.3, -0.25, 0, 0));
    add(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 4), C.bois, M(-1.3, 1.05, 4.1));
    add(new THREE.CylinderGeometry(0.06, 0.06, 2.1, 4), C.bois, M(1.3, 1.05, 4.1));
    add(new THREE.BoxGeometry(1.1, 0.5, 0.7), '#b5895a', M(-2.2, 0.25, 3.4, 0, 0.4, 0));
    lant.push({ p: new THREE.Vector3(1.3, 1.85, 4.25), c: b.couleur, halo: true });
    return { parts: p, hTot: 5.4, lant };
  }

  const F = {
    dome: { w: 5, h: 3.6, d: 5, toit: 'dome', rd: 2.2 },
    mosquee: { w: 5.6, h: 3.8, d: 5.6, toit: 'dome', rd: 2.45, minaret: true },
    plat: { w: 5, h: 4, d: 5, toit: 'plat' },
    tour: { w: 4.2, h: 5.6, d: 4.2, toit: 'dome', rd: 1.75 },
    large: { w: 6.6, h: 3.6, d: 4.6, toit: 'plat', arcade: true },
    jardin: { w: 5, h: 3.2, d: 5, toit: 'plat', plantes: true },
    lanternes: { w: 5.4, h: 4, d: 5, toit: 'plat', guirlande: true }
  }[b.forme] || { w: 5, h: 4, d: 5, toit: 'plat' };
  const { w, h, d } = F;
  let hTot = h;

  add(new THREE.BoxGeometry(w + 0.5, 0.32, d + 0.5), C.socle, M(0, 0.16, 0));
  add(new THREE.BoxGeometry(w, h, d), mur, M(0, h / 2, 0));
  add(new THREE.BoxGeometry(w + 0.18, 0.28, d + 0.18), accent, M(0, h - 0.35, 0));

  if (F.toit === 'plat') {
    add(new THREE.BoxGeometry(w + 0.3, 0.18, d + 0.3), eclaircir(mur, 0.2), M(0, h + 0.09, 0));
    const nx = Math.max(2, Math.round(w / 1.1)), nz = Math.max(2, Math.round(d / 1.1));
    for (let i = 0; i < nx; i++) {
      const x = -w / 2 + (i + 0.5) * w / nx;
      add(new THREE.BoxGeometry(0.5, 0.45, 0.3), mur, M(x, h + 0.4, d / 2));
      add(new THREE.BoxGeometry(0.5, 0.45, 0.3), mur, M(x, h + 0.4, -d / 2));
    }
    for (let i = 0; i < nz; i++) {
      const z = -d / 2 + (i + 0.5) * d / nz;
      add(new THREE.BoxGeometry(0.3, 0.45, 0.5), mur, M(w / 2, h + 0.4, z));
      add(new THREE.BoxGeometry(0.3, 0.45, 0.5), mur, M(-w / 2, h + 0.4, z));
    }
    hTot = h + 0.7;
  } else {
    const rd = F.rd;
    add(new THREE.CylinderGeometry(rd * 0.96, rd * 0.96, 0.5, 16), eclaircir(mur, 0.15), M(0, h + 0.25, 0));
    add(new THREE.SphereGeometry(rd, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), accent, M(0, h + 0.5, 0));
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 4), C.or, M(0, h + 0.5 + rd + 0.3, 0));
    add(new THREE.SphereGeometry(0.2, 8, 6), C.or, M(0, h + 0.5 + rd + 0.1, 0));
    hTot = h + 0.5 + rd + 0.6;
  }

  if (F.minaret) {
    const mx = w / 2 - 0.1, mz = -d / 2 + 0.1;
    add(new THREE.CylinderGeometry(0.55, 0.68, 7.4, 8), mur, M(mx, 3.7, mz));
    add(new THREE.CylinderGeometry(0.9, 0.7, 0.35, 8), accent, M(mx, 6.3, mz));
    add(new THREE.CylinderGeometry(0.45, 0.5, 1.1, 8), mur, M(mx, 7.0, mz));
    add(new THREE.ConeGeometry(0.62, 1.5, 8), accent, M(mx, 8.3, mz));
    add(new THREE.SphereGeometry(0.15, 6, 4), C.or, M(mx, 9.15, mz));
    hTot = Math.max(hTot, 6.4);
  }

  // façade : porte en arche, cadre coloré, marches, fenêtres
  const zf = d / 2;
  add(arche(1.85, 1.75), accent, M(0, 0.32, zf + 0.02));
  add(arche(1.35, 1.55), C.porte, M(0, 0.32, zf + 0.04));
  add(new THREE.BoxGeometry(2.1, 0.22, 0.8), C.pierre, M(0, 0.11, zf + 0.5));
  const fen = (x, y, z, ry) => { add(arche(0.82, 0.62), accent, M(x, y - 0.05, z, 0, ry, 0)); add(arche(0.6, 0.55), C.fenetre, M(x, y, z + (ry === 0 ? 0.02 : 0), 0, ry, 0)); };
  if (F.arcade) {
    for (const x of [-2.15, 2.15]) { add(arche(1.6, 1.4), accent, M(x, 0.32, zf + 0.02)); add(arche(1.2, 1.25), '#4a3456', M(x, 0.32, zf + 0.04)); }
  } else if (w >= 4.8) {
    fen(-w / 2 + 0.7, 1.7, zf + 0.02, 0); fen(w / 2 - 0.7, 1.7, zf + 0.02, 0);
  }
  if (b.forme === 'tour') { fen(0, 3.6, zf + 0.02, 0); }
  // fenêtres des côtés
  const decal = 0.03;
  add(arche(0.82, 0.62), accent, M(w / 2 + decal, 1.65, 0, 0, Math.PI / 2, 0));
  add(arche(0.6, 0.55), C.fenetre, M(w / 2 + decal * 2, 1.7, 0, 0, Math.PI / 2, 0));
  add(arche(0.82, 0.62), accent, M(-w / 2 - decal, 1.65, 0, 0, -Math.PI / 2, 0));
  add(arche(0.6, 0.55), C.fenetre, M(-w / 2 - decal * 2, 1.7, 0, 0, -Math.PI / 2, 0));

  // lanterne de la porte
  add(new THREE.BoxGeometry(0.08, 0.08, 0.5), C.bois, M(1.15, 2.55, zf + 0.25));
  add(new THREE.ConeGeometry(0.24, 0.24, 6), C.or, M(1.15, 2.42, zf + 0.45));
  lant.push({ p: new THREE.Vector3(1.15, 2.12, zf + 0.45), c: accent, halo: true });

  if (F.plantes) {
    for (const [x, z] of [[-1.4, -1.2], [1.2, 0.2], [-0.2, 1.3], [1.5, -1.5]]) add(new THREE.IcosahedronGeometry(0.55, 0), C.buisson, M(x, h + 0.55, z));
    for (const x of [-1.6, 1.6]) {
      add(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 8), '#c8774a', M(x, 0.55, zf + 0.75));
      add(new THREE.IcosahedronGeometry(0.38, 0), '#ff6b8a', M(x, 0.95, zf + 0.75));
    }
  }
  if (F.guirlande) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), x = -w / 2 + 0.3 + t * (w - 0.6);
      const y = 3.15 - Math.sin(t * Math.PI) * 0.45;
      lant.push({ p: new THREE.Vector3(x, y, zf + 0.35), c: ['#ff8a3d', '#f5b942', '#e5677b', '#2bb3c0'][i % 4], halo: true });
      add(new THREE.ConeGeometry(0.2, 0.18, 6), C.or, M(x, y + 0.28, zf + 0.35));
    }
  }
  return { parts: p, hTot, lant };
}
