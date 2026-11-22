// MOTEUR PÉDAGOGIQUE de l'École des lettres arabes — logique pure (sans DOM ni 3D), testée seule (outils/tests/ecole-lettres.test.mjs).
// Il suit, pour CHAQUE lettre, cinq stades réels : découverte → reconnaissance → son → formes → maîtrise. Une lettre n'est jamais « maîtrisée » après une seule bonne réponse :
// il faut plusieurs réussites, dans plusieurs activités différentes, et un bon taux de réussite récent. L'âge règle le départ et le confort (nombre de choix, aides) mais ne
// ferme aucune porte : une évaluation initiale et l'adaptation dynamique tiennent compte des compétences réellement acquises. Aucune punition, aucune perte après une absence.
import { LETTRES, PAR_ID, IDS, CHAPITRES, groupeDepuisAge, formesDe } from '../donnees/lettres.js?v=1';
export const CLE = 'ecole_lettres';
export const STADES = ['nouvelle', 'decouverte', 'reconnaissance', 'son', 'formes', 'maitrise'];
export const NOMS_STADES = { nouvelle: 'À découvrir', decouverte: 'Découverte', reconnaissance: 'Reconnue', son: 'Son connu', formes: 'Formes connues', maitrise: 'Maîtrisée' };
export const COMPETENCES = ['reco', 'son', 'formes', 'trace'];

export function etatInitial() { return { v: 1, age: null, groupe: null, niveau: null, placement: false, sousTitres: true, muet: false, lettres: {}, chapitres: {}, exercices: 0, defis: 0, dernier: null }; }
const compVide = () => ({ ok: 0, ko: 0, contextes: [], recent: [] });
const lettreVide = () => ({ vue: false, reco: compVide(), son: compVide(), formes: compVide(), trace: compVide(), conf: {} });
export function lettre(s, id) { return s.lettres[id] || (s.lettres[id] = lettreVide()); }
const nettoyer = c => { const o = compVide(); if (c && typeof c === 'object') { o.ok = Math.max(0, c.ok | 0); o.ko = Math.max(0, c.ko | 0); o.contextes = Array.isArray(c.contextes) ? [...new Set(c.contextes.filter(x => typeof x === 'string'))].slice(0, 12) : []; o.recent = Array.isArray(c.recent) ? c.recent.slice(-6).map(x => (x ? 1 : 0)) : []; } return o; };
export function lire(brut) {
  const d = etatInitial(); if (!brut || typeof brut !== 'object') return d;
  if (['g34', 'g56', 'g710'].includes(brut.groupe)) d.groupe = brut.groupe; if (Number.isFinite(brut.age)) d.age = Math.max(3, Math.min(10, brut.age | 0));
  if (['debutant', 'intermediaire', 'avance'].includes(brut.niveau)) d.niveau = brut.niveau; d.placement = !!brut.placement; if (typeof brut.sousTitres === 'boolean') d.sousTitres = brut.sousTitres; d.muet = !!brut.muet;
  if (brut.lettres && typeof brut.lettres === 'object') for (const id of IDS) { const x = brut.lettres[id]; if (!x) continue; const l = lettreVide(); l.vue = !!x.vue; for (const c of COMPETENCES) l[c] = nettoyer(x[c]);
    if (x.conf && typeof x.conf === 'object') for (const [k, v] of Object.entries(x.conf)) if (PAR_ID[k] && Number(v) > 0) l.conf[k] = Number(v) | 0; d.lettres[id] = l; }
  if (brut.chapitres && typeof brut.chapitres === 'object') for (const c of CHAPITRES) { const x = brut.chapitres[c.id]; if (x) d.chapitres[c.id] = { etoiles: Math.max(0, Math.min(3, x.etoiles | 0)), fini: !!x.fini }; }
  d.exercices = Math.max(0, brut.exercices | 0); d.defis = Math.max(0, brut.defis | 0); if (brut.dernier && typeof brut.dernier === 'object') d.dernier = { espace: String(brut.dernier.espace || ''), chapitre: String(brut.dernier.chapitre || '') };
  return d;
}
export function reglerAge(s, age) { s.age = Math.max(3, Math.min(10, Number(age) | 0)); s.groupe = groupeDepuisAge(s.age); return s; }
export const groupe = s => s.groupe || 'g56';

