// Les illustrations des découvertes, peintes dans le navigateur dans un même style « livre d'images » :
// ciel doux, sol de sable, formes rondes cernées d'un trait brun chaud. Rien n'est téléchargé.
// Les motifs (étoile à huit branches, frises) sont des créations du jeu.

const L = 480, Hh = 360, TRAIT = '#5a3d22';
const cache = new Map();

function toile() { const c = document.createElement('canvas'); c.width = L; c.height = Hh; return [c, c.getContext('2d')]; }
function lin(x, y0, y1, arr) { const g = x.createLinearGradient(0, y0, 0, y1); arr.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function contour(x, l = 4) { x.lineWidth = l; x.strokeStyle = TRAIT; x.lineJoin = 'round'; x.lineCap = 'round'; x.stroke(); }
function forme(x, couleur, chemin, l = 4) { x.beginPath(); chemin(); x.fillStyle = couleur; x.fill(); contour(x, l); }

// ---------- les fonds ----------
function ciel(x, moment = 'jour') {
  const c = moment === 'nuit' ? [[0, '#1f2160'], [0.7, '#4a3f8a'], [1, '#8a6aa0']] : moment === 'soir' ? [[0, '#6fa8d8'], [0.6, '#f3c58a'], [1, '#f7a46a']] : [[0, '#7cc4ec'], [0.7, '#cfeaf2'], [1, '#fbecc8']];
  x.fillStyle = lin(x, 0, Hh * 0.75, c); x.fillRect(0, 0, L, Hh);
  if (moment !== 'nuit') { x.fillStyle = 'rgba(255,255,255,.75)'; for (const [cx, cy, s] of [[90, 70, 1], [370, 50, 0.8]]) { x.beginPath(); x.ellipse(cx, cy, 44 * s, 16 * s, 0, 0, 7); x.ellipse(cx + 26 * s, cy - 10 * s, 26 * s, 16 * s, 0, 0, 7); x.ellipse(cx - 24 * s, cy - 6 * s, 20 * s, 13 * s, 0, 0, 7); x.fill(); } }
  else { x.fillStyle = '#fff6d8'; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc((i * 97) % L, (i * 53) % 200, 1 + (i % 3) * 0.6, 0, 7); x.fill(); } }
}
function sable(x, y = 270, couleur = '#ecc98c', couleur2 = '#d9ad6a') {
  x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(120, y - 26, 260, y + 18, L, y - 12); x.lineTo(L, Hh); x.lineTo(0, Hh); x.closePath();
  x.fillStyle = lin(x, y - 20, Hh, [[0, couleur], [1, couleur2]]); x.fill();
  x.strokeStyle = 'rgba(160,110,60,.35)'; x.lineWidth = 2.5;
  for (let k = 0; k < 4; k++) { x.beginPath(); const yy = y + 28 + k * 18; x.moveTo(30 + k * 60, yy); x.quadraticCurveTo(80 + k * 60, yy - 8, 130 + k * 60, yy); x.stroke(); }
}
function dunes(x, y = 250) { forme(x, '#e3b877', () => { x.moveTo(0, y + 20); x.quadraticCurveTo(110, y - 50, 230, y + 10); x.quadraticCurveTo(330, y - 40, L, y + 6); x.lineTo(L, y + 60); x.lineTo(0, y + 60); x.closePath(); }, 3); }
function soleil(x, cx = 400, cy = 70, r = 30) { x.fillStyle = 'rgba(255,214,110,.35)'; x.beginPath(); x.arc(cx, cy, r * 1.7, 0, 7); x.fill(); x.fillStyle = '#ffd56a'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); }

