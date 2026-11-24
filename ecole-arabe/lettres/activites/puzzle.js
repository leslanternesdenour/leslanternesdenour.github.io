// LE PUZZLE DES LETTRES (Atelier des formes) — la lettre est découpée en morceaux : son corps et ses POINTS (turquoise), ou deux moitiés pour les lettres sans point.
// L'enfant glisse chaque morceau à sa place ; un morceau proche s'aimante. Aucune erreur possible, seulement de la manipulation : on comprend de quoi la lettre est faite.
import { glyphes, boite, COULEURS } from '../rendu.js?v=3';
import { PAR_ID } from '../donnees/lettres.js?v=3';
import { enTete, melanger, pause } from './commun.js?v=3';
export default async function puzzle(ctx, { lettres, tours = 2 }) {
  const res = { ok: 0, ko: 0, aides: 0, tours: 0 }, rng = ctx.rng;
  for (let i = 0; i < tours && ctx.vivant(); i++) { const id = melanger(lettres, rng)[i % lettres.length]; const ok = await une(ctx, id, rng); res.ok += ok ? 1 : 0; res.tours++; }
  return res;
}
async function une(ctx, id, rng) {
  const l = PAR_ID[id], f = glyphes().lettres[id].isolee, b = boite(id, 'isolee', 0.1), T = b.t, g = ctx.groupe();
  const ui = enTete(ctx, '🧩 Le puzzle des lettres', 1); ui.cible.innerHTML = `<div class="cible-texte"><b>Remets les morceaux de ${l.nomFr} à leur place</b></div>`; ui.consigne.classList.add('cache');
  // morceaux : corps + points ; sans point (ou un seul morceau) : on coupe le corps en deux moitiés (verticale pour une lettre large, horizontale pour une lettre haute)
  let pieces = f.parties.map((p, k) => ({ d: p.d, type: p.type, bb: p.bb, clip: null, id: 'p' + k }));
  if (pieces.length === 1 || (pieces.length === 2 && pieces[1].bb[2] - pieces[1].bb[0] < 40)) { const hauteur = b.h > b.w * 1.15; const cx = b.cx, cy = b.cy, [x1, y1, x2, y2] = pieces[0].bb;
    pieces = hauteur ? [{ ...pieces[0], clip: [x1 - 5, y1 - 5, x2 + 5, cy], id: 'h1' }, { ...pieces[0], clip: [x1 - 5, cy, x2 + 5, y2 + 5], id: 'h2' }] : [{ ...pieces[0], clip: [cx, y1 - 5, x2 + 5, y2 + 5], id: 'h1' }, { ...pieces[0], clip: [x1 - 5, y1 - 5, cx, y2 + 5], id: 'h2' }, ...pieces.slice(1)]; }
  if (g === 'g34' && pieces.length > 3) pieces = pieces.slice(0, 3);
  const VB = { x: b.x - T * 0.15, y: b.y - T * 0.02, w: T * 1.3, h: T * 2.08 }, zonePieces = T * 1.2;                     // plateau assez bas ET assez haut pour contenir les morceaux les plus hauts (alif, lam…)           // la lettre en haut, le plateau des morceaux en bas
  const coul = p => (p.type === 'corps' ? COULEURS.encre : COULEURS.points), dest = [];
  const slots = pieces.map((p, k) => [b.x + T * (0.12 + (k / Math.max(1, pieces.length - 1)) * 0.76), zonePieces + b.y + T * 0.3 - (pieces.length === 1 ? 0 : 0)]);
  const decalages = melanger(pieces.map((_, k) => k), rng).map((k, i) => ({ k, dx: slots[i][0] - (p0(pieces[k]).cx), dy: slots[i][1] - (p0(pieces[k]).cy) })); function p0(p) { const c = p.clip || p.bb; return { cx: (c[0] + c[2]) / 2, cy: (c[1] + c[3]) / 2 }; }
  ui.choix.className = 'act-choix puzzle';
  ui.choix.innerHTML = `<svg class="puzzle-svg" viewBox="${VB.x.toFixed(0)} ${VB.y.toFixed(0)} ${VB.w.toFixed(0)} ${VB.h.toFixed(0)}"><defs>${pieces.map(p => p.clip ? `<clipPath id="c-${p.id}"><rect x="${p.clip[0]}" y="${p.clip[1]}" width="${p.clip[2] - p.clip[0]}" height="${p.clip[3] - p.clip[1]}"/></clipPath>` : '').join('')}</defs>
    <g class="cibles" opacity=".28">${pieces.map(p => `<path d="${p.d}" fill="none" stroke="#fff6e0" stroke-width="6" stroke-dasharray="26 18" ${p.clip ? `clip-path="url(#c-${p.id})"` : ''}/>`).join('')}</g>
    ${pieces.map((p, k) => { const d = decalages.find(x => x.k === k); return `<g class="morceau" data-k="${k}" data-dx="${d.dx.toFixed(1)}" data-dy="${d.dy.toFixed(1)}" transform="translate(${d.dx.toFixed(1)} ${d.dy.toFixed(1)})"><g ${p.clip ? `clip-path="url(#c-${p.id})"` : ''}><path d="${p.d}" fill="${coul(p)}" stroke="#fff6e0" stroke-width="8"/></g><circle cx="${p0(p).cx}" cy="${p0(p).cy}" r="${T * 0.14}" fill="transparent"/></g>`; }).join('')}</svg>`;
  const svg = ui.choix.querySelector('svg'), morceaux = [...svg.querySelectorAll('.morceau')]; let posees = 0, aides = 0, fini = false;
  const vers = e => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); };
  ctx.parler('puzzle', 'Remets les morceaux de la lettre à leur place.', 'Maktoub');
  await new Promise(resolve => {
    morceaux.forEach(m => { let prise = null; const dx0 = +m.dataset.dx, dy0 = +m.dataset.dy; m.dataset.x = dx0; m.dataset.y = dy0; m.style.cursor = 'grab'; m.style.touchAction = 'none';
      m.addEventListener('pointerdown', e => { if (m.classList.contains('pose') || fini) return; e.preventDefault(); if (m.parentNode.lastElementChild !== m) m.parentNode.appendChild(m); m.setPointerCapture?.(e.pointerId); const p = vers(e); prise = { ox: p.x - +m.dataset.x, oy: p.y - +m.dataset.y }; m.classList.add('prise'); });   // le morceau passe au premier plan AVANT la capture (déplacer un élément capturé coupe le glissement)
      m.addEventListener('pointermove', e => { if (!prise) return; const p = vers(e); m.dataset.x = p.x - prise.ox; m.dataset.y = p.y - prise.oy; m.setAttribute('transform', `translate(${m.dataset.x} ${m.dataset.y})`); });
      const lacher = () => { if (!prise) return; prise = null; m.classList.remove('prise'); const x = +m.dataset.x, y = +m.dataset.y; if (Math.hypot(x, y) < T * (g === 'g34' ? 0.3 : g === 'g56' ? 0.22 : 0.16)) { m.setAttribute('transform', 'translate(0 0)'); m.dataset.x = 0; m.dataset.y = 0; m.classList.add('pose'); m.style.cursor = 'default'; ctx.son('juste'); posees++; if (posees === morceaux.length && !fini) { fini = true; resolve(); } } };
      m.addEventListener('pointerup', lacher); m.addEventListener('pointercancel', lacher); });
    ui.aide.onclick = () => { aides++; const m = morceaux.find(x => !x.classList.contains('pose')); if (m) { m.classList.add('indice'); setTimeout(() => m.classList.remove('indice'), 2500); } ctx.parler('aide', 'Je te donne un petit coup de pouce.', 'Loumi'); }; ctx.surArret(resolve); });
  if (fini) { ctx.enregistrer({ lettre: id, competence: 'reco', contexte: 'puzzle', ok: aides === 0 }); ctx.reagir('joie'); ui.msg.textContent = `🌟 ${l.nomFr} est reconstituée !`; ctx.parler('bravo', 'Bravo !', 'Maktoub'); await pause(1300); }
  return fini;
}
