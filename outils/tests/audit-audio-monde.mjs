// Contrôle technique des voix des trois jeux du Monde (ablutions, prière, calendrier) : aucun appel réseau, aucun crédit.
// Pour chaque clip de voix.json : fichier présent, durée lisible, repères cohérents, signal non silencieux.
// ATTENTION : un MP3 sain ne prouve PAS que la prononciation est correcte (validation humaine nécessaire).
import { readFileSync, existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
const sh = promisify(execFile);
const racine = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const jeux = ['ablutions', 'priere', 'calendrier'];
const problemes = [], resume = {};
async function dur(f) { try { const { stdout } = await sh('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]); return parseFloat(stdout); } catch { return NaN; } }
async function niveau(f, t0, t1) {
  try { const { stderr } = await sh('ffmpeg', ['-v', 'info', '-ss', String(t0), '-t', String(Math.max(0.05, t1 - t0)), '-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { maxBuffer: 1 << 24 });
    const m = /max_volume: (-?[\d.]+|-inf) dB/.exec(stderr), a = /mean_volume: (-?[\d.]+|-inf) dB/.exec(stderr); return { max: m ? parseFloat(m[1]) : -Infinity, moy: a ? parseFloat(a[1]) : -Infinity }; } catch { return null; }
}
for (const j of jeux) {
  const dir = path.join(racine, j, 'voix'), vx = JSON.parse(readFileSync(path.join(dir, 'voix.json'), 'utf8'));
  const cles = Object.keys(vx); let ok = 0, secondes = 0; const cache = new Map();
  const files = [...new Set(Object.values(vx).map(c => c[0]))];
  await Promise.all(files.map(async f => { const p = path.resolve(dir, f); cache.set(f, existsSync(p) ? await dur(p) : null); }));
  const aTraiter = [];
  for (const k of cles) {
    const [f, d0, d1] = vx[k], p = path.resolve(dir, f), D = cache.get(f);
    if (D === null) { problemes.push(`${j}/${k} : fichier ABSENT (${f})`); continue; }
    if (!(D > 0)) { problemes.push(`${j}/${k} : fichier illisible (${f})`); continue; }
    if (!(d1 > d0)) { problemes.push(`${j}/${k} : repères invalides ${d0}→${d1}`); continue; }
    if (d1 > D + 0.15) problemes.push(`${j}/${k} : fin ${d1}s > durée du fichier ${D.toFixed(2)}s (clip tronqué)`);
    if (d1 - d0 < 0.3) problemes.push(`${j}/${k} : clip trop court (${(d1 - d0).toFixed(2)}s)`);
    aTraiter.push([k, p, d0, d1]);
  }
  for (let i = 0; i < aTraiter.length; i += 12) await Promise.all(aTraiter.slice(i, i + 12).map(async ([k, p, d0, d1]) => {
    const n = await niveau(p, d0, d1); if (!n) { problemes.push(`${j}/${k} : analyse impossible`); return; }
    secondes += d1 - d0;
    if (n.max < -45) problemes.push(`${j}/${k} : SILENCIEUX (max ${n.max} dB)`); else if (n.moy < -42) problemes.push(`${j}/${k} : très faible (moy ${n.moy} dB)`); else ok++;
  }));
  resume[j] = { clips: cles.length, ok, fichiers: files.length, minutes: +(secondes / 60).toFixed(1) };
}
console.log(JSON.stringify(resume)); console.log(problemes.length ? problemes.join('\n') : 'AUCUN PROBLÈME TECHNIQUE'); process.exit(problemes.length ? 1 : 0);