// ---------- les sujets ----------
function palmier(x, cx, base, s = 1, dattes = true) {
  forme(x, '#9a6a42', () => { x.moveTo(cx - 9 * s, base); x.quadraticCurveTo(cx + 6 * s, base - 90 * s, cx + 12 * s, base - 170 * s); x.lineTo(cx + 24 * s, base - 170 * s); x.quadraticCurveTo(cx + 20 * s, base - 90 * s, cx + 11 * s, base); x.closePath(); });
  x.strokeStyle = 'rgba(90,61,34,.55)'; x.lineWidth = 2.5; for (let k = 1; k < 9; k++) { const t = k / 9, yy = base - 170 * s * t, xx = cx + 1 + 16 * s * t; x.beginPath(); x.moveTo(xx - 9 * s, yy + 4); x.lineTo(xx + 9 * s, yy - 2); x.stroke(); }
  const hx = cx + 18 * s, hy = base - 172 * s;
  // les palmes : longues, retombantes, avec leur nervure et de petites folioles
  for (const [a, l] of [[-2.9, 150], [-2.45, 160], [-1.95, 120], [-1.55, 95], [-1.15, 125], [-0.7, 160], [-0.25, 150], [0.15, 120], [-3.35, 120]]) {
    const ex = hx + Math.cos(a) * l * s, ey = hy + Math.sin(a) * l * s * 0.55 + 70 * s * Math.abs(Math.cos(a)), mx = (hx + ex) / 2, my = hy + Math.sin(a) * l * s * 0.5 - 30 * s;
    forme(x, '#4f9a45', () => { x.moveTo(hx, hy); x.quadraticCurveTo(mx, my - 16 * s, ex, ey); x.quadraticCurveTo(mx, my + 14 * s, hx, hy); }, 3);
    x.strokeStyle = '#3a7232'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(hx, hy); x.quadraticCurveTo(mx, my, ex, ey); x.stroke();
    x.strokeStyle = '#6fb85a'; x.lineWidth = 1.6;
    for (let k = 1; k < 7; k++) { const t = k / 7, px = (1 - t) * (1 - t) * hx + 2 * (1 - t) * t * mx + t * t * ex, py = (1 - t) * (1 - t) * hy + 2 * (1 - t) * t * my + t * t * ey;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a + 0.9) * 12 * s, py + Math.sin(a + 0.9) * 12 * s + 6 * s); x.stroke(); }
  }
  // les grappes de dattes, qui pendent sous les palmes
  if (dattes) for (const dx of [-16, 14]) {
    x.strokeStyle = '#d9a040'; x.lineWidth = 3; x.beginPath(); x.moveTo(hx + dx * 0.3 * s, hy + 4 * s); x.quadraticCurveTo(hx + dx * s, hy + 10 * s, hx + dx * 1.2 * s, hy + 26 * s); x.stroke();
    for (let k = 0; k < 11; k++) { x.fillStyle = k % 3 ? '#b5592a' : '#8a3e24'; x.beginPath(); x.ellipse(hx + dx * 1.2 * s + (k % 3 - 1) * 7 * s, hy + 26 * s + Math.floor(k / 3) * 8 * s, 4.5 * s, 6 * s, 0, 0, 7); x.fill(); }
  }
  x.fillStyle = '#7a5636'; x.beginPath(); x.arc(hx, hy, 9 * s, 0, 7); x.fill();
}
function etoile8(x, cx, cy, r, c1 = '#ffd36b', c2 = '#f5b942') {
  x.save(); x.translate(cx, cy);
  for (const [k, c] of [[0, c2], [1, c1]]) { x.save(); x.rotate(k * Math.PI / 4); forme(x, c, () => x.rect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4), 3); x.restore(); }
  x.fillStyle = '#fff7da'; x.beginPath(); x.arc(0, 0, r * 0.32, 0, 7); x.fill(); x.restore();
}
function chameau(x, cx, base, s = 1, robe = '#d6a868') {
  const P = (px, py) => [cx + px * s, base - py * s];
  // pattes
  for (const px of [-58, -40, 34, 52]) forme(x, robe, () => { const [a, b] = P(px, 70); x.moveTo(a - 6 * s, b); x.lineTo(a - 5 * s, base); x.lineTo(a + 6 * s, base); x.lineTo(a + 7 * s, b); x.closePath(); }, 3);
  forme(x, robe, () => { const [a, b] = P(0, 100); x.ellipse(a, b, 82 * s, 38 * s, 0, 0, 7); });          // corps
  forme(x, '#c48f52', () => { const [a, b] = P(-4, 130); x.ellipse(a, b, 36 * s, 34 * s, 0, Math.PI, 0); });   // bosse
  forme(x, robe, () => { const [a, b] = P(70, 110); x.moveTo(a, b); x.quadraticCurveTo(a + 40 * s, b - 20 * s, a + 36 * s, b - 80 * s); x.lineTo(a + 52 * s, b - 82 * s); x.quadraticCurveTo(a + 58 * s, b - 20 * s, a + 18 * s, b + 22 * s); x.closePath(); });   // cou
  forme(x, robe, () => { const [a, b] = P(118, 190); x.ellipse(a, b, 26 * s, 15 * s, 0.2, 0, 7); });         // tête
  x.fillStyle = TRAIT; const [ex, ey] = P(118, 194); x.beginPath(); x.arc(ex, ey, 3.5 * s, 0, 7); x.fill();
  forme(x, '#c94f3c', () => { const [a, b] = P(-4, 140); x.rect(a - 30 * s, b, 60 * s, 18 * s); }, 3);   // petit tapis
  forme(x, '#2bb3c0', () => { const [a, b] = P(-4, 122); x.rect(a - 32 * s, b, 64 * s, 6 * s); }, 2);
}
function tente(x, cx, base, s = 1, c1 = '#c94f3c', c2 = '#f3e3c3') {
  forme(x, c1, () => { x.moveTo(cx - 110 * s, base); x.lineTo(cx - 70 * s, base - 90 * s); x.lineTo(cx + 70 * s, base - 90 * s); x.lineTo(cx + 110 * s, base); x.closePath(); });
  for (let k = 0; k < 5; k++) { x.fillStyle = c2; x.beginPath(); const x0 = cx - 86 * s + k * 38 * s; x.moveTo(x0, base - 6); x.lineTo(x0 + 18 * s, base - 84 * s); x.lineTo(x0 + 28 * s, base - 84 * s); x.lineTo(x0 + 14 * s, base - 6); x.closePath(); x.fill(); }
  forme(x, '#3a2a1a', () => { x.moveTo(cx - 22 * s, base); x.lineTo(cx - 14 * s, base - 50 * s); x.lineTo(cx + 14 * s, base - 50 * s); x.lineTo(cx + 22 * s, base); x.closePath(); }, 3);
  x.strokeStyle = TRAIT; x.lineWidth = 2; for (const sx of [-1, 1]) { x.beginPath(); x.moveTo(cx + sx * 70 * s, base - 90 * s); x.lineTo(cx + sx * 150 * s, base); x.stroke(); }
}
function maison(x, cx, base, w, h, mur = '#f3dcb4') {
  forme(x, mur, () => x.rect(cx - w / 2, base - h, w, h));
  forme(x, '#efe0bf', () => x.rect(cx - w / 2 - 6, base - h - 10, w + 12, 12), 3);
  forme(x, '#7b4f2e', () => { x.moveTo(cx - 14, base); x.lineTo(cx - 14, base - 38); x.arc(cx, base - 38, 14, Math.PI, 0); x.lineTo(cx + 14, base); x.closePath(); }, 3);
  for (const sx of [-1, 1]) forme(x, '#2d5b8a', () => x.rect(cx + sx * w * 0.3 - 9, base - h * 0.7, 18, 20), 3);
}
function jarre(x, cx, base, s = 1, c = '#c48452') {
  forme(x, c, () => { x.moveTo(cx - 14 * s, base - 96 * s); x.quadraticCurveTo(cx - 60 * s, base - 70 * s, cx - 30 * s, base); x.lineTo(cx + 30 * s, base); x.quadraticCurveTo(cx + 60 * s, base - 70 * s, cx + 14 * s, base - 96 * s); x.closePath(); });
  forme(x, '#a8582c', () => x.rect(cx - 18 * s, base - 108 * s, 36 * s, 14 * s), 3);
  x.strokeStyle = '#2bb3c0'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx - 40 * s, base - 55 * s); x.quadraticCurveTo(cx, base - 45 * s, cx + 40 * s, base - 55 * s); x.stroke();
}
function eau(x, y = 250) {
  forme(x, '#5fb8cf', () => { x.ellipse(L / 2, y + 34, 200, 52, 0, 0, 7); });
  x.strokeStyle = 'rgba(255,255,255,.75)'; x.lineWidth = 3;
  for (const [cx, cy, r] of [[180, 270, 40], [300, 290, 54], [240, 300, 26]]) { x.beginPath(); x.ellipse(cx, cy, r, r * 0.25, 0, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
}
function roseau(x, cx, base, h) { x.strokeStyle = '#6f8f3a'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, base); x.quadraticCurveTo(cx + 6, base - h * 0.6, cx + 10, base - h); x.stroke(); x.fillStyle = '#8a5a35'; x.beginPath(); x.ellipse(cx + 10, base - h - 8, 5, 13, 0.15, 0, 7); x.fill(); }
function rocher(x, cx, base, w, h, c = '#a8926f') { forme(x, c, () => { x.moveTo(cx - w / 2, base); x.quadraticCurveTo(cx - w / 2, base - h, cx - w * 0.1, base - h); x.quadraticCurveTo(cx + w / 2, base - h * 1.05, cx + w / 2, base); x.closePath(); }); }
function montagnes(x) {
  forme(x, '#b79a86', () => { x.moveTo(0, 230); x.lineTo(90, 110); x.lineTo(150, 170); x.lineTo(240, 70); x.lineTo(340, 180); x.lineTo(410, 120); x.lineTo(L, 200); x.lineTo(L, 280); x.lineTo(0, 280); x.closePath(); });
  x.fillStyle = 'rgba(90,61,34,.25)'; x.beginPath(); x.moveTo(240, 70); x.lineTo(340, 180); x.lineTo(270, 280); x.closePath(); x.fill();
  forme(x, '#94705c', () => { x.moveTo(0, 270); x.lineTo(60, 190); x.lineTo(130, 250); x.lineTo(200, 180); x.lineTo(300, 260); x.lineTo(L, 230); x.lineTo(L, 300); x.lineTo(0, 300); x.closePath(); });
}
function gravure(x, sorte) {
  x.fillStyle = lin(x, 0, Hh, [[0, '#d78a5e'], [1, '#a95a38']]); x.fillRect(0, 0, L, Hh);
  x.fillStyle = 'rgba(90,40,20,.18)'; for (let i = 0; i < 260; i++) { x.beginPath(); x.arc((i * 131) % L, (i * 71) % Hh, 1 + (i % 4), 0, 7); x.fill(); }
  x.fillStyle = 'rgba(250,228,196,.95)';
  const trait = pts => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, d] = pts[i + 1], Ln = Math.hypot(c - a, d - b); for (let k = 0; k <= Ln; k += 6) { const t = k / Ln; x.beginPath(); x.arc(a + (c - a) * t + ((k * 7) % 5 - 2), b + (d - b) * t + ((k * 3) % 5 - 2), 5, 0, 7); x.fill(); } } };
  const S = (pts) => trait(pts.map(([a, b]) => [a * 1.8 + 10, b * 1.8 - 20]));
  if (sorte === 'chameau') { S([[40, 120], [70, 80], [110, 60], [140, 80], [170, 80], [190, 50], [205, 40], [215, 50]]); S([[70, 80], [70, 150]]); S([[95, 85], [95, 150]]); S([[150, 85], [150, 150]]); S([[170, 85], [172, 150]]); S([[40, 120], [55, 100]]); }
  else if (sorte === 'bouquetin') { S([[60, 100], [180, 100], [195, 80]]); S([[195, 80], [185, 40], [160, 25], [135, 35]]); S([[200, 80], [205, 70]]); for (const xx of [75, 100, 160, 175]) S([[xx, 100], [xx, 150]]); S([[60, 100], [50, 90]]); }
  else if (sorte === 'autruche') { S([[90, 110], [120, 85], [160, 90], [175, 110], [150, 125], [110, 125], [90, 110]]); S([[160, 90], [175, 50], [180, 25], [192, 25]]); S([[125, 125], [120, 170]]); S([[140, 125], [150, 170]]); }
  else { for (const ox of [0, 110]) { S([[20 + ox, 110], [90 + ox, 110], [100 + ox, 95], [108 + ox, 92]]); S([[20 + ox, 110], [10 + ox, 95], [18 + ox, 85], [26 + ox, 92]]); for (const xx of [30, 45, 75, 88]) S([[xx + ox, 110], [xx + ox, 145]]); } }
}

