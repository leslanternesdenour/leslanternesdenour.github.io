# Stratégie de sauvegarde et de restauration (D10) — proposition détaillée, à valider

**Rien de ce document n'est encore activé.** Coût prévu : 0 € (dans les offres gratuites, détails au § 5).

## 1. Ce qui est sauvegardé

| Donnée | Source de vérité | Sauvegarde | Fréquence |
|---|---|---|---|
| Code public (site) | GitHub `leslanternesdenour.github.io` | Paquet Git complet (`git bundle`, toutes les branches et tout l'historique) | chaque semaine + avant toute migration |
| Code et contenus Premium | futur dépôt **privé** + espace R2 privé | Paquet Git du dépôt privé + copie de l'espace R2 vers un espace de sauvegarde | chaque semaine |
| Base Firestore (familles, enfants, droits, invitations, journal) | Firebase (Spark) | Export JSON complet de toutes les collections | **chaque nuit** + avant toute migration |
| Comptes Firebase Authentication (e-mails, empreintes de mots de passe) | Firebase | Export des comptes | chaque semaine + avant toute migration |
| Paiements | Stripe | Stripe conserve tout ; un script de rapprochement reconstruit les droits depuis Stripe | — |
| Secrets (clés) | Cloudflare / GitHub secrets | **Pas de copie automatique** : liste et procédure de régénération dans le gestionnaire de mots de passe | à chaque changement |

## 2. Comment (technique)
- **Moteur** : un *workflow* GitHub Actions planifié dans le **dépôt privé** (gratuit dans le quota mensuel de GitHub).
  Le plan gratuit de Cloudflare ne convient pas : un Worker gratuit est limité à 10 ms de calcul et 50 sous-requêtes par exécution.
- **Export Firestore** : lecture de toutes les collections par l'API REST avec un compte de service **en lecture seule** ;
  à 1 000 familles, environ 5 000 documents, soit environ 5 000 lectures par nuit, dans le quota gratuit de 50 000 par jour.
- **Export des comptes** : `firebase auth:export` (outil officiel), qui inclut les empreintes de mots de passe nécessaires à la restauration.
- **Destination** : un espace R2 dédié `lanternes-sauvegardes`, **jamais public**, accessible avec une clé R2 limitée à cet espace.

## 3. Chiffrement
- **Au repos** : R2 chiffre tous les objets (AES-256, documentation Cloudflare).
- **En plus, avant l'envoi** : chaque fichier contenant des données personnelles (Firestore, comptes) est chiffré avec
  **age** (chiffrement moderne et éprouvé) grâce à une **clé publique**. La **clé privée** n'existe que chez vous :
  gestionnaire de mots de passe + copie papier. Même en cas de fuite de l'espace R2 ou du dépôt, les sauvegardes sont illisibles.
- **En transit** : HTTPS partout.
- Conséquence importante : **sans votre clé privée, aucune restauration n'est possible**. Elle doit être conservée en 2 endroits.

## 4. Durée de conservation (minimisation RGPD)
| Rotation | Conservées |
|---|---|
| Quotidiennes | 30 jours |
| Hebdomadaires | 12 semaines |
| Mensuelles | **6 mois** |

Un compte supprimé disparaît donc définitivement de toutes les sauvegardes au plus tard 6 mois après sa suppression.
Cette durée sera écrite dans la politique de confidentialité (à faire valider). Les journaux d'administration suivent la même règle.

## 5. Coûts estimés
| Élément | Volume estimé à 1 000 familles | Coût |
|---|---|---|
| R2 (stockage des sauvegardes) | < 1 Go en tout (exercice : 17 Ko par sauvegarde chiffrée pour 1 000 familles fictives ; 48 sauvegardes conservées) | 0 € (offre gratuite : 10 Go/mois) |
| Opérations R2 | quelques milliers par mois | 0 € (offre gratuite : 1 million d'écritures, 10 millions de lectures par mois) |
| Lectures Firestore | ~5 000 par nuit | 0 € (quota Spark : 50 000 par jour) |
| GitHub Actions (dépôt privé) | quelques minutes par jour | 0 € dans le quota gratuit mensuel (à confirmer lors de la création du dépôt) |

Les sauvegardes natives de Firestore (programmées, restauration à 7 jours) exigent l'offre payante Blaze : **non utilisées**.

## 6. Procédure de restauration (et son test)
Les tests ont lieu sur un **projet Firebase de test séparé** (gratuit) et un espace R2 de test, jamais sur la production.
1. Récupérer le fichier de sauvegarde voulu dans R2.
2. Le déchiffrer avec la clé privée (`age -d`).
3. **Code** : `git clone sauvegarde.bundle` → vérifier les branches → lancer `node outils/tests/verifier.mjs`.
4. **Firestore** : script `outils/sauvegarde/restauration.mjs` (écrit et testé le 21/11/2026) : `importer` réécrit chaque document (sous-collections des enfants comprises) dans une base **vide** (refus sinon), puis compare document par document avec la sauvegarde.
5. **Comptes** : `firebase auth:import` avec les paramètres d'empreinte du projet → test de connexion avec un compte de test.
6. **Droits** : vérifier qu'un compte Créateur, un invité, un abonné de test et un gratuit retrouvent exactement leurs accès.
7. Compte rendu daté (durée de restauration, écarts constatés).

Calendrier des tests : une fois avant le lancement, **avant toute migration**, puis chaque trimestre.

### Ce qui reste à tester avant l'activation (votre accord est requis)
- Restauration **complète réelle** : export d'un projet Firebase de test → chiffrement → R2 → déchiffrement → import
  dans un **second** projet de test → connexion d'un compte Créateur, invité, abonné et gratuit de test → vérification des droits.
  Nécessite : le projet Firebase (Spark) et un espace R2 de test. Coût : 0 €.
- La clé privée réelle : créée par vous (voir CLE_DE_SAUVEGARDE.md).

### Déjà réalisé le 19/11/2026
- **Exercice de chiffrement / restauration** sur des données fictives au format prévu (1 000 familles) : 5/5 réussis,
  dont refus d'une mauvaise clé et détection d'un fichier altéré (`outils/sauvegarde/exercice-restauration.sh`).
- Sauvegarde complète du dépôt public (19 branches, tout l'historique, 45 Mo) en un fichier unique.
- **Restauration testée** : `main` restaurée est identique à l'original ; `preproduction` restaurée passe toutes les vérifications automatiques.

### Réalisé le 21/11/2026 (bloc 2)
- Script `outils/sauvegarde/restauration.mjs` : `exporter`, `importer` et `comparer`, utilisables sur la vraie base Firestore ou en mémoire.
- **Exercice complet automatisé** (`outils/tests/restauration.test.mjs`). Les données sont créées par le vrai code :
  le Créateur avec 7 profils, une famille abonnée (paiement test simulé) avec 3 profils et une progression, un proche invité,
  des invitations, le catalogue et le bandeau.
  - Le parcours : export, gzip, chiffrement age avec la clé publique, déchiffrement avec la clé privée, import dans une base vide.
  - Le contrôle : la base restaurée est **identique document par document**, et l'API y relit les mêmes droits, les mêmes profils et la même progression pour chaque compte.
  - La comparaison détecte un document modifié ou manquant. 3 erreurs volontaires dans le script ont toutes été repérées.

### Test réel préparé : ce que vous aurez à faire (0 €, deux projets Firebase Spark de test)
1. Créer deux projets Firebase de test, par exemple `ldn-source-test` et `ldn-restauration-test`, puis une clé de compte de service pour chacun.
   Gardez ces clés sur votre ordinateur : ne les envoyez jamais, ni à moi ni dans le dépôt.
2. Sur `ldn-source-test`, créer quelques comptes de test depuis la préproduction : un Créateur, un invité, un abonné en mode test et un compte gratuit.
3. Exporter la base :
   `FIREBASE_PROJET=ldn-source-test FIREBASE_COMPTE_SERVICE_FICHIER=~/cles/source.json node outils/sauvegarde/restauration.mjs exporter > export.json`
4. Chiffrer avec age, puis déchiffrer : voir CLE_DE_SAUVEGARDE.md.
5. Importer dans la base vide :
   `FIREBASE_PROJET=ldn-restauration-test FIREBASE_COMPTE_SERVICE_FICHIER=~/cles/cible.json node outils/sauvegarde/restauration.mjs importer export.json`
   Le script compare tout seul et affiche « ✓ base identique à l'export ».
6. Restaurer les comptes de connexion. Firebase Authentication ne fait pas partie de Firestore :
   `firebase auth:export comptes.json --project ldn-source-test`, puis `firebase auth:import comptes.json --project ldn-restauration-test`
   avec les paramètres d'empreinte affichés dans la console (Authentication → Utilisateurs → ⋮ → Paramètres de hachage).
7. Se connecter avec chaque compte de test et vérifier ses droits.
