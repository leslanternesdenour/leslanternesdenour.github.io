// LES ICÔNES 3D DU VILLAGE — un vrai petit objet par maison (livre ouvert, lanterne, goutte, dôme, tapis de prière, loupe, tableau de chiffres, chameau).
// Tout est construit par code (aucun modèle à télécharger) avec peu de polygones ; matériaux brillants (or, verre, bois, tissu) éclairés par la lumière du village.
// Chaque fabrique renvoie un groupe d'environ 1,6 unité de haut, posé sur y = 0. Aucune icône n'utilise d'emoji ni de symbole Unicode : les lettres et chiffres arabes sont dessinés sur de vraies surfaces (pages, verre, tableau).
import * as THREE from 'three';

const OR = 0xf5b942, OR2 = 0xc98a22;
const mat = (couleur, o = {}) => new THREE.MeshPhongMaterial({ color: couleur, shininess: o.brillance ?? 40, specular: o.speculaire ?? 0x444444, emissive: o.emissif ?? 0x000000, emissiveIntensity: o.intensite ?? 1, transparent: !!o.opacite, opacity: o.opacite ?? 1, flatShading: !!o.facettes, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
const or = () => mat(OR, { brillance: 90, speculaire: 0xffe9a8, emissif: 0x4a3008 });
const M = (geo, materiau, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, materiau); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); return m; };
const G = (...enfants) => { const g = new THREE.Group(); enfants.forEach(e => g.add(e)); return g; };

