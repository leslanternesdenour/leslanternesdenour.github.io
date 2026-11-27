// Critères mesurables, appliqués de la même façon à Claude, GPT et Gemini. Ils mesurent ce qui est démontré, pas qui parle.
import { confronter } from './rapport.mjs';

const GRAVES = new Set(['critique', 'haute']);
const compact = t => t.replace(/\s+/g, ' ').trim();

// Extraits de code cités : entre accents graves ou guillemets ; à défaut la preuve entière est l'extrait.
const extraits = preuve => {
  const cites = [...preuve.matchAll(/`([^`]+)`|«\s*([^»]+?)\s*»|"([^"]+)"/g)].map(m => m[1] || m[2] || m[3]);
  return (cites.length ? cites : [preuve]).map(compact).filter(e => e.length >= 6);
};

export function estAncre(constat, documents) {
  const doc = documents.find(d => d.chemin === constat.fichier?.replaceAll('\\', '/').replace(/^\.\//, ''));
  if (!doc || !Number.isInteger(constat.ligne)) return false;
  const lignes = doc.contenu.replace(/\r?\n$/, '').split(/\r?\n/);
  if (constat.ligne < 1 || constat.ligne > lignes.length) return false;
  const voisinage = compact(lignes.slice(Math.max(0, constat.ligne - 11), constat.ligne + 10).join('\n'));
  return extraits(constat.preuve || '').some(e => voisinage.includes(e));
}

export function comparer(analyses, documents) {
  const [a, b] = analyses, c = confronter(analyses), notes = Object.fromEntries(analyses.map(x => [x.agent, noter(x.rapport, documents).score]));
  const verdicts = [a.rapport.verdict, b.rapport.verdict];
  const motifs = [
    ...(verdicts.includes('ok') && verdicts.includes('bloquant') ? ['verdicts opposés (ok / bloquant)'] : []),
    ...c.isoles.filter(i => GRAVES.has(i.constat.gravite)).map(i => `constat ${i.constat.gravite} signalé par ${i.agent} seul : ${i.constat.constat}`),
    ...c.memesEndroits.filter(m => m.ecartDeGravite && (GRAVES.has(m[a.agent].gravite) || GRAVES.has(m[b.agent].gravite))).map(m => `écart de gravité au même endroit : ${m[a.agent].constat}`),
  ];
  // Retenue : la note de preuve la plus haute. Une égalité ou une note absente ne départage personne.
  const na = notes[a.agent], nb = notes[b.agent];
  const retenue = na === null || nb === null || na === nb ? null : na > nb ? a.agent : b.agent;
  return { notes, retenue, desaccordImportant: motifs.length > 0, motifs };
}

export function noter(rapport, documents) {
  const constats = rapport.constats.map(c => ({ ...c, ancre: estAncre(c, documents) }));
  return { constats, score: constats.length ? constats.filter(c => c.ancre).length / constats.length : null };
}
