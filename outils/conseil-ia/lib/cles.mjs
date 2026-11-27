// Lecture des clés : variable d'environnement d'abord, puis coffre chiffré (hors du dépôt).
import fs from 'node:fs'; import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Refus } from './garde.mjs';

export const VARIABLES = { gpt: 'OPENAI_API_KEY', gemini: 'GEMINI_API_KEY' };

const DECHIFFRER = '$ErrorActionPreference="Stop"; $s = Get-Content -LiteralPath $env:LDN_FICHIER -Raw | ForEach-Object { $_.Trim() } | ConvertTo-SecureString; [Console]::Out.Write([Net.NetworkCredential]::new("", $s).Password)';

// Saisie masquée puis chiffrement DPAPI. Lancé en ligne de commande : la politique d'exécution des scripts n'a pas à être changée.
// Une saisie masquée ne se relit pas : un collage raté ou une clé mal placée doit être détecté ici, sans jamais l'afficher.
export const SAISIE = String.raw`$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path $env:LDN_DOSSIER_CLES | Out-Null
foreach ($cle in @(@("OPENAI_API_KEY", "OpenAI", "^(AIza|AQ\.)"), @("GEMINI_API_KEY", "Gemini", "^sk-"))) {
  if ($env:LDN_FOURNISSEURS -and ($env:LDN_FOURNISSEURS -split ",") -notcontains $cle[1]) { continue }
  $etat = "non enregistree"
  foreach ($essai in 1..3) {
    $saisie = Read-Host -Prompt ("Cle API " + $cle[1] + " (saisie masquee, Entree pour passer)") -AsSecureString
    if ($saisie.Length -eq 0) { $etat = "inchangee"; break }
    $texte = [Net.NetworkCredential]::new("", $saisie).Password.Trim()
    if ($texte.Length -lt 20 -or $texte -match "[^\x21-\x7E]") { Write-Host ("Collage non recu ou incomplet (" + $texte.Length + " caracteres). Essayez Ctrl+Maj+V ou un clic droit."); continue }
    if ($texte -cmatch $cle[2]) { Write-Host "Cette cle semble venir d'un autre fournisseur."; continue }
    ConvertTo-SecureString $texte -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath (Join-Path $env:LDN_DOSSIER_CLES ($cle[0] + ".dpapi")) -Encoding Ascii
    $etat = "enregistree, chiffree pour votre compte Windows (" + $texte.Length + " caracteres recus)"; break
  }
  $texte = $null
  Write-Host ($cle[1] + " : " + $etat)
}`;

const environnementPowerShell = extra => ({ ...Object.fromEntries(Object.entries(process.env).filter(([nom]) => nom.toLowerCase() !== 'psmodulepath')), ...extra });

// Seules les clés des modèles présents dans la configuration sont demandées.
const FOURNISSEURS_DE_CLES = { gpt: 'OpenAI', gemini: 'Gemini' };
export const fournisseursASaisir = config => Object.keys(config.agents).map(a => FOURNISSEURS_DE_CLES[a]).filter(Boolean).join(',');

export function configurer(ctx) {
  if (!ctx.interactif) throw new Refus('à lancer vous-même, dans votre propre terminal : « node outils/conseil-ia/conseil.mjs configurer ». Ne collez jamais une clé dans une conversation.');
  if (process.platform !== 'win32') throw new Refus(`hors Windows, définir les variables ${Object.keys(ctx.config.agents).map(a => VARIABLES[a]).filter(Boolean).join(' et ')}`);
  execFileSync('powershell.exe', ['-NoProfile', '-Command', SAISIE], { env: environnementPowerShell({ LDN_DOSSIER_CLES: path.join(ctx.dossier, 'cles'), LDN_FOURNISSEURS: fournisseursASaisir(ctx.config) }), stdio: 'inherit' });
  ctx.ecrire('Vérifier ensuite : node outils/conseil-ia/conseil.mjs verifier');
  return 0;
}

// Seul le compte Windows qui a enregistré la clé peut la déchiffrer. Le chemin passe par l'environnement, jamais dans la commande.
export function dechiffrerWindows(fichier) {
  if (process.platform !== 'win32') throw new Refus('le coffre chiffré n\'existe que sous Windows : utiliser une variable d\'environnement');
  try {
    // PSModulePath hérité de PowerShell 7 empêche Windows PowerShell de charger ConvertTo-SecureString : il est retiré.
    return execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', DECHIFFRER], { env: environnementPowerShell({ LDN_FICHIER: fichier }), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 20_000 });
  } catch { throw new Refus(`clé illisible dans le coffre (${path.basename(fichier)}) : la réenregistrer avec « conseil.mjs configurer »`); }
}

export function lireCle(agent, { env, dossier, dechiffrer }) {
  const variable = VARIABLES[agent];
  if (env[variable]?.trim()) return { valeur: env[variable].trim(), source: `variable ${variable}` };
  const fichier = path.join(dossier, 'cles', `${variable}.dpapi`);
  if (!fs.existsSync(fichier)) return null;
  return { valeur: dechiffrer(fichier).trim(), source: 'coffre chiffré' };
}
