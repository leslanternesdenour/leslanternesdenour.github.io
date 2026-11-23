// JEU 3 — suivi réel de la progression en chiffres. Un élément (chiffre, nombre, calcul…) n'est « maîtrisé » qu'après plusieurs réussites dans des CONTEXTES différents (lire / écouter) :
// jamais sur une seule bonne réponse. Aucune punition, aucune perte : une erreur n'enlève rien. Sauvegarde par enfant (clé « ecole_chiffres », synchronisée comme les autres jeux).
import { ETAPES } from './donnees/chiffres.js?v=3';
export const CLE = 'ecole_chiffres';
export const etatInitial = () => ({ v: 1, age: null, groupe: null, sousTitres: true, muet: false, items: {}, etapes: {}, exercices: 0, dernier: null });
const groupeDe = age => (age <= 4 ? 'g34' : age <= 6 ? 'g56' : 'g710');
export function lire(brut) {
  const d = etatInitial(); if (!brut || typeof brut !== 'object') return d;
  if (['g34', 'g56', 'g710'].includes(brut.groupe)) d.groupe = brut.groupe; if (Number.isFinite(brut.age)) d.age = Math.max(3, Math.min(10, brut.age | 0));
  if (typeof brut.sousTitres === 'boolean') d.sousTitres = brut.sousTitres; d.muet = !!brut.muet; d.exercices = Math.max(0, brut.exercices | 0);
  if (brut.items && typeof brut.items === 'object') for (const [k, v] of Object.entries(brut.items)) if (v && typeof v === 'object') d.items[String(k).slice(0, 40)] = { ok: Math.max(0, v.ok | 0), ko: Math.max(0, v.ko | 0), contextes: Array.isArray(v.contextes) ? [...new Set(v.contextes.filter(x => typeof x === 'string').slice(0, 6))] : [], vu: !!v.vu };
  if (brut.etapes && typeof brut.etapes === 'object') for (const e of ETAPES) { const x = brut.etapes[e.id]; if (x) d.etapes[e.id] = { fini: !!x.fini, etoiles: Math.max(0, Math.min(3, x.etoiles | 0)) }; }
  return d;
}
export function reglerAge(s, age) { s.age = Math.max(3, Math.min(10, Number(age) | 0)); s.groupe = groupeDe(s.age); return s; }
export const groupe = s => s.groupe || 'g56';
export const item = (s, id) => s.items[id] || (s.items[id] = { ok: 0, ko: 0, contextes: [], vu: false });
export function enregistrer(s, { item: id, contexte, ok }) { const x = item(s, id); x.vu = true; s.exercices++; if (ok) { x.ok++; if (contexte && !x.contextes.includes(contexte)) x.contextes.push(contexte); } else x.ko++; return s; }
export const vu = (s, id) => { item(s, id).vu = true; return s; };
// stades : 0 nouveau, 1 découvert, 2 reconnu (1 réussite), 3 maîtrisé (≥ 3 réussites dans ≥ 2 contextes différents)
export function stade(s, id) { const x = s.items[id]; if (!x) return 0; if (x.ok >= 3 && x.contextes.length >= 2) return 3; if (x.ok >= 1) return 2; return x.vu ? 1 : 0; }
export const maitrises = (s, ids) => ids.filter(i => stade(s, i) >= 3);
export const aReviser = (s, ids, n = 3) => ids.filter(i => s.items[i] && s.items[i].ko > 0 && stade(s, i) < 3).slice(0, n);
export const etapeFaite = (s, id) => !!(s.etapes[id] && s.etapes[id].fini);
export const prochaineEtape = s => ETAPES.find(e => !etapeFaite(s, e.id)) || null;
export const nbChoix = s => (groupe(s) === 'g34' ? 2 : groupe(s) === 'g56' ? 3 : 4);
export const aideAutoMs = s => (groupe(s) === 'g34' ? 9000 : groupe(s) === 'g56' ? 16000 : null);
export function terminerEtape(s, id, { aides = 0, erreurs = 0 }) { const e = aides === 0 && erreurs <= 1 ? 3 : aides <= 2 && erreurs <= 4 ? 2 : 1; const c = s.etapes[id] || (s.etapes[id] = { fini: false, etoiles: 0 }); const premiere = !c.fini; c.fini = true; if (e > c.etoiles) c.etoiles = e; s.dernier = id; return { etoiles: e, premiere }; }
export const progressionGlobale = s => Math.round(ETAPES.filter(e => etapeFaite(s, e.id)).length / ETAPES.length * 100);
export function recompenses(s) { const etoiles = ETAPES.reduce((a, e) => a + ((s.etapes[e.id] || {}).etoiles || 0), 0) + Object.keys(s.items).filter(i => stade(s, i) >= 3).length; const lanternes = ETAPES.filter(e => etapeFaite(s, e.id)).length; return { etoiles, lanternes, diplome: lanternes === ETAPES.length }; }
