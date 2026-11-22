// LE JARDIN DES LETTRES — les lettres fleurissent ; l'enfant en touche une pour la DÉCOUVRIR : grande lettre dorée en 3D qu'il peut tourner, son nom, son son, un mot d'exemple illustré,
// ses formes (début, milieu, fin) et la possibilité de tout réécouter. Une lettre ouverte compte comme « découverte » (premier stade, jamais « maîtrisée »).
import { svgLettre, svgAlifForme, tailleCommune } from '../rendu.js?v=2';
import { ALIF } from '../../commun/langue/alphabet.js?v=2';
import { PAR_ID, formesDe, NOMS_FORMES } from '../donnees/lettres.js?v=2';
import * as C from '../moteur/competences.js?v=2';
import { enTete, pause } from './commun.js?v=2';
const POTS = ['🌷', '🌸', '🌼', '🌺', '🪻', '🌻', '🌹', '💐'];
// La fiche d'une lettre (réutilisée par le Palais). Renvoie une fonction de fermeture.
export function ouvrirFiche(ctx, id, conteneur, { surFermer } = {}) {
  const l = PAR_ID[id], g = ctx.groupe(), formes = formesDe(l), t = tailleCommune([id, id], 'isolee'), petit = g === 'g34';
  C.decouverte(ctx.s, id); ctx.sauver(); const tailleF = Math.max(...formes.map(f => tailleCommune([id], f)));
  const dirAvant = conteneur.dir; conteneur.dir = 'ltr'; conteneur.innerHTML = `<div class="fiche"><button class="rond retour-fiche" aria-label="Retour aux fleurs">‹</button>
    <div class="fiche-3d" aria-label="${l.nomFr} en grand"></div>
    <div class="fiche-info"><h3><span class="ar-nom" lang="ar" dir="rtl">${l.nom}</span> <small>${l.nomFr === l.translit ? l.translit : l.nomFr + ' · ' + l.translit}</small></h3><p class="son-fr">${l.sonFr}</p>
      <div class="boutons-son"><button class="gros" data-s="nom">🔊 Son nom</button><button class="gros" data-s="son">🔊 Son son</button></div>
      <div class="mot-ex"><button class="mot-btn" data-s="mot" aria-label="Écouter le mot"><span class="mot-ar" lang="ar" dir="rtl">${l.mot.ar}</span><span class="mot-emoji">${l.mot.emoji}</span></button><small>${l.mot.tr} — ${l.mot.fr}</small></div>
      ${id === 'alif' && !petit ? `<div class="alif-bloc"><button class="gros" data-alif>Alif et hamza ›</button><div class="alif-formes cache"><p>${ALIF.forme_simple.texte}</p><p class="astuce">👆 Touche une forme pour comprendre</p><div class="tuiles">${ALIF.formes.map(f => `<button class="tuile-forme pop alif-t" data-af="${f.id}" aria-label="Alif : ${f.id.replace('_', ' ')}">${svgAlifForme(f.id)}<small lang="ar" dir="rtl">${f.ar}</small></button>`).join('')}</div><div class="alif-detail" aria-live="polite"></div><p class="hamza"><b lang="ar" dir="rtl">${ALIF.hamza.ar}</b> ${ALIF.hamza.texte}</p></div></div>` : ''}
      ${petit ? '' : `<div class="formes-rang"><p>${l.joint ? 'Sa forme change dans le mot :' : 'Cette lettre ne s\'attache pas à la suivante :'}</p><p class="astuce">👆 Touche une forme pour comprendre</p><div class="tuiles">${formes.map(f => `<button class="tuile-forme forme-t pop" data-f="${f}" aria-label="${l.nomFr} : forme ${NOMS_FORMES[f].toLowerCase()}">${svgLettre(id, { forme: f, taille: tailleF })}<small>${NOMS_FORMES[f]}</small></button>`).join('')}</div><div class="forme-detail" aria-live="polite"></div></div>`}
    </div></div>`;
  const dire = { nom: [`nom.${id}`, l.nomFr], son: [`son.${id}`, l.syllabe], mot: [`mot.${id}`, l.mot.ar] };
  conteneur.querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { const [aid, txt] = dire[b.dataset.s]; b.classList.add('chante'); ctx.parler(aid, txt, 'Maktoub', { sousTitre: false }).then(() => b.classList.remove('chante')); }; });
  const ba = conteneur.querySelector('[data-alif]'); if (ba) ba.onclick = () => { const z = conteneur.querySelector('.alif-formes'); z.classList.toggle('cache'); ba.textContent = z.classList.contains('cache') ? 'Alif et hamza ›' : 'Fermer ‹'; };
  conteneur.querySelectorAll('.alif-t').forEach(b => { b.onclick = () => { const f = ALIF.formes.find(x => x.id === b.dataset.af); conteneur.querySelectorAll('.alif-t').forEach(x => x.classList.toggle('choisie', x === b)); const d = conteneur.querySelector('.alif-detail');
    d.innerHTML = `<div class="alif-gros">${svgAlifForme(f.id)}</div><p><b lang="ar" dir="rtl">${f.ar}</b> ${f.texte}</p>`; ctx.parler('alif.' + f.id, f.texte, 'Maktoub'); }; });
  const pts = l.points[0] ? ` Elle garde ${l.points[0] > 1 ? 'ses ' + l.points[0] + ' points' : 'son point'} ${l.points[1] === 'dessus' ? 'au-dessus' : 'au-dessous'}.` : '';
  const TEXTES = { isolee: `Isolée : la lettre toute seule, comme dans l'alphabet.${pts}`, initiale: `Au début d'un mot : elle s'attache à la lettre qui vient après elle.${pts}`, mediane: `Au milieu d'un mot : elle s'attache à la lettre d'avant et à la lettre d'après.${pts}`,
    finale: l.joint ? `À la fin d'un mot : elle s'attache à la lettre d'avant.${pts}` : `À la fin d'un mot : elle se colle à la lettre d'avant, mais elle ne s'attache jamais à la lettre qui suit.${pts}` };
  conteneur.querySelectorAll('.forme-t').forEach(b => { b.onclick = () => { const f = b.dataset.f; conteneur.querySelectorAll('.forme-t').forEach(x => x.classList.toggle('choisie', x === b)); const d = conteneur.querySelector('.forme-detail');
    d.innerHTML = `<div class="alif-gros">${svgLettre(id, { forme: f, taille: tailleF })}</div><p><b>${NOMS_FORMES[f]}</b> — ${TEXTES[f]}</p>`; ctx.parler('forme.' + id + '.' + f, TEXTES[f], 'Maktoub'); }; });
  const rang = conteneur.querySelectorAll('.tuile-forme:not(.alif-t):not(.forme-t)'); rang.forEach((x, k) => setTimeout(() => x.classList.add('pop'), 900 + k * 450));       // les formes apparaissent l'une après l'autre
  let vue = null; (async () => { try { const { creerVue3d } = await import('../vue3d.js?v=2'); vue = creerVue3d(conteneur.querySelector('.fiche-3d')); vue.definir(id, 'isolee'); } catch (e) { conteneur.querySelector('.fiche-3d').innerHTML = svgLettre(id, { classe: 'grand' }); } })();
  setTimeout(() => ctx.parler(`nom.${id}`, l.nomFr, 'Maktoub', { sousTitre: false }), 700);
  const fermer = () => { if (vue) vue.fermer(); vue = null; conteneur.innerHTML = ''; conteneur.dir = dirAvant; if (surFermer) surFermer(); }; conteneur.querySelector('.retour-fiche').onclick = fermer; return fermer;
}
export default async function decouvrir(ctx, { lettres, tout = false }) {
  const ui = enTete(ctx, '🌷 Le jardin des lettres', lettres.length); ui.cible.innerHTML = `<div class="cible-texte"><b>Touche une fleur pour découvrir sa lettre</b></div>`; ui.aide.classList.add('cache'); ui.consigne.onclick = () => ctx.parler('decouvrir', 'Touche une lettre pour la découvrir.', 'Maktoub'); ctx.parler('decouvrir', 'Touche une lettre pour la découvrir.', 'Maktoub');
  const ouvertes = new Set(); const echelle = tailleCommune(lettres);
  ui.choix.className = 'act-choix jardin'; ui.choix.dir = 'rtl'; const rendre = () => { ui.choix.innerHTML = lettres.map((id, k) => `<button class="fleur-btn${ouvertes.has(id) ? ' vue' : ''}" data-id="${id}" aria-label="Découvrir ${PAR_ID[id].nomFr}"><span class="pot">${POTS[k % POTS.length]}</span><span class="fleur">${svgLettre(id, { taille: echelle })}</span><small>${ouvertes.has(id) ? PAR_ID[id].nomFr : ''}</small></button>`).join('') + (ouvertes.size >= (tout ? lettres.length : 1) ? `<button class="principal fini" dir="ltr">${ouvertes.size >= lettres.length ? 'Continuer ›' : 'J\'ai fini ›'}</button>` : ''); };
  rendre(); ui.points.forEach(p => p.classList.remove('ok'));
  await new Promise(fin => { ctx.surArret(fin);
    ui.choix.addEventListener('click', e => { const f = e.target.closest('.fini'); if (f) return fin(); const b = e.target.closest('.fleur-btn'); if (!b) return; const id = b.dataset.id; ouvertes.add(id); ctx.reagir('joie');
      const jardin = ui.choix.innerHTML; const zone = ui.choix; zone.innerHTML = ''; const fermer = ouvrirFiche(ctx, id, zone, { surFermer: () => { rendre(); ui.points.slice(0, ouvertes.size).forEach(p => p.classList.add('ok')); if (ouvertes.size >= lettres.length) ctx.reagir('joie'); } }); void jardin; void fermer; });
  });
  return { ok: ouvertes.size, ko: 0, aides: 0, tours: ouvertes.size };
}
