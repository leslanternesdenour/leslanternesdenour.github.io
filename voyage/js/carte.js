// La carte du pays de Nour : une vieille carte de voyage sur parchemin (dessinée une fois à partir du vrai terrain),
// qu'on peut déplacer, agrandir, et où l'on choisit une destination pour se faire guider.
// Les motifs (rose des vents à huit branches, frise) sont des créations du jeu.
import { LIMITE, LIEUX, CHEMINS, PISTES, fbm } from './terrain.js?v=3';

const TAILLE = 1600, ECH = TAILLE / (LIMITE * 2);              // pixels par mètre sur le parchemin
const P = v => (v + LIMITE) * ECH;                           // monde → parchemin

// les catégories de lieux, avec leur symbole dans la légende
export const CATEGORIES = {
  village: { nom: 'Village', icone: '🏘️' }, marche: { nom: 'Souk', icone: '🛍️' }, eau: { nom: 'Point d\'eau', icone: '💧' },
  oasis: { nom: 'Oasis', icone: '🌴' }, camp: { nom: 'Campement', icone: '⛺' }, desert: { nom: 'Désert', icone: '🏜️' },
  montagne: { nom: 'Montagnes', icone: '⛰️' }, passage: { nom: 'Passage', icone: '🚪' }, decouverte: { nom: 'Découverte', icone: '✨' },
  pierre: { nom: 'Pierre à lire', icone: '📜' }, personne: { nom: 'Personnage', icone: '💬' }, maison: { nom: 'Chez toi', icone: '🏡' },
  ecurie: { nom: 'Écurie', icone: '🐎' }
};