// ----- enregistrement d'un résultat d'exercice -----
// contexte : nom de l'activité (chasse, son, formes, jumelles, intrus, trace, puzzle…) ; confusion : la lettre prise à tort (le cas échéant)
export function enregistrer(s, { lettre: id, competence, contexte, ok, confusion }) {
  if (!PAR_ID[id] || !COMPETENCES.includes(competence)) return s; const l = lettre(s, id), c = l[competence]; l.vue = true; s.exercices++;
  if (ok) { c.ok++; if (contexte && !c.contextes.includes(contexte)) c.contextes.push(contexte); } else { c.ko++; if (confusion && PAR_ID[confusion]) l.conf[confusion] = (l.conf[confusion] || 0) + 1; }
  c.recent.push(ok ? 1 : 0); if (c.recent.length > 6) c.recent.shift(); return s;
}
export const decouverte = (s, id) => { if (PAR_ID[id]) lettre(s, id).vue = true; return s; };

// ----- stades -----
const confirme = (c, n = 2, ctx = 2) => c.ok >= n && c.contextes.length >= ctx;
const tauxRecent = l => { const r = [...l.reco.recent, ...l.son.recent, ...l.formes.recent]; return r.length ? r.reduce((a, b) => a + b, 0) / r.length : 0; };
export function stade(s, id) {
  const l = s.lettres[id]; if (!l || !l.vue) return 0;
  if (!confirme(l.reco)) return 1;
  if (!confirme(l.son)) return 2;
  if (!(l.formes.ok >= 2 || !formesDe(PAR_ID[id]).slice(1).length && l.formes.ok >= 1)) return 3;       // les formes : au moins 2 réussites (1 suffit si la lettre n'a pas de forme liée à étudier)
  const ctx = new Set([...l.reco.contextes, ...l.son.contextes, ...l.formes.contextes, ...l.trace.contextes]);
  if (ctx.size >= 3 && tauxRecent(l) >= 0.8) return 5;
  return 4;
}
export const nomStade = (s, id) => STADES[stade(s, id)];
export const nbStade = (s, min) => IDS.filter(id => stade(s, id) >= min).length;
export const connues = s => IDS.filter(id => stade(s, id) >= 2);
export const maitrisees = s => IDS.filter(id => stade(s, id) >= 5);
export const decouvertes = s => IDS.filter(id => stade(s, id) >= 1);
export const progressionGlobale = s => Math.round((IDS.reduce((a, id) => a + stade(s, id), 0) / (IDS.length * 5)) * 100);

// Lettres à réviser : jamais confirmées, d'abord celles qui sont confondues ou ratées récemment (révision ciblée), jamais plus de n
export function aReviser(s, n = 4) {
  const cand = IDS.filter(id => stade(s, id) >= 1 && stade(s, id) < 5);
  const score = id => { const l = s.lettres[id], conf = Object.values(l.conf).reduce((a, b) => a + b, 0), rat = [...l.reco.recent, ...l.son.recent, ...l.formes.recent].filter(x => !x).length; return conf * 2 + rat - stade(s, id) * 0.3; };
  return cand.sort((a, b) => score(b) - score(a)).slice(0, n);
}
// Paires de lettres souvent confondues (pour un exercice ciblé)
export function confusions(s, n = 3) { const L = []; for (const id of IDS) { const l = s.lettres[id]; if (l) for (const [k, v] of Object.entries(l.conf)) L.push({ a: id, b: k, n: v }); } return L.sort((x, y) => y.n - x.n).slice(0, n); }

// ----- évaluation initiale (jamais pour les 3-4 ans) et niveau -----
export const QUESTIONS_PLACEMENT = ['ba', 'jim', 'dal', 'sin', 'ayn', 'mim'];
export function resultatPlacement(s, reponses) {     // reponses : [{lettre, ok}]
  const bons = reponses.filter(r => r.ok).length; s.placement = true;
  s.niveau = bons <= 1 ? 'debutant' : bons <= 4 ? 'intermediaire' : 'avance';
  for (const r of reponses) if (r.ok) { const l = lettre(s, r.lettre); l.vue = true; l.reco.ok = Math.max(l.reco.ok, 1); }     // une première trace, qui doit encore être CONFIRMÉE par des exercices
  return s.niveau;
}
export const niveau = s => s.niveau || (groupe(s) === 'g34' ? 'debutant' : groupe(s) === 'g56' ? 'debutant' : 'intermediaire');
// Nombre de choix proposés : l'âge fixe le confort, les compétences acquises le font évoluer (jamais plus de 4)
export function nbChoix(s) {
  const g = groupe(s), c = connues(s).length, base = g === 'g34' ? 2 : g === 'g56' ? 3 : 4;
  return Math.min(4, base + (niveau(s) === 'avance' ? 1 : 0) + (c >= 14 ? 1 : 0) - (g === 'g34' && c < 4 ? 0 : 0));
}
export const toleranceTrace = s => ({ g34: { couvre: 0.4, dehors: 0.7 }, g56: { couvre: 0.55, dehors: 0.55 }, g710: { couvre: 0.65, dehors: 0.4 } }[groupe(s)]);
export const aideAutoMs = s => (groupe(s) === 'g34' ? 9000 : groupe(s) === 'g56' ? 16000 : null);

