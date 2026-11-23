// JEU 3 — les activités des chiffres et des nombres. Elles réutilisent le moteur d'activités « à choix » du Jeu 1 (jouerChoix) : mêmes retours, même aide douce, jamais de punition ni de chronomètre.
import { jouerChoix, enTete, melanger } from '../../lettres/activites/commun.js?v=3';
import { CHIFFRES, ecrire, NOMS, FR, nomArabe, suiteAudio, OBJETS } from '../donnees/chiffres.js?v=3';
import * as C from '../moteur.js?v=3';
export const num = (n, cls = '') => `<span class="ar-texte num ${cls}" lang="ar" dir="ltr">${ecrire(n)}</span>`;
export const ar = (t, cls = '') => `<span class="ar-texte ${cls}" lang="ar" dir="rtl">${t}</span>`;
const groupe = (n, o) => `<span class="groupe-objets" role="img" aria-label="${n} ${o.fr}">${Array.from({ length: n }, () => `<i>${o.e}</i>`).join('')}</span>`;
const objet = ctx => melanger(OBJETS, ctx.rng)[0];
// dit un nombre (suite d'audios) ; sans audio disponible : sous-titre en français
export async function dire(ctx, n, sousTitre = true) { const ids = suiteAudio(n); if (!ids) return; for (let i = 0; i < ids.length; i++) { const id = ids[i], txt = id.startsWith('et.') ? ET_TXT(id) : NOMS[+id.slice(3)]; await ctx.parler(id, txt, 'Maktoub', { sousTitre: sousTitre && i === ids.length - 1 }); } }
import { ET_DIZAINE } from '../donnees/chiffres.js?v=3';
const ET_TXT = id => ET_DIZAINE[+id.slice(3)];
const autres = (ctx, bonne, pool, k) => melanger(pool.filter(x => x !== bonne), ctx.rng).slice(0, k);
const piocher = (ctx, pool) => { const rev = C.aReviser(ctx.s, pool.map(n => 'nb.' + n)).map(i => +i.slice(3)); return (rev.length && ctx.rng() < 0.5 ? melanger(rev, ctx.rng) : melanger(pool, ctx.rng))[0]; };
const enreg = (ctx, n, contexte) => (it, ok) => ({ item: 'nb.' + n, contexte, ok: ok === true });
// ---- Présentation : on touche chaque chiffre pour l'entendre et voir les objets ----
export async function presenter(ctx, { nombres }) {
  const ui = enTete(ctx, '✨ Je découvre', 1); ui.aide.classList.add('cache'); ui.consigne.classList.add('cache'); const o = objet(ctx), vus = new Set(); ui.cible.innerHTML = `<div class="presentation"><div class="signe-gros" id="gros-num">${num(nombres[0], 'ar-geant')}</div><div id="gros-obj"></div><p id="gros-nom"></p></div>`; ui.choix.className = 'act-choix exemples';
  ui.choix.innerHTML = nombres.map(n => `<button class="tuile-ar ex" data-n="${n}" aria-label="${FR[n]}">${num(n, 'ar-gros')}<small>${FR[n]}</small></button>`).join('') + `<button class="principal gros-b suite-pres">Continuer ▶</button>`;
  const montrer = n => { ui.cible.querySelector('#gros-num').innerHTML = num(n, 'ar-geant'); ui.cible.querySelector('#gros-obj').innerHTML = n <= 20 ? groupe(n, o) : ''; ui.cible.querySelector('#gros-nom').innerHTML = `${NOMS[n] ? ar(NOMS[n], 'ar-moyen') : ''} — ${FR[n]}`; };
  montrer(nombres[0]);
  await new Promise(fin => { ctx.surArret(fin); ui.choix.addEventListener('click', async e => { const b = e.target.closest('button'); if (!b) return; if (b.classList.contains('suite-pres')) return fin(); const n = +b.dataset.n; vus.add(n); C.vu(ctx.s, 'nb.' + n); ctx.sauver(); montrer(n); b.classList.add('chante'); ctx.reagir('joie'); await dire(ctx, n); b.classList.remove('chante'); }); });
  return { ok: Math.max(1, vus.size), ko: 0, aides: 0, tours: Math.max(1, vus.size) };
}
// ---- Compter : on voit des objets, on choisit le chiffre ----
export const compter = (ctx, { nombres, tours = 4 }) => jouerChoix(ctx, { titre: '🧮 Je compte', tours, construire() {
  const n = piocher(ctx, nombres), o = objet(ctx), choix = melanger([n, ...autres(ctx, n, nombres.length >= 3 ? nombres : [...nombres, n + 1, n - 1].filter(x => x >= 0 && x <= 20), C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<div class="cible-objets">${groupe(n, o)}</div>`, consigne: { id: 'c_compte', texte: 'Compte les objets, puis touche le bon chiffre.' }, items: choix.map(x => ({ html: num(x, 'ar-gros'), bonne: x === n, aria: FR[x] })), surJuste: () => dire(ctx, n, false), apres: () => `${FR[n]} ${o.fr}`, enregistrer: enreg(ctx, n, 'compter') };
} });
// ---- Lire un chiffre : on voit le chiffre, on choisit le bon nombre d'objets ----
export const lireChiffre = (ctx, { nombres, tours = 4 }) => jouerChoix(ctx, { titre: '👀 Je lis le chiffre', tours, construire() {
  const n = piocher(ctx, nombres.filter(x => x <= 20)), o = objet(ctx), pool = nombres.filter(x => x <= 20), choix = melanger([n, ...autres(ctx, n, pool.length >= 3 ? pool : [...pool, n + 1, n - 1].filter(x => x >= 0 && x <= 20), C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<div class="cible-syl">${num(n, 'ar-geant')}</div>`, consigne: { id: 'c_lire', texte: 'Lis le chiffre, puis touche le bon nombre d’objets.' }, items: choix.map(x => ({ html: groupe(x, o), bonne: x === n, aria: `${x}` })), surJuste: () => dire(ctx, n, false), apres: () => `${ecrire(n)} : ${FR[n]}`, enregistrer: enreg(ctx, n, 'lire') };
} });
// ---- Écouter : on entend un nombre, on choisit le chiffre / le nombre écrit ----
export const ecouter = (ctx, { nombres, tours = 4 }) => jouerChoix(ctx, { titre: '👂 J\'écoute le nombre', tours, construire() {
  const n = piocher(ctx, nombres), pool = nombres.length >= 3 ? nombres : [...new Set([...nombres, ...nombres.map(x => x + 1), ...nombres.map(x => x - 1)])].filter(x => x >= 0 && x <= 20), choix = melanger([n, ...autres(ctx, n, pool, C.nbChoix(ctx.s) - 1)], ctx.rng), ids = suiteAudio(n);
  return { mode: 'grille', cible: `<button class="lanterne-son" aria-label="Écouter">🏮<span>Écoute</span></button>`, consigne: { id: n > 20 ? 'c_nombre' : 'c_ecoute', texte: 'Écoute le nombre, puis touche le bon chiffre.' }, rejouer: () => dire(ctx, n, false),
    surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => dire(ctx, n, false); }, items: choix.map(x => ({ html: num(x, 'ar-gros'), bonne: x === n, aria: FR[x] })), apres: () => `${ecrire(n)} : ${FR[n]}`, enregistrer: enreg(ctx, n, 'ecouter'),
    son: ids && ids.length === 1 ? { id: ids[0], texte: nomArabe(n), qui: 'Maktoub' } : undefined };
} });
// ---- La suite : quel nombre vient après ? ----
export const suite = (ctx, { max = 10, tours = 4 }) => jouerChoix(ctx, { titre: '➡️ Quel nombre vient après ?', tours, construire() {
  const n = Math.floor(ctx.rng() * Math.min(max, 19)), reponse = n + 1, choix = melanger([reponse, ...autres(ctx, reponse, Array.from({ length: Math.min(max, 20) + 1 }, (_, i) => i), C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<div class="cible-syl">${num(n, 'ar-geant')}<span class="fleche">➡️</span><span class="inconnu">?</span></div>`, consigne: { id: 'c_suite', texte: 'Quel nombre vient après ?' }, items: choix.map(x => ({ html: num(x, 'ar-gros'), bonne: x === reponse, aria: FR[x] })), surJuste: () => dire(ctx, reponse, false), apres: () => `Après ${FR[n]}, il y a ${FR[reponse]}.`, enregistrer: enreg(ctx, reponse, 'suite') };
} });
// ---- Les grands nombres (21–99, 100, 1000) : on entend, on choisit le nombre écrit ----
export const grands = (ctx, { tours = 4 }) => jouerChoix(ctx, { titre: '💯 Les grands nombres', tours, construire() {
  const dizaines = [20, 30, 40, 50, 60, 70, 80, 90], d = dizaines[Math.floor(ctx.rng() * dizaines.length)], u = 1 + Math.floor(ctx.rng() * 9), n = d + u, faux = melanger([d + (u % 9) + 1, (d === 20 ? 30 : d - 10) + u, u * 10 + (d / 10 % 10 || 2), n + 10].filter(x => x !== n && x > 20 && x < 100), ctx.rng), choix = melanger([n, ...faux.slice(0, C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<button class="lanterne-son" aria-label="Écouter">🏮<span>Écoute</span></button>`, consigne: { id: 'c_nombre', texte: 'Écoute le nombre, puis touche le bon nombre écrit.' }, rejouer: () => dire(ctx, n, false),
    surRendu: ui => { const b = ui.cible.querySelector('.lanterne-son'); if (b) b.onclick = () => dire(ctx, n, false); setTimeout(() => dire(ctx, n, false), 600); }, items: choix.map(x => ({ html: num(x, 'ar-gros'), bonne: x === n, aria: FR[x] || String(x) })),
    apres: () => `${ecrire(n)} : ${nomArabe(n)}`, enregistrer: enreg(ctx, n, 'grands') };
} });
// ---- Petits calculs avec des objets (+ et −) ----
export const calculer = (ctx, { max = 10, tours = 4 }) => jouerChoix(ctx, { titre: '➕ Les petits calculs', tours, construire() {
  const plus = ctx.rng() < 0.6, o = objet(ctx), a = 1 + Math.floor(ctx.rng() * (max - 1)), b = plus ? 1 + Math.floor(ctx.rng() * (max - a)) : 1 + Math.floor(ctx.rng() * (a - 1 || 1)), r = plus ? a + b : a - b, choix = melanger([r, ...autres(ctx, r, Array.from({ length: max + 1 }, (_, i) => i), C.nbChoix(ctx.s) - 1)], ctx.rng);
  return { mode: 'grille', cible: `<div class="calcul">${groupe(a, o)}<b>${plus ? '+' : '−'}</b>${groupe(b, o)}<b>=</b><span class="inconnu">?</span><p class="op">${num(a, 'ar-moyen')} ${plus ? '+' : '−'} ${num(b, 'ar-moyen')}</p></div>`, consigne: { id: 'c_calcul', texte: 'Fais le calcul, puis touche le résultat.' }, items: choix.map(x => ({ html: num(x, 'ar-gros'), bonne: x === r, aria: FR[x] })),
    surJuste: () => dire(ctx, r, false), apres: () => `${ecrire(a)} ${plus ? '+' : '−'} ${ecrire(b)} = ${ecrire(r)}`, enregistrer: enreg(ctx, r, 'calculer') };
} });
