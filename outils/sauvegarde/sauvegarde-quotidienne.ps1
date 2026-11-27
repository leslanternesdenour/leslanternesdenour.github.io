# Sauvegarde quotidienne chiffree : Firestore + Authentication -> dossier local -> bucket R2 prive (si le jeton est present).
# A lancer a la main ou depuis le Planificateur de taches Windows (voir docs/SAUVEGARDES.md). Lecture seule sur Firebase, aucune suppression.
# Ne contient AUCUN secret : le compte de service (GOOGLE_APPLICATION_CREDENTIALS) et le jeton Cloudflare (CLOUDFLARE_API_TOKEN) sont lus
# dans les variables d'environnement UTILISATEUR de Windows. La cle privee de dechiffrement n'est jamais utilisee ici.
param(
  [string]$Dossier = "$env:USERPROFILE\outils-claude\sauvegardes\firestore",
  [string]$ClePublique = "$env:USERPROFILE\outils-claude\secrets\sauvegarde-cle-publique.txt",
  [string]$Bucket = 'ldn-sauvegardes',
  [switch]$SansR2,
  [int]$Essais = 3,
  [int]$PauseEssais = 300
)
$ErrorActionPreference = 'Stop'
# Les sorties de Node sont en UTF-8 : sans ceci, PowerShell 5.1 les lit en page de code OEM et les accents du journal sont abimes.
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8
$racine = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
New-Item -ItemType Directory -Force $Dossier | Out-Null
$journal = Join-Path $Dossier 'journal-sauvegarde.log'
function Ecrire-Journal([string]$m) { $l = '{0:yyyy-MM-dd HH:mm:ss}  {1}' -f (Get-Date), $m; Add-Content -Path $journal -Value $l -Encoding utf8; Write-Host $l }
foreach ($v in 'GOOGLE_APPLICATION_CREDENTIALS', 'CLOUDFLARE_API_TOKEN') {
  if (-not [Environment]::GetEnvironmentVariable($v, 'Process')) { $x = [Environment]::GetEnvironmentVariable($v, 'User'); if ($x) { [Environment]::SetEnvironmentVariable($v, $x, 'Process') } }
}
Set-Location $racine
# Jusqu'a $Essais tentatives (pause $PauseEssais s entre deux) : le Planificateur Windows ne relance pas une tache qui se termine en erreur, c'est donc au script de le faire.
for ($essai = 1; $essai -le $Essais; $essai++) {
  try {
    Ecrire-Journal "Debut de la sauvegarde (essai $essai/$Essais)"
    node outils/sauvegarde/sauvegarder.mjs --sortie="$Dossier" --cle-publique="$ClePublique" 2>&1 | ForEach-Object { Ecrire-Journal ('  ' + ($_ -replace '"familles/[^"]+":\d+,?', '')) }
    if ($LASTEXITCODE -ne 0) { throw "La sauvegarde a echoue (code $LASTEXITCODE)" }
    if ($SansR2) { Ecrire-Journal 'Envoi vers R2 ignore (-SansR2)' }
    elseif (-not $env:CLOUDFLARE_API_TOKEN) { Ecrire-Journal 'ATTENTION : CLOUDFLARE_API_TOKEN absent : sauvegardes gardees en local seulement, rien envoye vers R2' }
    else {
      node outils/sauvegarde/r2.mjs envoyer --dossier="$Dossier" --bucket="$Bucket" --executer 2>&1 | ForEach-Object { Ecrire-Journal ('  ' + $_) }
      if ($LASTEXITCODE -ne 0) { throw "L'envoi vers R2 a echoue (code $LASTEXITCODE)" }
      node outils/sauvegarde/r2.mjs retention --dossier="$Dossier" --bucket="$Bucket" 2>&1 | ForEach-Object { Ecrire-Journal ('  ' + $_) }   # simulation : aucune suppression
    }
    Ecrire-Journal 'Sauvegarde terminee'
    exit 0
  } catch {
    Ecrire-Journal ("ECHEC (essai $essai/$Essais) : " + $_.Exception.Message)
    if ($essai -lt $Essais) { Ecrire-Journal "Nouvel essai dans $PauseEssais secondes"; Start-Sleep -Seconds $PauseEssais }
  }
}
Ecrire-Journal "ECHEC DEFINITIF apres $Essais essais"
exit 1
