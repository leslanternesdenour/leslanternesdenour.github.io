// Moteur commun des activités « à choix » (chasse, son, jumelles, intruse, formes…) : manches, aide douce, retours immédiats, enregistrement de la compétence — sans punition.
// Chaque activité décrit seulement SA manche (construire) ; le déroulé, les retours et l'adaptation sont ici : une seule fois.
import { BRAVOS, ENCORES, PHRASES } from '../donnees/audio.js?v=1';
import { PAR_ID } from '../donnees/lettres.js?v=1';
export const $$ = (el, sel) => [...el.querySelectorAll(sel)];
export const pause = ms => new Promise(r => setTimeout(r, ms));
export const melanger = (a, rng = Math.random) => { const p = [...a]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
export function enTete(ctx, titre, tours) {
  ctx.zone.innerHTML = `<div class="act"><div class="act-tete"><h2>${titre}</h2><div class="points" aria-label="Manches">${Array.from({ length: tours }, () => '<i></i>').join('')}</div></div><div class="act-cible"></div><div class="act-choix"></div><p class="act-msg" aria-live="polite"></p>
    <div class="act-outils"><button class="secondaire" data-a="aide">💡 Un coup de pouce</button><button class="secondaire" data-a="consigne">🔊 Réécouter</button></div></div>`;
  return { points: $$(ctx.zone, '.points i'), cible: ctx.zone.querySelector('.act-cible'), choix: ctx.zone.querySelector('.act-choix'), msg: ctx.zone.querySelector('.act-msg'), aide: ctx.zone.querySelector('[data-a=aide]'), consigne: ctx.zone.querySelector('[data-a=consigne]') };
}
// construire(i) -> { cible: html, consigne: {id, texte}, mode: 'grille'|'scene', items: [{ html, bonne, lettre, x, y, rot }], enregistrer(item, ok) -> événement de compétence, apres?(item) -> html (explication), son? }
export async function jouerChoix(ctx, { titre, tours, construire }) {
  const ui = enTete(ctx, titre, tours); const res = { ok: 0, ko: 0, aides: 0, tours: 0 }; let aideTimer = 0;
  for (let i = 0; i < tours && ctx.vivant(); i++) {
    const m = construire(i); if (!m) break; ui.cible.innerHTML = m.cible || ''; ui.choix.className = 'act-choix ' + (m.mode === 'scene' ? 'scene' : 'grille n' + m.items.length); ui.msg.textContent = '';
    ui.choix.innerHTML = m.items.map((it, k) => `<button class="choix-btn${m.mode === 'scene' ? ' scene-item' : ''}" data-k="${k}" style="${m.mode === 'scene' ? `left:${it.x}%;top:${it.y}%;--rot:${it.rot || 0}deg;--sc:${it.sc || 1}` : ''}" aria-label="${it.aria || 'choix ' + (k + 1)}">${it.html}</button>`).join('');
    if (m.surRendu) m.surRendu(ui);
    const btns = $$(ui.choix, '.choix-btn'); let erreurs = 0, fini = false, premier = true; const bonne = m.items.findIndex(x => x.bonne);
    const dire = () => ctx.parler(m.consigne.id, m.consigne.texte, 'Maktoub'); ui.consigne.onclick = () => { if (m.rejouer) m.rejouer(); else dire(); };
    const aide = compte => { if (fini) return; const faux = btns.filter((b, k) => k !== bonne && !b.disabled); if (compte) { res.aides++; ctx.parler('aide', PHRASES.aide.texte, 'Loumi'); }
      if (m.mode === 'scene' || faux.length < 1) btns[bonne].classList.add('indice'); else { faux[0].disabled = true; faux[0].classList.add('faux'); } };
    ui.aide.onclick = () => aide(true);
    const relancer = () => { clearTimeout(aideTimer); if (ctx.aideAutoMs) aideTimer = setTimeout(() => { if (!fini && ctx.vivant()) btns[bonne].classList.add('indice'); }, ctx.aideAutoMs); }; relancer();
    if (m.son) await ctx.parler(m.son.id, m.son.texte, m.son.qui || 'Maktoub', { sousTitre: false }); else if (m.consigne) ctx.parler(m.consigne.id, m.consigne.texte, 'Maktoub');
    await new Promise(fin => {
      btns.forEach((b, k) => {
        b.onclick = async () => {
          if (fini || b.disabled || !ctx.vivant()) return; relancer(); const it = m.items[k];
          if (it.bonne) {
            fini = true; clearTimeout(aideTimer); b.classList.add('juste'); btns.forEach(x => { if (x !== b) x.disabled = true; }); ctx.reagir('joie'); ctx.son('juste');
            if (premier) { res.ok++; ctx.enregistrer(m.enregistrer(it, true)); } if (ui.points[i]) ui.points[i].classList.add(premier ? 'ok' : 'ko');
            const br = BRAVOS[i % BRAVOS.length]; if (m.apres) ui.msg.innerHTML = m.apres(it); ctx.parler(br, PHRASES[br].texte, 'Maktoub'); res.tours++; await pause(m.apres ? 1900 : 1150); fin();
          } else {
            erreurs++; b.classList.add('faux'); b.disabled = true; ctx.reagir('hum'); ctx.son('faux'); if (premier) { premier = false; res.ko++; ctx.enregistrer(m.enregistrer(it, false)); }
            const k2 = ENCORES[(erreurs - 1) % ENCORES.length]; ui.msg.textContent = PHRASES[k2].texte; ctx.parler(k2, PHRASES[k2].texte, 'Loumi'); if (erreurs >= 2) aide(false);
          }
        };
      });
      ctx.surArret(() => { clearTimeout(aideTimer); fin(); });
    });
  }
  clearTimeout(aideTimer); return res;
}
// une lettre en « carte » : svg + (option) nom
export const carteLettre = (svg, nom) => `<span class="carte-lettre">${svg}${nom ? `<small>${nom}</small>` : ''}</span>`;
export const nomLettre = id => PAR_ID[id].nomFr;
