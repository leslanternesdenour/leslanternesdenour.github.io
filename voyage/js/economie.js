// La bourse de l'enfant et les Pièces de Nour.
// - Chaque récompense a un identifiant : elle n'est donnée qu'UNE fois (actualiser la page ne la redonne pas).
// - Les pièces apparaissent au sol près de l'enfant et se ramassent toutes seules en passant dessus
//   (à pied ou sur n'importe quelle monture). Les pièces pas encore ramassées sont sauvegardées :
//   si on ferme la page, elles réapparaissent au prochain voyage, jamais perdues, jamais en double.
// - Le solde ne peut pas devenir négatif ; un même achat ne peut pas être payé deux fois.
// - Les pièces sont une création artistique propre au jeu (étoile à huit branches, croissant, lanterne),
//   pas la copie d'une monnaie historique. On ne les achète jamais avec de l'argent.
import * as THREE from 'three';

const VALEURS = [100, 50, 10, 5, 1];
const ARGENT = { 1: '#d7a85a', 5: '#e0b04e', 10: '#f0c14a', 50: '#f5c842', 100: '#ffd34d' };

// ---------- le dessin de la pièce (relief) ----------
function texturesPiece() {
  const n = 256, c = document.createElement('canvas'); c.width = c.height = n;
  const x = c.getContext('2d'), h = document.createElement('canvas'); h.width = h.height = n;
  const y = h.getContext('2d');
  // carte de hauteur : rebord perlé, étoile à huit branches, croissant, petite lanterne
  y.fillStyle = '#000'; y.fillRect(0, 0, n, n);
  y.fillStyle = '#555'; y.beginPath(); y.arc(n / 2, n / 2, n * 0.48, 0, 7); y.fill();
  y.fillStyle = '#333'; y.beginPath(); y.arc(n / 2, n / 2, n * 0.4, 0, 7); y.fill();
  y.fillStyle = '#aaa';
  for (let i = 0; i < 36; i++) { const a = i / 36 * Math.PI * 2; y.beginPath(); y.arc(n / 2 + Math.cos(a) * n * 0.44, n / 2 + Math.sin(a) * n * 0.44, n * 0.016, 0, 7); y.fill(); }
  const etoile = (r1, r2, coul) => { y.fillStyle = coul; y.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? r2 : r1; y.lineTo(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r); } y.closePath(); y.fill(); };
  etoile(n * 0.34, n * 0.25, '#999'); etoile(n * 0.27, n * 0.2, '#666');
  y.fillStyle = '#ddd'; y.beginPath(); y.arc(n / 2, n / 2, n * 0.13, 0, 7); y.fill();
  y.fillStyle = '#666'; y.beginPath(); y.arc(n / 2 + n * 0.05, n / 2 - n * 0.03, n * 0.12, 0, 7); y.fill();   // croissant
  y.fillStyle = '#eee'; y.beginPath(); y.arc(n / 2 + n * 0.06, n / 2 + n * 0.05, n * 0.025, 0, 7); y.fill();  // petite étoile
  // couleur dorée, plus claire sur les reliefs
  const img = y.getImageData(0, 0, n, n), col = x.createImageData(n, n);
  for (let i = 0; i < n * n; i++) { const v = img.data[i * 4] / 255; col.data[i * 4] = 190 + v * 65; col.data[i * 4 + 1] = 140 + v * 90; col.data[i * 4 + 2] = 40 + v * 70; col.data[i * 4 + 3] = 255; }
  x.putImageData(col, 0, 0);
  // normales à partir des hauteurs
  const nm = document.createElement('canvas'); nm.width = nm.height = n; const z = nm.getContext('2d'), out = z.createImageData(n, n);
  const H = (i, j) => img.data[(Math.min(n - 1, Math.max(0, j)) * n + Math.min(n - 1, Math.max(0, i))) * 4] / 255;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const dx = (H(i + 1, j) - H(i - 1, j)) * 3, dy = (H(i, j + 1) - H(i, j - 1)) * 3, l = Math.hypot(dx, dy, 1), k = (j * n + i) * 4;
    out.data[k] = (-dx / l * 0.5 + 0.5) * 255; out.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[k + 3] = 255;
  }
  z.putImageData(out, 0, 0);
  const t1 = new THREE.CanvasTexture(c); t1.colorSpace = THREE.SRGBColorSpace;
  const t2 = new THREE.CanvasTexture(nm);
  return { couleur: t1, normales: t2, image: c.toDataURL() };
}

