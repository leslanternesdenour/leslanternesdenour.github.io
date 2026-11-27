// Banc d'essai commun aux tests du conseil IA : projet jetable, faux réseau, fausses clés. Aucun appel réel.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';

export const rapport = { verdict: 'ok', resume: 'Rien à signaler.', constats: [], non_verifie: [] };
export const CLES = { OPENAI_API_KEY: 'cle-essai-openai-0001', GEMINI_API_KEY: 'cle-essai-gemini-0002' };
const repondre = corps => new Response(JSON.stringify(corps), { status: 200 });
export const avecTexte = objet => url => url.includes('openai')
  ? repondre({ status: 'completed', usage: { input_tokens: 1000, output_tokens: 500 }, output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(objet) }] }] })
  : repondre({ usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 500 }, candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(objet) }] } }] });
export const succes = avecTexte(rapport);

export function banc({ env = CLES, reseau = succes } = {}) {
  const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-projet-')), dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-donnees-'));
  fs.writeFileSync(path.join(racine, 'page.js'), 'let a = 1;\n');
  execFileSync('git', ['init', '-q', '-b', 'preproduction'], { cwd: racine });
  const appels = [], sortie = [];
  // Les mécanismes à trois modèles (arbitrage) sont essayés sur une configuration d'essai, distincte de la configuration réelle.
  const config = JSON.parse(fs.readFileSync(new URL('./conseil-ia-config-trois.json', import.meta.url), 'utf8'));
  const deps = { config, env, cwd: racine, dossier,ecrire: t => sortie.push(t), attendre: async () => {}, maintenant: () => new Date('2026-11-26T10:00:00Z'),
    fetch: async (url, init) => { appels.push({ url, init }); return reseau(url, init); } };
  return { racine, dossier, appels, deps, texte: () => sortie.join('\n') };
}
export const analyseClaude = (b, extra = {}) => {
  const f = path.join(b.dossier, 'claude.json');
  fs.writeFileSync(f, JSON.stringify({ verdict: 'bloquant', resume: 'Vu par Claude.', constats: [{ gravite: 'critique', categorie: 'c', fichier: 'page.js', ligne: 1, constat: 'Constat de Claude', preuve: '`let a = 1;`', recommandation: 'r', confiance: 'haute' }], non_verifie: [], ...extra }));
  return f;
};
// Empreinte de tout le projet : sert à prouver que rien n'y est écrit.
export const empreinte = racine => fs.readdirSync(racine, { recursive: true }).filter(f => fs.statSync(path.join(racine, f)).isFile()).sort().map(f => `${f}:${fs.readFileSync(path.join(racine, f)).toString('base64')}`).join('|');
