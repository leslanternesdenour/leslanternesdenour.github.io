// LA CHASSE AUX LETTRES (Jardin des lettres) — une scène de jardin : la lettre demandée est cachée parmi d'autres fleurs-lettres ; l'enfant la retrouve.
// 3-4 ans : 2 grosses fleurs ; 5-6 ans : 5 ; 7-10 ans : 8, avec les lettres jumelles et des formes différentes (début / milieu / fin) à reconnaître.
import { svgLettre, tailleCommune } from '../rendu.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { PAR_ID, formesDe } from '../donnees/lettres.js?v=1';
import { jouerChoix, melanger } from './commun.js?v=1';
const POSITIONS = [[16, 20], [50, 14], [82, 22], [22, 52], [52, 50], [80, 56], [14, 82], [48, 84], [82, 84]];
export default async function chasse(ctx, { lettres, tours = 3 }) {
  const g = ctx.groupe(), nb = g === 'g34' ? 2 : g === 'g56' ? 5 : 8, rng = ctx.rng;
  return jouerChoix(ctx, { titre: '🔎 La chasse aux lettres', tours, construire(i) {
    const cible = C.choisirCible(ctx.s, rng, lettres), autres = C.distracteurs(ctx.s, cible, nb - 1, rng, lettres.length > 2 ? lettres : null), ids = [cible, ...autres.slice(0, nb - 1)];
    if (ids.length < 2) return null; const echelle = tailleCommune(ids), pos = melanger(POSITIONS.slice(0, Math.max(ids.length, 2) === 2 ? 2 : 9), rng);
    const place = g === 'g34' ? [[28, 50], [72, 50]] : null;
    const items = melanger(ids, rng).map((id, k) => { const formes = formesDe(PAR_ID[id]), forme = g === 'g710' && formes.length > 1 ? formes[Math.floor(rng() * formes.length)] : 'isolee'; const p = place ? place[k] : pos[k % pos.length];
      return { lettre: id, bonne: id === cible, x: p[0], y: p[1], rot: Math.round((rng() - 0.5) * 20), sc: place ? 1.5 : 0.9 + rng() * 0.3, aria: 'une fleur-lettre', html: `<span class="fleur">${svgLettre(id, { forme, taille: g === 'g710' ? tailleCommune(ids, 'isolee') : echelle })}</span>` }; });
    const l = PAR_ID[cible];
    return { mode: 'scene', consigne: { id: 'chasse', texte: `Trouve la lettre ${l.nomFr}.` }, son: { id: 'nom.' + cible, texte: `${l.nomFr}`, qui: 'Maktoub' },
      rejouer: () => ctx.parler('nom.' + cible, l.nomFr, 'Maktoub'),
      cible: `<div class="cible-lettre">${svgLettre(cible, { classe: 'grand' })}<div><b>${l.nomFr}</b><small>${l.sonFr}</small></div></div>`,
      items, enregistrer: (it, ok) => ({ lettre: cible, competence: 'reco', contexte: 'chasse', ok: ok === true, confusion: ok === true ? undefined : it.lettre }) };
  } });
}
