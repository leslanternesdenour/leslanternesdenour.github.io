// Correctifs proposés : essayés dans une copie du projet. Aucune fonction d'ici n'écrit dans le projet lui-même.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Refus, masquerSecrets, raisonFichierInterdit } from './garde.mjs';
import { git } from './documents.mjs';
import { lancerTests } from './verification.mjs';

export const jeter = copie => fs.rmSync(copie, { recursive: true, force: true, maxRetries: 3 });

// Copie de travail : fichiers suivis et nouveaux (travail en cours compris), jamais les fichiers ignorés ou sensibles.
export function copier(racine) {
  const copie = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-essai-')));
  for (const f of git(racine, 'ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean)) {
    const source = path.join(racine, f);
    if (raisonFichierInterdit(f) || !fs.existsSync(source) || !fs.lstatSync(source).isFile()) continue;
    fs.mkdirSync(path.dirname(path.join(copie, f)), { recursive: true }); fs.copyFileSync(source, path.join(copie, f));
  }
  git(copie, 'init', '-q');
  return copie;
}

// Ce qu'aucun correctif proposé ne peut modifier : les garde-fous eux-mêmes, la configuration de publication, les secrets.
const PROTEGES = /^(\.claude\/|\.github\/|\.git|outils\/conseil-ia\/|outils\/tests\/conseil-ia|wrangler\.toml$|CLAUDE\.md$)/i;

function filtrer(correctif) {
  if (!correctif.trim()) throw new Refus('correctif vide');
  if (correctif.length > 200_000) throw new Refus('correctif trop volumineux (200 000 caractères maximum)');
  if (/^(GIT binary patch|Binary files )/m.test(correctif)) throw new Refus('correctif binaire refusé');
  if (/^(rename |copy |old mode |new mode |(new|deleted) file mode (?!100644|100755))/m.test(correctif)) throw new Refus('correctif refusé : renommage, lien ou droits modifiés');
  if (masquerSecrets(correctif).nombre) throw new Refus('correctif refusé : il contient une clé ou un secret');
}

// Le code proposé s'exécute avec les permissions de Node réduites à la copie, et un environnement sans aucune variable privée.
// Node présente ce modèle comme une ceinture de sécurité, pas comme une frontière absolue : relire le correctif reste obligatoire.
export function testerEnBacASable(copie, fichiers) {
  const tout = path.join(copie, '*'), temporaire = path.join(copie, '.essai-tmp');
  fs.mkdirSync(temporaire, { recursive: true });
  const env = { ...(process.env.SystemRoot && { SystemRoot: process.env.SystemRoot }), TEMP: temporaire, TMP: temporaire, TMPDIR: temporaire };
  // Bibliothèques installées au-dessus de la copie : lecture seule.
  const bibliotheques = [];
  for (let d = path.dirname(copie); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, 'node_modules'))) bibliotheques.push(`--allow-fs-read=${path.join(d, 'node_modules', '*')}`);
    if (d === path.dirname(d)) break;
  }
  return lancerTests(copie, fichiers, ['--permission', `--allow-fs-read=${tout}`, `--allow-fs-write=${tout}`, ...bibliotheques], env);
}

export function essayer(racine, correctif) {
  filtrer(correctif);
  const copie = copier(racine), lancer = (...a) => execFileSync('git', ['-c', 'core.autocrlf=false', 'apply', ...a], { cwd: copie, input: correctif.endsWith('\n') ? correctif : `${correctif}\n`, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  let fichiers;
  const refuser = message => { jeter(copie); throw new Refus(message); };
  const echec = e => refuser(`le correctif ne s'applique pas : ${String(e.stderr || e.message).trim().slice(0, 400)}`);
  // La liste des fichiers touchés vient de git lui-même, pas d'une lecture maison des en-têtes.
  try { fichiers = lancer('--numstat', '-z').split('\0').filter(Boolean).map(l => l.split('\t')[2]); } catch (e) { echec(e); }
  const protege = fichiers.find(f => PROTEGES.test(f) || raisonFichierInterdit(f));
  if (protege) refuser(`correctif refusé : fichier protégé (${protege})`);
  try { lancer('--ignore-whitespace'); } catch (e) { echec(e); }
  return { copie, fichiers };
}
