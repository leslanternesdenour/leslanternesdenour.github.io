// LA LETTRE INTRUSE (Salle des défis) — trois lettres vont ensemble, une seule n'est pas pareille. Trois variantes qui apportent chacune une idée différente :
//  « pareilles » (petits) : trois fois la même lettre et une autre ; « formes » : trois FORMES de la même lettre (début, milieu, fin) et une autre lettre : c'est la preuve que la forme change mais que la lettre reste la même ;
//  « points » (grands) : trois lettres avec le même nombre de points, une qui en a un autre.
import { svgLettre, tailleCommune } from '../rendu.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { PAR_ID, formesDe } from '../donnees/lettres.js?v=1';
import { jouerChoix, melanger, carteLettre } from './commun.js?v=1';
export default async function intrus(ctx, { lettres, tours = 3 }) {
  const g = ctx.groupe(), rng = ctx.rng, liees = lettres.filter(id => PAR_ID[id].joint);
  return jouerChoix(ctx, { titre: '🕵️ La lettre intruse', tours, construire(i) {
    const types = g === 'g34' ? ['pareilles'] : g === 'g56' ? ['pareilles', 'formes'] : ['formes', 'points', 'pareilles']; let type = types[(i + (rng() < 0.3 ? 1 : 0)) % types.length];
    if (type === 'formes' && !liees.length) type = 'pareilles'; if (type === 'points') { const parNb = {}; for (const id of lettres) (parNb[PAR_ID[id].points[0]] = parNb[PAR_ID[id].points[0]] || []).push(id); if (!Object.values(parNb).some(a => a.length >= 3) || Object.keys(parNb).length < 2) type = 'pareilles'; }
    let items = [], consigne = "Trouve la lettre qui n'est pas pareille.", explication = '', enreg;
    if (type === 'pareilles') { const cible = C.choisirCible(ctx.s, rng, lettres), autres = C.distracteurs(ctx.s, cible, 1, rng, lettres.length > 1 ? lettres : null); if (!autres.length) return null; const ids = [cible, autres[0]], t = tailleCommune(ids);
      items = melanger([...[0, 1, 2].map(() => ({ lettre: cible, bonne: false, html: carteLettre(svgLettre(cible, { taille: t })) })), { lettre: autres[0], bonne: true, html: carteLettre(svgLettre(autres[0], { taille: t })) }], rng); explication = `Les autres sont la lettre ${PAR_ID[cible].nomFr}.`; enreg = (it, ok) => ({ lettre: cible, competence: 'reco', contexte: 'intrus', ok: ok === true, confusion: ok === true ? undefined : cible }); }
    else if (type === 'formes') { const cible = C.choisirCible(ctx.s, rng, liees), formes = formesDe(PAR_ID[cible]), autres = C.distracteurs(ctx.s, cible, 1, rng, lettres.length > 1 ? lettres : null); if (!autres.length) return null; const intr = autres[0], t = tailleCommune([cible, intr], 'isolee');
      const fi = formes.filter(f => PAR_ID[intr].joint ? true : f === 'isolee' || f === 'finale'); const fx = PAR_ID[intr].joint ? formes[Math.floor(rng() * formes.length)] : 'isolee';
      items = melanger([...formes.slice(0, 3).map(f => ({ lettre: cible, bonne: false, html: carteLettre(svgLettre(cible, { forme: f, taille: t * 1.1 })) })), { lettre: intr, bonne: true, html: carteLettre(svgLettre(intr, { forme: fx, taille: t * 1.1 })) }], rng);
      consigne = "Trois de ces formes sont la même lettre. Trouve l'intruse !"; explication = `Même lettre, trois formes : ${PAR_ID[cible].nomFr} change de forme dans le mot.`; enreg = (it, ok) => ({ lettre: cible, competence: 'formes', contexte: 'intrus', ok: ok === true, confusion: ok === true ? undefined : intr }); void fi; }
    else { const parNb = {}; for (const id of lettres) (parNb[PAR_ID[id].points[0]] = parNb[PAR_ID[id].points[0]] || []).push(id); const grands = Object.entries(parNb).filter(([, a]) => a.length >= 3), [nb, grp] = grands[Math.floor(rng() * grands.length)], reste = Object.entries(parNb).filter(([k]) => k !== nb).flatMap(([, a]) => a), intr = reste[Math.floor(rng() * reste.length)], trois = melanger(grp, rng).slice(0, 3), t = tailleCommune([...trois, intr]);
      items = melanger([...trois.map(id => ({ lettre: id, bonne: false, html: carteLettre(svgLettre(id, { taille: t })) })), { lettre: intr, bonne: true, html: carteLettre(svgLettre(intr, { taille: t })) }], rng); consigne = 'Trois lettres ont le même nombre de points. Trouve celle qui est différente !'; explication = `${nb === '0' ? 'Trois lettres sans point' : `Trois lettres avec ${nb} point${nb > 1 ? 's' : ''}`}, et ${PAR_ID[intr].nomFr} qui en a ${PAR_ID[intr].points[0] || 'aucun'}.`; enreg = (it, ok) => ({ lettre: intr, competence: 'reco', contexte: 'intrus', ok: ok === true, confusion: ok === true ? undefined : it.lettre }); }
    return { mode: 'grille', consigne: { id: 'intrus', texte: consigne }, cible: `<div class="cible-texte"><b>${consigne}</b></div>`, items, apres: () => explication, enregistrer: enreg };
  } });
}
