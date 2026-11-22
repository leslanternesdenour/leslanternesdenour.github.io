// LE DÉFI DE NOUR (Salle des défis) — une épreuve qui MÉLANGE plusieurs compétences : une manche de chasse, de son, de jumelles, d'intruse, de formes, de puzzle.
// Elle n'utilise que des lettres déjà rencontrées. Aucune manche n'est chronométrée ; le défi se termine toujours par un succès, jamais par un échec.
import chasse from './chasse.js?v=1'; import son, { disponible } from './son.js?v=1'; import jumelles, { groupesJumeaux } from './jumelles.js?v=1'; import intrus from './intrus.js?v=1'; import formes from './formes.js?v=1'; import puzzle from './puzzle.js?v=1';
import { PAR_ID } from '../donnees/lettres.js?v=1';
import { melanger, pause } from './commun.js?v=1';
export default async function defi(ctx, { lettres }) {
  const g = ctx.groupe(), rng = ctx.rng; const manches = [['chasse', chasse]]; if (disponible(ctx, lettres)) manches.push(['son', son]); if (groupesJumeaux(lettres).length) manches.push(['jumelles', jumelles]);
  manches.push(['intrus', intrus]); if (g !== 'g34' && lettres.some(id => PAR_ID[id].joint)) manches.push(['formes', formes]); manches.push(['puzzle', puzzle]);
  const suite = melanger(manches, rng).slice(0, g === 'g34' ? 4 : 5); const res = { ok: 0, ko: 0, aides: 0, tours: 0 };
  await ctx.parler('defi', 'Voici le défi de Maktoub : un petit peu de tout ce que tu sais !', 'Maktoub');
  for (const [nom, act] of suite) { if (!ctx.vivant()) break; const r = await act(ctx, { lettres, tours: 1 }); res.ok += r.ok || 0; res.ko += r.ko || 0; res.aides += r.aides || 0; res.tours += r.tours || 0; await pause(250); }
  ctx.s.defis++; return res;
}