// texture dessinée : texte arabe sur fond (la police Amiri est chargée par la page ; on redessine quand elle est prête)
function texTexte(lignes, { fond = null, couleur = '#2a1a5e', taille = 120, l = 512, h = 512, police = 'Amiri', contour = null, dx = 0, dy = 0, sens = 'rtl' } = {}) {
  const c = document.createElement('canvas'); c.width = l; c.height = h; const g = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const dessiner = () => { g.clearRect(0, 0, l, h); if (fond) { g.fillStyle = fond; g.fillRect(0, 0, l, h); } g.font = `700 ${taille}px "${police}","Noto Naskh Arabic","Traditional Arabic",serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = sens;
    const n = lignes.length; lignes.forEach((s, i) => { const y = h / 2 + dy + (i - (n - 1) / 2) * taille * 1.05; if (contour) { g.lineWidth = taille * 0.07; g.strokeStyle = contour; g.strokeText(s, l / 2 + dx, y); } g.fillStyle = couleur; g.fillText(s, l / 2 + dx, y); }); t.needsUpdate = true; };
  dessiner(); try { document.fonts && document.fonts.load(`700 ${taille}px "${police}"`).then(dessiner).catch(() => {}); } catch (e) { /* police indisponible : le texte reste lisible avec la police de secours */ }
  return t;
}
const texTapis = () => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 400; const g = c.getContext('2d');
  g.fillStyle = '#9b1d3a'; g.fillRect(0, 0, 256, 400); g.strokeStyle = '#f5b942'; g.lineWidth = 10; g.strokeRect(14, 14, 228, 372); g.lineWidth = 4; g.strokeRect(34, 34, 188, 332);
  g.fillStyle = '#2a8f9c'; g.beginPath(); g.moveTo(58, 340); g.lineTo(58, 190); g.quadraticCurveTo(58, 80, 128, 62); g.quadraticCurveTo(198, 80, 198, 190); g.lineTo(198, 340); g.closePath(); g.fill(); g.strokeStyle = '#f5b942'; g.lineWidth = 6; g.stroke();
  g.fillStyle = '#f5b942'; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(128 + Math.cos(a) * 34, 210 + Math.sin(a) * 34); g.lineTo(128 + Math.cos(a + 0.39) * 14, 210 + Math.sin(a + 0.39) * 14); g.lineTo(128 + Math.cos(a + 0.78) * 34, 210 + Math.sin(a + 0.78) * 34); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const forme5 = (R, r) => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); } s.closePath(); return s; };
const etoile = (R = 0.2) => new THREE.ExtrudeGeometry(forme5(R, R * 0.45), { depth: R * 0.35, bevelEnabled: true, bevelSize: R * 0.06, bevelThickness: R * 0.06, bevelSegments: 1 });

// ---------- 1. livre ouvert (lecture / école des lettres) ----------
function livre({ couv = 0x1e7a58, lignes = ['اِقْرَأ'], taille = 150, lettresRelief = false } = {}) {
  const g = new THREE.Group(), pageTex = texTexte(lignes, { fond: '#fff7e2', couleur: '#2a1a5e', taille, l: 512, h: 640 });
  const couvM = mat(couv, { brillance: 55, speculaire: 0x66aa88 }), pageM = new THREE.MeshPhongMaterial({ map: pageTex, shininess: 12 }), tranche = mat(0xfff2cc, { brillance: 8 });
  for (const s of [-1, 1]) {
    const moitie = new THREE.Group(); moitie.position.set(s * 0.02, 0.18, 0); moitie.rotation.z = -s * 0.2;
    moitie.add(M(new THREE.BoxGeometry(0.86, 0.08, 1.12), couvM, s * 0.45, 0, 0));                             // couverture
    moitie.add(M(new THREE.BoxGeometry(0.8, 0.07, 1.04), tranche, s * 0.44, 0.075, 0));                         // bloc de pages
    const p = M(new THREE.PlaneGeometry(0.76, 1.0), pageM, s * 0.44, 0.115, 0, -Math.PI / 2, 0, 0); p.scale.x = 1; moitie.add(p);   // page décorée
    moitie.add(M(new THREE.BoxGeometry(0.1, 0.095, 0.1), or(), s * 0.82, 0.04, 0.52)); moitie.add(M(new THREE.BoxGeometry(0.1, 0.095, 0.1), or(), s * 0.82, 0.04, -0.52));   // coins dorés
    g.add(moitie);
  }
  g.add(M(new THREE.CylinderGeometry(0.07, 0.07, 1.12, 10), couvM, 0, 0.14, 0, Math.PI / 2, 0, 0));               // dos du livre
  g.position.y = 0.1; g.rotation.x = 0.35; const e = new THREE.Group(); e.add(g); return e;
}
// ---------- 2. lanterne orientale ----------
function lanterne({ halo }) {
  const g = new THREE.Group(), verre = mat(0xffd36a, { emissif: 0xffa82a, intensite: 1.15, brillance: 90, speculaire: 0xffffff }), ossature = or();
  g.add(M(new THREE.CylinderGeometry(0.42, 0.34, 0.14, 6), ossature, 0, 0.07, 0));                                // base
  g.add(M(new THREE.CylinderGeometry(0.4, 0.3, 0.9, 6, 1, true), mat(0xffd36a, { emissif: 0xff9a1a, intensite: 1.2, opacite: 0.92, double: true, brillance: 100 }), 0, 0.6, 0));   // verre
  g.add(M(new THREE.SphereGeometry(0.2, 12, 8), mat(0xfff3c0, { emissif: 0xffe08a, intensite: 1.5 }), 0, 0.6, 0));  // lumière intérieure
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; g.add(M(new THREE.BoxGeometry(0.045, 0.92, 0.045), ossature, Math.cos(a) * 0.37, 0.6, Math.sin(a) * 0.37, 0, 0, Math.sin(a) * 0.08 * 0, 1)); }
  g.add(M(new THREE.CylinderGeometry(0.02, 0.44, 0.34, 6), ossature, 0, 1.2, 0));                                   // toit
  g.add(M(new THREE.SphereGeometry(0.1, 10, 8), ossature, 0, 1.42, 0)); g.add(M(new THREE.TorusGeometry(0.11, 0.025, 8, 16), ossature, 0, 1.56, 0, 0, 0, 0));
  g.add(M(new THREE.TorusGeometry(0.46, 0.025, 6, 6), ossature, 0, 1.05, 0, Math.PI / 2));
  if (halo) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: halo, color: 0xffc04a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.8 })); s.scale.setScalar(2.4); s.position.y = 0.6; s.userData.halo = true; g.add(s); }
  return g;
}
// ---------- 3. goutte d'eau brillante + vasque ----------
function goutte() {
  // silhouette d'une goutte : arrondie en bas, pointue en haut
  const p = []; const N = 30; for (let i = 0; i <= N; i++) { const t = i / N, r = t <= 0.3 ? 0.46 * Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.3) / 0.3, 2))) : 0.46 * Math.pow(Math.max(0, 1 - (t - 0.3) / 0.7), 1.7); p.push(new THREE.Vector2(Math.max(0.0001, r), t * 1.5)); }
  const g = new THREE.Group(), eau = mat(0x2fb8ff, { emissif: 0x0a5fb0, intensite: 0.8, brillance: 120, speculaire: 0xffffff, opacite: 0.94 });
  g.add(M(new THREE.LatheGeometry(p, 24), eau, 0, 0.45, 0));
  g.add(M(new THREE.SphereGeometry(0.09, 10, 8), mat(0xffffff, { emissif: 0xffffff, opacite: 0.85 }), -0.17, 0.78, 0.33, 0, 0, 0, 1, 1.9, 0.7));     // reflet
  g.add(M(new THREE.SphereGeometry(0.045, 8, 6), mat(0xffffff, { emissif: 0xffffff, opacite: 0.8 }), -0.08, 0.6, 0.42));
  g.add(M(new THREE.SphereGeometry(0.62, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0x2bb3c0, { brillance: 80, speculaire: 0xaaffff, double: true }), 0, 0.42, 0));   // vasque
  g.add(M(new THREE.TorusGeometry(0.62, 0.05, 8, 24), or(), 0, 0.42, 0, Math.PI / 2));
  g.add(M(new THREE.CylinderGeometry(0.56, 0.56, 0.03, 24), mat(0x6fe0f0, { emissif: 0x1a7f90, opacite: 0.9 }), 0, 0.41, 0));  // surface de l'eau
  g.add(M(new THREE.CylinderGeometry(0.16, 0.28, 0.34, 10), mat(0x2bb3c0), 0, 0.12, 0)); return g;
}
// ---------- 4. dôme doré + croissant (prière) ----------
function dome() {
  const g = new THREE.Group(), vert = mat(0x1f8a78, { brillance: 90, speculaire: 0xaaffee }), mur = mat(0xf3e6c8, { brillance: 16 });
  g.add(M(new THREE.CylinderGeometry(0.6, 0.66, 0.5, 14), mur, 0, 0.25, 0)); g.add(M(new THREE.TorusGeometry(0.63, 0.04, 6, 20), or(), 0, 0.52, 0, Math.PI / 2));
  g.add(M(new THREE.SphereGeometry(0.66, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), vert, 0, 0.5, 0));
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.add(M(new THREE.TorusGeometry(0.66, 0.012, 4, 12, Math.PI / 2), or(), 0, 0.5, 0, 0, a, Math.PI / 2 * 0, 1)); }
  g.add(M(new THREE.CylinderGeometry(0.03, 0.03, 0.34, 6), or(), 0, 1.35, 0));
  const arc = new THREE.Shape(); arc.absarc(0, 0, 0.26, 0.5, Math.PI * 2 - 0.5, false); arc.absarc(0.1, 0, 0.21, Math.PI * 2 - 0.55, 0.55, true);
  g.add(M(new THREE.ExtrudeGeometry(arc, { depth: 0.07, bevelEnabled: false }), or(), 0, 1.66, -0.035, 0, 0, Math.PI * 0.5 * 0 + 0.0, 1));
  const e = M(etoile(0.1), or(), 0.12, 1.66, -0.03); g.add(e);
  g.add(M(new THREE.BoxGeometry(0.34, 0.42, 0.04), mat(0x5a3a22), 0, 0.2, 0.64)); g.add(M(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 12, 1, false, 0, Math.PI), mat(0x5a3a22), 0, 0.41, 0.64, Math.PI / 2)); return g;
}
// ---------- 5. tapis de prière avec cinq étoiles ----------
function tapis() {
  const g = new THREE.Group(), t = texTapis();
  const plan = new THREE.Group(); plan.add(M(new THREE.BoxGeometry(1.0, 0.06, 1.55), mat(0x9b1d3a), 0, 0, 0));
  plan.add(M(new THREE.PlaneGeometry(0.96, 1.5), new THREE.MeshPhongMaterial({ map: t, shininess: 14 }), 0, 0.034, 0, -Math.PI / 2, 0, 0));
  for (let i = 0; i < 9; i++) { for (const z of [-0.8, 0.8]) plan.add(M(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 4), mat(0xf5e6c0), -0.4 + i * 0.1, 0, z, Math.PI / 2, 0, 0)); }
  plan.rotation.x = 0.5; plan.position.y = 0.62; g.add(plan);
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.2 + i * 0.15); const s = M(etoile(0.17), or(), Math.cos(a) * 0.75, 1.12 + Math.sin(a) * 0.55 - 0.3, 0.1); s.userData.tourne = 1; g.add(s); }
  return g;
}
// ---------- 6. loupe avec une lettre arabe ----------
function loupe() {
  const g = new THREE.Group(), lettre = texTexte(['ك'], { fond: null, couleur: '#14527a', taille: 380, l: 512, h: 512, contour: '#ffffff' });
  g.add(M(new THREE.TorusGeometry(0.55, 0.085, 12, 32), or(), 0, 0.95, 0));
  g.add(M(new THREE.CircleGeometry(0.52, 28), mat(0x9fe8ff, { emissif: 0x2a8fb0, intensite: 0.5, opacite: 0.55, brillance: 120, speculaire: 0xffffff }), 0, 0.95, 0.01));
  const L = M(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({ map: lettre, transparent: true, depthWrite: false }), 0, 0.93, 0.05); g.add(L);
  g.add(M(new THREE.CylinderGeometry(0.075, 0.095, 0.7, 10), mat(0x6a3f22, { brillance: 30 }), -0.48, 0.38, 0, 0, 0, -0.78));
  g.add(M(new THREE.SphereGeometry(0.1, 10, 8), or(), -0.7, 0.14, 0)); g.add(M(new THREE.TorusGeometry(0.55, 0.03, 6, 24, Math.PI * 0.6), mat(0xffffff, { emissif: 0xffffff, opacite: 0.6 }), 0, 0.95, 0.09, 0, 0, 0.9)); g.rotation.z = 0.12; return g;
}
// ---------- 7. tableau avec chiffres arabes + dés ----------
function tableau() {
  const g = new THREE.Group(), chiffres = texTexte(['١ ٢ ٣'], { fond: '#1f4d3a', couleur: '#fff7e2', taille: 230, l: 640, h: 400, police: 'Amiri', sens: 'ltr' }), bois = mat(0x9a6a3a, { brillance: 30 });
  g.add(M(new THREE.PlaneGeometry(1.5, 0.94), new THREE.MeshPhongMaterial({ map: chiffres, shininess: 20 }), 0, 0.95, 0.06));
  for (const [x, y, w, h] of [[0, 1.46, 1.66, 0.12], [0, 0.44, 1.66, 0.12], [-0.77, 0.95, 0.12, 1.08], [0.77, 0.95, 0.12, 1.08]]) g.add(M(new THREE.BoxGeometry(w, h, 0.14), bois, x, y, 0.06));
  g.add(M(new THREE.BoxGeometry(1.2, 0.07, 0.2), bois, 0, 0.36, 0.2)); g.add(M(new THREE.BoxGeometry(0.2, 0.05, 0.08), mat(0xffffff), -0.3, 0.42, 0.24));
  for (const [x, c, r] of [[0.55, 0xe5445a, 0.3], [0.9, 0x2a8fe0, -0.4]]) { g.add(M(new THREE.BoxGeometry(0.3, 0.3, 0.3), mat(c, { brillance: 70, speculaire: 0xffffff }), x, 0.2, 0.42, 0, r, 0)); g.add(M(new THREE.SphereGeometry(0.035, 6, 4), mat(0xffffff), x + Math.sin(r) * 0.08, 0.2 + 0.0, 0.58 * 0 + 0.57)); }
  g.add(M(new THREE.BoxGeometry(0.1, 0.5, 0.1), bois, -0.5, 0.2, -0.1, 0.0, 0, 0.1)); g.add(M(new THREE.BoxGeometry(0.1, 0.5, 0.1), bois, 0.5, 0.2, -0.1, 0.0, 0, -0.1)); return g;
}
// ---------- 8. chameau avec sacoche ----------
function chameau() {
  const g = new THREE.Group(), peau = mat(0xd9a05b, { brillance: 14 }), fonce = mat(0xb9803f, { brillance: 10 });
  g.add(M(new THREE.SphereGeometry(0.5, 14, 10), peau, 0, 0.78, 0, 0, 0, 0, 1.45, 0.85, 0.78));
  g.add(M(new THREE.SphereGeometry(0.3, 12, 8), peau, 0.12, 1.22, 0, 0, 0, 0, 1, 1.1, 0.9));
  g.add(M(new THREE.CylinderGeometry(0.14, 0.2, 0.75, 8), peau, 0.72, 1.18, 0, 0, 0, -0.55));
  g.add(M(new THREE.SphereGeometry(0.2, 10, 8), peau, 1.0, 1.54, 0, 0, 0, 0, 1.4, 0.95, 0.9)); g.add(M(new THREE.SphereGeometry(0.1, 8, 6), fonce, 1.22, 1.46, 0));
  for (const z of [-0.09, 0.09]) g.add(M(new THREE.SphereGeometry(0.075, 6, 5), mat(0x2a1a10), 1.06, 1.62, z * 2.2)); for (const z of [-0.1, 0.1]) g.add(M(new THREE.ConeGeometry(0.05, 0.14, 5), fonce, 0.86, 1.72, z * 2));
  for (const [x, z] of [[-0.45, -0.25], [-0.45, 0.25], [0.5, -0.25], [0.5, 0.25]]) { g.add(M(new THREE.CylinderGeometry(0.075, 0.06, 0.78, 6), peau, x, 0.4, z)); g.add(M(new THREE.CylinderGeometry(0.095, 0.095, 0.06, 6), fonce, x, 0.03, z)); }
  g.add(M(new THREE.CylinderGeometry(0.03, 0.02, 0.5, 5), fonce, -0.78, 0.7, 0, 0, 0, 0.6));
  g.add(M(new THREE.BoxGeometry(0.62, 0.12, 0.62), mat(0x1e8a9c), 0, 1.3, 0, 0, 0, 0));                           // tapis de selle
  for (const [x, c] of [[-0.1, 0xe5445a], [0.12, 0x2f9e5a], [0.34, 0xf5b942]]) g.add(M(new THREE.CylinderGeometry(0.11, 0.11, 0.62, 10), mat(c), x - 0.05, 1.45, 0, Math.PI / 2, 0, 0));   // tapis roulés
  for (const z of [-0.43, 0.43]) { g.add(M(new THREE.BoxGeometry(0.34, 0.4, 0.14), mat(0x8a3b2a), -0.05, 0.86, z)); g.add(M(new THREE.SphereGeometry(0.045, 6, 4), or(), -0.05, 0.9, z * 1.18)); }   // sacoches
  g.position.x = -0.1; return g;
}
// ---------- sablier (maison qui se prépare) ----------
function sablier() {
  const g = new THREE.Group(), bois = mat(0x7a5636);
  g.add(M(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 10), bois, 0, 0, 0)); g.add(M(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 10), bois, 0, 0.9, 0));
  g.add(M(new THREE.ConeGeometry(0.22, 0.42, 10, 1, true), mat(0xbfefff, { opacite: 0.5, double: true }), 0, 0.23, 0, Math.PI)); g.add(M(new THREE.ConeGeometry(0.22, 0.42, 10, 1, true), mat(0xbfefff, { opacite: 0.5, double: true }), 0, 0.67, 0));
  g.add(M(new THREE.ConeGeometry(0.14, 0.26, 10), mat(0xf0c27a), 0, 0.16, 0)); return g;
}

const FABRIQUES = { jardin: () => livre({ couv: 0x1e7a58, lignes: ['اِقْرَأْ'], taille: 230 }), sons: () => livre({ couv: 0x2b5fb0, lignes: ['أ ب', 'ت ث'], taille: 210 }), ramadan: lanterne, ablutions: goutte, priere: dome, cinq: tapis, mots: loupe, etoiles: tableau, desert: chameau };
// hauteur approximative de chaque icône (pour poser le nom dessous)
export const ECHELLE = { jardin: 2.4, sons: 2.4, ramadan: 2.35, ablutions: 2.4, priere: 2.15, cinq: 2.35, mots: 2.35, etoiles: 2.3, desert: 2.15 };
export function creerIcone3d(id, { halo } = {}) {
  const f = FABRIQUES[id] || (() => G(M(new THREE.OctahedronGeometry(0.6, 0), or(), 0, 0.7, 0)));
  const g = f({ halo }); g.userData.id = id; g.scale.setScalar(ECHELLE[id] || 2.5); g.userData.base = g.scale.x; return g;
}
export const creerSablier = () => sablier();
// éclairage et rendu d'une vignette 2D de l'icône (pour le panneau d'information) : on dessine l'icône dans une petite scène à part
export function vignette(renderer, id, taille = 160) {
  const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50), obj = creerIcone3d(id); obj.scale.setScalar(1);
  sc.add(obj, new THREE.HemisphereLight(0xffffff, 0xcdb68a, 1.5)); const d = new THREE.DirectionalLight(0xfff4dc, 2.4); d.position.set(3, 6, 5); sc.add(d);
  const bb = new THREE.Box3().setFromObject(obj), c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3()), r = Math.max(s.x, s.y, s.z) * 1.55;
  cam.position.set(c.x + r * 0.25, c.y + r * 0.35, c.z + r * 1.9); cam.lookAt(c);
  const rt = new THREE.WebGLRenderTarget(taille, taille, { samples: 2 }), ancien = renderer.getRenderTarget(), ac = renderer.getClearAlpha(), col = renderer.getClearColor(new THREE.Color());
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(sc, cam);
  const px = new Uint8Array(taille * taille * 4); renderer.readRenderTargetPixels(rt, 0, 0, taille, taille, px); renderer.setRenderTarget(ancien); renderer.setClearColor(col, ac); rt.dispose();
  const cv = document.createElement('canvas'); cv.width = cv.height = taille; const g = cv.getContext('2d'), im = g.createImageData(taille, taille);
  for (let y = 0; y < taille; y++) im.data.set(px.subarray((taille - 1 - y) * taille * 4, (taille - y) * taille * 4), y * taille * 4); g.putImageData(im, 0, 0);
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); }); return cv.toDataURL('image/png');
}
