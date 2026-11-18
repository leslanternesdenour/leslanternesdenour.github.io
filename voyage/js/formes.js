// Petits outils pour fabriquer les objets du monde à partir de formes simples.
// Chaque objet devient UNE seule géométrie colorée (couleurs dans les sommets) :
// peu d'appels de dessin, donc fluide même sur un téléphone modeste.
import * as THREE from 'three';

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

// Une pièce = une forme + une couleur + une position/rotation/échelle
export function piece(geo, couleur, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  _m.compose(_p.set(...p), _q.setFromEuler(_e.set(...r)), _s.set(...s));
  g.applyMatrix4(_m);
  const c = new THREE.Color(couleur);
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}

// Assemble plusieurs pièces en une seule géométrie
export function fusion(pieces) {
  let total = 0;
  for (const g of pieces) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const g of pieces) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    col.set(g.attributes.color.array, o * 3);
    o += g.attributes.position.count;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
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
const GRAIN_VS = `
  varying vec3 vWP;`;
const GRAIN_PROJ = `#include <project_vertex>
  vec4 wpG = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    wpG = instanceMatrix * wpG;
  #endif
  vWP = (modelMatrix * wpG).xyz;`;
const GRAIN_FS = `
  uniform float uGrain; uniform float uFinesse;
  varying vec3 vWP;
  float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float b3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
  vec3 bosseG(vec3 p, vec3 n, vec2 dH, float fd) {
    vec3 sx = normalize(dFdx(p)), sy = normalize(dFdy(p)), r1 = cross(sy, n), r2 = cross(n, sx);
    float det = dot(sx, r1) * fd; return normalize(abs(det) * n - sign(det) * (dH.x * r1 + dH.y * r2)); }`;
export function materiau({ balance = 0, emissif = null, grain = 1, finesse = 1 } = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  if (emissif) m.emissive = new THREE.Color(emissif);
  const avecGrain = grain > 0;
  m.onBeforeCompile = s => {
    if (avecGrain) {
      s.uniforms.uGrain = { get value() { return grain * reglageGrain.value; } };
      s.uniforms.uFinesse = { value: finesse };
      s.vertexShader = GRAIN_VS + '\n' + s.vertexShader.replace('#include <project_vertex>', GRAIN_PROJ);
      s.fragmentShader = GRAIN_FS + '\n' + s.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
          float gP = smoothstep(60.0, 6.0, length(vViewPosition)) * uGrain;
          float gN = b3(vWP * 3.1 * uFinesse) * 0.55 + b3(vWP * 11.0 * uFinesse) * 0.3 + b3(vWP * 0.7) * 0.15;
          diffuseColor.rgb *= 1.0 + (gN - 0.5) * 0.22 * (0.4 + 0.6 * gP);`)
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
  m.customProgramCacheKey = () => 'mat-' + balance + '-' + (avecGrain ? 'g' + finesse : 'n');
  return m;
}
