// LE SON MYSTÉRIEUX (Galerie des sons) — une lanterne fait entendre un son ; l'enfant touche la lettre qui le fait. Sans l'audio du son, l'activité n'est pas proposée (jamais de faux son).
import { svgLettre, tailleCommune } from '../rendu.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { PAR_ID } from '../donnees/lettres.js?v=1';
import { jouerChoix, melanger, carteLettre } from './commun.js?v=1';
export const disponible = (ctx, lettres) => lettres.some(id => ctx.a('son.' + id));
export default async function son(ctx, { lettres, tours = 4 }) {
  const pool = lettres.filter(id => ctx.a('son.' + id)); if (!pool.length) { ctx.zone.innerHTML = `<div class="act"><p class="act-msg">Les sons de ces lettres arrivent bientôt. Essaie une autre activité !</p></div>`; await new Promise(r => setTimeout(r, 2200)); return { ok: 0, ko: 0, aides: 0, tours: 0 }; }
  const rng = ctx.rng, nb = ctx.nbChoix();
  return jouerChoix(ctx, { titre: '🔔 Le son mystérieux', tours, construire(i) {
    const cible = C.choisirCible(ctx.s, rng, pool), dispo = lettres, autres = C.distracteurs(ctx.s, cible, nb - 1, rng, dispo.length > 1 ? dispo : null), ids = melanger([cible, ...autres], rng); if (ids.length < 2) return null;
    const echelle = tailleCommune(ids), l = PAR_ID[cible];
    return { mode: 'grille', consigne: { id: 'son', texte: 'Écoute bien, puis touche la bonne lettre.' }, son: { id: 'son.' + cible, texte: l.syllabe, qui: 'Maktoub' }, rejouer: () => ctx.parler('son.' + cible, l.syllabe, 'Maktoub', { sousTitre: false }),
      cible: `<button class="lanterne-son" aria-label="Écouter le son">🏮<span>Écoute</span></button>`, surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => { b.classList.add('chante'); ctx.parler('son.' + cible, l.syllabe, 'Maktoub', { sousTitre: false }).then(() => b.classList.remove('chante')); }; },
      items: ids.map(id => ({ lettre: id, bonne: id === cible, aria: 'une lettre', html: carteLettre(svgLettre(id, { taille: echelle })) })),
      apres: () => `${l.nomFr} : ${l.sonFr}.`, enregistrer: (it, ok) => ({ lettre: cible, competence: 'son', contexte: 'son', ok: ok === true, confusion: ok === true ? undefined : it.lettre }) };
  } });
}
