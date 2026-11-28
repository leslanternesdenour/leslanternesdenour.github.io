// La carte ancienne de la Route : un parchemin allongé (village → oasis → …), avec le chemin, les régions, les lieux découverts ou à explorer
// et la position de l'enfant. Même échelle que les déplacements réels (1 m du jeu = la même longueur sur la carte dans les deux sens).
// L'enfant peut toucher un lieu pour que la flèche de cap l'y conduise (aucune téléportation).
import { REGIONS_ROUTE, LIEUX_ROUTE, positionDeLieu, regionA } from './donnees.js';
import { pointChemin, OASIS, S_FIN_TRANCHE } from './relief.js';
import { LIEU_HALTE } from './halte-plan.js';
import { LIEU_RETOUR } from './retour-plan.js';

const S0 = -300, S1 = 6100, T0 = -800, T1 = 800;          // l'étendue de la carte (m)
export function creerProjection(w, h, portrait) {
  const long = S1 - S0, large = T1 - T0;
  const k = portrait ? Math.min(w / large, h / long) : Math.min(w / long, h / large);
  const W = (portrait ? large : long) * k, H = (portrait ? long : large) * k, ox = (w - W) / 2, oy = (h - H) / 2;
  const P = (s, t) => portrait ? { x: ox + (t - T0) * k, y: oy + (s - S0) * k } : { x: ox + (s - S0) * k, y: oy + (t - T0) * k };
  P.k = k; P.W = W; P.H = H; P.ox = ox; P.oy = oy; P.portrait = portrait;
  P.inverse = (x, y) => portrait ? { s: S0 + (y - oy) / k, t: T0 + (x - ox) / k } : { s: S0 + (x - ox) / k, t: T0 + (y - oy) / k };
  return P;
}
const tour = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
// distance et angle (relatif à la direction du joueur) vers un lieu : monde x = t, z = s ; a = atan2(x, z)
export function capVers(j, c) {
  const ds = c.s - j.s, dt = c.t - j.t;
  return { distance: Math.hypot(ds, dt), angle: tour(Math.atan2(dt, ds) - j.a) };
}

