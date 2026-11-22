// LE PARCOURS DES SONS (Galerie des sons) — jeu de MÉMOIRE : on écoute une suite de sons, puis on touche les lettres dans le même ordre. 2 sons (3-4 ans), 3 (5-6 ans), 4 (7-10 ans).
// On peut réécouter la suite à volonté ; une erreur rejoue la suite doucement, sans rien enlever.
import { svgLettre, tailleCommune } from '../rendu.js?v=2';
import * as C from '../moteur/competences.js?v=2';
import { PAR_ID } from '../donnees/lettres.js?v=2';
import { enTete, melanger, carteLettre, pause, $$ } from './commun.js?v=2';
export default async function parcoursSons(ctx, { lettres, tours = 2 }) {
  const pool = lettres.filter(id => ctx.a('son.' + id)); if (pool.length < 2) { ctx.zone.innerHTML = `<div class="act"><p class="act-msg">Les sons de ces lettres arrivent bientôt. Essaie une autre activité !</p></div>`; await pause(2200); return { ok: 0, ko: 0, aides: 0, tours: 0 }; }
  const g = ctx.groupe(), L = Math.min(g === 'g34' ? 2 : g === 'g56' ? 3 : 4, pool.length), nb = Math.min(pool.length, L + 2, 6), rng = ctx.rng, ui = enTete(ctx, '🎶 Le parcours des sons', tours), res = { ok: 0, ko: 0, aides: 0, tours: 0 };
  ui.aide.classList.add('cache');
  for (let t = 0; t < tours && ctx.vivant(); t++) {
    const choix = melanger(pool, rng).slice(0, nb), suite = Array.from({ length: L }, () => choix[Math.floor(rng() * choix.length)]); const echelle = tailleCommune(choix); ui.msg.textContent = '';
    ui.cible.innerHTML = `<button class="lanterne-son" aria-label="Écouter la suite">🏮<span>Écoute la suite</span></button><div class="suite">${suite.map(() => '<i></i>').join('')}</div>`;
    ui.choix.className = 'act-choix grille n' + nb; ui.choix.innerHTML = choix.map(id => `<button class="choix-btn" data-id="${id}" aria-label="une lettre">${carteLettre(svgLettre(id, { taille: echelle }))}</button>`).join('');
    const btns = $$(ui.choix, '.choix-btn'), pastilles = $$(ui.cible, '.suite i'); let attente = true, k = 0, fini = false, premier = true;
    const jouer = async () => { attente = true; ui.msg.textContent = '👂 Écoute bien…'; for (const id of suite) { if (!ctx.vivant()) return; await ctx.parler('son.' + id, PAR_ID[id].syllabe, 'Maktoub', { sousTitre: false }); await pause(350); } ui.msg.textContent = '👉 À toi !'; attente = false; k = 0; pastilles.forEach(p => p.className = ''); };
    ui.cible.querySelector('.lanterne-son').onclick = () => { if (attente && ui.msg.textContent.startsWith('👂')) return; jouer(); }; ui.consigne.onclick = () => jouer();
    await ctx.parler('parcours_sons', 'Écoute la suite de sons, puis touche les lettres dans le même ordre.', 'Maktoub'); await jouer();
    await new Promise(fin => { btns.forEach(b => { b.onclick = async () => {
      if (attente || fini || !ctx.vivant()) return; const id = b.dataset.id;
      if (id === suite[k]) { b.classList.add('juste'); setTimeout(() => b.classList.remove('juste'), 350); pastilles[k].classList.add('ok'); ctx.son('juste'); k++; if (k >= suite.length) { fini = true; ctx.reagir('joie'); ctx.parler('bravo', 'Bravo !', 'Maktoub');
          for (const x of new Set(suite)) ctx.enregistrer({ lettre: x, competence: 'son', contexte: 'parcours-sons', ok: premier }); if (premier) res.ok++; else res.ko++; res.tours++; ui.msg.textContent = '🌟 Bravo !'; await pause(1200); fin(); } }
      else { ctx.reagir('hum'); ctx.son('faux'); if (premier) { premier = false; ctx.enregistrer({ lettre: suite[k], competence: 'son', contexte: 'parcours-sons', ok: false, confusion: id }); } ui.msg.textContent = 'Écoute encore la suite…'; ctx.parler('encore', 'Essaie encore, tu peux le faire !', 'Loumi'); await pause(900); await jouer(); } }; });
      ctx.surArret(fin); });
  }
  return res;
}
