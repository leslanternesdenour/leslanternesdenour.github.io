// Petits outils pour fabriquer les objets du monde à partir de formes simples.
// Chaque objet devient UNE seule géométrie colorée (couleurs dans les sommets) :
// peu d'appels de dessin, donc fluide même sur un téléphone modeste.
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

// Matières (pour le relief et le grain) : 0 rien, 1 tissu, 2 cuir, 3 bois, 4 terre cuite, 5 laine, 6 terre crue / pierre
export const M = { tissu: 1, cuir: 2, bois: 3, terre: 4, laine: 5, pierre: 6 };
// Une pièce = une forme + une couleur + une position/rotation/échelle (+ une matière)
// v : 1 pour une pièce de VISAGE (œil, sourcil, nez, bouche, joue) : elle disparaît quand le « mode sans visage » est actif (monde/socle/sans-visage.js)
export function piece(geo, couleur, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], m = 0, v = 0 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  _m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), _s.set(...s));
  g.applyMatrix4(_m);
  const c = new THREE.Color(couleur);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('motif', new THREE.BufferAttribute(new Float32Array(n).fill(m), 1));
  g.setAttribute('visage', new THREE.BufferAttribute(new Float32Array(n).fill(v), 1));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'motif', 'visage'].includes(k)) g.deleteAttribute(k);
  return g;
}

// Assemble plusieurs pièces en une seule géométrie
export function fusion(pieces) {
  let total = 0;
  for (const g of pieces) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3), mot = new Float32Array(total), vis = new Float32Array(total);
  let o = 0;
  for (const g of pieces) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    if (g.attributes.motif) mot.set(g.attributes.motif.array, o);
    if (g.attributes.visage) vis.set(g.attributes.visage.array, o);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('motif', new THREE.BufferAttribute(mot, 1));
  out.setAttribute('visage', new THREE.BufferAttribute(vis, 1));
  out.computeBoundingSphere();
  return out;
}

// Déplace une géométrie déjà fusionnée (pour composer des objets)
export function placer(geo, p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1]) {
  _m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), _s.set(...s));
  const g = geo.clone();
  g.applyMatrix4(_m);
  return g;
}