// ---------- le catalogue des illustrations ----------
const DESSINS = {
  // les mots arabes
  bir: x => { ciel(x); sable(x, 250); forme(x, '#c9b48e', () => x.ellipse(240, 270, 110, 34, 0, 0, 7)); forme(x, '#c9b48e', () => x.rect(130, 200, 220, 70)); forme(x, '#1d3a44', () => x.ellipse(240, 200, 108, 26, 0, 0, 7), 3);
    for (const sx of [-1, 1]) forme(x, '#6b4a30', () => x.rect(240 + sx * 100 - 8, 80, 16, 125)); forme(x, '#6b4a30', () => x.rect(130, 72, 220, 14)); forme(x, '#8a6440', () => x.arc(240, 100, 16, 0, 7), 3);
    x.strokeStyle = '#d9c79e'; x.lineWidth = 3; x.beginPath(); x.moveTo(246, 100); x.lineTo(246, 160); x.stroke(); forme(x, '#7a5232', () => x.rect(230, 158, 32, 30), 3); },
  jamal: x => { ciel(x); soleil(x); dunes(x, 230); sable(x, 280); chameau(x, 210, 310, 1.05); },
  souq: x => { ciel(x); sable(x, 280); for (const [cx, c] of [[130, '#c94f3c'], [350, '#2bb3c0']]) { forme(x, '#8a6440', () => { x.rect(cx - 90, 120, 10, 170); x.rect(cx + 80, 120, 10, 170); }); forme(x, c, () => { x.moveTo(cx - 100, 120); x.lineTo(cx + 100, 120); x.lineTo(cx + 90, 160); x.lineTo(cx - 90, 160); x.closePath(); }); forme(x, '#a77a4e', () => x.rect(cx - 90, 230, 180, 26)); }
    jarre(x, 100, 232, 0.45); jarre(x, 150, 232, 0.38, '#b9652f'); for (let k = 0; k < 4; k++) forme(x, ['#f5b942', '#c94f3c', '#7b4fa0', '#3fbf7f'][k], () => x.rect(300 + k * 26, 200, 22, 30), 3); },
  nakhla: x => { ciel(x); soleil(x, 90, 70); sable(x, 290); palmier(x, 220, 320, 1.15); },
  tamr: x => { ciel(x); forme(x, '#c9a26a', () => { x.ellipse(240, 250, 150, 50, 0, 0, Math.PI); x.lineTo(90, 250); x.closePath(); }); x.strokeStyle = '#8a6440'; x.lineWidth = 3; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(110 + k * 42, 252); x.lineTo(130 + k * 30, 296); x.stroke(); }
    for (let k = 0; k < 22; k++) forme(x, ['#8a3e24', '#a8582c', '#7a3420'][k % 3], () => x.ellipse(120 + (k % 8) * 34 + (k > 7 ? 16 : 0), 240 - Math.floor(k / 8) * 22, 16, 22, 0.4 * (k % 2 ? 1 : -1), 0, 7), 2.5); },
  maa: x => { ciel(x); sable(x, 240); eau(x, 240); forme(x, '#5fb8cf', () => { x.moveTo(240, 50); x.bezierCurveTo(300, 140, 290, 200, 240, 200); x.bezierCurveTo(190, 200, 180, 140, 240, 50); }); x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.ellipse(222, 160, 10, 20, -0.3, 0, 7); x.fill(); },
  khayma: x => { ciel(x, 'soir'); soleil(x, 380, 120, 34); sable(x, 280, '#e8bf86', '#cf9f60'); tente(x, 230, 300, 1.15); },
  najma: x => { ciel(x, 'nuit'); dunes(x, 260); x.fillStyle = '#c9a26a'; x.fillRect(0, 300, L, 60); etoile8(x, 240, 130, 70); x.fillStyle = 'rgba(255,230,150,.25)'; x.beginPath(); x.arc(240, 130, 110, 0, 7); x.fill(); },
  // les plantes
  palmier: x => DESSINS.nakhla(x),
  acacia: x => { ciel(x); sable(x, 290); forme(x, '#6b4a30', () => { x.moveTo(228, 310); x.lineTo(236, 180); x.lineTo(200, 130); x.lineTo(212, 126); x.lineTo(246, 168); x.lineTo(290, 120); x.lineTo(298, 128); x.lineTo(252, 190); x.lineTo(252, 310); x.closePath(); });
    forme(x, '#6f8f3a', () => x.ellipse(240, 110, 170, 40, 0, 0, 7)); forme(x, '#7f9f48', () => x.ellipse(240, 90, 130, 30, 0, 0, 7)); chameau(x, 380, 330, 0.45); },
  arak: x => { ciel(x); sable(x, 290); for (const [cx, cy, r] of [[180, 230, 60], [260, 210, 72], [330, 240, 54], [230, 250, 50]]) forme(x, ['#5f8a46', '#6f9a50'][Math.round(cx) % 2], () => x.arc(cx, cy, r, 0, 7));
    for (let k = 0; k < 3; k++) forme(x, '#e9d8b8', () => x.rect(120 + k * 18, 300 - k * 4, 70, 9), 2.5); },
  roseaux: x => { ciel(x); sable(x, 230); eau(x, 236); for (let k = 0; k < 14; k++) roseau(x, 110 + k * 20, 300 - (k % 3) * 6, 120 + (k % 4) * 20); },
  // les découvertes du wadi
  ghadir: x => { ciel(x); sable(x, 220, '#d9c08e', '#bfa06a'); eau(x, 240); for (const cx of [90, 400]) roseau(x, cx, 270, 90); },
  traces: x => { ciel(x); x.fillStyle = lin(x, 120, Hh, [[0, '#d2b07a'], [1, '#b9945e']]); x.fillRect(0, 120, L, Hh);
    for (let k = 0; k < 6; k++) { const cx = 80 + k * 64, cy = 300 - k * 30; x.fillStyle = '#8a6440'; for (const [dx, dy, r] of [[0, 0, 14], [-14, -18, 6], [-4, -24, 6], [8, -22, 6]]) { x.beginPath(); x.ellipse(cx + dx, cy + dy, r, r * 1.3, 0, 0, 7); x.fill(); } } },
  galets: x => { ciel(x); x.fillStyle = '#c9b38e'; x.fillRect(0, 160, L, 200); for (let k = 0; k < 26; k++) forme(x, ['#a89a86', '#8f8478', '#c2b49a', '#9a8e7e'][k % 4], () => x.ellipse(40 + (k * 83) % 420, 190 + (k * 47) % 150, 22 + (k % 3) * 8, 15 + (k % 2) * 5, (k % 5) * 0.3, 0, 7), 3); },
  'g-chameau': x => gravure(x, 'chameau'), 'g-bouquetin': x => gravure(x, 'bouquetin'), 'g-autruche': x => gravure(x, 'autruche'), 'g-chiens': x => gravure(x, 'chiens'),
  // les lieux
  village: x => { ciel(x); sable(x, 280, '#e9d8b4', '#d8c09a'); maison(x, 120, 290, 120, 90); maison(x, 360, 290, 130, 100, '#efcfa0'); palmier(x, 230, 300, 0.75); },
  marche: x => DESSINS.souq(x),
  oasis: x => { ciel(x); sable(x, 230); eau(x, 236); palmier(x, 80, 300, 0.8); palmier(x, 360, 300, 0.9); },
  camp: x => DESSINS.khayma(x),
  dunes: x => { ciel(x); soleil(x); dunes(x, 200); dunes(x, 250); sable(x, 300); chameau(x, 360, 300, 0.4); },
  montagnes: x => { ciel(x); soleil(x, 400, 60, 26); montagnes(x); sable(x, 300, '#cdb08a', '#b39468'); },
  wadi: x => { ciel(x); x.fillStyle = '#93bd5f'; x.fillRect(0, 230, L, 130); forme(x, '#a89a86', () => { x.moveTo(0, 300); x.bezierCurveTo(160, 250, 300, 340, L, 280); x.lineTo(L, 320); x.bezierCurveTo(300, 370, 160, 290, 0, 340); x.closePath(); });
    for (let k = 0; k < 30; k++) { x.fillStyle = ['#f5d35a', '#f2f0e8', '#d98ac9', '#f39a5a'][k % 4]; x.beginPath(); x.arc((k * 67) % L, 240 + (k * 37) % 50, 5, 0, 7); x.fill(); } },
  rochers: x => { ciel(x); sable(x, 270, '#e0b88a', '#c99a6a'); rocher(x, 150, 300, 200, 150, '#c27a52'); rocher(x, 350, 300, 170, 120, '#b46a46'); x.fillStyle = 'rgba(250,228,196,.9)'; for (let k = 0; k < 12; k++) { x.beginPath(); x.arc(110 + k * 7, 220 - Math.sin(k / 2) * 14, 3, 0, 7); x.fill(); } }
};

