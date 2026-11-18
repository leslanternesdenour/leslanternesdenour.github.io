// Textures fabriquées dans le navigateur (aucun fichier à télécharger, aucune licence à vérifier).
// Toutes « raccordables » : elles se répètent sans couture visible.
import * as THREE from 'three';

function hash(i, j, graine) {
  let h = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(graine, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
// bruit de valeur périodique (période p cases) : x, y entre 0 et 1
function bruitP(x, y, p, graine = 1) {
  const X = x * p, Y = y * p, i = Math.floor(X), j = Math.floor(Y), fx = X - i, fy = Y - j;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const m = k => ((k % p) + p) % p;
  const a = hash(m(i), m(j), graine), b = hash(m(i + 1), m(j), graine), c = hash(m(i), m(j + 1), graine), d = hash(m(i + 1), m(j + 1), graine);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbmP = (x, y, p, oct, g) => { let s = 0, a = 0.5, n = 0; for (let k = 0; k < oct; k++) { s += a * bruitP(x, y, p << k, g + k); n += a; a *= 0.5; } return s / n; };

function canvas(n) { const c = document.createElement('canvas'); c.width = c.height = n; return c; }
function texture(c, { srgb = false, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

// Relief fin du sol : R = rides du sable, G = herbe, B = roche fissurée, A = grain
export function textureSol(n = 512) {
  const c = canvas(n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u = i / n, v = j / n, k = (j * n + i) * 4;
    const deform = fbmP(u, v, 4, 3, 11) * 2.2;
    const phase = (u * 7 + v * 3 + deform) * Math.PI * 2;
    const ride = Math.pow(0.5 + 0.5 * Math.sin(phase + 0.6 * Math.sin(phase)), 1.6);   // rides asymétriques comme celles du vent
    const herbe = fbmP(u, v, 32, 3, 21) * 0.6 + bruitP(u, v, 128, 23) * 0.4;
    const r1 = Math.abs(fbmP(u, v, 8, 3, 31) - 0.5) * 2, r2 = Math.abs(fbmP(u, v, 16, 2, 37) - 0.5) * 2;
    const roche = Math.min(1, Math.pow(r1, 0.35) * 0.7 + Math.pow(r2, 0.5) * 0.3);
    const grain = bruitP(u, v, 128, 41) * 0.5 + bruitP(u, v, 256, 43) * 0.5;
    d[k] = ride * 255; d[k + 1] = herbe * 255; d[k + 2] = roche * 255; d[k + 3] = grain * 255;
  }
  x.putImageData(img, 0, 0);
  return texture(c);
}

// Vaguelettes de l'eau (carte de normales)
export function normalesEau(n = 256) {
  const h = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) h[j * n + i] = fbmP(i / n, j / n, 6, 4, 51);
  const c = canvas(n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
  const H = (i, j) => h[((j + n) % n) * n + ((i + n) % n)];
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const dx = (H(i + 1, j) - H(i - 1, j)) * 6, dy = (H(i, j + 1) - H(i, j - 1)) * 6;
    const l = Math.hypot(dx, dy, 1), k = (j * n + i) * 4;
    d[k] = (-dx / l * 0.5 + 0.5) * 255; d[k + 1] = (-dy / l * 0.5 + 0.5) * 255; d[k + 2] = (1 / l * 0.5 + 0.5) * 255; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return texture(c);
}

// Un nuage doux (plusieurs boules floues)
export function textureNuage(graine = 1) {
  const c = canvas(256), x = c.getContext('2d');
  let s = graine * 9301 + 49297;
  const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let k = 0; k < 14; k++) {
    const cx = 50 + R() * 156, cy = 120 + (R() - 0.5) * 60, r = 30 + R() * 45;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(0.6, 'rgba(255,255,255,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  }
  return texture(c, { srgb: true, repeat: false });
}

// Empreintes : pied d'enfant et pied de chameau (deux grosses pelotes)
export function textureEmpreinte(type) {
  const c = canvas(64), x = c.getContext('2d');
  x.fillStyle = 'rgba(70,45,20,1)';
  if (type === 'enfant') {
    x.beginPath(); x.ellipse(32, 24, 11, 17, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(32, 50, 9, 10, 0, 0, Math.PI * 2); x.fill();
  } else {
    x.beginPath(); x.ellipse(22, 32, 13, 22, 0.1, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(42, 32, 13, 22, -0.1, 0, Math.PI * 2); x.fill();
  }
  const t = texture(c, { repeat: false }); return t;
}

// Grain de sable volant
export function texturePoussiere() {
  const c = canvas(32), x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,240,210,1)'); g.addColorStop(1, 'rgba(255,240,210,0)');
  x.fillStyle = g; x.fillRect(0, 0, 32, 32);
  return texture(c, { srgb: true, repeat: false });
}
