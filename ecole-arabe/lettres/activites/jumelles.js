// LES LETTRES JUMELLES (Salle des défis) — des lettres de même squelette (ب ت ث ن ي ; ج ح خ ; د ذ ; ر ز ; س ش ; ص ض ; ط ظ ; ع غ ; ف ق ; ك ل) : tout se joue sur les POINTS.
// L'enfant retrouve la bonne lettre, puis l'explication montre la différence.
import { svgLettre, tailleCommune } from '../rendu.js?v=3';
import * as C from '../moteur/competences.js?v=3';
import { PAR_ID } from '../donnees/lettres.js?v=3';
import { jouerChoix, melanger, carteLettre } from './commun.js?v=3';
export const pointsTexte = l => (l.points[0] === 0 ? 'aucun point' : `${l.points[0]} point${l.points[0] > 1 ? 's' : ''} ${l.points[1] === 'dessus' ? 'au-dessus' : 'en dessous'}`);
export const groupesJumeaux = lettres => { const f = {}; for (const id of lettres) (f[PAR_ID[id].famille] = f[PAR_ID[id].famille] || []).push(id); return Object.values(f).filter(a => a.length >= 2); };
export default async function jumelles(ctx, { lettres, tours = 4 }) {
  const groupes = groupesJumeaux(lettres); if (!groupes.length) { ctx.zone.innerHTML = `<div class="act"><p class="act-msg">Il faut connaître quelques lettres jumelles pour jouer. Découvre-en d'autres dans le Jardin !</p></div>`; await new Promise(r => setTimeout(r, 2400)); return { ok: 0, ko: 0, aides: 0, tours: 0 }; }
  const rng = ctx.rng;
  return jouerChoix(ctx, { titre: '👯 Les lettres jumelles', tours, construire(i) {
    const grp = groupes[Math.floor(rng() * groupes.length)], cible = C.choisirCible(ctx.s, rng, grp), ids = melanger(grp.slice(0, ctx.groupe() === 'g34' ? 2 : 4).includes(cible) ? grp.slice(0, ctx.groupe() === 'g34' ? 2 : 4) : [cible, ...grp.filter(x => x !== cible).slice(0, 2)], rng), echelle = tailleCommune(ids), l = PAR_ID[cible];
    return { mode: 'grille', consigne: { id: 'jumelles', texte: 'Ces lettres se ressemblent. Regarde bien leurs points !' }, son: { id: 'nom.' + cible, texte: l.nomFr, qui: 'Maktoub' }, rejouer: () => ctx.parler('nom.' + cible, l.nomFr, 'Maktoub'),
      cible: `<div class="cible-texte"><b>Où est ${l.nomFr} ?</b><small>${ctx.groupe() === 'g710' ? '' : pointsTexte(l)}</small></div>`,
      items: ids.map(id => ({ lettre: id, bonne: id === cible, aria: 'une lettre', html: carteLettre(svgLettre(id, { taille: echelle })) })),
      apres: () => `${l.nomFr} a ${pointsTexte(l)}.`, enregistrer: (it, ok) => ({ lettre: cible, competence: 'reco', contexte: 'jumelles', ok: ok === true, confusion: ok === true ? undefined : it.lettre }) };
  } });
}
