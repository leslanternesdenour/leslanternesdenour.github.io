// Le relief du monde : un seul grand terrain, calculé dans le navigateur (aucun fichier à télécharger).
// Le village est au centre ; l'oasis à l'est ; le camp des caravanes à l'ouest ;
// les grandes dunes au sud ; les montagnes au nord, derrière le col.
import * as THREE from 'three';

export const TAILLE = 800;          // le monde fait 800 m de côté
export const LIMITE = 360;          // l'enfant ne va pas plus loin (le bord est caché par les dunes)

export const LIEUX = {
  village:   { x: 0,    z: 0,    r: 44 },
  oasis:     { x: 190,  z: 30,   r: 50, lac: 21 },
  camp:      { x: -175, z: 60,   r: 42 },
  dunes:     { x: 30,   z: 230,  r: 120 },
  col:       { x: 0,    z: -150, r: 22 },
  montagnes: { x: 0,    z: -265, r: 70 },
  wadi:      { x: -245, z: 175,  r: 46 },     // région à débloquer : le lit d'une rivière sèche
  rochers:   { x: 150,  z: -95,  r: 40 }      // région à débloquer : les rochers gravés
};

// Le replat du portail de la grande route (route/portail-plan.js) : plat sur `plat` m autour de (x, z), puis il se fond dans les dunes sur `lisse` m. h : sa hauteur.
// Le maillage du terrain est grossier (3 à 6 m par maille) : le rayon plat couvre le portail ET une maille de plus (plan à tous les niveaux sauf le plus faible, à quelques cm près). plat + lisse < 17,2 m : le replat s'arrête AVANT la piste de l'oasis, qui ne bouge pas.
export const PLATEFORME_PORTAIL = { x: 72.5, z: 32, plat: 12, lisse: 5, h: 2.2 };

// Les chemins (lignes brisées). Ils aplanissent les dunes et se colorent.
export const CHEMINS = [
  [[0, 0], [40, 6], [95, 20], [140, 26], [164, 28]],                       // vers l'oasis (s'arrête au bord de l'eau)
  [[0, 0], [-45, 18], [-100, 40], [-150, 52], [-175, 60]],                 // vers le camp
  [[0, 0], [6, -50], [-4, -100], [0, -150], [-14, -190], [-6, -230], [0, -265]], // vers le col et les montagnes
  [[0, 0], [10, 70], [22, 140], [30, 205]]                                 // vers les grandes dunes
];
const CHEMIN_MONTAGNE = CHEMINS[2];
// La Route vers La Mecque (préproduction seulement) : une piste traverse le rempart de dunes au sud. Désactivé par défaut : le village reste identique.
export const OPTIONS = { sortieRoute: false, chemin: null };
export function activerSortieRoute(chemin) { if (OPTIONS.sortieRoute) return; OPTIONS.sortieRoute = true; OPTIONS.chemin = chemin; PISTES.push(chemin); }
// les pistes vers les régions à débloquer (elles partent des chemins existants)
export const PISTES = [
  [[-175, 60], [-205, 110], [-232, 148], [-242, 168]],   // du camp vers le wadi
  [[95, 20], [118, -30], [140, -70], [148, -86]]          // de la route de l'oasis vers les rochers gravés
];
// le lit du wadi : une ligne sinueuse qui traverse la région
const LIT_WADI = [[-290, 150], [-268, 160], [-250, 176], [-232, 186], [-212, 204], [-196, 214]];

// ---------- bruit (valeurs pseudo-aléatoires, toujours les mêmes) ----------
function hash(i, j) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function bruit(x, z) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j;
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, z, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let k = 0; k < oct; k++) { s += a * bruit(x * f + k * 17.3, z * f - k * 9.1); f *= 2.03; a *= 0.5; }
  return s;
}
export const lisse = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const melange = (a, b, t) => a + (b - a) * t;

