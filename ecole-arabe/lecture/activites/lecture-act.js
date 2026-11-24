// JEU 2 — les activités de lecture. Elles réutilisent le moteur d'activités « à choix » du Jeu 1 (jouerChoix) : mêmes retours, même aide douce, même absence de punition.
import { jouerChoix, enTete, melanger, pause } from '../../lettres/activites/commun.js?v=3';
import { SYLLABES, SYLLABES_LONGUES, SOUKOUN, CHADDA, MOTS, MOTS_PAR_ID, PHRASES_LECTURE, CONS, VOYELLES_COURTES, LONGUES, SIGNES } from '../donnees/lecture.js?v=3';
import { PAR_ID_ALPHABET as L } from '../../commun/langue/alphabet.js?v=3';
import * as C from '../moteur.js?v=3';
export const ar = (txt, cls = '') => `<span class="ar-texte ${cls}" lang="ar" dir="rtl">${txt}</span>`;
const parId = [...SYLLABES, ...SYLLABES_LONGUES, ...SOUKOUN, ...CHADDA].reduce((o, x) => (o[x.id] = x, o), {});
const piocher = (ctx, liste, n = 1, evite = null) => { const rev = C.aReviser(ctx.s, liste.map(x => x.id)); const pool = liste.filter(x => x.id !== evite); const pref = pool.filter(x => rev.includes(x.id)); return melanger(pref.length && ctx.rng() < 0.5 ? pref : pool, ctx.rng).slice(0, n); };
const enreg = (ctx, id, contexte) => (it, ok) => ({ item: id, contexte, ok: ok === true });
// ---- Atelier : on fabrique des syllabes en touchant une lettre puis un signe (aucune erreur possible) ----
export async function atelier(ctx, { voyelles = ['fatha', 'kasra', 'damma'], tours = 3 }) {
  const ui = enTete(ctx, '🔧 L\'atelier des syllabes', 1); ui.aide.classList.add('cache'); ui.consigne.onclick = () => ctx.parler('c_atelier', 'Touche une lettre, puis un signe, pour fabriquer une syllabe.', 'Maktoub'); ctx.parler('c_atelier', 'Touche une lettre, puis un signe, pour fabriquer une syllabe.', 'Maktoub');
  const cons = CONS.slice(0, ctx.groupe() === 'g34' ? 4 : CONS.length); let cC = cons[0], cV = voyelles[0], faits = new Set();
  ui.cible.innerHTML = `<div class="atelier-lect"><div class="resultat" id="res-syl"></div><p class="lecture-fr" id="res-lect"></p></div>`; ui.choix.className = 'act-choix atelier-lect-choix';
  const rendre = () => { const syl = SYLLABES.find(s => s.cons === cC && s.voy === cV); ui.cible.querySelector('#res-syl').innerHTML = ar(syl.ar, 'ar-geant'); ui.cible.querySelector('#res-lect').textContent = '« ' + syl.lecture + ' »';
    ui.choix.innerHTML = `<div class="rang-lettres" dir="rtl">${cons.map(c => `<button class="tuile-ar${c === cC ? ' choisie' : ''}" data-c="${c}" aria-label="${L[c].nomFr}">${ar(L[c].ar, 'ar-gros')}</button>`).join('')}</div><div class="rang-signes">${voyelles.map(v => { const d = VOYELLES_COURTES.find(x => x.id === v); return `<button class="tuile-signe${v === cV ? ' choisie' : ''}" data-v="${v}" aria-label="${d.nom}">${ar('ـ' + SIGNES[v], 'ar-gros')}<small>${d.lecture}</small></button>`; }).join('')}</div><button class="principal gros-b fini-atelier" ${faits.size >= 3 ? '' : 'disabled'}>J'ai fini ▶</button>`; };
  const jouer = () => { const syl = SYLLABES.find(s => s.cons === cC && s.voy === cV); faits.add(syl.id); C.vu(ctx.s, syl.id); ctx.sauver(); ctx.parler(syl.id, syl.ar, 'Maktoub', { sousTitre: false }); ctx.reagir('joie'); };
  rendre(); await new Promise(fin => { ctx.surArret(fin); ui.choix.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.c) cC = b.dataset.c; if (b.dataset.v) cV = b.dataset.v; if (b.classList.contains('fini-atelier')) return fin(); jouer(); rendre(); }); });
  return { ok: faits.size, ko: 0, aides: 0, tours: faits.size };
}
// ---- Lire une syllabe : on voit la syllabe, on choisit comment elle se lit ----
export const lireSyllabe = (ctx, { liste, tours = 4 }) => jouerChoix(ctx, { titre: '👀 Je lis la syllabe', tours, construire() {
  const cible = piocher(ctx, liste)[0], autres = melanger(liste.filter(s => s.lecture !== cible.lecture), ctx.rng), memeCons = autres.filter(s => s.cons === cible.cons), choix = melanger([cible, ...[...memeCons, ...autres].filter((s, i, a) => a.findIndex(z => z.lecture === s.lecture) === i).slice(0, C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<div class="cible-syl">${ar(cible.ar, 'ar-geant')}</div>`, consigne: { id: 'c_lire', texte: 'Lis la syllabe, puis touche le bon son.' }, items: choix.map(s => ({ html: `<span class="carte-lecture">${s.lecture}</span>`, bonne: s.id === cible.id, aria: s.lecture })),
    surJuste: () => ctx.parler(cible.id, cible.ar, 'Maktoub', { sousTitre: false }), apres: () => `${cible.ar} se lit « ${cible.lecture} »`, enregistrer: enreg(ctx, cible.id, 'lire') };
} });
// ---- Écouter une syllabe : on entend, on choisit la syllabe écrite ----
export const ecouteSyllabe = (ctx, { liste, tours = 4 }) => jouerChoix(ctx, { titre: '👂 J\'écoute la syllabe', tours, construire() {
  const cible = piocher(ctx, liste)[0], autres = melanger(liste.filter(s => s.id !== cible.id), ctx.rng), memeCons = autres.filter(s => s.cons === cible.cons), choix = melanger([cible, ...[...memeCons, ...autres].slice(0, C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<button class="lanterne-son" aria-label="Écouter"> 🏮<span>Écoute</span></button>`, consigne: { id: 'c_ecoute', texte: 'Écoute, puis touche la bonne syllabe.' }, son: { id: cible.id, texte: cible.ar, qui: 'Maktoub' }, rejouer: () => ctx.parler(cible.id, cible.ar, 'Maktoub', { sousTitre: false }),
    surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => ctx.parler(cible.id, cible.ar, 'Maktoub', { sousTitre: false }); },
    items: choix.map(s => ({ html: ar(s.ar, 'ar-gros'), bonne: s.id === cible.id, aria: s.lecture })), apres: () => `${cible.ar} : « ${cible.lecture} »`, enregistrer: enreg(ctx, cible.id, 'ecoute') };
} });
// ---- Soukoun et chadda : on entend un mot court, on choisit le bon ----
export const signes = (ctx, { tours = 4 }) => jouerChoix(ctx, { titre: '🔘 Soukoun et chadda', tours, construire() {
  const liste = [...SOUKOUN, ...CHADDA], cible = piocher(ctx, liste)[0], choix = melanger([cible, ...melanger(liste.filter(x => x.id !== cible.id), ctx.rng).slice(0, C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<button class="lanterne-son" aria-label="Écouter">🏮<span>Écoute</span></button>`, consigne: { id: 'c_signes', texte: 'Écoute, puis touche le bon mot.' }, son: { id: cible.id, texte: cible.ar, qui: 'Maktoub' }, rejouer: () => ctx.parler(cible.id, cible.ar, 'Maktoub', { sousTitre: false }),
    surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => ctx.parler(cible.id, cible.ar, 'Maktoub', { sousTitre: false }); }, items: choix.map(s => ({ html: ar(s.ar, 'ar-gros'), bonne: s.id === cible.id, aria: s.lecture })), apres: () => `${cible.ar} : « ${cible.lecture} »`, enregistrer: enreg(ctx, cible.id, 'ecoute') };
} });
// ---- Mots : on lit le mot, on choisit la bonne image ----
export const lireMot = (ctx, { liste = MOTS, tours = 4 }) => jouerChoix(ctx, { titre: '📖 Je lis le mot', tours, construire() {
  const cible = piocher(ctx, liste.map(m => ({ ...m, id: 'mot.' + m.id })))[0], m = MOTS_PAR_ID[cible.id.slice(4)], autres = melanger(liste.filter(x => x.id !== m.id), ctx.rng).slice(0, C.nbChoix(ctx.s) - 1), choix = melanger([m, ...autres], ctx.rng);
  return { mode: 'grille', cible: `<button class="mot-cible" aria-label="Écouter le mot">${ar(m.ar, 'ar-geant')}</button>`, consigne: { id: 'c_mot', texte: 'Lis le mot, puis touche la bonne image.' }, rejouer: () => ctx.parler('mot.' + m.id, m.ar, 'Maktoub', { sousTitre: false }),
    surRendu: ui => { const b = ui.cible.querySelector('.mot-cible'); if (b) b.onclick = () => ctx.parler('mot.' + m.id, m.ar, 'Maktoub', { sousTitre: false }); },
    items: choix.map(x => ({ html: `<span class="emoji-grand" aria-hidden="true">${x.emoji}</span>`, bonne: x.id === m.id, aria: x.fr })), surJuste: () => ctx.parler('mot.' + m.id, m.ar, 'Maktoub', { sousTitre: false }), apres: () => `${m.ar} : ${m.fr} (${m.tr})`, enregistrer: enreg(ctx, 'mot.' + m.id, 'lire') };
} });
// ---- Mots : on entend le mot, on choisit le mot écrit ----
export const ecouteMot = (ctx, { liste = MOTS, tours = 4 }) => jouerChoix(ctx, { titre: '👂 J\'écoute le mot', tours, construire() {
  const m = piocher(ctx, liste.map(x => ({ ...x, id: x.id })))[0], autres = melanger(liste.filter(x => x.id !== m.id), ctx.rng).slice(0, C.nbChoix(ctx.s) - 1), choix = melanger([m, ...autres], ctx.rng);
  return { mode: 'grille', cible: `<button class="lanterne-son" aria-label="Écouter">🏮<span>Écoute</span></button>`, consigne: { id: 'c_ecoute', texte: 'Écoute, puis touche le bon mot.' }, son: { id: 'mot.' + m.id, texte: m.ar, qui: 'Maktoub' }, rejouer: () => ctx.parler('mot.' + m.id, m.ar, 'Maktoub', { sousTitre: false }),
    surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => ctx.parler('mot.' + m.id, m.ar, 'Maktoub', { sousTitre: false }); },
    items: choix.map(x => ({ html: ar(x.ar, 'ar-gros'), bonne: x.id === m.id, aria: x.fr })), apres: () => `${m.ar} : ${m.fr}`, enregistrer: enreg(ctx, 'mot.' + m.id, 'ecoute') };
} });
// ---- Phrases : « هَذَا / هَذِهِ + nom » — on lit, on choisit l'image ----
export const lirePhrase = (ctx, { tours = 3 }) => jouerChoix(ctx, { titre: '💬 Je lis la phrase', tours, construire() {
  const p = melanger(PHRASES_LECTURE, ctx.rng)[0], m = MOTS_PAR_ID[p.mot], autres = melanger(PHRASES_LECTURE.filter(x => x.id !== p.id), ctx.rng).slice(0, C.nbChoix(ctx.s) - 1).map(x => MOTS_PAR_ID[x.mot]), choix = melanger([m, ...autres], ctx.rng);
  return { mode: 'grille', cible: `<button class="mot-cible" aria-label="Écouter la phrase">${ar(p.ar, 'ar-grand')}</button>`, consigne: { id: 'c_phrase', texte: 'Lis la phrase, puis touche la bonne image.' }, rejouer: () => ctx.parler(p.id, p.ar, 'Maktoub', { sousTitre: false }),
    surRendu: ui => { const b = ui.cible.querySelector('.mot-cible'); if (b) b.onclick = () => ctx.parler(p.id, p.ar, 'Maktoub', { sousTitre: false }); },
    items: choix.map(x => ({ html: `<span class="emoji-grand" aria-hidden="true">${x.emoji}</span>`, bonne: x.id === m.id, aria: x.fr })), surJuste: () => ctx.parler(p.id, p.ar, 'Maktoub', { sousTitre: false }), apres: () => `${p.ar} — ${p.fr}`, enregistrer: enreg(ctx, p.id, 'lire') };
} });
// ---- Présentation d'un signe : exemples à toucher pour entendre ----
export async function presenter(ctx, { type, voy }) {
  const ui = enTete(ctx, '✨ Je découvre', 1); ui.aide.classList.add('cache'); ui.consigne.classList.add('cache'); let exemples, texte, signe;
  if (type === 'voyelle') { const d = VOYELLES_COURTES.find(v => v.id === voy); signe = ar('بـ' + SIGNES[voy], 'ar-geant'); texte = `${d.nom} : ${d.texte}. Elle fait « ${d.lecture} ».`; exemples = SYLLABES.filter(s => s.voy === voy).slice(0, ctx.groupe() === 'g34' ? 3 : 5); }
  else if (type === 'signes') { signe = ar('بْ', 'ar-geant') + ar('بّ', 'ar-geant'); texte = 'Le soukoun (un petit rond) : pas de voyelle. La chadda : on double la lettre.'; exemples = [...SOUKOUN.slice(0, 3), ...CHADDA]; }
  else { signe = ar('بَ → بَا', 'ar-geant'); texte = 'Voyelles longues : fatha + alif = « aa », kasra + ya = « ii », damma + waw = « ouu ». On tient le son.'; exemples = SYLLABES_LONGUES.filter(s => ['ba', 'mim', 'nun'].includes(s.cons)); }
  ui.cible.innerHTML = `<div class="presentation"><div class="signe-gros">${signe}</div><p>${texte}</p></div>`; ui.choix.className = 'act-choix exemples'; ui.choix.innerHTML = exemples.map(x => `<button class="tuile-ar ex" data-id="${x.id}">${ar(x.ar, 'ar-gros')}<small>${x.lecture}</small></button>`).join('') + `<button class="principal gros-b suite-pres">Continuer ▶</button>`;
  const intro = { fatha: 'etape_fatha', kasra: 'etape_kasra', damma: 'etape_damma' }[voy] || (type === 'signes' ? 'etape_soukoun' : 'etape_longues'); ctx.parler(intro, texte, 'Maktoub');
  await new Promise(fin => { ctx.surArret(fin); ui.choix.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('suite-pres')) return fin(); const x = parId[b.dataset.id]; C.vu(ctx.s, x.id); ctx.sauver(); b.classList.add('chante'); ctx.reagir('joie'); ctx.parler(x.id, x.ar, 'Maktoub', { sousTitre: false }).then(() => b.classList.remove('chante')); }); });
  return { ok: 1, ko: 0, aides: 0, tours: 1 };
}
