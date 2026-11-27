// Conseil IA : les clés se saisissent à l'écran, masquées, dans le terminal de la personne ; jamais en argument, jamais en clair sur le disque.
import test from 'node:test'; import assert from 'node:assert/strict';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { banc } from './conseil-ia-banc.mjs';

const cles = () => import('../conseil-ia/lib/cles.mjs');

test('saisie : hors d\'un terminal interactif, la configuration est refusée', async () => {
  const { executer } = await import('../conseil-ia/conseil.mjs'); const b = banc();
  assert.equal(await executer(['configurer'], { ...b.deps, interactif: false }), 3);
  assert.match(b.texte(), /dans votre propre terminal/); assert.equal(fs.existsSync(path.join(b.dossier, 'cles')), false);
});

test('saisie : un collage raté ou une clé du mauvais fournisseur est redemandé, jamais enregistré ni affiché', { skip: process.platform !== 'win32' }, async () => {
  const { SAISIE, dechiffrerWindows } = await cles(); const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-saisie-'));
  const googleErronee = 'AI' + 'za' + 'collee-au-mauvais-endroit-0001', bonne = 'sk-' + 'essai-valide-0123456789';
  // OpenAI : Ctrl+V reçu comme un seul caractère, puis la clé Google, puis la bonne clé. Gemini : trois collages ratés.
  const clavier = `$global:frappes = New-Object Collections.Queue; foreach ($f in @([string][char]22, "${googleErronee}", "  ${bonne}  ", "court", "avec une espace au milieu de la saisie", [string][char]22)) { $global:frappes.Enqueue($f) }
function Read-Host { param($Prompt, [switch]$AsSecureString) $f = $global:frappes.Dequeue(); ConvertTo-SecureString $f -AsPlainText -Force }
`;
  const env = Object.fromEntries(Object.entries(process.env).filter(([n]) => n.toLowerCase() !== 'psmodulepath'));
  const sortie = execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', clavier + SAISIE], { env: { ...env, LDN_DOSSIER_CLES: dossier }, encoding: 'utf8' });
  assert.deepEqual(fs.readdirSync(dossier), ['OPENAI_API_KEY.dpapi']);
  assert.equal(dechiffrerWindows(path.join(dossier, 'OPENAI_API_KEY.dpapi')), bonne);
  assert.match(sortie, /Collage non recu/); assert.match(sortie, /autre fournisseur/); assert.match(sortie, /Gemini : non enregistree/);
  for (const frappe of [googleErronee, bonne, 'avec une espace']) assert.ok(!sortie.includes(frappe));
});

test('saisie : chaque clé tapée est enregistrée chiffrée et relisible ; une saisie vide ne change rien', { skip: process.platform !== 'win32' }, async () => {
  const { SAISIE, dechiffrerWindows } = await cles(); const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'ldn-saisie-'));
  // Seule la frappe est simulée : le reste du script est celui qui sert réellement.
  const clavier = 'function Read-Host { param($Prompt, [switch]$AsSecureString) if ($Prompt -match "OpenAI") { ConvertTo-SecureString "frappe-essai-7731-longue" -AsPlainText -Force } else { New-Object Security.SecureString } };\n';
  const env = Object.fromEntries(Object.entries(process.env).filter(([n]) => n.toLowerCase() !== 'psmodulepath'));
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', clavier + SAISIE], { env: { ...env, LDN_DOSSIER_CLES: dossier } });
  assert.deepEqual(fs.readdirSync(dossier), ['OPENAI_API_KEY.dpapi']);
  const fichier = path.join(dossier, 'OPENAI_API_KEY.dpapi');
  assert.ok(!fs.readFileSync(fichier, 'utf8').includes('frappe')); assert.equal(dechiffrerWindows(fichier), 'frappe-essai-7731-longue');
});