// ----- choix des lettres d'un exercice -----
const melanger = (a, rng) => { const p = [...a]; for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
// Lettres déjà rencontrées ou du chapitre en cours : on ne questionne jamais sur une lettre jamais vue
export function disponibles(s, chapitreIdx = null) { const ids = new Set(decouvertes(s)); if (chapitreIdx != null) for (let i = 0; i <= chapitreIdx; i++) for (const id of CHAPITRES[i].lettres) ids.add(id); return IDS.filter(id => ids.has(id)); }
// Distracteurs : pour les petits, des lettres bien différentes ; pour les plus grands (ou dès que la lettre est connue), les lettres JUMELLES d'abord
export function distracteurs(s, cible, n, rng = Math.random, dispo = null) {
  const pool = (dispo || disponibles(s)).filter(id => id !== cible), famille = PAR_ID[cible].famille, jumelles = pool.filter(id => PAR_ID[id].famille === famille), autres = pool.filter(id => PAR_ID[id].famille !== famille);
  const fort = groupe(s) !== 'g34' && (stade(s, cible) >= 2 || niveau(s) === 'avance'); const res = [];
  const ordre = fort ? [...melanger(jumelles, rng), ...melanger(autres, rng)] : [...melanger(autres, rng), ...melanger(jumelles, rng)];
  for (const id of ordre) { if (res.length >= n) break; res.push(id); } return res;
}
export function choisirCible(s, rng = Math.random, dispo = null) {     // priorité aux lettres à réviser, puis aux lettres les moins avancées
  const pool = dispo || disponibles(s); if (!pool.length) return IDS[0]; const rev = aReviser(s, 4).filter(id => pool.includes(id));
  if (rev.length && rng() < 0.6) return rev[Math.floor(rng() * rev.length)]; const tri = [...pool].sort((a, b) => stade(s, a) - stade(s, b)); return tri[Math.floor(rng() * Math.min(4, tri.length))];
}

// ----- chapitres, récompenses -----
export const chapitreIdx = id => CHAPITRES.findIndex(c => c.id === id);
export const lettresDuChapitre = id => CHAPITRES[chapitreIdx(id)].lettres;
export const chapitreFait = (s, id) => !!(s.chapitres[id] && s.chapitres[id].fini);
export const prochainChapitre = s => CHAPITRES.find(c => !chapitreFait(s, c.id)) || null;
export const etoilesPour = (aides, erreurs) => (aides === 0 && erreurs <= 1 ? 3 : aides <= 2 && erreurs <= 4 ? 2 : 1);
export function terminerChapitre(s, id, { aides = 0, erreurs = 0 }) {
  const e = etoilesPour(aides, erreurs), c = s.chapitres[id] || (s.chapitres[id] = { etoiles: 0, fini: false }); const premiere = !c.fini; c.fini = true; if (e > c.etoiles) c.etoiles = e; s.dernier = { espace: 'parcours', chapitre: id }; return { etoiles: e, premiere };
}
// Récompenses RECALCULÉES depuis les acquisitions réelles (jamais additionnées : recharger ne donne rien en double)
export function recompenses(s) {
  const etoiles = IDS.reduce((a, id) => a + (stade(s, id) >= 2 ? 1 : 0) + (stade(s, id) >= 5 ? 1 : 0), 0) + CHAPITRES.reduce((a, c) => a + ((s.chapitres[c.id] || {}).etoiles || 0), 0);
  const lanternes = CHAPITRES.filter(c => chapitreFait(s, c.id)).length, badges = [], tot = k => IDS.reduce((a, id) => a + ((s.lettres[id] || { [k]: { ok: 0 } })[k].ok), 0);
  if (decouvertes(s).length >= 1) badges.push('premiere-lettre'); if (tot('trace') >= 10) badges.push('traceur'); if (tot('son') >= 10) badges.push('bonne-oreille'); if (tot('formes') >= 10) badges.push('maitre-des-formes');
  if (s.defis >= 3) badges.push('champion-des-defis'); for (const c of CHAPITRES) if (c.lettres.every(id => stade(s, id) >= 2)) badges.push('famille-' + c.id);
  const diplomes = []; if (IDS.every(id => stade(s, id) >= 2)) diplomes.push('explorateur'); if (IDS.every(id => stade(s, id) >= 5)) diplomes.push('maitre');
  return { etoiles, lanternes, badges, diplomes, maxEtoiles: IDS.length * 2 + CHAPITRES.length * 3 };
}
