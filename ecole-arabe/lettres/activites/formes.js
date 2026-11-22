// L'ATELIER DES FORMES — on RELIE des lettres pour former un mot et on voit chaque lettre changer de forme (début, milieu, fin), puis on choisit la forme qui va dans la case.
// Les lettres ا د ذ ر ز و ne s'attachent pas à la suivante : la lettre d'après recommence en forme « début ». Ce sont toujours les mêmes lettres, seule la forme change.
import { svgMot, svgLettre, tailleCommune } from '../rendu.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { PAR_ID, formesDe, NOMS_FORMES } from '../donnees/lettres.js?v=1';
import { MOTS_ATELIER, formesDuMot } from '../moteur/mots.js?v=1';
import { jouerChoix, melanger, carteLettre, pause } from './commun.js?v=1';
const motsPour = (lettres, cible) => { const tous = MOTS_ATELIER.filter(m => m.lettres.includes(cible)); const bons = tous.filter(m => m.lettres.every(id => lettres.includes(id))); return bons.length ? bons : tous; };
export const mots = (lettres) => MOTS_ATELIER.filter(m => m.lettres.some(id => lettres.includes(id)));
export default async function formes(ctx, { lettres, tours = 3 }) {
  const g = ctx.groupe(), rng = ctx.rng, liees = lettres.filter(id => PAR_ID[id].joint && motsPour(lettres, id).length);
  if (!liees.length) { ctx.zone.innerHTML = `<div class="act"><p class="act-msg">Les formes s'étudient avec des lettres qui s'attachent. Découvre d'autres lettres d'abord !</p></div>`; await pause(2400); return { ok: 0, ko: 0, aides: 0, tours: 0 }; }
  return jouerChoix(ctx, { titre: '🔄 L\'atelier des formes', tours, construire(i) {
    const cible = C.choisirCible(ctx.s, rng, liees), mot = melanger(motsPour(lettres, cible), rng)[0], ids = mot.lettres, positions = ids.map((id, k) => (id === cible ? k : -1)).filter(k => k >= 0), pos = positions[0], items0 = formesDuMot(ids), formeBonne = items0[pos].forme;
    const toutes = formesDe(PAR_ID[cible]), nb = g === 'g56' ? 3 : 4, options = melanger([formeBonne, ...melanger(toutes.filter(f => f !== formeBonne), rng)].slice(0, Math.min(nb, toutes.length)), rng), t = tailleCommune([cible], 'isolee') * 1.1;
    const vide = svgMot(ids, { vide: pos, classe: 'mot-grand' }).svg, relie = svgMot(ids, { classe: 'mot-grand' }).svg, isole = svgMot(ids, { isole: true, classe: 'mot-grand' }).svg;
    return { mode: 'grille', consigne: { id: 'formes_q', texte: 'Quelle forme va dans la case ?' },
      cible: `<div class="atelier"><div class="atelier-mot"><div class="pile isole">${isole}</div><div class="pile relie cache">${relie}</div></div><button class="secondaire relier">🔗 Relier les lettres</button><p class="legende">${mot.emoji} ${mot.fr}</p><div class="atelier-q"><div class="pile">${vide}</div></div></div>`,
      surRendu: ui => { const a = ui.cible.querySelector('.atelier'), b = a.querySelector('.relier'); let etape = 0; b.onclick = () => { etape++; a.classList.toggle('est-relie', etape % 2 === 1); a.querySelector('.isole').classList.toggle('cache', etape % 2 === 1); a.querySelector('.relie').classList.toggle('cache', etape % 2 === 0); b.textContent = etape % 2 ? '↩️ Séparer les lettres' : '🔗 Relier les lettres'; if (etape === 1) ctx.parler('formes', 'Regarde : la lettre change de forme dans le mot, mais c\'est toujours la même lettre.', 'Maktoub'); };
      },
      items: options.map(f => ({ lettre: cible, forme: f, bonne: f === formeBonne, aria: NOMS_FORMES[f], html: `<span class="carte-lettre">${svgLettre(cible, { forme: f, taille: t })}<small>${NOMS_FORMES[f]}</small></span>` })),
      apres: () => `Au ${formeBonne === 'initiale' ? 'début' : formeBonne === 'mediane' ? 'milieu' : formeBonne === 'finale' ? 'bout' : 'repos'} du mot, ${PAR_ID[cible].nomFr} prend la forme « ${NOMS_FORMES[formeBonne].toLowerCase()} ».`,
      enregistrer: (it, ok) => ({ lettre: cible, competence: 'formes', contexte: 'formes', ok: ok === true, confusion: undefined }) };
  } });
}