export function creerCarteRoute({ route, age, joueur, surFermer, surOuvrir }) {
  let el = null, cv = null, ctx2 = null, info = null, ouverte = false, choisi = null, cap = null, elCap = null, tCap = 0, fond = null, fondTaille = '';
  const lieuxCarte = () => [...LIEUX_ROUTE.filter(l => l.type !== 'objet' && l.type !== 'personnage'), LIEU_HALTE, LIEU_RETOUR];   // + la halte de repos (à découvrir en passant, jamais comptée dans une mission)
  const connu = l => l.toujoursConnu || route.decouvertes.includes(l.id) || route.repos.includes(l.id) || Object.values(route.missions).some(m => (m.faits || []).includes(l.id));

  function construire() {
    el = document.createElement('div'); el.id = 'carte-route'; el.className = 'cache'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Carte ancienne de la grande route');
    el.style.cssText = 'position:fixed;inset:0;z-index:70;background:#2d2014;display:flex;flex-direction:column;font-family:inherit;color:#f5e9cc';
    el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;gap:10px"><h2 style="margin:0;font-size:clamp(16px,3.5vw,22px)">🗺️ La grande route vers La Mecque</h2><button id="cr-fermer" aria-label="Fermer la carte" style="font-size:22px;min-width:48px;min-height:48px;border-radius:12px;border:0;background:#c9a14a;color:#2d2014;cursor:pointer">✕</button></div>
      <canvas id="cr-canvas" style="flex:1;min-height:0;width:100%;touch-action:manipulation"></canvas>
      <div id="cr-info" style="padding:10px 14px;min-height:64px;font-size:clamp(14px,3vw,17px)"></div>`;
    document.body.appendChild(el);
    cv = el.querySelector('#cr-canvas'); ctx2 = cv.getContext('2d'); info = el.querySelector('#cr-info');
    el.querySelector('#cr-fermer').onclick = fermer;
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1), P = proj(), q = P.inverse((e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height);
      let best = null, dm = 1e9;
      for (const l of lieuxCarte()) { const p = positionDeLieu(l), dd = Math.hypot(p.s - q.s, p.t - q.t); if (dd < dm) { dm = dd; best = l; } }
      if (best && dm < 150 / Math.max(0.35, P.k * 3)) choisir(best);
    });
    addEventListener('keydown', e => { if (ouverte && e.code === 'Escape') fermer(); });
  }
  const proj = () => creerProjection(cv.width, cv.height, cv.height > cv.width * 1.05);
  function choisir(l) {
    choisi = l; const j = joueur(), p = positionDeLieu(l), c = capVers(j, p), ok = connu(l);
    info.innerHTML = `<b>${ok ? l.icone + ' ' + l.nom : '❔ Un lieu à explorer'}</b> · ${c.distance > 950 ? (c.distance / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(c.distance / 5) * 5 + ' m'}
      <button id="cr-guider" style="margin-left:10px;padding:8px 14px;border-radius:12px;border:0;background:#c9a14a;color:#2d2014;font-size:inherit;cursor:pointer">🧭 Me guider</button>`;
    info.querySelector('#cr-guider').onclick = () => { cap = { l, s: p.s, t: p.t }; majCap(); fermer(); };
  }
  function dessiner() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(r.width * d) || cv.height !== Math.round(r.height * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    const w = cv.width, h = cv.height, P = proj(), x = ctx2, u = Math.max(1, P.k * 3);
    x.fillStyle = '#2d2014'; x.fillRect(0, 0, w, h);
    // le parchemin
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ecd9ac'); g.addColorStop(1, '#e0c68f');
    x.fillStyle = g; x.fillRect(P.ox, P.oy, P.W, P.H); x.strokeStyle = '#7a5232'; x.lineWidth = 3 * d; x.strokeRect(P.ox, P.oy, P.W, P.H);
    // les régions : bandes de couleur, grisées tant qu'elles ne sont pas découvertes
    let idxReg = 0; const etiquettes = [];
    for (const reg of REGIONS_ROUTE) {
      const a = P(Math.max(S0, reg.s0), T0), b = P(Math.min(S1, reg.s1), T1), vu = route.decouvertes.includes('region:' + reg.id);
      x.globalAlpha = vu ? 0.55 : 0.18; x.fillStyle = vu ? reg.couleur : '#8a7a62';
      const X = Math.min(a.x, b.x), Y = Math.min(a.y, b.y); x.fillRect(X, Y, Math.abs(b.x - a.x), Math.abs(b.y - a.y)); x.globalAlpha = 1;
      // le nom : réduit à la largeur de la bande, et une région sur deux décalée d'une ligne : les noms ne se superposent jamais
      const txt = vu ? `${reg.icone} ${reg.nom}` : '❔', bw = Math.abs(b.x - a.x); let tp = 13 * d; x.fillStyle = '#4a3320'; x.font = `bold ${tp}px Georgia, serif`; x.textAlign = 'center';
      while (x.measureText(txt).width > bw * 0.96 && tp > 9 * d) { tp -= 0.5 * d; x.font = `bold ${tp}px Georgia, serif`; }
      const c = P(Math.max(S0, reg.s0) / 2 + Math.min(S1, reg.s1) / 2, T1 - 70), dy = (idxReg++ % 2) * 15 * d; etiquettes.push({ txt, x: c.x, y: c.y - dy, tp });   // dessiné plus bas, par-dessus les montagnes
    }
    // des montagnes dessinées de chaque côté (comme sur le terrain)
    x.strokeStyle = '#6a4a2c'; x.fillStyle = 'rgba(214,190,140,.9)'; x.lineWidth = 1.4 * d;
    for (let s = S0 + 60; s < S1; s += 160) for (const t of [-540, 540]) { const p = P(s + (t > 0 ? 40 : 0), t), z = 20 * d * Math.max(0.7, P.k * 2.4); x.beginPath(); x.moveTo(p.x - z, p.y + z * 0.6); x.lineTo(p.x, p.y - z); x.lineTo(p.x + z, p.y + z * 0.6); x.closePath(); x.fill(); x.stroke(); }
    // l'eau de l'oasis
    { const p = P(OASIS.s, OASIS.t); x.fillStyle = '#7fbccb'; x.strokeStyle = '#2e6f80'; x.lineWidth = 2 * d; x.beginPath(); x.arc(p.x, p.y, OASIS.lac * P.k * 1.6, 0, 6.283); x.fill(); x.stroke(); }
    // la piste : pointillés à l'encre
    x.strokeStyle = 'rgba(122,62,36,.9)'; x.lineWidth = 3.2 * d; x.setLineDash([10 * d, 8 * d]); x.lineCap = 'round'; x.beginPath();
    for (let s = S0; s <= S_FIN_TRANCHE; s += 20) { const q = pointChemin(s), p = P(s, q.t); s === S0 ? x.moveTo(p.x, p.y) : x.lineTo(p.x, p.y); } x.stroke(); x.setLineDash([]);
    // le village, au début
    // (l'etiquette est decalee vers l'interieur de la carte : sinon elle est coupee par le bord)
    { const p = P(S0 + 20, 48); x.font = `bold ${Math.round(12 * d)}px Georgia, serif`; const lw = x.measureText('Village de Nour').width, m = 6 * d;
      const px = Math.min(Math.max(p.x, lw / 2 + m), w - lw / 2 - m);
      x.font = `${Math.round(24 * d)}px serif`; x.textAlign = 'center'; x.fillStyle = '#3a2a1a'; const py0 = Math.max(p.y, 26 * d); x.fillText('🏘️', Math.max(p.x, 16 * d), py0);
      x.font = `bold ${Math.round(12 * d)}px Georgia, serif`; x.fillStyle = '#4a3320';
      if (P.portrait) { x.textAlign = 'left'; x.fillText('Village de Nour', Math.max(p.x, 16 * d) + 20 * d, py0 - 4 * d); x.textAlign = 'center'; } else x.fillText('Village de Nour', px, py0 + 18 * d); }
    // le portail de RETOUR au village, à sa vraie place (retour-plan.js) : un petit portail de pierre, la légende « Retour au village », et une discrète flèche vers le village
    { const pp = positionDeLieu(LIEU_RETOUR), p = P(pp.s, pp.t), sel = choisi && choisi.id === LIEU_RETOUR.id, u = 14 * d, q = P(pp.s - 1, pp.t);
      let vx = q.x - p.x, vy = q.y - p.y; const vl = Math.hypot(vx, vy) || 1; vx /= vl; vy /= vl;                   // la direction du village sur la carte
      if (sel) { x.beginPath(); x.arc(p.x, p.y - 0.8 * u, 2.4 * u, 0, 6.283); x.fillStyle = 'rgba(255,211,107,.55)'; x.fill(); }
      x.fillStyle = '#3a2a1a'; x.fillRect(p.x - 1.2 * u, p.y - 1.75 * u, 2.4 * u, 1.9 * u);
      x.fillStyle = '#e8d3a2'; x.fillRect(p.x - 1.05 * u, p.y - 1.4 * u, 0.7 * u, 1.45 * u); x.fillRect(p.x + 0.35 * u, p.y - 1.4 * u, 0.7 * u, 1.45 * u); x.fillRect(p.x - 1.2 * u, p.y - 1.7 * u, 2.4 * u, 0.34 * u);
      x.fillStyle = '#f0a94e'; x.fillRect(p.x - 0.32 * u, p.y - 1.3 * u, 0.64 * u, 1.35 * u);
      // la flèche, du portail vers le village
      { const ax = p.x + vx * 2.1 * u, ay = p.y - 0.8 * u + vy * 2.1 * u, bx = ax + vx * 2.4 * u, by = ay + vy * 2.4 * u, nx = -vy, ny = vx;
        x.strokeStyle = '#4a3320'; x.fillStyle = '#4a3320'; x.lineWidth = 2.4 * d; x.lineCap = 'round'; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
        x.beginPath(); x.moveTo(bx + vx * 1.0 * u, by + vy * 1.0 * u); x.lineTo(bx + nx * 0.7 * u, by + ny * 0.7 * u); x.lineTo(bx - nx * 0.7 * u, by - ny * 0.7 * u); x.closePath(); x.fill(); }
      x.font = `bold ${Math.round(13 * d)}px Georgia, serif`; const lt = LIEU_RETOUR.nom, lw = x.measureText(lt).width, pt = P.portrait;
      const lx0 = pt ? Math.min(p.x + 1.7 * u + 5 * d, w - lw - 8 * d) : Math.min(Math.max(p.x, lw / 2 + 6 * d), w - lw / 2 - 6 * d), ly0 = pt ? p.y - 0.4 * u : p.y - 2.5 * u - 5 * d;
      x.fillStyle = 'rgba(255,248,231,.9)'; x.fillRect(pt ? lx0 - 3 * d : lx0 - lw / 2 - 4 * d, ly0 - 11 * d, lw + (pt ? 6 : 8) * d, 16 * d); x.fillStyle = '#4a3320'; x.textAlign = pt ? 'left' : 'center'; x.fillText(lt, lx0, ly0); x.textAlign = 'center'; }
    // La Mecque, au bout de la piste : un repere toujours visible (le nom est deja dans le titre de la carte ; rien de religieux n'est montre ici)
    { const q = pointChemin(S_FIN_TRANCHE), p = P(S_FIN_TRANCHE, q.t), vu = route.decouvertes.includes('cite-place');
      x.textAlign = 'center'; x.font = `${Math.round(26 * d)}px serif`; x.fillStyle = '#3a2a1a'; x.fillText('🏁', Math.min(p.x, w - 18 * d), p.y);
      x.font = `bold ${Math.round(13 * d)}px Georgia, serif`; const lt = vu ? 'La Mecque · arrivée !' : 'La Mecque', lw = x.measureText(lt).width, px = Math.min(p.x, w - lw / 2 - 6 * d), py = p.y - 30 * d;
      x.fillStyle = 'rgba(255,248,231,.88)'; x.fillRect(px - lw / 2 - 5 * d, py - 14 * d, lw + 10 * d, 20 * d); x.fillStyle = '#4a3320'; x.fillText(lt, px, py); }
    // les noms des régions : par-dessus tout, sur un petit fond clair pour rester lisibles
    for (const e of etiquettes) { x.font = `bold ${e.tp}px Georgia, serif`; const lw = x.measureText(e.txt).width; x.fillStyle = 'rgba(255,248,231,.78)'; x.fillRect(e.x - lw / 2 - 3 * d, e.y - e.tp, lw + 6 * d, e.tp * 1.3); x.fillStyle = '#4a3320'; x.textAlign = 'center'; x.fillText(e.txt, e.x, e.y); }
    // les lieux : découverts (icône) ou à explorer (point d'interrogation)
    const inconnus = [];   // les ❔ trop proches d'un autre ne sont pas redessines (grappes illisibles) ; ils restent touchables
    for (const l of lieuxCarte()) {
      if (l.id === LIEU_RETOUR.id) continue;                  // dessiné plus haut, avec sa légende
      const pp = positionDeLieu(l), p = P(pp.s, pp.t), ok = connu(l), sel = choisi && choisi.id === l.id;
      if (!ok && !sel) { if (inconnus.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 17 * d)) continue; inconnus.push(p); }
      x.font = `${Math.round((ok ? 22 : 16) * d)}px serif`; x.textAlign = 'center'; x.globalAlpha = ok ? 1 : 0.55;
      if (sel) { x.beginPath(); x.arc(p.x, p.y - 6 * d, 18 * d, 0, 6.283); x.fillStyle = 'rgba(255,211,107,.55)'; x.fill(); }
      x.fillStyle = '#3a2a1a'; x.fillText(ok ? l.icone : '❔', p.x, p.y); x.globalAlpha = 1;
    }
    // la destination choisie
    if (cap) { const p = P(cap.s, cap.t); x.strokeStyle = '#c0392b'; x.lineWidth = 3 * d; x.beginPath(); x.arc(p.x, p.y - 6 * d, 22 * d, 0, 6.283); x.stroke(); }
    // la position de l'enfant
    const j = joueur();
    if (j.dans) { const p = P(j.s, j.t); x.save(); x.translate(p.x, p.y); x.rotate(P.portrait ? Math.PI - j.a : j.a + Math.PI / 2); x.fillStyle = '#c0392b'; x.strokeStyle = '#fff'; x.lineWidth = 2 * d;
      x.beginPath(); x.moveTo(0, -12 * d); x.lineTo(8 * d, 9 * d); x.lineTo(0, 4 * d); x.lineTo(-8 * d, 9 * d); x.closePath(); x.fill(); x.stroke(); x.restore(); }
    else { const p = P(S0 + 20, 48); x.fillStyle = '#c0392b'; x.beginPath(); x.arc(p.x + 22 * d, p.y - 8 * d, 7 * d, 0, 6.283); x.fill(); }
  }
  function ouvrir() {
    if (!el) construire();
    ouverte = true; el.classList.remove('cache'); el.style.display = 'flex'; surOuvrir && surOuvrir();
    info.textContent = joueur().dans ? 'Touche un lieu pour te faire guider. Le point rouge, c\'est toi.' : 'Voici la grande route. Elle part du village et mène très loin : touche un lieu pour le voir.';
    requestAnimationFrame(() => { dessiner(); });
  }
  function fermer() { if (!ouverte) return; ouverte = false; el.style.display = 'none'; surFermer && surFermer(); }
  // la flèche de cap, en haut de l'écran, tant qu'on se rend quelque part
  function majCap() {
    if (!cap) { if (elCap) elCap.style.display = 'none'; return; }
    if (!elCap) { elCap = document.createElement('div'); elCap.id = 'route-cap'; elCap.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:30;background:rgba(45,32,20,.82);color:#f5e9cc;padding:6px 14px;border-radius:999px;display:flex;gap:10px;align-items:center;font-size:15px';
      elCap.innerHTML = '<span id="rc-fleche" style="display:inline-block;font-size:22px">✨</span><span id="rc-txt"></span><button id="rc-stop" aria-label="Arrêter le guidage" style="border:0;background:#c9a14a;border-radius:999px;min-width:34px;min-height:34px;cursor:pointer">✕</button>';
      document.body.appendChild(elCap); elCap.querySelector('#rc-stop').onclick = () => { cap = null; majCap(); }; }
    const j = joueur(); if (!j.dans) { elCap.style.display = 'none'; return; }
    const c = capVers(j, cap); elCap.style.display = 'flex';
    if (c.distance < 12) { cap = null; elCap.style.display = 'none'; return; }
    elCap.querySelector('#rc-txt').textContent = `${cap.l.icone} ${cap.l.nom} · ${c.distance > 950 ? (c.distance / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(c.distance / 5) * 5 + ' m'}`;
  }
  return { ouvrir, fermer, ouverte: () => ouverte, cap: () => cap, maj(dt) { tCap += dt; if (tCap > 0.25) { tCap = 0; majCap(); if (ouverte) dessiner(); } } };
}
