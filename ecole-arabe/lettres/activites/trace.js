// LE TRACÉ MAGIQUE (Atelier des formes) — l'enfant passe son doigt (ou la souris) sur la lettre : une traînée de lumière dorée se dépose et fait briller la lettre.
// Détection APPROXIMATIVE du parcours : on mesure la part de la lettre couverte par la traînée et la part de traînée qui sort de la lettre, avec une tolérance selon l'âge
// (3-4 ans : très large ; 7-10 ans : plus précise). On n'exige jamais une écriture parfaite ; l'ordre et le sens des traits ne sont pas imposés (limite assumée : pas d'animation de tracé guidé).
// Les points de la lettre (turquoise) sont ensuite à toucher. Jamais d'échec bloquant : après deux essais trop imprécis, le tracé est accepté avec un coup de pouce.
import { glyphes, boite } from '../rendu.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { PAR_ID } from '../donnees/lettres.js?v=1';
import { enTete, pause } from './commun.js?v=1';
export default async function trace(ctx, { lettres, tours = 1 }) {
  const res = { ok: 0, ko: 0, aides: 0, tours: 0 }; const liste = lettres.slice(0, tours);
  for (const id of liste) { if (!ctx.vivant()) break; const r = await tracerUne(ctx, id); res.ok += r.ok ? 1 : 0; res.ko += r.ok ? 0 : 1; res.aides += r.aides; res.tours++; }
  return res;
}
async function tracerUne(ctx, id) {
  const l = PAR_ID[id], g = ctx.groupe(), tol = C.toleranceTrace(ctx.s), f = glyphes().lettres[id].isolee, b = boite(id, 'isolee', 0.12);
  const ui = enTete(ctx, '✨ Le tracé magique', 1); ui.consigne.classList.add('cache'); ui.cible.innerHTML = `<div class="cible-texte"><b>Trace ${l.nomFr}</b><small>${l.sonFr}</small></div>`;
  const S = Math.max(240, Math.min(420, Math.floor((ctx.zone.clientWidth || 360) - 24), Math.floor(innerHeight * 0.5))), dpr = Math.min(devicePixelRatio || 1, 2), W = Math.round(S * dpr);
  ui.choix.className = 'act-choix trace'; ui.choix.innerHTML = `<div class="zone-trace" style="width:${S}px;height:${S}px"><canvas class="guide"></canvas><canvas class="encre"></canvas><div class="points-tap"></div></div><div class="jauge" aria-label="Avancement du tracé"><i style="width:0%"></i></div>`;
  const zone = ui.choix.querySelector('.zone-trace'), cg = zone.querySelector('.guide'), ce = zone.querySelector('.encre'), pts = zone.querySelector('.points-tap'), jauge = ui.choix.querySelector('.jauge i');
  for (const c of [cg, ce]) { c.width = c.height = W; c.style.width = c.style.height = S + 'px'; }
  const echelle = (W / b.t), tx = -b.x * echelle, ty = -b.y * echelle; const chemin = new Path2D(); const m = new DOMMatrix([echelle, 0, 0, echelle, tx, ty]);
  const corps = f.parties.filter(p => p.type === 'corps'), points = f.parties.filter(p => p.type !== 'corps'); for (const p of f.parties) chemin.addPath(new Path2D(p.d), m);
  // le guide, selon l'âge : lettre pleine et lumineuse (3-4 ans), contour + léger remplissage (5-6 ans), contour fin (7-10 ans)
  const gx = cg.getContext('2d'); gx.fillStyle = g === 'g34' ? 'rgba(255,214,102,.45)' : g === 'g56' ? 'rgba(255,214,102,.22)' : 'rgba(255,214,102,.1)'; gx.fill(chemin); gx.lineWidth = (g === 'g710' ? 2 : 4) * dpr; gx.strokeStyle = 'rgba(255,246,224,.9)'; gx.setLineDash([10 * dpr, 8 * dpr]); gx.stroke(chemin);
  // masque de la lettre (corps seulement) pour mesurer la couverture
  const mk = document.createElement('canvas'); mk.width = mk.height = W; const mx = mk.getContext('2d', { willReadFrequently: true }); const cheminCorps = new Path2D(); for (const p of corps) cheminCorps.addPath(new Path2D(p.d), m); mx.fill(cheminCorps);
  const masque = mx.getImageData(0, 0, W, W).data; let total = 0; for (let i = 3; i < masque.length; i += 4) if (masque[i] > 40) total++;
  const ex = ce.getContext('2d', { willReadFrequently: true }); const epaisseur = W * (g === 'g34' ? 0.13 : g === 'g56' ? 0.105 : 0.085); ex.lineCap = ex.lineRound = 'round'; ex.lineJoin = 'round'; ex.lineWidth = epaisseur; ex.strokeStyle = '#ffd666'; ex.shadowColor = 'rgba(255,200,80,.9)'; ex.shadowBlur = 14 * dpr;
  // zone tolérée pour « rester sur la lettre » : la lettre élargie de la largeur du crayon (sinon une lettre fine comme alif serait impossible à suivre)
  const mt = document.createElement('canvas'); mt.width = mt.height = W; const mtx = mt.getContext('2d', { willReadFrequently: true }); mtx.fill(cheminCorps); mtx.lineWidth = epaisseur * 0.8; mtx.lineJoin = 'round'; mtx.stroke(cheminCorps); const masqueTol = mtx.getImageData(0, 0, W, W).data;
  let dessine = false, dernier = null, essais = 0, aides = 0, corpsFini = false, fini = false, derniereMesure = 0;
  const pos = e => { const r = ce.getBoundingClientRect(); return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (W / r.height)]; };
  function mesurer() {
    const px = ex.getImageData(0, 0, W, W).data; let dedans = 0, tolere = 0, peint = 0; for (let i = 3, k = 0; i < px.length; i += 4, k++) { if (px[i] > 60) { peint++; if (masque[i] > 40) dedans++; if (masqueTol[i] > 40) tolere++; } }
    return { couvre: total ? dedans / total : 0, dehors: peint ? 1 - tolere / peint : 0 };
  }
  function majJauge() { const r = mesurer(); jauge.style.width = Math.min(100, Math.round((r.couvre / tol.couvre) * 100)) + '%'; return r; }
  const attendreFin = new Promise(resolve => {
    async function terminerCorps() {
      if (corpsFini) return; const r = mesurer();
      if (r.couvre < tol.couvre) return;
      if (r.dehors > tol.dehors && essais < 2) { essais++; ui.msg.textContent = 'Reste bien sur la lettre. On recommence ?'; ctx.parler('encore2', 'Regarde bien, tu y es presque.', 'Loumi'); ctx.reagir('hum'); await pause(1100); ex.clearRect(0, 0, W, W); jauge.style.width = '0%'; return; }
      corpsFini = true; ctx.son('juste'); zone.classList.add('brille'); ctx.reagir('joie');
      if (!points.length) return fin(true);
      ui.msg.textContent = '✨ Maintenant, touche les points !'; ctx.parler('trace_points', 'Maintenant, touche les points.', 'Maktoub'); const vus = new Set();
      points.forEach((p, k) => { const cx = ((p.bb[0] + p.bb[2]) / 2 - b.x) / b.t * 100, cy = ((p.bb[1] + p.bb[3]) / 2 - b.y) / b.t * 100, d = document.createElement('button'); d.className = 'point-tap'; d.style.cssText = `left:${cx}%;top:${cy}%`; d.setAttribute('aria-label', 'un point'); d.onclick = () => { d.classList.add('pris'); vus.add(k); ctx.son('juste'); if (vus.size === points.length) fin(true); }; pts.appendChild(d); });
    }
    function fin(ok) { if (fini) return; fini = true; resolve(ok); }
    ce.addEventListener('pointerdown', e => { if (corpsFini || fini) return; e.preventDefault(); ce.setPointerCapture?.(e.pointerId); dessine = true; dernier = pos(e); ex.beginPath(); ex.moveTo(dernier[0], dernier[1]); ex.lineTo(dernier[0] + 0.1, dernier[1] + 0.1); ex.stroke(); });
    ce.addEventListener('pointermove', e => { if (!dessine) return; e.preventDefault(); const p = pos(e); ex.beginPath(); ex.moveTo(dernier[0], dernier[1]); ex.lineTo(p[0], p[1]); ex.stroke(); dernier = p; const t = performance.now(); if (t - derniereMesure > 160) { derniereMesure = t; majJauge(); } });
    const lever = () => { if (!dessine) return; dessine = false; majJauge(); terminerCorps(); };
    ce.addEventListener('pointerup', lever); ce.addEventListener('pointercancel', lever); ce.style.touchAction = 'none';
    ui.aide.onclick = () => { aides++; zone.classList.add('pulse'); setTimeout(() => zone.classList.remove('pulse'), 3500); ctx.parler('aide', 'Je te donne un petit coup de pouce.', 'Loumi'); };
    const passer = document.createElement('button'); passer.className = 'secondaire'; passer.textContent = 'Passer ›'; passer.onclick = () => fin(false); ui.aide.parentNode.appendChild(passer);
    if (ctx.aideAutoMs) setTimeout(() => { if (!corpsFini && !fini && ctx.vivant()) zone.classList.add('pulse'); }, ctx.aideAutoMs + 4000); ctx.surArret(() => fin(false));
    ctx.parler('trace', 'Passe ton doigt sur la lettre pour la faire briller.', 'Maktoub'); if (essais >= 2) terminerCorps();
  });
  const ok = await attendreFin; if (ok) { ctx.enregistrer({ lettre: id, competence: 'trace', contexte: 'trace', ok: true }); ui.msg.textContent = '🌟 Bravo, quelle belle lettre !'; await pause(1300); }
  return { ok, aides };
}