// Distance d'un point à une ligne brisée
export function distanceChemin(x, z, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l2));
    const ex = ax + t * dx - x, ez = az + t * dz - z;
    best = Math.min(best, ex * ex + ez * ez);
  }
  return Math.sqrt(best);
}
export function distanceChemins(x, z) {
  let d = Infinity;
  for (const c of CHEMINS) d = Math.min(d, distanceChemin(x, z, c));
  for (const c of PISTES) d = Math.min(d, distanceChemin(x, z, c));
  return d;
}
const dist = (x, z, l) => Math.hypot(x - l.x, z - l.z);

// ---------- le relief ----------
// Renvoie la hauteur brute et quelques masques utiles pour les couleurs.
function relief(x, z) {
  const dCh = distanceChemins(x, z);
  const surChemin = lisse(8, 2.5, dCh);

  // dunes : ondulations longues, plus hautes au sud
  const sud = lisse(40, 260, z);
  const ondes = 1 - Math.abs(Math.sin((x * 0.55 + z) * 0.03 + fbm(x * 0.006, z * 0.006, 3) * 6));
  const dunes = fbm(x * 0.012, z * 0.012, 3) * 5 + ondes * ondes * (3 + 9 * sud);

  // montagnes : au nord, avec une vallée qui suit le chemin
  const nord = lisse(-135, -230, z);
  const vallee = lisse(34, 9, distanceChemin(x, z, CHEMIN_MONTAGNE));
  const massif = nord * (38 + fbm(x * 0.01, z * 0.01, 3) * 85) * (1 - 0.74 * vallee);
  const rochers = nord * Math.pow(Math.abs(fbm(x * 0.05, z * 0.05, 3) - 0.5) * 2, 1.5) * 9 * (1 - 0.85 * vallee);

  // bords du monde : de hautes dunes ferment l'horizon
  const bord = Math.max(Math.abs(x), Math.abs(z));
  const breche = OPTIONS.sortieRoute && bord > 280 ? lisse(30, 12, distanceChemin(x, z, OPTIONS.chemin)) : 0;
  const rempart = lisse(300, 390, bord) * 38 * (1 - breche);

  let h = dunes * (1 - 0.85 * surChemin) * (1 - 0.7 * nord) + massif + rochers * (1 - 0.9 * surChemin) + rempart;
  // les montagnes en gradins : des falaises et des corniches (grès et granit d'Arabie), mais pas sur le chemin ni dans la vallée
  const gradins = nord * (1 - vallee) * (1 - surChemin) * lisse(12, 34, massif);
  if (gradins > 0.01) {
    const pas = 7 + fbm(x * 0.004, z * 0.004, 2) * 4, q = h / pas, f = q - Math.floor(q);
    h = melange(h, (Math.floor(q) + lisse(0.5, 0.88, f)) * pas, gradins * 0.8);
  }

  // le replat du portail de la grande route : le sol y est PLAN (le terrain penche d'1,3 m d'un pilier à l'autre), pour que le portail et ses marches reposent de niveau
  { const p = lisse(PLATEFORME_PORTAIL.plat + PLATEFORME_PORTAIL.lisse, PLATEFORME_PORTAIL.plat, Math.hypot(x - PLATEFORME_PORTAIL.x, z - PLATEFORME_PORTAIL.z)); if (p > 0) h = melange(h, PLATEFORME_PORTAIL.h, p); }

  // le village et l'oasis sont plats
  const v = lisse(LIEUX.village.r + 22, LIEUX.village.r, dist(x, z, LIEUX.village));
  h = melange(h, 0.3, v);
  const dOasis = dist(x, z, LIEUX.oasis);
  const o = lisse(LIEUX.oasis.r + 24, LIEUX.oasis.r, dOasis);
  h = melange(h, 0.5, o);
  const lac = lisse(LIEUX.oasis.lac + 3, LIEUX.oasis.lac - 6, dOasis);
  h -= lac * 3.2;
  const c = lisse(LIEUX.camp.r + 18, LIEUX.camp.r - 6, dist(x, z, LIEUX.camp));
  h = melange(h, 0.8 + dunes * 0.15, c);
  const belv = lisse(28, 14, dist(x, z, LIEUX.montagnes));  // le belvédère : un plateau en haut
  h = melange(h, h * 0.4 + 22, belv * 0.8);

  // le wadi : une région plus plate, creusée par le lit d'une rivière à sec
  const dW = dist(x, z, LIEUX.wadi), w = lisse(LIEUX.wadi.r + 30, LIEUX.wadi.r, dW);
  h = melange(h, 1.2 + fbm(x * 0.03, z * 0.03, 2) * 2, w);
  const dLit = distanceChemin(x, z, LIT_WADI), lit = lisse(9, 3, dLit) * w;
  h -= lit * 2.6;
  // les rochers gravés : un plateau de grès, avec de gros blocs
  const dR = dist(x, z, LIEUX.rochers), gr = lisse(LIEUX.rochers.r + 26, LIEUX.rochers.r - 4, dR);
  h = melange(h, 2 + fbm(x * 0.05, z * 0.05, 2) * 1.5, gr);
  const wv = w * lisse(24, 8, dLit) * (0.55 + 0.45 * fbm(x * 0.09, z * 0.09, 2));   // l'herbe pousse près du lit
  return { h, surChemin, v, o, lac, dOasis, nord, massif, rochers, c, lit, gres: gr, wv, gradins };
}