function decouper(n) {   // 340 → [100,100,100,10,10,10,10] (au plus 14 pièces)
  const out = []; let r = n;
  for (const v of VALEURS) while (r >= v && out.length < 14) { out.push(v); r -= v; }
  if (r > 0) out[out.length - 1] += r;
  return out;
}

export function creerBourse({ scene, terrain, A, enregistrer, sons, ui }) {
  const H = (x, z) => terrain.hauteur(x, z);
  // ---------- état sauvegardé (et migration de l'ancienne version) ----------
  if (!A.versionBourse) {
    const ancien = A.pieces || 0;
    A.pieces = ancien * 10;                         // nouvelle échelle des prix : tout est multiplié par 10
    A.registre = ancien ? [{ id: 'migration', n: A.pieces, raison: 'Pièces déjà gagnées', t: Date.now(), type: 'gain' }] : [];
    A.credites = {}; A.enAttente = [];
    A.versionBourse = 2;
    enregistrer();
  }
  A.registre = A.registre || []; A.credites = A.credites || {}; A.enAttente = A.enAttente || [];
  if (!(A.pieces >= 0)) A.pieces = 0;               // jamais négatif, jamais « NaN »

  const tx = texturesPiece();
  const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 32); geo.rotateX(Math.PI / 2);
  const matFace = new THREE.MeshStandardMaterial({ map: tx.couleur, normalMap: tx.normales, metalness: 0.55, roughness: 0.32, emissive: '#5a3a00', emissiveIntensity: 0.35 });
  const matBord = new THREE.MeshStandardMaterial({ color: '#e8b843', metalness: 0.6, roughness: 0.3, emissive: '#5a3a00', emissiveIntensity: 0.3 });
  const lueur = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,230,140,.9)'); g.addColorStop(1, 'rgba(255,200,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();

  const piecesSol = [];   // { rec, idx, v, g, x, z, y, etat: 'sol'|'vol', t }
  function poserPieces(rec, cx, cz, angle) {
    const vals = decouper(rec.restant ?? rec.n);
    rec.pieces = vals.map((v, i) => {
      const a = (angle ?? 0) + (i - (vals.length - 1) / 2) * 0.38, d = 4.5 + (i % 3) * 1.1;   // devant l'enfant, à quelques pas
      return { v, x: cx + Math.sin(a) * d, z: cz + Math.cos(a) * d };
    });
    afficher(rec);
  }
  function afficher(rec) {
    rec.pieces.forEach((p, idx) => {
      if (p.pris) return;
      const g = new THREE.Group();
      const m = new THREE.Mesh(geo, [matBord, matFace, matFace]);
      const s = p.v >= 100 ? 1.45 : p.v >= 50 ? 1.25 : p.v >= 10 ? 1.05 : 0.85;
      m.scale.setScalar(s); g.add(m);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: lueur, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7, color: ARGENT[p.v] || '#ffd34d' }));
      sp.scale.setScalar(1.3 * s); g.add(sp);
      g.position.set(p.x, H(p.x, p.z) + 0.55, p.z);
      scene.add(g);
      piecesSol.push({ rec, idx, v: p.v, g, m, x: p.x, z: p.z, etat: 'tombe', t: Math.random() * 0.2, h0: 3 + Math.random() });
    });
  }

  // ---------- donner une récompense (une seule fois par identifiant) ----------
  function recompense(id, n, raison, ou) {
    if (!id || A.credites[id] || n <= 0) return false;
    A.credites[id] = Date.now();
    const rec = { id, n, raison, restant: n, t: Date.now() };
    A.enAttente.push(rec);
    poserPieces(rec, ou.x, ou.z, ou.a);
    enregistrer();                                   // sauvegardé tout de suite : rien ne se perd si on ferme
    ui.annonce(n, raison);
    return true;
  }
  // Au retour dans le monde : les pièces pas encore ramassées réapparaissent près de l'enfant
  function restaurer(ou) {
    for (const rec of A.enAttente) { rec.pieces = null; poserPieces(rec, ou.x, ou.z, ou.a); }
    if (A.enAttente.length) ui.rappel(A.enAttente.reduce((s, r) => s + r.restant, 0));
  }

  // ---------- acheter ----------
  function possede(id) { return A.registre.some(e => e.type === 'achat' && e.id === id); }
  function acheter(id, prix, nom) {
    if (possede(id)) return { ok: false, raison: 'deja' };
    if (!(prix > 0) || A.pieces < prix) return { ok: false, raison: 'pieces' };
    A.pieces -= prix;
    A.registre.push({ id, n: -prix, raison: nom, t: Date.now(), type: 'achat' });
    enregistrer();
    return { ok: true };
  }

  // ---------- ramassage automatique ----------
  let paquet = 0, timerPaquet = null;
  function maj(dt, t, collecteur, rayon, camera) {
    for (let i = piecesSol.length - 1; i >= 0; i--) {
      const p = piecesSol[i]; p.t += dt;
      const sol = H(p.x, p.z) + 0.55;
      if (p.etat === 'tombe') {                      // elles tombent en tournoyant puis rebondissent
        const k = Math.min(1, p.t / 0.6);
        p.g.position.y = sol + p.h0 * (1 - k) * (1 - k) + Math.abs(Math.sin(k * Math.PI * 2)) * 0.25 * (1 - k);
        if (k >= 1) p.etat = 'sol';
      } else if (p.etat === 'sol') {
        p.g.position.y = sol + Math.sin(t * 2.4 + p.x) * 0.08;
        const dx = collecteur.x - p.x, dz = collecteur.z - p.z, d = Math.hypot(dx, dz);
        if (d < rayon + 1.2) { const f = Math.min(1, dt * (rayon + 1.2 - d) * 2.2); p.x += dx * f; p.z += dz * f; p.g.position.x = p.x; p.g.position.z = p.z; }  // aimantées
        if (d < rayon) { p.etat = 'vol'; p.t = 0; ramasser(p, camera); }
      } else if (p.etat === 'vol') {
        const k = Math.min(1, p.t / 0.35);
        p.g.position.y = sol + k * 1.4; p.g.scale.setScalar(1 - k * 0.5);
        if (k >= 1) { scene.remove(p.g); piecesSol.splice(i, 1); }
      }
      p.m.rotation.y += dt * (p.etat === 'vol' ? 14 : 2.6);
    }
  }
  function ramasser(p, camera) {
    const rec = p.rec, piece = rec.pieces[p.idx];
    if (piece.pris) return;
    piece.pris = true;
    rec.restant -= p.v; A.pieces += p.v;
    if (rec.restant <= 0 || rec.pieces.every(x => x.pris)) {
      A.enAttente = A.enAttente.filter(r => r !== rec);
      A.registre.push({ id: rec.id, n: rec.n, raison: rec.raison, t: Date.now(), type: 'gain' });
      if (A.registre.length > 400) A.registre = A.registre.slice(-400);
    }
    enregistrer();
    sons.sonPiece(p.v);
    // une pièce dessinée s'envole vers le compteur
    const v = p.g.position.clone().project(camera);
    ui.versBourse((v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight, tx.image);
    paquet += p.v; clearTimeout(timerPaquet);
    timerPaquet = setTimeout(() => { ui.gain(A.pieces, paquet); paquet = 0; }, 260);
  }

  return { recompense, restaurer, acheter, possede, maj, image: tx.image, enAttente: () => A.enAttente.reduce((s, r) => s + r.restant, 0) };
}
