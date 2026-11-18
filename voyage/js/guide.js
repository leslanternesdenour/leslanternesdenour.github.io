// Le guidage : trouve un chemin praticable (A* sur une grille) qui évite les maisons, les arbres, l'eau,
// les pentes trop raides et le col fermé, puis le montre au sol par de petites lumières dorées.
// Le chemin est recalculé quand l'enfant s'en écarte, quand de nouveaux décors apparaissent ou quand le col s'ouvre.
import * as THREE from 'three';
import { LIMITE, LIEUX, distanceChemins } from './terrain.js?v=3';

const CASE = 3, N = Math.ceil(LIMITE * 2 / CASE), O = -LIMITE;     // grille de 240 × 240 cases de 3 m
const idx = (i, j) => j * N + i;
const versMonde = (i, j) => ({ x: O + (i + 0.5) * CASE, z: O + (j + 0.5) * CASE });
const versCase = (x, z) => ({ i: Math.max(0, Math.min(N - 1, Math.floor((x - O) / CASE))), j: Math.max(0, Math.min(N - 1, Math.floor((z - O) / CASE))) });

export function creerGuide({ scene, terrain, colliders, col, fermees = () => [] }) {
  const H = (x, z) => terrain.hauteur(x, z);
  // ---------- ce qui ne change pas : hauteurs, eau, chemins ----------
  const haut = new Float32Array(N * N), cout = new Float32Array(N * N), eau = new Uint8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const { x, z } = versMonde(i, j), k = idx(i, j);
    haut[k] = H(x, z);
    const lac = Math.hypot(x - LIEUX.oasis.x, z - LIEUX.oasis.z) < LIEUX.oasis.lac + 0.5;
    eau[k] = lac ? 1 : 0;
    cout[k] = distanceChemins(x, z) < 3.5 ? 0.55 : 1;          // les routes caravanières sont plus agréables
  }
  // ---------- ce qui change : obstacles (selon la taille de la monture) ----------
  let bloque = null, nbColliders = -1, marge = -1, colOuvert = null, clefFermees = '';
  const clef = () => fermees().map(f => f.id).join(',');
  function preparer(rayon) {
    if (bloque && nbColliders === colliders.length && marge === rayon && colOuvert === col.ouvert && clefFermees === clef()) return;
    bloque = new Uint8Array(N * N); nbColliders = colliders.length; marge = rayon; colOuvert = col.ouvert; clefFermees = clef();
    for (const f of fermees()) { const a = versCase(f.x - f.r, f.z - f.r), b = versCase(f.x + f.r, f.z + f.r);
      for (let j = a.j; j <= b.j; j++) for (let i = a.i; i <= b.i; i++) { const p = versMonde(i, j); if (Math.hypot(p.x - f.x, p.z - f.z) < f.r) bloque[idx(i, j)] = 1; } }
    for (let k = 0; k < N * N; k++) if (eau[k]) bloque[k] = 1;
    for (const c of colliders) {
      const r = c.r + rayon, a = versCase(c.x - r, c.z - r), b = versCase(c.x + r, c.z + r);
      for (let j = a.j; j <= b.j; j++) for (let i = a.i; i <= b.i; i++) { const p = versMonde(i, j); if (Math.hypot(p.x - c.x, p.z - c.z) < r) bloque[idx(i, j)] = 1; }
    }
    if (!col.ouvert) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (versMonde(i, j).z < -172) bloque[idx(i, j)] = 1;
  }
  const libre = k => !bloque[k];
  // on peut aller d'une case à l'autre si la pente qui monte n'est pas trop raide (comme pour marcher)
  const passe = (a, b, dist) => haut[b] - haut[a] <= dist * 0.85;

  // ---------- A* ----------
  const g = new Float32Array(N * N), venu = new Int32Array(N * N), etat = new Uint8Array(N * N);
  const tas = []; // tas binaire de [f, k]
  const pousser = (f, k) => { tas.push([f, k]); let n = tas.length - 1; while (n > 0) { const p = (n - 1) >> 1; if (tas[p][0] <= tas[n][0]) break; [tas[p], tas[n]] = [tas[n], tas[p]]; n = p; } };
  const tirer = () => { const h = tas[0], l = tas.pop(); if (tas.length) { tas[0] = l; let n = 0; for (;;) { const a = 2 * n + 1, b = a + 1; let m = n; if (a < tas.length && tas[a][0] < tas[m][0]) m = a; if (b < tas.length && tas[b][0] < tas[m][0]) m = b; if (m === n) break; [tas[m], tas[n]] = [tas[n], tas[m]]; n = m; } } return h; };
  const VOISINS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];
  function caseLibreProche(c, max = 6) {
    if (libre(idx(c.i, c.j))) return c;
    for (let r = 1; r <= max; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
      const i = c.i + di, j = c.j + dj; if (i < 0 || j < 0 || i >= N || j >= N) continue;
      if (libre(idx(i, j))) return { i, j };
    }
    return null;
  }
  // ligne droite praticable ? (pour lisser le chemin)
  function ligneLibre(a, b) {
    const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.ceil(L / 1.2);
    let prec = null;
    for (let s = 0; s <= n; s++) {
      const x = a.x + (b.x - a.x) * s / n, z = a.z + (b.z - a.z) * s / n, c = versCase(x, z), k = idx(c.i, c.j);
      if (!libre(k)) return false;
      if (prec !== null && prec !== k && !passe(prec, k, CASE)) return false;
      prec = k;
    }
    return true;
  }
  function chercher(depuis, vers, rayon) {
    preparer(rayon);
    const s0 = caseLibreProche(versCase(depuis.x, depuis.z)), b0 = caseLibreProche(versCase(vers.x, vers.z), 8);
    if (!s0) return { ok: false, raison: 'depart' };
    if (!b0) return { ok: false, raison: 'arrivee' };
    const S = idx(s0.i, s0.j), B = idx(b0.i, b0.j);
    g.fill(Infinity); etat.fill(0); tas.length = 0;
    g[S] = 0; venu[S] = -1; pousser(0, S);
    const hx = b0.i, hz = b0.j, hcout = (i, j) => { const dx = Math.abs(i - hx), dz = Math.abs(j - hz); return (Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz)) * 0.55; };
    let trouve = false, tours = 0;
    while (tas.length) {
      const [, k] = tirer(); if (etat[k] === 2) continue; etat[k] = 2;
      if (k === B) { trouve = true; break; }
      if (++tours > 60000) break;
      const i = k % N, j = (k / N) | 0;
      for (const [di, dj, l] of VOISINS) {
        const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue;
        const nk = idx(ni, nj); if (etat[nk] === 2 || !libre(nk)) continue;
        if (di && dj && (!libre(idx(i + di, j)) || !libre(idx(i, j + dj)))) continue;   // pas de coin coupé
        if (!passe(k, nk, l * CASE)) continue;
        const pente = Math.abs(haut[nk] - haut[k]) / (l * CASE);
        const ng = g[k] + l * cout[nk] * (1 + pente * 1.5);
        if (ng < g[nk]) { g[nk] = ng; venu[nk] = k; pousser(ng + hcout(ni, nj), nk); }
      }
    }
    if (!trouve) return { ok: false, raison: !col.ouvert && vers.z < -172 ? 'col' : 'route' };
    const brut = [];
    for (let k = B; k !== -1; k = venu[k]) brut.push(versMonde(k % N, (k / N) | 0));
    brut.reverse(); brut[0] = { x: depuis.x, z: depuis.z };
    if (Math.hypot(vers.x - brut[brut.length - 1].x, vers.z - brut[brut.length - 1].z) < CASE * 3) brut.push({ x: vers.x, z: vers.z });
    // on tire le fil : garder seulement les points nécessaires
    const lisse = [brut[0]]; let a = 0;
    while (a < brut.length - 1) { let b = brut.length - 1; while (b > a + 1 && !ligneLibre(brut[a], brut[b])) b--; lisse.push(brut[b]); a = b; }
    return { ok: true, points: lisse };
  }

  // ---------- les petites lumières au sol ----------
  const NB = 34, ESP = 2.6;
  const disque = new THREE.PlaneGeometry(1.1, 1.1); disque.rotateX(-Math.PI / 2);
  // une petite étoile dorée à huit branches, entourée d'un halo (motif du jeu)
  const texPoint = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g2 = x.createRadialGradient(32, 32, 2, 32, 32, 31); g2.addColorStop(0, 'rgba(255,214,90,.95)'); g2.addColorStop(0.45, 'rgba(255,190,60,.55)'); g2.addColorStop(1, 'rgba(255,180,40,0)');
    x.fillStyle = g2; x.fillRect(0, 0, 64, 64); x.translate(32, 32); x.fillStyle = '#fff6d0';
    for (let k = 0; k < 2; k++) { x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const matPoint = new THREE.MeshBasicMaterial({ map: texPoint, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const points = new THREE.InstancedMesh(disque, matPoint, NB); points.frustumCulled = false; points.visible = false; points.renderOrder = 3;
  points.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NB * 3), 3);
  scene.add(points);
  // la balise d'arrivée : une colonne de lumière visible de loin, et un anneau qui tourne
  const tex = (() => { const c = document.createElement('canvas'); c.width = 4; c.height = 64; const x = c.getContext('2d'), gr = x.createLinearGradient(0, 0, 0, 64);
    gr.addColorStop(0, 'rgba(255,220,130,0)'); gr.addColorStop(0.7, 'rgba(255,215,120,0.55)'); gr.addColorStop(1, 'rgba(255,240,190,0.95)'); x.fillStyle = gr; x.fillRect(0, 0, 4, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const balise = new THREE.Group(); balise.visible = false; scene.add(balise);
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 26, 16, 1, true), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  colonne.position.y = 13; balise.add(colonne);
  const anneau = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color: '#ffd36b', transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  anneau.rotation.x = Math.PI / 2; anneau.position.y = 0.25; balise.add(anneau);
  // l'éclat d'arrivée
  const eclat = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.0, 40), new THREE.MeshBasicMaterial({ color: '#fff1b8', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  eclat.rotation.x = -Math.PI / 2; eclat.visible = false; scene.add(eclat);
  let tEclat = -1;

  // ---------- l'état du guidage ----------
  let dest = null, route = null, rayonActuel = 1, montrer = true, tRecalcul = 0, probleme = null;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(1, 1, 1), v3 = new THREE.Vector3(), coul = new THREE.Color();
  function recalculer(pos) {
    const r = chercher(pos, dest, rayonActuel);
    if (r.ok) { route = r.points; probleme = null; } else { route = null; probleme = r.raison; }
    return r;
  }
  // distance d'un point à la route, et position sur la route (en mètres depuis le début)
  function projeter(pos) {
    let best = Infinity, s = 0, acc = 0;
    for (let n = 0; n < route.length - 1; n++) {
      const a = route[n], b = route[n + 1], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1e-6;
      const t = Math.max(0, Math.min(1, ((pos.x - a.x) * dx + (pos.z - a.z) * dz) / (L * L)));
      const d = Math.hypot(a.x + dx * t - pos.x, a.z + dz * t - pos.z);
      if (d < best) { best = d; s = acc + t * L; }
      acc += L;
    }
    return { d: best, s, total: acc };
  }
  function pointA(s) {
    let acc = 0;
    for (let n = 0; n < route.length - 1; n++) {
      const a = route[n], b = route[n + 1], L = Math.hypot(b.x - a.x, b.z - a.z);
      if (acc + L >= s) { const t = (s - acc) / (L || 1); return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }; }
      acc += L;
    }
    return route[route.length - 1];
  }

  return {
    chercher,
    get dest() { return dest; }, get route() { return route; }, get probleme() { return probleme; },
    get montrer() { return montrer; }, set montrer(v) { montrer = v; },
    // dest = { x, z, nom, icone, rayon }
    activer(d, pos, rayon) {
      // on cherche d'abord : si aucun chemin n'existe, le guidage en cours (s'il y en a un) continue
      if (!col.ouvert && d.z < -172) return { ok: false, raison: 'col' };
      const fe = fermees().find(f => Math.hypot(d.x - f.x, d.z - f.z) < f.r); if (fe) return { ok: false, raison: 'region', region: fe.id };
      const r = chercher(pos, d, rayon);
      if (!r.ok) return { ok: false, raison: r.raison };
      dest = { rayon: 4, ...d }; rayonActuel = rayon; montrer = true; route = r.points; probleme = null;
      balise.position.set(dest.x, H(dest.x, dest.z), dest.z); balise.visible = true;
      return { ok: true, longueur: projeter(pos).total };
    },
    arreter() { dest = null; route = null; probleme = null; points.visible = false; balise.visible = false; },
    // à chaque image : renvoie { distance, cap (angle monde vers le prochain point), arrive }
    maj(dt, t, pos, rayon) {
      if (tEclat >= 0) { tEclat += dt; const k = tEclat / 1.4; eclat.scale.setScalar(1 + k * 9); eclat.material.opacity = Math.max(0, 0.9 * (1 - k)); if (k >= 1) { tEclat = -1; eclat.visible = false; } }
      if (!dest) return null;
      tRecalcul -= dt;
      if (rayon !== rayonActuel) { rayonActuel = rayon; tRecalcul = 0; route = route || null; }
      let p = route ? projeter(pos) : null;
      const besoin = !route || p.d > 7 || nbColliders !== colliders.length || colOuvert !== col.ouvert || marge !== rayonActuel || clefFermees !== clef();
      if (besoin && tRecalcul <= 0) { tRecalcul = 1.2; recalculer(pos); p = route ? projeter(pos) : null; }
      const reste = Math.hypot(dest.x - pos.x, dest.z - pos.z);
      if (reste < dest.rayon) {
        eclat.position.set(dest.x, H(dest.x, dest.z) + 0.15, dest.z); eclat.visible = true; tEclat = 0;
        const fini = dest; this.arreter(); return { arrive: true, dest: fini, distance: 0 };
      }
      anneau.rotation.z = t * 0.8; anneau.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
      if (!route) { points.visible = false; return { distance: reste, cap: Math.atan2(dest.x - pos.x, dest.z - pos.z), probleme }; }
      const distRoute = Math.max(0, p.total - p.s) + Math.min(p.d, 50);
      // les lumières devant l'enfant : elles semblent couler vers la destination
      points.visible = montrer;
      if (montrer) {
        const decal = (t * 3.2) % ESP;
        for (let n = 0; n < NB; n++) {
          const s = p.s + 1.5 + n * ESP + decal, fin = s > p.total;
          const q2 = pointA(Math.min(s, p.total));
          v3.set(q2.x, H(q2.x, q2.z) + 0.06, q2.z);
          const f = fin ? 0 : Math.min(1, (n + 1) / 3) * (1 - n / NB * 0.55);
          sc.setScalar(fin ? 0.001 : f * (0.8 + 0.25 * Math.sin(t * 4 - n * 0.6)));
          m4.compose(v3, q, sc); points.setMatrixAt(n, m4);
          coul.setRGB(1, 1, 1); points.setColorAt(n, coul);
        }
        points.instanceMatrix.needsUpdate = true; points.instanceColor.needsUpdate = true;
      }
      const vise = pointA(Math.min(p.s + 6, p.total));
      return { distance: distRoute, cap: Math.atan2(vise.x - pos.x, vise.z - pos.z) };
    }
  };
}
