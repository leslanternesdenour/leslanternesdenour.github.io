// Conseil IA : état, simulation sans dépense, vérification des clés, branche protégée, parcours de Claude comme auteur et relecteur.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { banc, avecTexte, rapport, analyseClaude, CLES } from './conseil-ia-banc.mjs';

const commande = () => import('../conseil-ia/conseil.mjs');
const idDossier = texte => texte.match(/Dossier : (\S+)/)[1];

test('simulation et état : le plan et le coût maximal sont annoncés sans appel, sans dossier et sans déchiffrer de clé', async () => {
  const { executer } = await commande(); const b = banc({ env: {} });
  fs.mkdirSync(path.join(b.dossier, 'cles')); fs.writeFileSync(path.join(b.dossier, 'cles', 'OPENAI_API_KEY.dpapi'), 'x');
  b.deps.dechiffrer = () => { throw new Error('ne doit pas être lu'); };
  assert.equal(await executer(['mission', '--mission', 'Trouver le bogue', '--fichier', 'page.js', '--simulation'], b.deps), 0, b.texte());
  assert.match(b.texte(), /SIMULATION/); assert.match(b.texte(), /GPT : gpt-6\.2-sol, coût maximal 0\.\d+ \$/);
  assert.equal(b.appels.length, 0); assert.equal(fs.existsSync(path.join(b.dossier, 'dossiers')), false);
  assert.equal(await executer(['etat'], b.deps), 0);
  assert.match(b.texte(), /GPT : activé .*clé enregistrée/); assert.match(b.texte(), /Gemini : activé .*aucune clé/); assert.match(b.texte(), /Claude : activé .*session/);
  assert.match(b.texte(), /aujourd'hui 0\.0000 \$ sur 3 \$/); assert.equal(b.appels.length, 0);
});

test('vérification : chaque clé et chaque modèle configuré sont contrôlés par une lecture gratuite', async () => {
  const { executer } = await commande();
  const b = banc({ reseau: url => url.includes('gemini-4-carbon') ? new Response('{}', { status: 404 }) : new Response('{}', { status: 200 }) });
  assert.equal(await executer(['verifier'], b.deps), 2, b.texte());
  assert.ok(b.appels.every(a => (a.init.method || 'GET') === 'GET' && !a.init.body));
  assert.ok(b.appels.some(a => a.url === 'https://api.openai.com/v1/models/gpt-6.2-sol'));
  assert.ok(b.appels.some(a => a.url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash'));
  assert.match(b.texte(), /gpt-6\.2-astra : accessible/); assert.match(b.texte(), /gemini-4-carbon : erreur HTTP 404/);
  for (const cle of Object.values(CLES)) assert.ok(!b.texte().includes(cle));
  assert.equal(fs.existsSync(path.join(b.dossier, 'registre.json')), false);
});

test('essai : un petit appel réel par fournisseur, sans fichier du projet ni dossier, avec modèle répondu, jetons et coût', async () => {
  const { executer } = await commande();
  const corps = JSON.stringify({ ...rapport, verdict: 'reserves' });
  const b = banc({ reseau: url => new Response(JSON.stringify(url.includes('openai')
    ? { model: 'gpt-6.2-sol-2026-10-01', status: 'completed', usage: { input_tokens: 1000, output_tokens: 500 }, output: [{ type: 'message', content: [{ type: 'output_text', text: corps }] }] }
    : { modelVersion: 'gemini-3.8-flash-002', usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 500 }, candidates: [{ finishReason: 'STOP', content: { parts: [{ text: corps }] } }] }), { status: 200 }) });
  assert.equal(await executer(['essai'], b.deps), 0, b.texte());
  assert.equal(b.appels.length, 2);
  for (const a of b.appels) { assert.ok(!a.init.body.includes('let a = 1;')); assert.ok(a.init.body.length < 6000); assert.match(a.init.body, /"(max_output_tokens|maxOutputTokens)":4000/); }
  assert.match(b.texte(), /GPT : réussi · demandé gpt-6\.2-sol, répondu gpt-6\.2-sol-2026-10-01 · jetons 1000 \+ 500 · coût 0\.0070 \$/);
  assert.match(b.texte(), /Gemini : réussi · demandé gemini-3\.8-flash, répondu gemini-3\.8-flash-002 · jetons 1000 \+ 500 · coût 0\.0053 \$/);
  assert.equal(fs.existsSync(path.join(b.dossier, 'dossiers')), false);
  assert.equal(JSON.parse(fs.readFileSync(path.join(b.dossier, 'registre.json'), 'utf8')).length, 2);
  const eco = banc({ env: { OPENAI_API_KEY: CLES.OPENAI_API_KEY }, reseau: () => new Response('{"error":{"message":"modele inconnu"}}', { status: 404 }) });
  assert.equal(await executer(['essai', '--profil', 'economique'], eco.deps), 1);
  assert.match(eco.appels[0].init.body, /"model":"gpt-6-luna"/); assert.match(eco.texte(), /GPT : échec .*404.*modele inconnu/); assert.match(eco.texte(), /Gemini : échec .*aucune clé/);
});

test('vérification : la liste des modèles réellement ouverts à chaque clé est affichée', async () => {
  const { executer } = await commande();
  const b = banc({ reseau: url => {
    if (url === 'https://api.openai.com/v1/models') return new Response(JSON.stringify({ data: [{ id: 'gpt-6.2-sol' }, { id: 'gpt-9-neuf' }, { id: 'whisper-1' }] }), { status: 200 });
    if (url.startsWith('https://generativelanguage.googleapis.com/v1beta/models?')) return new Response(JSON.stringify({ models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-embedding-1', supportedGenerationMethods: ['embedContent'] }] }), { status: 200 });
    return new Response('{}', { status: 200 });
  } });
  assert.equal(await executer(['verifier'], b.deps), 0, b.texte());
  assert.match(b.texte(), /GPT, modèles ouverts à cette clé \(2\) : gpt-6\.2-sol ✓, gpt-9-neuf\n/);
  assert.match(b.texte(), /Gemini, modèles ouverts à cette clé \(1\) : gemini-3\.8-flash ✓(\n|$)/);
});

test('Claude auteur : sa proposition suit les mêmes contrôles, un autre modèle la relit, et rien ne s\'essaie sur une branche protégée', async () => {
  const { executer } = await commande(); const b = banc({ reseau: avecTexte({ ...rapport, verdict: 'bloquant' }) });
  await executer(['mission', '--mission', 'Trouver le bogue', '--fichier', 'page.js', '--agents', 'claude'], b.deps);
  const id = idDossier(b.texte()), lancer = (...a) => executer([...a, '--dossier', id], b.deps);
  assert.equal(await lancer('deposer', '--fichier', analyseClaude(b)), 0, b.texte());
  assert.equal(await lancer('proposer'), 0, b.texte()); assert.equal(b.appels.length, 0);
  const f = path.join(b.dossier, 'p.json'); fs.writeFileSync(f, JSON.stringify({ resume: 'r', correctif: 'diff --git a/page.js b/page.js\n--- a/page.js\n+++ b/page.js\n@@ -1 +1 @@\n-let a = 1;\n+let a = 3;\n', tests_proposes: [], risques: [] }));
  assert.equal(await lancer('deposer', '--type', 'proposition', '--fichier', f), 0, b.texte());
  assert.equal(await lancer('relire'), 2, b.texte()); assert.equal(b.appels.length, 1); assert.match(b.texte(), /relecture bloquante/);
  execFileSync('git', ['symbolic-ref', 'HEAD', 'refs/heads/main'], { cwd: b.racine });
  assert.equal(await lancer('controler'), 3); assert.match(b.texte(), /« main » protégée/);
});

test('ligne de commande : le programme se lance réellement et sort avec le bon code, sans rien écrire hors du dossier personnel', () => {
  const b = banc(), script = fileURLToPath(new URL('../conseil-ia/conseil.mjs', import.meta.url));
  const env = { ...process.env, USERPROFILE: b.dossier, HOME: b.dossier, OPENAI_API_KEY: '', GEMINI_API_KEY: '' };
  const etat = spawnSync(process.execPath, [script, 'etat'], { cwd: b.racine, env, encoding: 'utf8' });
  assert.equal(etat.status, 0, etat.stderr); assert.match(etat.stdout, /Gemini : activé/);
  assert.equal(spawnSync(process.execPath, [script, 'desactiver', 'gemini'], { cwd: b.racine, env }).status, 0);
  assert.ok(fs.existsSync(path.join(b.dossier, '.lanternes-ia', 'etat.json')));
  assert.equal(spawnSync(process.execPath, [script, 'nimporte'], { cwd: b.racine, env }).status, 3);
});