// Hasard reproductible (le monde est le même à chaque visite)
export function hasard(graine = 1) {
  let s = graine >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Matériau commun : couleurs des sommets + grain de matière (enduit, pierre, pelage, tissu)
// + léger balancement dans le vent (palmiers, herbes). Le grain ne coûte presque rien (calculé à l'écran).
export const temps = { value: 0 };
export const vent = { value: 1 };
export const reglageGrain = { value: 1 };
// Mode sans visage : 1 = les pièces de visage (attribut « visage ») ne sont pas dessinées. Piloté par LDN_SV (monde/socle/sans-visage.js).
export const sansVisage = { value: 0 };
if (typeof globalThis !== 'undefined' && globalThis.LDN_SV) globalThis.LDN_SV.abonner(a => { sansVisage.value = a ? 1 : 0; });
const GRAIN_VS = `
  attribute float motif;
  varying vec3 vWP; varying vec3 vPL; varying float vMotif;`;
const GRAIN_PROJ = `#include <project_vertex>
  vPL = position; vMotif = motif;
  vec4 wpG = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wpG = instanceMatrix * wpG;
  #endif
  vWP = (modelMatrix * wpG).xyz;`;
const GRAIN_FS = `
  uniform float uGrain; uniform float uFinesse;
  varying vec3 vWP; varying vec3 vPL; varying float vMotif;

  float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float b3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  vec3 bosseG(vec3 p, vec3 n, vec2 dH, float fd) {
    vec3 sx = normalize(dFdx(p)), sy = normalize(dFdy(p)), r1 = cross(sy, n), r2 = cross(n, sx);
    float det = dot(sx, r1) * fd; return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2)); }
  // le relief propre à chaque matière, dessiné dans le repère de l'objet (il bouge avec lui)
  float matiere(vec3 p, float m) {
    if (m < 0.5) return 0.5;
    if (m < 1.5) { float a = sin(p.x * 330.0 + p.y * 3.0) * sin(p.y * 330.0 + p.z * 330.0); return 0.5 + a * 0.14 + (b3(vec3(p.x * 7.0, p.y * 2.5, p.z * 7.0)) - 0.5) * 0.45; }   // tissu : trame fine et plis doux
    if (m < 2.5) { return 0.35 + b3(p * 90.0) * 0.45 + b3(p * 23.0) * 0.2; }                                              // cuir
    if (m < 3.5) { float l = sin((p.y + b3(p * 4.0) * 0.35) * 70.0 + p.x * 4.0); return 0.5 + l * 0.3; }                 // bois
    if (m < 4.5) { float t = b3(p * 60.0); return 0.45 + step(0.82, t) * 0.4 + b3(p * 9.0) * 0.15; }                     // terre cuite
    if (m < 5.5) { float a = sin(p.x * 120.0 + b3(p * 30.0) * 2.0) * sin(p.y * 120.0); return 0.5 + a * 0.22 + (b3(p * 8.0) - 0.5) * 0.25; }          // laine
    return 0.4 + b3(p * 14.0) * 0.4 + b3(p * 50.0) * 0.2;                                                                 // terre crue, pierre
  }`;
export function materiau({ balance = 0, emissif = null, grain = 1, finesse = 1 } = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (emissif) m.emissive = new THREE.Color(emissif);
  const avecGrain = grain > 0;
  m.onBeforeCompile = s => {
    // pièces de visage : écartées à l'affichage en mode sans visage (valable pour TOUS les objets fabriqués avec materiau())
    s.uniforms.uSansVisage = sansVisage;
    s.vertexShader = 'attribute float visage;\nvarying float vVisage;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vVisage = visage;');
    s.fragmentShader = 'uniform float uSansVisage;\nvarying float vVisage;\n' + s.fragmentShader.replace('void main() {', 'void main() {\n  if (vVisage > 0.5 && uSansVisage > 0.5) discard;');
    if (avecGrain) {
      s.uniforms.uGrain = { get value() { return grain * reglageGrain.value; } };
      s.uniforms.uFinesse = { value: finesse };
      s.vertexShader = GRAIN_VS + '\n' + s.vertexShader.replace('#include <project_vertex>', GRAIN_PROJ);
      s.fragmentShader = GRAIN_FS + '\n' + s.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          float gP = smoothstep(60.0, 6.0, length(vViewPosition)) * uGrain;
          float gN = b3(vWP * 3.1 * uFinesse) * 0.55 + b3(vWP * 11.0 * uFinesse) * 0.3 + b3(vWP * 0.7) * 0.15;
          float mN = matiere(vPL, vMotif);
          float avecM = step(0.5, vMotif);
          diffuseColor.rgb *= 1.0 + (gN - 0.5) * 0.22 * (0.4 + 0.6 * gP) * (1.0 - avecM * 0.6) + (mN - 0.5) * 0.28 * avecM * (0.5 + 0.5 * gP);
          gN = mix(gN, mN, avecM * 0.8);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          normal = bosseG(-vViewPosition, normal, vec2(dFdx(gN), dFdy(gN)) * 0.5 * gP, faceDirection);`);
    }
    if (balance > 0) {
      s.uniforms.uTemps = temps; s.uniforms.uVent = vent;
      s.vertexShader = 'uniform float uTemps;\nuniform float uVent;\n' + s.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float hb = max(position.y - 0.8, 0.0);
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.17;
        #else
          float ph = 0.0;
        #endif
        float bal = sin(uTemps * 1.5 + ph) * 0.6 + sin(uTemps * 2.6 + ph * 1.7) * 0.3;
        transformed.x += bal * hb * hb * ${(0.010 * balance).toFixed(4)} * uVent;
        transformed.z += bal * hb * hb * ${(0.006 * balance).toFixed(4)} * uVent;`);
    }
  };
  m.customProgramCacheKey = () => 'sv-mat-' + balance + '-' + (avecGrain ? 'g' + finesse : 'n');
  return m;
}
