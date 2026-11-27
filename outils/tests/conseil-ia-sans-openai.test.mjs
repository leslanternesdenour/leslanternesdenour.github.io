// Conseil IA tel qu'il est configuré : Claude et Gemini seulement. OpenAI n'est ni demandé, ni vérifié, ni contacté.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { banc, analyseClaude, CLES } from './conseil-ia-banc.mjs';

const reelle = () => JSON.parse(fs.readFileSync(new URL('../conseil-ia/conseil.config.json', import.meta.url), 'utf8'));

test('configuration réelle : deux modèles, aucune trace d\'OpenAI', () => {
  assert.deepEqual(Object.keys(reelle().agents), ['claude', 'gemini']);
  assert.ok(!/gpt|openai/i.test(JSON.stringify(reelle())));
});

test('configuration réelle : aucune commande ne contacte OpenAI, même si une variable OPENAI_API_KEY traîne', async () => {
  const { executer } = await import('../conseil-ia/conseil.mjs'); const b = banc({ env: CLES }); delete b.deps.config;
  assert.equal(await executer(['etat'], b.deps), 0, b.texte()); assert.ok(!/GPT/.test(b.texte()));
  assert.equal(await executer(['verifier'], b.deps), 0, b.texte());
  assert.equal(await executer(['essai'], b.deps), 0, b.texte());
  assert.equal(await executer(['essai', '--agents', 'gpt'], b.deps), 3);
  assert.equal(await executer(['mission', '--mission', 'm', '--agents', 'gpt'], b.deps), 3);
  assert.equal(await executer(['mission', '--mission', 'Sécurité : vérifier ce traitement', '--fichier', 'page.js'], b.deps), 0, b.texte());
  const id = b.texte().match(/Dossier : (\S+)/)[1];
  assert.equal(await executer(['deposer', '--dossier', id, '--fichier', analyseClaude(b)], b.deps), 0, b.texte());
  assert.ok(b.appels.length >= 3); assert.deepEqual([...new Set(b.appels.map(a => new URL(a.url).hostname))], ['generativelanguage.googleapis.com']);
});

test('configuration réelle : la saisie ne demande que la clé Gemini', { skip: process.platform !== 'win32' }, async () => {
  const { SAISIE, fournisseursASaisir } = await import('../conseil-ia/lib/cles.mjs');
  assert.equal(fournisseursASaisir(reelle()), 'Gemini');
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-saisie-'));
  const clavier = 'function Read-Host { param($Prompt, [switch]$AsSecureString) Write-Host ("DEMANDE " + $Prompt); New-Object Security.SecureString };\n';
  const env = Object.fromEntries(Object.entries(process.env).filter(([n]) => n.toLowerCase() !== 'psmodulepath'));
  const sortie = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', clavier + SAISIE], { env: { ...env, LDN_DOSSIER_CLES: dossier, LDN_FOURNISSEURS: 'Gemini' }, encoding: 'utf8' });
  assert.match(sortie, /DEMANDE Cle API Gemini/); assert.ok(!/OpenAI/.test(sortie));
});
