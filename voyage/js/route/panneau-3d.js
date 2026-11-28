// Un panneau de bois sculpté, en 3D : deux poteaux, une poutre aux bouts arrondis, une grande planche gravée (texte, symbole, flèche), une flèche de bois suspendue
// par des cordes, des lanières de corde autour des poteaux, deux glands de laine et une petite lampe à huile. Arabie du VIIe siècle : aucun matériau ni signe moderne.
// La planche est dessinée dans un canevas (gros caractères crème « en relief » sur du bois, symbole et flèche gravés) : lisible de loin, par un enfant de 3 à 10 ans.
import * as THREE from 'three';
import { piece, fusion, materiau, M } from '../formes.js?v=4';

const B = () => new THREE.BoxGeometry(1, 1, 1), CYL = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), SPH = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h);
const BOIS = '#8a6440', BOIS_FONCE = '#6b4a30', CREME = '#f8ead0', ENCRE = '#3b2616', OR = '#e2b865', CORDE = '#c9a26a';

// un hasard toujours le même (le bois a toujours les mêmes veines)
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ----- les dessins gravés (tracés à la main, formes simples) -----
function dessinPortail(g, cx, cy, u) {      // un petit portail de pierre : deux piliers, un linteau, la lumière entre les deux
  g.fillStyle = ENCRE; g.fillRect(cx - 0.62 * u, cy - 0.62 * u, 1.24 * u, 1.3 * u);                      // l'ombre gravée
  g.fillStyle = '#e8d3a2'; g.fillRect(cx - 0.55 * u, cy - 0.55 * u, 0.38 * u, 1.2 * u); g.fillRect(cx + 0.17 * u, cy - 0.55 * u, 0.38 * u, 1.2 * u);   // piliers
  g.fillRect(cx - 0.62 * u, cy - 0.66 * u, 1.24 * u, 0.2 * u);                                           // linteau
  const l = g.createLinearGradient(0, cy - 0.4 * u, 0, cy + 0.65 * u); l.addColorStop(0, '#ffe39a'); l.addColorStop(1, '#f2a94e'); g.fillStyle = l; g.fillRect(cx - 0.17 * u, cy - 0.45 * u, 0.34 * u, 1.1 * u);   // la lumière
  g.fillStyle = '#2bb3c0'; for (const s of [-1, 1]) { g.save(); g.translate(cx + s * 0.36 * u, cy - 0.05 * u); g.rotate(Math.PI / 4); g.fillRect(-0.07 * u, -0.07 * u, 0.14 * u, 0.14 * u); g.restore(); }   // les losanges de turquoise
}
function dessinVillage(g, cx, cy, u) {      // le village : deux maisons de terre aux toits plats, une porte, un palmier
  g.fillStyle = ENCRE; g.fillRect(cx - 0.9 * u, cy - 0.5 * u, 1.8 * u, 1.2 * u);
  g.fillStyle = '#e8d3a2'; g.fillRect(cx - 0.85 * u, cy - 0.05 * u, 0.85 * u, 0.7 * u); g.fillRect(cx + 0.02 * u, cy - 0.35 * u, 0.7 * u, 1.0 * u);       // deux maisons
  g.fillStyle = '#c4ab80'; g.fillRect(cx - 0.9 * u, cy - 0.1 * u, 0.95 * u, 0.1 * u); g.fillRect(cx - 0.02 * u, cy - 0.4 * u, 0.8 * u, 0.1 * u);              // les toits plats
  g.fillStyle = '#6b4a30'; g.fillRect(cx - 0.55 * u, cy + 0.25 * u, 0.28 * u, 0.4 * u); g.fillRect(cx + 0.2 * u, cy + 0.2 * u, 0.28 * u, 0.45 * u);        // les portes
  g.fillStyle = '#ffd36b'; g.fillRect(cx + 0.5 * u, cy - 0.05 * u, 0.14 * u, 0.14 * u);                                                                  // une fenêtre allumée
  g.strokeStyle = '#6b8f3a'; g.lineWidth = 0.08 * u; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 0.95 * u, cy + 0.65 * u); g.lineTo(cx + 0.95 * u, cy - 0.3 * u); g.stroke();
  g.fillStyle = '#6b8f3a'; for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.save(); g.translate(cx + 0.95 * u, cy - 0.3 * u); g.rotate(a); g.fillRect(-0.04 * u, -0.38 * u, 0.08 * u, 0.4 * u); g.restore(); }   // le palmier
}
function dessinFleche(g, x0, x1, cy, h, sens) {    // une grosse flèche crème au contour gravé ; sens : 1 = vers la droite, -1 = vers la gauche
  const L = x1 - x0, pointe = sens > 0 ? x1 : x0, queue = sens > 0 ? x0 : x1, base = pointe - sens * L * 0.42;
  const tracer = (pad) => { g.beginPath(); g.moveTo(queue, cy - h * 0.2 + pad); g.lineTo(base, cy - h * 0.2 + pad); g.lineTo(base, cy - h * 0.5 - pad * 1.2); g.lineTo(pointe + sens * pad, cy); g.lineTo(base, cy + h * 0.5 + pad * 1.2); g.lineTo(base, cy + h * 0.2 - pad); g.lineTo(queue, cy + h * 0.2 - pad); g.closePath(); };
  g.save(); g.translate(5, 6); g.fillStyle = ENCRE; tracer(0); g.fill(); g.restore();                // l'ombre
  g.fillStyle = CREME; tracer(0); g.fill(); g.lineWidth = 6; g.strokeStyle = ENCRE; g.stroke();
  g.strokeStyle = 'rgba(59,38,22,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(queue + sens * 14, cy); g.lineTo(pointe - sens * 40, cy); g.stroke();   // une gravure le long de la hampe
}
function textureWood(graine) {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'), r = alea(graine);
  g.fillStyle = '#8a6440'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 26; i++) { g.fillStyle = r() > 0.5 ? 'rgba(59,38,22,.16)' : 'rgba(226,184,101,.14)'; g.fillRect(0, r() * 128, 128, 1 + r() * 3); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// La face de la planche : bois veiné, double filet gravé, losanges, symbole, texte en gros caractères, flèche
function textureFace({ ligne1, ligne2, symbole, fleche }) {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = alea(7 + ligne1.length * 13);
  g.fillStyle = '#9a6f43'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { g.fillStyle = r() > 0.5 ? 'rgba(59,38,22,.13)' : 'rgba(240,200,130,.12)'; g.fillRect(0, r() * H, W, 1 + r() * 4); }       // les veines du bois
  for (let i = 0; i < 3; i++) { const x = 80 + r() * 860, y = 60 + r() * 390; g.strokeStyle = 'rgba(59,38,22,.25)'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, 16, 9, 0, 0, 6.283); g.stroke(); }   // des nœuds
  g.lineWidth = 8; g.strokeStyle = ENCRE; g.strokeRect(14, 14, W - 28, H - 28); g.lineWidth = 3; g.strokeStyle = 'rgba(240,210,150,.75)'; g.strokeRect(26, 26, W - 52, H - 52);   // le double filet gravé
  g.fillStyle = 'rgba(59,38,22,.75)'; for (let x = 70; x < W - 40; x += 46) for (const y of [44, H - 44]) { g.save(); g.translate(x, y); g.rotate(Math.PI / 4); g.fillRect(-6, -6, 12, 12); g.restore(); }   // les losanges gravés, discrets
  // la mise en page : le symbole d'un côté, la flèche de l'autre (côté où elle pointe), le texte au milieu
  const aGauche = fleche === 'gauche', xFl0 = aGauche ? 52 : W - 232, xFl1 = aGauche ? 232 : W - 52, xSym = aGauche ? W - 128 : 128, xTxt = aGauche ? (232 + (W - 250)) / 2 + 6 : (250 + (W - 232)) / 2 - 6;
  dessinFleche(g, xFl0, xFl1, H / 2, 150, aGauche ? -1 : 1);
  (symbole === 'portail' ? dessinPortail : dessinVillage)(g, xSym, H / 2 + 6, 92);
  // le texte : deux lignes, caractères épais, crème sur ombre gravée ; réduit à la largeur disponible
  const largeur = 560, police = t => `800 ${t}px "Baloo 2","Nunito","Trebuchet MS",Georgia,serif`;
  let tp = 122; g.font = police(tp); while (Math.max(g.measureText(ligne1).width, g.measureText(ligne2).width) > largeur && tp > 56) { tp -= 4; g.font = police(tp); }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  for (const [t, y] of [[ligne1, H / 2 - tp * 0.5], [ligne2, H / 2 + tp * 0.55]]) {
    g.fillStyle = ENCRE; g.fillText(t, xTxt + 5, y + 6); g.lineWidth = 8; g.strokeStyle = ENCRE; g.strokeText(t, xTxt, y); g.fillStyle = CREME; g.fillText(t, xTxt, y);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// p : un panneau de panneaux-plan.js ; H : la hauteur du sol ; renvoie { groupe, animer }
export function creerPanneau3D({ scene, H, colliders, ombres, p }) {
  const mat = materiau({ finesse: 1.3 });
  const groupe = new THREE.Group(); groupe.name = 'route-panneau-' + p.id; scene.add(groupe);
  groupe.position.set(p.x, H(p.x, p.z), p.z); groupe.rotation.y = p.yaw;
  const sens = p.fleche === 'gauche' ? -1 : 1, g = [];
  // les poteaux (enfoncés dans le sol), leurs têtes arrondies, des pierres de calage, la poutre aux bouts arrondis
  for (const s of [-1, 1]) {
    g.push(piece(CYL(0.11, 0.13, 3.9, 8), BOIS_FONCE, { p: [s * 1.62, 1.35, 0], m: M.bois }), piece(SPH(0.17, 8, 6), BOIS, { p: [s * 1.62, 3.33, 0], m: M.bois }),
      piece(SPH(0.32, 7, 5), '#a8926f', { p: [s * 1.62, 0.02, 0.1], s: [1.2, 0.55, 1], m: M.pierre }), piece(SPH(0.24, 7, 5), '#8f7d62', { p: [s * 1.38, 0.0, -0.15], s: [1.1, 0.5, 1], m: M.pierre }));
    for (const y of [1.42, 2.95]) g.push(piece(new THREE.TorusGeometry(0.135, 0.03, 5, 10), CORDE, { p: [s * 1.62, y, 0], r: [Math.PI / 2, 0, 0], m: M.laine }));   // les cordes enroulées autour des poteaux
  }
  g.push(piece(B(), BOIS, { p: [0, 3.2, 0], s: [4.0, 0.2, 0.22], m: M.bois }));
  for (const s of [-1, 1]) g.push(piece(CYL(0.13, 0.13, 0.24, 8), BOIS_FONCE, { p: [s * 2.0, 3.2, 0], r: [0, 0, Math.PI / 2], m: M.bois }), piece(B(), OR, { p: [s * 1.15, 3.2, 0.115], s: [0.5, 0.06, 0.02], m: M.bois }));      // les bouts arrondis, des filets dorés
  // la planche : un cadre épais (on voit sa tranche), les dessins sont sur la face
  g.push(piece(B(), BOIS, { p: [0, 2.2, 0], s: [3.42, 1.72, 0.16], m: M.bois }), piece(B(), BOIS_FONCE, { p: [0, 2.2, -0.02], s: [3.5, 1.8, 0.12], m: M.bois }));
  // la flèche de bois, suspendue sous la planche par deux cordes
  const forme = new THREE.Shape(); { const L = 1.7, h = 0.62, base = L * 0.42, X = v => v * sens; forme.moveTo(X(-L / 2), -h * 0.2); forme.lineTo(X(L / 2 - base), -h * 0.2); forme.lineTo(X(L / 2 - base), -h * 0.5); forme.lineTo(X(L / 2), 0); forme.lineTo(X(L / 2 - base), h * 0.5); forme.lineTo(X(L / 2 - base), h * 0.2); forme.lineTo(X(-L / 2), h * 0.2); forme.closePath(); }   // la pointe du côté du sens (le dessin est déjà inversé : pas d'échelle négative)
  const fl = new THREE.ExtrudeGeometry(forme, { depth: 0.12, bevelEnabled: false }); fl.translate(0, 0, -0.06);
  const flInt = new THREE.ExtrudeGeometry(forme, { depth: 0.12, bevelEnabled: false }); flInt.translate(0, 0, -0.06);
  g.push(piece(fl, BOIS_FONCE, { p: [sens * 0.1, 1.0, 0.02], m: M.bois }), piece(flInt, '#d3a96b', { p: [sens * 0.1 * 0.86 + sens * 0.02, 1.0, 0.045], s: [0.86, 0.8, 1], m: M.bois }));
  for (const s of [-1, 1]) g.push(piece(CYL(0.018, 0.018, 0.42, 4), CORDE, { p: [s * 0.55, 1.58, 0.01], m: M.laine }));          // les cordes qui tiennent la flèche
  // deux glands de laine aux bouts de la poutre (turquoise et rouge, comme les bandes du portail)
  for (const [s, col] of [[-1, '#b5352a'], [1, '#2bb3c0']]) g.push(piece(CYL(0.012, 0.012, 0.5, 4), '#2b2320', { p: [s * 2.0, 2.92, 0.16] }), piece(B(), col, { p: [s * 2.0, 2.55, 0.16], s: [0.2, 0.42, 0.06], m: M.laine }), piece(B(), '#e8d6a0', { p: [s * 2.0, 2.36, 0.16], s: [0.22, 0.06, 0.07], m: M.laine }));
  const m = new THREE.Mesh(fusion(g), mat); m.castShadow = ombres; m.receiveShadow = ombres; groupe.add(m);
  // la face gravée de la planche
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.26, 1.63), new THREE.MeshLambertMaterial({ map: textureFace(p) })); face.position.set(0, 2.2, 0.085); groupe.add(face);
  // la petite lampe à huile, accrochée au bout de la poutre, du côté de la flèche
  const lampe = new THREE.Mesh(SPH(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffd36b' })); lampe.position.set(-sens * 2.0, 2.78, -0.02);
  const cage = new THREE.Mesh(CYL(0.15, 0.15, 0.27, 6), new THREE.MeshLambertMaterial({ color: '#5a3f28', wireframe: true })); cage.position.copy(lampe.position);
  const chaine = new THREE.Mesh(CYL(0.01, 0.01, 0.3, 4), new THREE.MeshBasicMaterial({ color: '#2b2320' })); chaine.position.set(lampe.position.x, 3.06, -0.02);
  groupe.add(lampe, cage, chaine);
  // les obstacles : les deux poteaux
  const dx = Math.cos(p.yaw), dz = -Math.sin(p.yaw);
  for (const s of [-1, 1]) colliders.push({ x: p.x + s * 1.62 * dx, z: p.z + s * 1.62 * dz, r: 0.34 });
  return { groupe, animer(t) { lampe.scale.setScalar(1 + Math.sin(t * 6 + p.x) * 0.07); } };
}
