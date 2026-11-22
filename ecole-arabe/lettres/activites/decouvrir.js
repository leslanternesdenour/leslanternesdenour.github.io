// LE JARDIN DES LETTRES — les lettres fleurissent ; l'enfant en touche une pour la DÉCOUVRIR : grande lettre dorée en 3D qu'il peut tourner, son nom, son son, un mot d'exemple illustré,
// ses formes (début, milieu, fin) et la possibilité de tout réécouter. Une lettre ouverte compte comme « découverte » (premier stade, jamais « maîtrisée »).
import { svgLettre, tailleCommune } from '../rendu.js?v=1';
import { PAR_ID, formesDe, NOMS_FORMES } from '../donnees/lettres.js?v=1';
import * as C from '../moteur/competences.js?v=1';
import { enTete, pause } from './commun.js?v=1';
const POTS = ['🌷', '🌸', '🌼', '🌺', '🪻', '🌻', '🌹', '💐'];
// La fiche d'une lettre (réutilisée par le Palais). Renvoie une fonction de fermeture.
export function ouvrirFiche(ctx, id, conteneur, { surFermer } = {}) {
  const l = PAR_ID[id], g = ctx.groupe(), formes = formesDe(l), t = tailleCommune([id, id], 'isolee'), petit = g === 'g34';
  C.decouverte(ctx.s, id); ctx.sauver(); const tailleF = Math.max(...formes.map(f => tailleCommune([id], f)));
  conteneur.innerHTML = `<div class="fiche"><button class="rond retour-fiche" aria-label="Retour aux fleurs">‹</button>
    <div class="fiche-3d" aria-label="${l.nomFr} en grand"></div>
    <div class="fiche-info"><h3><span class="ar-nom" lang="ar">${l.nom}</span> <small>${l.nomFr}</small></h3><p class="son-fr">${l.sonFr}</p>
      <div class="boutons-son"><button class="gros" data-s="nom">🔊 Son nom</button><button class="gros" data-s="son">🔊 Son son</button></div>
      <div class="mot-ex"><button class="mot-btn" data-s="mot" aria-label="Écouter le mot"><span class="mot-ar" lang="ar">${l.mot.ar}</span><span class="mot-emoji">${l.mot.emoji}</span></button><small>${l.mot.tr} — ${l.mot.fr}</small></div>
      ${petit ? '' : `<div class="formes-rang"><p>${l.joint ? 'Sa forme change dans le mot :' : 'Cette lettre ne s\'attache pas à la suivante :'}</p><div class="tuiles">${formes.map(f => `<span class="tuile-forme" data-f="${f}">${svgLettre(id, { forme: f, taille: tailleF })}<small>${NOMS_FORMES[f]}</small></span>`).join('')}</div></div>`}
    </div></div>`;
  const dire = { nom: [`nom.${id}`, l.nomFr], son: [`son.${id}`, l.syllabe], mot: [`mot.${id}`, l.mot.ar] };
  conteneur.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { const [aid, txt] = dire[b.dataset.s]; b.classList.add('chante'); ctx.parler(aid, txt, 'Nour', { sousTitre: false }).then(() => b.classList.remove('chante')); }; });
  const rang = conteneur.querySelectorAll('.tuile-forme'); rang.forEach((x, k) => setTimeout(() => x.classList.add('pop'), 900 + k * 450));       // les formes apparaissent l'une après l'autre
  let vue = null; (async () => { try { const { creerVue3d } = await import('../vue3d.js?v=1'); vue = creerVue3d(conteneur.querySelector('.fiche-3d')); vue.definir(id, 'isolee'); } catch (e) { conteneur.querySelector('.fiche-3d').innerHTML = svgLettre(id, { classe: 'grand' }); } })();
  setTimeout(() => ctx.parler(`nom.${id}`, l.nomFr, 'Nour', { sousTitre: false }), 700);
  const fermer = () => { if (vue) vue.fermer(); vue = null; conteneur.innerHTML = ''; if (surFermer) surFermer(); }; conteneur.querySelector('.retour-fiche').onclick = fermer; return fermer;
}
export default async function decouvrir(ctx, { lettres, tout = false }) {
  const ui = enTete(ctx, '🌷 Le jardin des lettres', lettres.length); ui.cible.innerHTML = `<div class="cible-texte"><b>Touche une fleur pour découvrir sa lettre</b></div>`; ui.aide.classList.add('cache'); ui.consigne.onclick = () => ctx.parler('decouvrir', 'Touche une lettre pour la découvrir.', 'Nour'); ctx.parler('decouvrir', 'Touche une lettre pour la découvrir.', 'Nour');
  const ouvertes = new Set(); const echelle = tailleCommune(lettres);
  ui.choix.className = 'act-choix jardin'; const rendre = () => { ui.choix.innerHTML = lettres.map((id, k) => `<button class="fleur-btn${ouvertes.has(id) ? ' vue' : ''}" data-id="${id}" aria-label="Découvrir ${PAR_ID[id].nomFr}"><span class="pot">${POTS[k % POTS.length]}</span><span class="fleur">${svgLettre(id, { taille: echelle })}</span><small>${ouvertes.has(id) ? PAR_ID[id].nomFr : ''}</small></button>`).join('') + (ouvertes.size >= (tout ? lettres.length : 1) ? `<button class="principal fini">${ouvertes.size >= lettres.length ? 'Continuer ›' : 'J\'ai fini ›'}</button>` : ''); };
  rendre(); ui.points.forEach(p => p.classList.remove('ok'));
  await new Promise(fin => { ctx.surArret(fin);
    ui.choix.addEventListener('click', e => { const f = e.target.closest('.fini'); if (f) return fin(); const b = e.target.closest('.fleur-btn'); if (!b) return; const id = b.dataset.id; ouvertes.add(id); ctx.reagir('joie');
      const jardin = ui.choix.innerHTML; const zone = ui.choix; zone.innerHTML = ''; const fermer = ouvrirFiche(ctx, id, zone, { surFermer: () => { rendre(); ui.points.slice(0, ouvertes.size).forEach(p => p.classList.add('ok')); if (ouvertes.size >= lettres.length) ctx.reagir('joie'); } }); void jardin; void fermer; });
  });
  return { ok: ouvertes.size, ko: 0, aides: 0, tours: ouvertes.size };
}