// Renvoie l'image (URL) d'une illustration, dessinée une seule fois.
export function illustration(cle) {
  if (!DESSINS[cle]) return '';
  if (cache.has(cle)) return cache.get(cle);
  const [c, x] = toile(); DESSINS[cle](x);
  const url = c.toDataURL('image/png'); cache.set(cle, url); return url;
}
export const aIllustration = cle => !!DESSINS[cle];

// L'icône des mots arabes : un livre ouvert, avec la lettre noûn (ن) en or — un clin d'œil à Nour.
export const ICONE_MOTS = `<svg viewBox="0 0 64 64" aria-hidden="true" class="icone-mots"><path d="M6 14c9-3 18-2 26 4v36c-8-6-17-7-26-4z" fill="#fff3d6" stroke="#5a3d22" stroke-width="3" stroke-linejoin="round"/><path d="M58 14c-9-3-18-2-26 4v36c8-6 17-7 26-4z" fill="#fff8e7" stroke="#5a3d22" stroke-width="3" stroke-linejoin="round"/><path d="M6 14v36M58 14v36" stroke="#2bb3c0" stroke-width="3"/><path d="M38 34c0 6 4 9 8 9s8-3 8-9" fill="none" stroke="#c8901c" stroke-width="3.4" stroke-linecap="round"/><circle cx="46" cy="27" r="2.6" fill="#c8901c"/><path d="M12 24h12M12 30h12M12 36h9" stroke="#b39468" stroke-width="2.2" stroke-linecap="round"/></svg>`;
export const ICONE_SON = `<svg viewBox="0 0 24 24" aria-hidden="true" class="icone-son"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5c1.3 1 2 2.2 2 3.5s-.7 2.5-2 3.5M18.5 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