function* dessinerParchemin(terrain) {   // dessin en plusieurs étapes, pour ne jamais bloquer le jeu
  const cv = document.createElement('canvas'); cv.width = cv.height = TAILLE;
  const x = cv.getContext('2d');
  // fond : papier ancien, taches et fibres
  const img = x.createImageData(TAILLE, TAILLE), D = img.data, pas = 2;
  for (let j = 0; j < TAILLE; j += pas) for (let i = 0; i < TAILLE; i += pas) {
    const wx = i / ECH - LIMITE, wz = j / ECH - LIMITE;
    const tache = fbm(wx * 0.02, wz * 0.02, 3), fibre = fbm(wx * 0.4, wz * 0.08, 2);
    const h = terrain.hauteur(wx, wz), m = terrain.matiere(wx, wz);
    let r = 236, g = 216, b = 170;
    r -= tache * 26; g -= tache * 30; b -= tache * 34; r -= fibre * 8; g -= fibre * 8; b -= fibre * 6;
    // teintes douces selon le pays : herbe un peu verte, roche plus grise, relief ombré
    r -= m.herbe * 28; g -= m.herbe * 6; b -= m.herbe * 30;
    r -= m.roche * 24; g -= m.roche * 22; b -= m.roche * 12;
    const hx = terrain.hauteur(wx + 2, wz) - h, hz = terrain.hauteur(wx, wz + 2) - h, ombre = Math.max(-1, Math.min(1, (hx + hz) * 0.35));
    r -= ombre * 26; g -= ombre * 24; b -= ombre * 20;
    for (let dj = 0; dj < pas; dj++) for (let di = 0; di < pas; di++) { const o = ((j + dj) * TAILLE + i + di) * 4; D[o] = r; D[o + 1] = g; D[o + 2] = b; D[o + 3] = 255; }
    if (i + pas >= TAILLE && j % 24 === 0) yield;
  }
  x.putImageData(img, 0, 0); yield;
  const encre = '#5a3d22';
  // les dunes : petites vagues dessinées à la plume
  x.strokeStyle = 'rgba(122,82,40,.38)'; x.lineWidth = 1.6;
  for (let n = 0; n < 420; n++) {
    const wx = -320 + ((n * 97) % 640), wz = 60 + ((n * 61) % 290);
    if (Math.hypot(wx - LIEUX.oasis.x, wz - LIEUX.oasis.z) < 60 || Math.hypot(wx - LIEUX.camp.x, wz - LIEUX.camp.z) < 50 || Math.hypot(wx, wz) < 60) continue;
    const cx = P(wx), cz = P(wz); x.beginPath(); x.moveTo(cx - 14, cz + 3); x.quadraticCurveTo(cx - 4, cz - 7, cx + 4, cz); x.quadraticCurveTo(cx + 10, cz + 5, cx + 16, cz + 1); x.stroke();
  }
  // les montagnes : petits sommets ombrés
  const sommets = [];
  for (let n = 0; n < 900; n++) { const wx = -340 + ((n * 137) % 680), wz = -350 + ((n * 53) % 210); const h = terrain.hauteur(wx, wz); if (h > 26 && Math.abs(wx - (wz < -230 ? -6 : 0)) > 22) sommets.push([wx, wz, h]); }
  sommets.sort((a, b) => a[1] - b[1]);
  for (const [wx, wz, h] of sommets) {
    const cx = P(wx), cz = P(wz), s = 8 + Math.min(14, h * 0.12);
    x.fillStyle = 'rgba(240,226,190,.95)'; x.strokeStyle = encre; x.lineWidth = 1.4;
    x.beginPath(); x.moveTo(cx - s, cz + s * 0.5); x.lineTo(cx, cz - s); x.lineTo(cx + s, cz + s * 0.5); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(90,61,34,.35)'; x.beginPath(); x.moveTo(cx, cz - s); x.lineTo(cx + s, cz + s * 0.5); x.lineTo(cx + s * 0.15, cz + s * 0.5); x.closePath(); x.fill();
  }
  // l'eau de l'oasis
  const o = LIEUX.oasis; x.fillStyle = '#7fbccb'; x.strokeStyle = '#2e6f80'; x.lineWidth = 2.5;
  x.beginPath(); x.arc(P(o.x), P(o.z), o.lac * ECH, 0, Math.PI * 2); x.fill(); x.stroke();
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(P(o.x), P(o.z), (o.lac - 4 - k * 4) * ECH, 0.3 + k, 1.4 + k); x.stroke(); }
  // palmiers de l'oasis
  for (let k = 0; k < 22; k++) { const a = k * 0.62, r = o.lac + 6 + (k % 4) * 5, cx = P(o.x + Math.cos(a) * r), cz = P(o.z + Math.sin(a) * r);
    x.strokeStyle = '#5a3d22'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cz + 7); x.lineTo(cx, cz - 3); x.stroke();
    x.strokeStyle = '#4f7a3a'; x.lineWidth = 2; for (let f = 0; f < 5; f++) { const b = f * 1.25 + 0.3; x.beginPath(); x.moveTo(cx, cz - 3); x.quadraticCurveTo(cx + Math.cos(b) * 5, cz - 8, cx + Math.cos(b) * 9, cz - 3 + Math.sin(b) * 3); x.stroke(); } }
  // les routes caravanières : pointillés à l'encre
  x.strokeStyle = 'rgba(122,62,36,.85)'; x.lineWidth = 3.2; x.setLineDash([10, 8]); x.lineCap = 'round';
  for (const c of [...CHEMINS, ...PISTES]) { x.beginPath(); c.forEach(([wx, wz], n) => n ? x.lineTo(P(wx), P(wz)) : x.moveTo(P(wx), P(wz))); x.stroke(); }
  x.setLineDash([]);
  // les maisons du village, comme de petits dessins
  for (const [a, r] of [[35, 26], [60, 28], [110, 27], [135, 25], [190, 26], [215, 29], [300, 26], [330, 28], [248, 33]]) {
    const wx = Math.cos(a * Math.PI / 180) * r, wz = Math.sin(a * Math.PI / 180) * r, cx = P(wx), cz = P(wz);
    x.fillStyle = '#f3e3c3'; x.strokeStyle = encre; x.lineWidth = 1.3; x.fillRect(cx - 7, cz - 6, 14, 12); x.strokeRect(cx - 7, cz - 6, 14, 12);
    x.fillStyle = encre; x.fillRect(cx - 2, cz, 4, 6);
  }
  // la rose des vents (motif du jeu)
  const rx = P(270), rz = P(-300);
  x.save(); x.translate(rx, rz);
  for (let k = 0; k < 8; k++) { x.rotate(Math.PI / 4); x.fillStyle = k % 2 ? '#c9a14a' : '#7a5232'; x.beginPath(); x.moveTo(0, 0); x.lineTo(7, -10); x.lineTo(0, k % 2 ? -34 : -52); x.lineTo(-7, -10); x.closePath(); x.fill(); }
  x.fillStyle = '#f3e3c3'; x.strokeStyle = encre; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 8, 0, Math.PI * 2); x.fill(); x.stroke();
  x.fillStyle = encre; x.font = 'bold 26px Georgia, serif'; x.textAlign = 'center'; x.fillText('N', 0, -60);
  x.restore();
  yield;
  // un cadre et des bords brunis, comme un vieux parchemin
  const bord = x.createRadialGradient(TAILLE / 2, TAILLE / 2, TAILLE * 0.36, TAILLE / 2, TAILLE / 2, TAILLE * 0.72);
  bord.addColorStop(0, 'rgba(90,50,20,0)'); bord.addColorStop(0.75, 'rgba(110,62,24,.28)'); bord.addColorStop(1, 'rgba(70,36,12,.75)');
  x.fillStyle = bord; x.fillRect(0, 0, TAILLE, TAILLE);
  x.strokeStyle = 'rgba(90,61,34,.75)'; x.lineWidth = 4; x.strokeRect(26, 26, TAILLE - 52, TAILLE - 52); x.lineWidth = 1.5; x.strokeRect(36, 36, TAILLE - 72, TAILLE - 72);
  for (let k = 0; k < 64; k++) { const t = k / 64; for (const [a, b] of [[t * TAILLE, 31], [t * TAILLE, TAILLE - 31], [31, t * TAILLE], [TAILLE - 31, t * TAILLE]]) { x.fillStyle = k % 2 ? '#c9a14a' : '#7a5232'; x.fillRect(a - 2, b - 2, 4, 4); } }
  x.fillStyle = '#5a3d22'; x.font = 'italic bold 40px Georgia, serif'; x.textAlign = 'center'; x.fillText('Le pays de Nour', TAILLE / 2, 92);
  return cv;
}

