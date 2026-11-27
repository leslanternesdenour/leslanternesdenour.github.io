# Sauvegardes chiffrées des comptes (Firestore et Firebase Authentication)

Objectif : pouvoir retrouver les comptes, les profils enfants, les droits et les consentements si la base est perdue ou abîmée.
Le projet Firebase n'a pas de facturation : il n'a donc ni restauration à un instant donné ni sauvegarde planifiée native. Cette méthode est gratuite.

## Principe
1. **Export** de la base en lecture seule (rien n'est écrit ni supprimé dans Firestore).
2. **Compression**, puis **chiffrement au format `age`** avec une clé **publique**.
3. Deux fichiers datés, rangés **hors du dépôt**, chacun avec son empreinte `.sha256` : `firestore-AAAA-MM-JJ-HH-MM.json.gz.age` (familles, profils enfants, droits, invitations, consentements, journaux) et `auth-AAAA-MM-JJ-HH-MM.json.gz.age` (comptes de connexion).

Le fichier est illisible sans la **clé privée**, qui reste chez le propriétaire. Une fuite du fichier (ou de l'espace de stockage) ne révèle donc aucune donnée.
La collection `courriers` (compteurs anti-spam) n'est pas sauvegardée : elle ne contient que des horodatages.

## Première fois : créer les clés (à faire par le propriétaire)
```powershell
node outils/sauvegarde/generer-cle.mjs --privee="$env:USERPROFILE\Documents\cle-privee-sauvegarde-LDN.txt" --publique="$env:USERPROFILE\outils-claude\secrets\sauvegarde-cle-publique.txt"
```
- La **clé privée** (`AGE-SECRET-KEY-…`) : à copier dans un gestionnaire de mots de passe **et** sur une clé USB, puis à retirer de `Documents`. **Sans elle, les sauvegardes sont perdues pour toujours.** Ne jamais la coller dans un chat, ne jamais la mettre dans le dépôt.
- La **clé publique** (`age1…`) ne sert qu'à chiffrer : elle peut être lue par les outils automatiques.
- Prérequis : la bibliothèque `age-encryption` (`npm i age-encryption`, ou `LDN_MODULES=<dossier node_modules>`).

## Sauvegarder
Compte de service en lecture : `GOOGLE_APPLICATION_CREDENTIALS` (fichier JSON hors dépôt, voir `docs/` privé de l'administrateur).
```powershell
# 1. Essai à blanc : affiche seulement le nombre de documents par collection
node outils/sauvegarde/sauvegarder.mjs --a-blanc
# 2. Sauvegarde réelle
node outils/sauvegarde/sauvegarder.mjs --sortie="$env:USERPROFILE\outils-claude\sauvegardes\firestore" --cle-publique="$env:USERPROFILE\outils-claude\secrets\sauvegarde-cle-publique.txt"
```
Le programme refuse d'écraser un fichier existant et ne supprime jamais d'ancienne sauvegarde. Rythme conseillé : une fois par semaine, et avant toute opération sur la base.
Garder au moins **deux copies** à des endroits différents (ordinateur + disque externe ou stockage privé). Un stockage R2 privé est prévu : il n'est pas créé tant que le propriétaire n'a pas donné son accord.

## Vérifier une sauvegarde
```powershell
Get-FileHash "<fichier>.age" -Algorithm SHA256   # doit être égal au contenu du fichier .sha256
```
Vérification complète avec la clé privée (à lancer par le propriétaire ; n'affiche que des nombres, jamais de donnée ni la clé) :
```powershell
node outils/sauvegarde/verifier-sauvegarde.mjs --fichier="<fichier>.age" --cle-privee="<fichier de la clé privée>"
```

## Restaurer (exercice à faire dans un projet de TEST, jamais directement en production)
1. Créer un projet Firebase de test (nom contenant « test » ou « restauration »).
2. Déchiffrer avec la clé privée (sur l'ordinateur du propriétaire) :
   ```powershell
   node -e "import('./outils/sauvegarde/age-js.mjs').then(async m=>{const fs=require('fs');const b=await m.dechiffrer(fs.readFileSync(process.argv[1]),fs.readFileSync(process.argv[2],'utf8').trim());fs.writeFileSync(process.argv[3],b)})" "<fichier>.age" "<cle-privee>.txt" export.json
   ```
3. Importer : `outils/sauvegarde/restauration.mjs importer export.json` (voir l'en-tête du fichier : l'import refuse une base non vide et un projet qui ne ressemble pas à un projet de test). `export.json` contient des données personnelles : à supprimer après l'exercice.
4. `outils/sauvegarde/restauration.mjs comparer export.json` doit répondre « base identique à l'export ».

Les comptes de connexion se restaurent avec la sauvegarde `auth-…` (section suivante).

## Tests
- `bash outils/tests/tout.sh` : étape « Sauvegarde chiffrée » (base fictive, mauvaise clé et fichier altéré refusés, la source n'est jamais modifiée).
- `bash outils/sauvegarde/exercice-restauration.sh` : même exercice avec la commande `age` officielle.
## Validation de la procédure (27/11/2026)
Première sauvegarde réelle de `lanternes-de-nour` (85 documents : 4 familles, 4 profils enfants, 4 droits, 2 invitations, 35 événements Stripe, 9 consentements d'achat, 26 journaux d'administration, 1 accès offert), contrôlée avec la clé privée du propriétaire :
- empreinte SHA-256 conforme, déchiffrement réussi, format `ldn-export-1` reconnu ;
- restauration dans une base **isolée en mémoire** (aucune écriture réseau) : 85 documents sur 85, 0 différence avec la sauvegarde ; un second import dans une base non vide est refusé ;
- cohérence des données : chaque compte avec droits a une famille, chaque profil enfant est rattaché à une famille, 4 profils au plus par famille ;
- comparaison en lecture seule avec la base réelle au même moment : aucun écart.

Non couvert : la restauration dans un vrai projet Firebase de test n'a pas encore été faite (elle demande de créer un projet de test, avec l'accord du propriétaire).

## Comptes de connexion (Firebase Authentication)
**Ce que contient l'export `auth-…`** : pour chaque compte, l'identifiant, l'adresse, l'état de vérification, les fournisseurs (e-mail + mot de passe, Google), l'empreinte du mot de passe et son sel, le rôle éventuel (`customAttributes`), les dates. Il contient aussi la **configuration de hachage du projet** (SCRYPT, clé de signature, séparateur de sel) : sans elle, les mots de passe importés ne seraient plus valides. Cette clé de signature est un **secret** : l'export n'est donc jamais écrit en clair (mémoire, puis fichier `age` chiffré avec la clé publique du propriétaire). Les messages d'erreur ne reprennent jamais le contenu des réponses de l'API.

**Restauration** (projet de **test** uniquement, jamais la production) : `accounts:batchCreate` avec la configuration de hachage de l'export, sans écrasement (`allowOverwrite: false`).
- `lanternes-de-nour` (la production) est **refusé en dur** par l'outil, même avec une confirmation.
- Tout autre projet dont le nom ne contient ni « test » ni « restauration » exige `--cible-confirmee=<nom exact>`.
- Un projet qui contient déjà des comptes est refusé.
```powershell
# 1. déchiffrer en mémoire puis importer, dans un projet de TEST (compte de service de CE projet de test) :
node --input-type=module -e "import fs from 'fs'; import { dechiffrer } from './outils/sauvegarde/age-js.mjs'; import { importerAuth } from './outils/sauvegarde/auth.mjs'; const e = JSON.parse((await dechiffrer(fs.readFileSync(process.argv[1]), fs.readFileSync(process.argv[2],'utf8').trim())).toString()); console.log(await importerAuth(e, { projet: process.argv[3], compte: JSON.parse(fs.readFileSync(process.argv[4],'utf8')) }), 'compte(s) importé(s)')" "<auth-….age>" "<cle-privee>.txt" "ldn-restauration-test" "<compte-de-service-du-projet-de-test>.json"
```
Ensuite, comparer avec `comparerAuth` (dates de dernière connexion ignorées) et tester une connexion avec un compte de test. Les adresses des vrais parents ne doivent pas être utilisées pour envoyer des e-mails depuis un projet de test.

**Validé le 27/11/2026 (production, lecture seule)** : 4 comptes (2 e-mail + mot de passe, 2 Google ; 4 adresses vérifiées ; 1 rôle Créateur), 0 compte désactivé. Chaque famille Firestore a un compte de connexion et inversement ; les 2 comptes à mot de passe ont leur empreinte et leur sel ; la sauvegarde est identique aux comptes réels au même moment. La restauration a été validée par les tests (API fictive : mêmes comptes, SCRYPT, sans écrasement, production refusée). **Une restauration dans un vrai projet Firebase de test n'a pas été faite** : elle demande de créer un projet, ce que le compte de service `claude-admin` n'a pas le droit de faire.

## Copie hors de l'ordinateur : bucket R2 privé `ldn-sauvegardes`
Une sauvegarde qui n'existe que sur l'ordinateur ne protège pas d'une panne ou d'un vol. Les archives **déjà chiffrées** sont copiées dans un bucket R2 **distinct** de `ldn-premium` (l'outil refuse `ldn-premium`), privé, sans domaine public, lié à aucun site. R2 est déjà activé sur le compte Cloudflare ; le volume (quelques Ko par sauvegarde) reste très en dessous du palier gratuit (10 Go).

### Mise en place (une seule fois)
1. **Jeton Cloudflare limité** (à créer par le propriétaire, dans Cloudflare > Mon profil > Jetons API > Créer un jeton > personnalisé) : autorisation **Compte › Stockage R2 Workers › Modifier**, sur votre compte seulement. Ne le collez jamais dans un chat ni dans le dépôt. Rangez-le dans une variable d'environnement **utilisateur** sans l'afficher :
   ```powershell
   $s = Read-Host "Collez le jeton Cloudflare (rien ne s'affiche)" -AsSecureString
   [Environment]::SetEnvironmentVariable('CLOUDFLARE_API_TOKEN', [System.Net.NetworkCredential]::new('', $s).Password, 'User')
   ```
2. **Créer le bucket** (privé par défaut, placé en Europe de l'Ouest) et le **verrouiller 30 jours** : un objet ne peut plus être supprimé ni écrasé pendant 30 jours, même par erreur ou par un pirate qui aurait le jeton.
   ```powershell
   wrangler r2 bucket create ldn-sauvegardes --location weur
   wrangler r2 bucket lock add ldn-sauvegardes verrou-30-jours sauvegardes/ --retention-days 30
   ```
3. Ne **jamais** activer `r2.dev` ni un domaine personnalisé sur ce bucket.

### Envoyer, vérifier
```powershell
node outils/sauvegarde/r2.mjs envoyer --dossier="$env:USERPROFILE\outils-claude\sauvegardes\firestore" --bucket=ldn-sauvegardes            # simulation
node outils/sauvegarde/r2.mjs envoyer --dossier="$env:USERPROFILE\outils-claude\sauvegardes\firestore" --bucket=ldn-sauvegardes --executer
node outils/sauvegarde/r2.mjs statut  --dossier="$env:USERPROFILE\outils-claude\sauvegardes\firestore"
```
- Seuls les fichiers `firestore-…age` et `auth-…age` dont l'empreinte SHA-256 est conforme partent ; tout autre fichier du dossier est ignoré (jamais une clé, jamais un `.json` en clair).
- Chaque fichier est **relu depuis R2 et comparé (SHA-256)** avant d'être inscrit au manifeste `manifeste-r2.json` ; une différence arrête l'envoi.
- Les objets sont rangés `sauvegardes/<type>/<année>/<mois>/<fichier>`. Un second passage n'envoie que les nouveaux fichiers.

### Rétention
Règle appliquée par `r2.mjs retention` : **tout garder 14 jours**, puis **1 par semaine pendant 8 semaines**, puis **1 par mois pendant 12 mois** ; au-delà, un fichier devient candidat à la suppression. Les **3 plus récents** de chaque type sont toujours gardés, et un objet non vérifié n'est jamais proposé.
- Par défaut c'est une **simulation** ; `--appliquer` supprime, **5 objets au plus par passage**. Rien n'est jamais supprimé automatiquement, ni dans le dossier local.
- Le verrou de 30 jours empêche toute suppression plus précoce.

### Automatisation
`outils/sauvegarde/sauvegarde-quotidienne.ps1` enchaîne : sauvegarde Firestore + Authentication, chiffrement, copie vérifiée vers R2, simulation de rétention, et écrit un journal `journal-sauvegarde.log` (sans donnée personnelle). Sans `CLOUDFLARE_API_TOKEN`, il garde les fichiers en local et le dit dans le journal. Il lit le compte de service et le jeton dans les variables d'environnement **utilisateur** ; il n'utilise jamais la clé privée.

**Mise en place du 27/11/2026** : la tâche planifiée `Sauvegarde Lanternes de Nour` s'exécute chaque jour à **3 h** sous le compte de l'utilisateur (sans droits administrateur ; si l'ordinateur est éteint à 3 h, elle se lance dès que possible). Elle ne lance **pas** le dépôt de travail : elle utilise une **copie dédiée** (`C:\Users\zakar\outils-claude\depot-sauvegarde`, un `git worktree` du dépôt), pour que changer de branche dans le dépôt de travail ne casse jamais la sauvegarde.
```powershell
# Créer la copie dédiée et la tâche (déjà fait) :
git worktree add --detach "$env:USERPROFILE\outils-claude\depot-sauvegarde" <branche-contenant-les-scripts>
$a = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$env:USERPROFILE\outils-claude\depot-sauvegarde\outils\sauvegarde\sauvegarde-quotidienne.ps1`""
$r = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -WakeToRun -RunOnlyIfNetworkAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 45) -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName 'Sauvegarde Lanternes de Nour' -Action $a -Trigger (New-ScheduledTaskTrigger -Daily -At 3:00) -Settings $r
# Mettre la copie à jour (par exemple après la fusion dans preproduction) :
git -C "$env:USERPROFILE\outils-claude\depot-sauvegarde" fetch origin; git -C "$env:USERPROFILE\outils-claude\depot-sauvegarde" checkout --detach origin/preproduction
# Retirer la tâche :
Unregister-ScheduledTask -TaskName 'Sauvegarde Lanternes de Nour' -Confirm:$false
```
Où regarder si ça marche : `outils-claude\sauvegardes\firestore\journal-sauvegarde.log` (une ligne « Sauvegarde terminee » par jour), puis `node outils/sauvegarde/r2.mjs statut --dossier=…`. Le script a été exécuté de bout en bout le 27/11/2026 : à la main, par `schtasks /run` et par le déclencheur horaire réel (code 0 à chaque fois, 2 archives + envoi R2 vérifié, aucune suppression). **Le premier déclenchement automatique à 3 h reste à confirmer le 28/11 dans le journal.**

Réglages de la tâche et leur raison :
- **Batterie autorisée** (`AllowStartIfOnBatteries`, `DontStopIfGoingOnBatteries`) : par défaut Windows ne démarre pas une tâche sur batterie ; sur un portable, la tâche restait « En attente » indéfiniment.
- **`StartWhenAvailable`** : si l'ordinateur est éteint ou en veille à 3 h, la tâche part dès qu'il est rallumé **et que la session de l'utilisateur est ouverte** (la tâche ne s'exécute que session ouverte, sans mot de passe stocké).
- **`WakeToRun`** : réveille l'ordinateur en veille à 3 h, mais seulement **sur secteur** (les minuteurs de réveil sont désactivés sur batterie par le plan d'alimentation ; ce réglage n'a pas été modifié pour éviter qu'un portable dans un sac ne se réveille). Sur batterie en veille, la sauvegarde part au réveil suivant.
- **`RunOnlyIfNetworkAvailable`** : pas de lancement sans réseau.
- **Reprise après échec** : le Planificateur Windows ne relance **pas** une tâche qui se termine avec un code d'erreur (essai réel : aucune relance). C'est donc le script qui fait jusqu'à **3 essais, 5 minutes d'écart** (`-Essais`, `-PauseEssais`), journalisés ; après le troisième, il écrit « ECHEC DEFINITIF » et sort avec le code 1. Durée maximale de la tâche : 45 minutes.

### Validation de la copie R2 (27/11/2026)
- Bucket `ldn-sauvegardes` créé en **Europe de l'Ouest**, accès public `r2.dev` **désactivé**, **aucun domaine** connecté ; règle de verrouillage `verrou-30-jours` sur le préfixe `sauvegardes/` (30 jours).
- 3 archives envoyées puis **relues depuis R2** avec la même empreinte SHA-256 ; un second passage n'a rien à renvoyer.
- **Restauration depuis R2** : les 3 fichiers téléchargés, déchiffrés avec la clé privée du propriétaire et contrôlés (empreinte, format, comptes) ; copies temporaires supprimées.
- Le jeton Cloudflare `LDN-Sauvegardes-R2` (**Stockage R2 : Modifier**, compte seul) est dans la variable utilisateur `CLOUDFLARE_API_TOKEN` ; il **expire le 27/11/2027** : à renouveler avant. Il a été transmis dans une conversation : le **renouveler** (Cloudflare > Jetons API > Rouler) dès que possible est recommandé ; il suffit ensuite de poser la nouvelle valeur dans la variable.
### Restaurer depuis R2
`wrangler r2 object get ldn-sauvegardes/sauvegardes/<type>/<année>/<mois>/<fichier> --file <fichier> --remote`, puis la procédure « Vérifier » et « Restaurer » ci-dessus (clé privée du propriétaire).