export function hauteurBrute(x, z) { return relief(x, z).h; }

// ---------- maillage ----------
export class Terrain {
  constructor(segments, detail = null) {
    this.n = segments;
    this.pas = TAILLE / segments;
    const n1 = segments + 1;
    this.grille = new Float32Array(n1 * n1);
    const geo = new THREE.PlaneGeometry(TAILLE, TAILLE, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const coul = new Float32Array(pos.count * 3), mat = new Float32Array(pos.count * 3);
    this.matieres = new Float32Array(pos.count * 2);   // herbe, roche (pour les empreintes et les sons)
    const sable = new THREE.Color('#e9c88f'), sable2 = new THREE.Color('#dcb06f'), herbe = new THREE.Color('#93bd5f'),
      herbe2 = new THREE.Color('#6d9a45'), roche = new THREE.Color('#94705c'), roche2 = new THREE.Color('#5d4f48'),
      chemin = new THREE.Color('#d8b07a'), sableClair = new THREE.Color('#f3dfb2'), ocre = new THREE.Color('#d39a5c'), sableFonce = new THREE.Color('#c39156'), gravier = new THREE.Color('#a89a86'), gres = new THREE.Color('#c27a52'), place = new THREE.Color('#f1e2c4'), mouille = new THREE.Color('#b99a68'), tmp = new THREE.Color();
    const montagne = new Float32Array(pos.count);     // pour colorer les falaises et les corniches ensuite
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      const r = relief(x, z);
      montagne[i] = r.nord * (1 - r.surChemin);
      pos.setY(i, r.h);
      this.grille[i] = r.h;
      // couleur
      const var1 = fbm(x * 0.05, z * 0.05, 2);
      // de grandes taches de sable : doré, beige clair, ocre, et quelques zones plus foncées
      const g1 = fbm(x * 0.006 + 3.1, z * 0.006 - 1.7, 3), g2 = fbm(x * 0.013 - 5.2, z * 0.011 + 2.4, 2);
      tmp.copy(sable).lerp(sable2, var1);
      tmp.lerp(sableClair, lisse(0.52, 0.72, g1) * 0.75);
      tmp.lerp(ocre, lisse(0.55, 0.78, g2) * 0.55 * (1 - lisse(0.5, 0.7, g1)));
      tmp.lerp(sableFonce, lisse(0.3, 0.12, g1) * 0.45);
      const vert = Math.max(r.v * lisse(0.2, 0.9, fbm(x * 0.08, z * 0.08, 2) + 0.35),
        r.o * lisse(LIEUX.oasis.r + 4, LIEUX.oasis.lac + 4, r.dOasis), r.wv * (1 - r.lit));
      const wHerbe = Math.min(1, vert * 1.2);
      if (vert > 0) tmp.lerp(herbe.clone().lerp(herbe2, Math.min(1, var1 * 0.7 + fbm(x * 0.15, z * 0.15, 2) * 0.6)), wHerbe);
      const roc = Math.min(1, r.nord * 1.35 * (0.62 + 0.38 * lisse(4, 18, r.massif + r.rochers)) + r.nord * lisse(3, 8, r.rochers));
      if (roc > 0) {
        tmp.lerp(roche.clone().lerp(roche2, var1), roc);
        tmp.multiplyScalar(1 - roc * (0.1 + 0.1 * Math.sin(r.h * 0.9 + var1 * 3)));   // strates dans la roche
      }
      if (r.lac > 0.05) tmp.lerp(mouille, Math.min(1, r.lac * 1.6));
      if (r.lit > 0.05) tmp.lerp(gravier.clone().lerp(roche2, var1 * 0.4), Math.min(1, r.lit * 1.3));          // galets du wadi
      if (r.gres > 0.05) tmp.lerp(gres.clone().lerp(roche, var1 * 0.5), r.gres * 0.75);                       // grès rouge
      const wRoche = Math.max(0, Math.min(1, roc)) * (1 - r.surChemin * 0.6);
      mat[i * 3] = Math.max(0, 1 - wHerbe - wRoche); mat[i * 3 + 1] = wHerbe * (1 - r.surChemin); mat[i * 3 + 2] = wRoche;
      this.matieres[i * 2] = wHerbe; this.matieres[i * 2 + 1] = wRoche;
      if (r.surChemin > 0) tmp.lerp(r.nord > 0.3 ? roche2.clone().lerp(chemin, 0.55) : chemin, r.surChemin * 0.8);
      const dv = Math.hypot(x, z);                      // la place pavée autour de la fontaine
      if (dv < 13) tmp.lerp(place, lisse(13, 10, dv) * (0.85 + 0.15 * var1));
      coul[i * 3] = tmp.r; coul[i * 3 + 1] = tmp.g; coul[i * 3 + 2] = tmp.b;
    }
    {
      const g = this.grille, n1b = n1, k = 2, pasGrille = TAILLE / segments;
      for (let j = 0; j < n1b; j++) for (let i = 0; i < n1b; i++) {
        const v = j * n1b + i, h = g[v];
        const a = g[j * n1b + Math.max(0, i - k)], b = g[j * n1b + Math.min(n1b - 1, i + k)], c2 = g[Math.max(0, j - k) * n1b + i], d2 = g[Math.min(n1b - 1, j + k) * n1b + i];
        const creux = h - (a + b + c2 + d2) / 4;
        const f = 1 + Math.max(-0.13, Math.min(0.07, creux * 0.05));
        coul[v * 3] *= f; coul[v * 3 + 1] *= f; coul[v * 3 + 2] *= f * (creux < 0 ? 1.02 : 1);
        // en montagne : parois raides en roche sombre et rougeâtre, replats couverts de sable clair
        const m = montagne[v];
        if (m > 0.05) {
          const pente = Math.hypot(b - a, d2 - c2) / (4 * k * pasGrille);
          const raide = lisse(0.45, 1.1, pente) * m, plat = lisse(0.3, 0.1, pente) * m;
          if (raide > 0) { coul[v * 3] = melange(coul[v * 3], 0.36, raide * 0.85); coul[v * 3 + 1] = melange(coul[v * 3 + 1], 0.23, raide * 0.85); coul[v * 3 + 2] = melange(coul[v * 3 + 2], 0.18, raide * 0.85); }
          if (plat > 0) { coul[v * 3] = melange(coul[v * 3], 0.62, plat * 0.12); coul[v * 3 + 1] = melange(coul[v * 3 + 1], 0.48, plat * 0.12); coul[v * 3 + 2] = melange(coul[v * 3 + 2], 0.38, plat * 0.12); }
        }
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(coul, 3));
    geo.setAttribute('aMat', new THREE.BufferAttribute(mat, 3));
    geo.computeVertexNormals();
    this.mesh = new THREE.Mesh(geo, materiauSol(detail));
    this.mesh.receiveShadow = true;
    this.mesh.name = 'terrain';
  }

  // Quelle matière sous les pieds : { herbe, roche } entre 0 et 1
  matiere(x, z) {
    const n = this.n, n1 = n + 1;
    const i = Math.max(0, Math.min(n, Math.round((x + TAILLE / 2) / this.pas))), j = Math.max(0, Math.min(n, Math.round((z + TAILLE / 2) / this.pas)));
    const k = (j * n1 + i) * 2;
    return { herbe: this.matieres[k], roche: this.matieres[k + 1] };
  }

  // Hauteur du sol à un endroit (interpolée sur la grille : les pieds touchent le sol dessiné)
  hauteur(x, z) {
    const n = this.n, n1 = n + 1;
    const gx = (x + TAILLE / 2) / this.pas, gz = (z + TAILLE / 2) / this.pas;
    const i = Math.max(0, Math.min(n - 1, Math.floor(gx))), j = Math.max(0, Math.min(n - 1, Math.floor(gz)));
    const fx = Math.min(1, Math.max(0, gx - i)), fz = Math.min(1, Math.max(0, gz - j));
    const g = this.grille;
    const a = g[j * n1 + i], b = g[j * n1 + i + 1], c = g[(j + 1) * n1 + i], d = g[(j + 1) * n1 + i + 1];
    // même découpage en triangles que PlaneGeometry
    if (fx + fz <= 1) return a + (b - a) * fx + (c - a) * fz;
    return d + (c - d) * (1 - fx) + (b - d) * (1 - fz);
  }
}

// Matériau du sol : couleurs du relief + texture de détail (rides du sable, herbe, roche fissurée)
// avec un léger relief qui réagit à la lumière, et qui s'efface au loin (pas de scintillement).
export function materiauSol(detail) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (!detail) return m;
  m.onBeforeCompile = s => {
    s.uniforms.tDetail = { value: detail };
    s.vertexShader = 'attribute vec3 aMat;\nvarying vec3 vMat;\nvarying vec2 vUvD;\nvarying vec2 vUvL;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      vMat = aMat; vUvD = position.xz / 7.0; vUvL = position.xz / 41.0;`);
    s.fragmentShader = `uniform sampler2D tDetail;\nvarying vec3 vMat;\nvarying vec2 vUvD;\nvarying vec2 vUvL;
      float hDetail() {
        vec4 a = texture2D(tDetail, vUvD), b = texture2D(tDetail, vUvL * vec2(1.0, 1.3));
        float sable = mix(a.r, b.r, 0.35) * 0.8 + a.a * 0.2;
        float herbe = a.g * 0.8 + a.a * 0.2;
        float roche = mix(a.b, b.b, 0.5);
        return dot(vec3(sable, herbe, roche), vMat);
      }
      vec3 bosseSol(vec3 p, vec3 n, vec2 dH, float fd) {
        vec3 sx = normalize(dFdx(p)), sy = normalize(dFdy(p));
        vec3 r1 = cross(sy, n), r2 = cross(n, sx);
        float det = dot(sx, r1) * fd;
        vec3 g = sign(det) * (dH.x * r1 + dH.y * r2);
        return normalize(abs(det) * n - g);
      }
      ` + s.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        float hD = hDetail();
        float pres = smoothstep(140.0, 15.0, length(vViewPosition));
        diffuseColor.rgb *= mix(1.0, 0.86 + 0.26 * hD, 0.55 + 0.45 * pres);
        // de petites paillettes de sable qui brillent tout près
        vec2 cel = floor(vUvD * 140.0);
        float pai = step(0.992, fract(sin(dot(cel, vec2(12.9898, 78.233))) * 43758.5453));
        diffuseColor.rgb += pai * vMat.x * smoothstep(25.0, 4.0, length(vViewPosition)) * 0.22;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float forceRelief = (0.9 * vMat.x + 0.5 * vMat.y + 1.6 * vMat.z) * pres;
        normal = bosseSol(-vViewPosition, normal, vec2(dFdx(hD), dFdy(hD)) * forceRelief, faceDirection);`);
  };
  m.customProgramCacheKey = () => 'sol-detail';
  return m;
}