// Ouvre la carte. api = { lieux() → [{ id, nom, cat, x, z, connu, etat, guidable }], joueur(), monture(), route(), dest(),
//   guider(lieu), arreter(), fermer() }
export function creerCarte(terrain, api) {
  let fond = null, travail = null, toile = null;
  // on prépare le parchemin tranquillement, pendant que l'enfant joue
  function etape(budget) { const fin = performance.now() + budget; while (performance.now() < fin) { const r = travail.next(); if (r.done) { fond = r.value; return true; } } return false; }
  function preparer() {
    if (fond || travail) return;
    travail = dessinerParchemin(terrain);
    const suite = () => { if (fond) return; if (!etape(8)) setTimeout(suite, 30); };
    setTimeout(suite, 30);
  }
  function finir() { if (fond) return; if (!travail) travail = dessinerParchemin(terrain); etape(1e9); }
  const cv = document.getElementById('carte-canvas'), ctx = cv.getContext('2d');
  const vue = { x: 0, z: 0, zoom: 1.6 }; // centre (monde) et zoom (pixels écran par mètre = zoom × échelle de base)
  let choisi = null, ouverte = false, raf = 0;
  const taille = () => { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); } return { w: cv.width, h: cv.height, d }; };
  const base = () => Math.min(cv.width, cv.height) / (LIMITE * 2);       // à zoom 1 : tout le pays tient dans l'écran
  const ecran = (wx, wz) => { const k = base() * vue.zoom; return { X: cv.width / 2 + (wx - vue.x) * k, Y: cv.height / 2 + (wz - vue.z) * k }; };
  const monde = (X, Y) => { const k = base() * vue.zoom; return { x: vue.x + (X - cv.width / 2) / k, z: vue.z + (Y - cv.height / 2) / k }; };
  function borner() { const m = LIMITE * (1 - 1 / vue.zoom); vue.x = Math.max(-m, Math.min(m, vue.x)); vue.z = Math.max(-m, Math.min(m, vue.z)); }

  function dessiner(t) {
    const { w, h, d } = taille(), k = base() * vue.zoom;
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, w, h);
    const o = ecran(-LIMITE, -LIMITE);
    ctx.drawImage(fond, o.X, o.Y, LIMITE * 2 * k, LIMITE * 2 * k);
    const L = api.lieux();
    // les régions inconnues sont voilées
    for (const l of L) if (l.region && !l.connu) {
      const c = ecran(l.x, l.z), r = l.region * k;
      const g = ctx.createRadialGradient(c.X, c.Y, r * 0.2, c.X, c.Y, r);
      g.addColorStop(0, 'rgba(226,206,160,.92)'); g.addColorStop(1, 'rgba(226,206,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.X, c.Y, r, 0, Math.PI * 2); ctx.fill();
    }
    // les grandes routes (La Mecque) : un trait doré par-dessus le parchemin, y compris sur son bord bruni
    for (const l of L) if (l.trace) {
      ctx.setLineDash([]); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [couleur, largeur] of [['#5a3d22', 9], ['#f5b942', 5.5]]) {
        ctx.strokeStyle = couleur; ctx.lineWidth = largeur * d;
        ctx.beginPath(); l.trace.forEach(([wx, wz], n) => { const c = ecran(wx, wz); n ? ctx.lineTo(c.X, c.Y) : ctx.moveTo(c.X, c.Y); }); ctx.stroke();
      }
    }
    // le chemin du guidage
    const route = api.route();
    if (route && route.length > 1) {
      ctx.strokeStyle = 'rgba(201,79,60,.9)'; ctx.lineWidth = 5 * d; ctx.setLineDash([12 * d, 9 * d]); ctx.lineDashOffset = -t * 0.03 * d; ctx.lineCap = 'round';
      ctx.beginPath(); route.forEach((p, n) => { const c = ecran(p.x, p.z); n ? ctx.lineTo(c.X, c.Y) : ctx.moveTo(c.X, c.Y); }); ctx.stroke(); ctx.setLineDash([]);
    }
    // les lieux
    const zoomMin = { pierre: 1.3, personne: 1.5, eau: 1.4, maison: 1.2, ecurie: 1.2, marche: 1.1 };
    for (const l of L) {
      if (zoomMin[l.cat] && vue.zoom < zoomMin[l.cat] && l !== choisi) continue;
      const c = ecran(l.x, l.z), R = (l.grand ? 22 : 17) * d, sel = choisi && choisi.id === l.id, dest = api.dest() && api.dest().id === l.id;
      ctx.save(); ctx.translate(c.X, c.Y);
      ctx.fillStyle = l.connu ? '#fff8e7' : '#e8dcc0'; ctx.strokeStyle = sel ? '#c94f3c' : dest ? '#f5b942' : '#7a5232'; ctx.lineWidth = (sel || dest ? 4 : 2.2) * d;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = `${(l.grand ? 24 : 18) * d}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (l.connu) ctx.fillText(l.icone || CATEGORIES[l.cat].icone, 0, 1 * d);
      else { ctx.fillStyle = '#7a5232'; ctx.font = `bold ${20 * d}px Georgia, serif`; ctx.fillText('?', 0, 1 * d); }
      if (l.verrou) { ctx.font = `${13 * d}px sans-serif`; ctx.fillText('🔒', R * 0.75, -R * 0.75); }
      if (l.fait) { ctx.font = `${12 * d}px sans-serif`; ctx.fillText('✅', R * 0.75, -R * 0.75); }
      if (l.grand || vue.zoom > 3.4 || sel || dest) {
        ctx.font = `italic bold ${(l.grand ? 16 : 13) * d}px Georgia, serif`; ctx.lineWidth = 4 * d; ctx.strokeStyle = 'rgba(243,227,195,.9)'; ctx.fillStyle = '#4a2e16';
        const txt = l.connu ? l.nom : 'Lieu inconnu';
        // au bout d'une grande route (tout au bord du parchemin), le nom se décale pour rester entier à l'écran
        const dx = l.trace && c.X <= w ? Math.min(0, w - 4 * d - c.X - ctx.measureText(txt).width / 2) : 0;
        ctx.strokeText(txt, dx, R + 13 * d); ctx.fillText(txt, dx, R + 13 * d);
      }
      ctx.restore();
    }
    // la destination : un petit drapeau
    const de = api.dest();
    if (de) { const c = ecran(de.x, de.z); ctx.save(); ctx.translate(c.X, c.Y - 22 * d); ctx.strokeStyle = '#5a3d22'; ctx.lineWidth = 2.5 * d; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -30 * d); ctx.stroke();
      ctx.fillStyle = '#c94f3c'; ctx.beginPath(); ctx.moveTo(0, -30 * d); ctx.lineTo(18 * d, -24 * d + Math.sin(t / 200) * 2 * d); ctx.lineTo(0, -18 * d); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // la monture et l'enfant
    const m = api.monture();
    if (m && !m.avecToi) { const c = ecran(m.x, m.z); ctx.font = `${20 * d}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.icone, c.X, c.Y); }
    const j = api.joueur(), c = ecran(j.x, j.z), pulse = 1 + Math.sin(t / 250) * 0.15;
    ctx.fillStyle = 'rgba(43,179,192,.25)'; ctx.beginPath(); ctx.arc(c.X, c.Y, 24 * d * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.translate(c.X, c.Y); ctx.rotate(-j.a + Math.PI);
    ctx.fillStyle = '#2bb3c0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3 * d;
    ctx.beginPath(); ctx.moveTo(0, -15 * d); ctx.lineTo(11 * d, 12 * d); ctx.lineTo(0, 6 * d); ctx.lineTo(-11 * d, 12 * d); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
  }
  const boucle = t => { if (!ouverte) return; dessiner(t); raf = requestAnimationFrame(boucle); };

  // ---------- toucher : déplacer, pincer, choisir ----------
  const doigts = new Map(); let glisse = 0, pince = null;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); doigts.set(e.pointerId, { x: e.clientX, y: e.clientY }); glisse = 0;
    if (doigts.size === 2) { const [a, b] = [...doigts.values()]; pince = { d: Math.hypot(a.x - b.x, a.y - b.y), z: vue.zoom }; } });
  cv.addEventListener('pointermove', e => {
    const p = doigts.get(e.pointerId); if (!p) return;
    const d = devicePixelRatio > 1 ? Math.min(2, devicePixelRatio) : 1, k = base() * vue.zoom;
    if (doigts.size === 2 && pince) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...doigts.values()]; vue.zoom = Math.max(1, Math.min(6, pince.z * Math.hypot(a.x - b.x, a.y - b.y) / pince.d)); borner(); glisse = 99; return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; glisse += Math.abs(dx) + Math.abs(dy);
    vue.x -= dx * d / k; vue.z -= dy * d / k; borner(); p.x = e.clientX; p.y = e.clientY;
  });
  const fin = e => {
    const p = doigts.get(e.pointerId); doigts.delete(e.pointerId); if (doigts.size < 2) pince = null;
    if (p && glisse < 8 && e.type === 'pointerup') {      // un simple toucher : on choisit le lieu le plus proche
      const r = cv.getBoundingClientRect(), d = cv.width / r.width, w = monde((e.clientX - r.left) * d, (e.clientY - r.top) * d), k = base() * vue.zoom;
      let best = null, bd = 30 * d / k;
      for (const l of api.lieux()) { const dd = Math.hypot(l.x - w.x, l.z - w.z); if (dd < bd) { bd = dd; best = l; } }
      choisir(best);
    }
  };
  cv.addEventListener('pointerup', fin); cv.addEventListener('pointercancel', fin);
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(), d = cv.width / r.width, avant = monde((e.clientX - r.left) * d, (e.clientY - r.top) * d);
    vue.zoom = Math.max(1, Math.min(6, vue.zoom * Math.exp(-e.deltaY * 0.0015))); const apres = monde((e.clientX - r.left) * d, (e.clientY - r.top) * d);
    vue.x += avant.x - apres.x; vue.z += avant.z - apres.z; borner(); }, { passive: false });
  const $ = id => document.getElementById(id);
  $('carte-plus').onclick = () => { vue.zoom = Math.min(6, vue.zoom * 1.4); borner(); };
  $('carte-moins').onclick = () => { vue.zoom = Math.max(1, vue.zoom / 1.4); borner(); };
  $('carte-moi').onclick = () => { const j = api.joueur(); vue.x = j.x; vue.z = j.z; vue.zoom = Math.max(vue.zoom, 2.2); borner(); };
  $('carte-legende-btn').onclick = () => $('carte-legende').classList.toggle('cache');
  $('carte-legende').innerHTML = `<b>Légende</b><ul>${Object.values(CATEGORIES).map(c => `<li><span>${c.icone}</span>${c.nom}</li>`).join('')}
    <li><span class="leg-moi"></span>Toi</li><li><span>❔</span>Lieu encore inconnu</li><li><span class="leg-route"></span>Ton chemin</li><li><span class="leg-pointilles"></span>Route caravanière</li><li><span>🔒</span>Encore fermé</li></ul>`;

  function choisir(l) {
    choisi = l; const f = $('carte-fiche');
    if (!l) { f.classList.add('cache'); return; }
    const j = api.joueur(), dist = Math.round(Math.hypot(l.x - j.x, l.z - j.z)), cat = CATEGORIES[l.cat];
    const estDest = api.dest() && api.dest().id === l.id;
    f.innerHTML = `<div class="fiche-tete"><span>${l.connu ? (l.icone || cat.icone) : '❔'}</span><div><b>${l.connu ? l.nom : 'Un lieu encore inconnu'}</b><small>${cat.nom}${l.fait ? ' · déjà vu ✓' : ''} · à ${dist} m</small></div><button class="fermer-fiche" aria-label="Fermer">✕</button></div>
      ${l.texte ? `<p>${l.texte}</p>` : ''}${l.verrou ? `<p class="verrou">🔒 ${l.verrou}</p>` : ''}
      <div class="fiche-boutons">${estDest ? '<button class="petit-bouton" data-arreter>Arrêter le guidage</button>' : l.guidable !== false && !l.verrou ? '<button class="gros-bouton" data-guider>🧭 Me guider</button>' : ''}${l.trace && api.voirRoute ? '<button class="petit-bouton" data-voir-route>🗺️ Voir toute la route</button>' : ''}</div>`;
    f.classList.remove('cache');
    f.querySelector('.fermer-fiche').onclick = () => choisir(null);
    const gb = f.querySelector('[data-guider]'); if (gb) gb.onclick = () => { const ok = api.guider(l); if (ok) { choisir(null); api.fermer(); } };
    const ab = f.querySelector('[data-arreter]'); if (ab) ab.onclick = () => { api.arreter(); choisir(l); };
    const vr = f.querySelector('[data-voir-route]'); if (vr) vr.onclick = () => api.voirRoute();
  }

  return {
    ouvrir(lieuId) {
      finir();
      ouverte = true;
      const j = api.joueur(), de = api.dest();
      const cible = lieuId ? api.lieux().find(l => l.id === lieuId) : null;
      if (cible) { vue.x = cible.x; vue.z = cible.z; vue.zoom = 2.2; } else if (de) { vue.x = (j.x + de.x) / 2; vue.z = (j.z + de.z) / 2; vue.zoom = Math.max(1, Math.min(3, LIMITE * 1.4 / Math.max(60, Math.hypot(de.x - j.x, de.z - j.z)))); }
      else { vue.x = j.x; vue.z = j.z; vue.zoom = 1.8; }
      borner(); choisir(cible || null);
      cancelAnimationFrame(raf); raf = requestAnimationFrame(boucle);
    },
    fermer() { ouverte = false; cancelAnimationFrame(raf); choisi = null; $('carte-fiche').classList.add('cache'); },
    get ouverte() { return ouverte; }, vue, choisir, preparer
  };
}
