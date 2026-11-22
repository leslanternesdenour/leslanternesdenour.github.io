// LE PALAIS DES LETTRES — la collection : les 28 lettres, qui brillent de plus en plus avec la maîtrise (5 stades réels). On touche une lettre pour la revoir en 3D ; les badges et diplômes y sont exposés.
import { svgLettre, tailleCommune } from '../rendu.js?v=1';
import { LETTRES, PAR_ID, CHAPITRES } from '../donnees/lettres.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { ouvrirFiche } from './decouvrir.js?v=1';
import { enTete } from './commun.js?v=1';
export const BADGES = { 'premiere-lettre': ['🌱', 'Première lettre'], traceur: ['✨', 'Traceur magique'], 'bonne-oreille': ['👂', 'Bonne oreille'], 'maitre-des-formes': ['🔄', 'Maître des formes'], 'champion-des-defis': ['🏆', 'Champion des défis'] };
export default async function collection(ctx) {
  const ui = enTete(ctx, '🏛️ Le palais des lettres', 1); ui.cible.innerHTML = ''; ui.aide.classList.add('cache'); ui.consigne.classList.add('cache'); ui.msg.textContent = '';
  const echelle = tailleCommune(LETTRES.map(l => l.id)); const rec = C.recompenses(ctx.s), g = C.progressionGlobale(ctx.s);
  const rendre = () => {
    const r = C.recompenses(ctx.s);
    ui.cible.innerHTML = `<div class="palais-tete"><div class="jauge grand" aria-label="Progression"><i style="width:${C.progressionGlobale(ctx.s)}%"></i></div><p><b>${C.progressionGlobale(ctx.s)} %</b> du chemin · ⭐ ${r.etoiles} · 🏮 ${r.lanternes}/8 · ${C.maitrisees(ctx.s).length} lettres maîtrisées</p>
      <div class="badges">${r.badges.filter(b => BADGES[b]).map(b => `<span title="${BADGES[b][1]}">${BADGES[b][0]} ${BADGES[b][1]}</span>`).join('')}${r.diplomes.map(d => `<span class="diplome">${d === 'maitre' ? '🏆 Maître des lettres' : '🎓 Explorateur des lettres'}</span>`).join('')}</div></div>`;
    ui.choix.className = 'act-choix palais'; ui.choix.innerHTML = CHAPITRES.map(c => `<div class="palais-salle"><h3>${c.icone} ${c.nom}</h3><div class="palais-rang">${c.lettres.map(id => { const st = C.stade(ctx.s, id); return `<button class="carte-palais st${st}" data-id="${id}" aria-label="${PAR_ID[id].nomFr} : ${C.NOMS_STADES[C.STADES[st]]}"><span class="lettre">${svgLettre(id, { taille: echelle })}</span><small>${PAR_ID[id].nomFr}</small><i class="stades">${[1, 2, 3, 4, 5].map(n => `<b class="${st >= n ? 'on' : ''}"></b>`).join('')}</i></button>`; }).join('')}</div></div>`).join('');
  };
  rendre(); void rec; void g;
  await new Promise(fin => { ctx.surArret(fin); ui.choix.addEventListener('click', e => { const b = e.target.closest('.carte-palais'); if (!b) return; const id = b.dataset.id; const haut = ui.cible.innerHTML; ui.cible.innerHTML = ''; ouvrirFiche(ctx, id, ui.choix, { surFermer: () => rendre() }); void haut; }); });
  return { ok: 0, ko: 0, aides: 0, tours: 0 };
}
