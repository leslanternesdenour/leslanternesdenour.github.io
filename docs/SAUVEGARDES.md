# Sauvegardes chiffrées de la base des comptes (Firestore)

Objectif : pouvoir retrouver les comptes, les profils enfants, les droits et les consentements si la base est perdue ou abîmée.
Le projet Firebase n'a pas de facturation : il n'a donc ni restauration à un instant donné ni sauvegarde planifiée native. Cette méthode est gratuite.

## Principe
1. **Export** de la base en lecture seule (rien n'est écrit ni supprimé dans Firestore).
2. **Compression**, puis **chiffrement au format `age`** avec une clé **publique**.
3. Un fichier daté `firestore-AAAA-MM-JJ-HH-MM.json.gz.age` et son empreinte `.sha256`, rangés **hors du dépôt**.

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
Une vraie vérification de lecture se fait avec la clé privée (exercice de restauration ci-dessous).

## Restaurer (exercice à faire dans un projet de TEST, jamais directement en production)
1. Créer un projet Firebase de test (nom contenant « test » ou « restauration »).
2. Déchiffrer avec la clé privée (sur l'ordinateur du propriétaire) :
   ```powershell
   node -e "import('./outils/sauvegarde/age-js.mjs').then(async m=>{const fs=require('fs');const b=await m.dechiffrer(fs.readFileSync(process.argv[1]),fs.readFileSync(process.argv[2],'utf8').trim());fs.writeFileSync(process.argv[3],b)})" "<fichier>.age" "<cle-privee>.txt" export.json
   ```
3. Importer : `outils/sauvegarde/restauration.mjs importer export.json` (voir l'en-tête du fichier : l'import refuse une base non vide et un projet qui ne ressemble pas à un projet de test). `export.json` contient des données personnelles : à supprimer après l'exercice.
4. `outils/sauvegarde/restauration.mjs comparer export.json` doit répondre « base identique à l'export ».

Les Auth (comptes de connexion) ne sont pas dans cet export : ils se réexportent par la console Firebase (Authentication) ou l'API Admin si besoin.

## Tests
- `bash outils/tests/tout.sh` : étape « Sauvegarde chiffrée » (base fictive, mauvaise clé et fichier altéré refusés, la source n'est jamais modifiée).
- `bash outils/sauvegarde/exercice-restauration.sh` : même exercice avec la commande `age` officielle.