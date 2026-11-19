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
| R2 (stockage des sauvegardes) | < 1 Go en tout | 0 € (offre gratuite : 10 Go/mois) |
| Opérations R2 | quelques milliers par mois | 0 € (offre gratuite : 1 million d'écritures, 10 millions de lectures par mois) |
| Lectures Firestore | ~5 000 par nuit | 0 € (quota Spark : 50 000 par jour) |
| GitHub Actions (dépôt privé) | quelques minutes par jour | 0 € dans le quota gratuit mensuel (à confirmer lors de la création du dépôt) |

Les sauvegardes natives de Firestore (programmées, restauration à 7 jours) exigent l'offre payante Blaze : **non utilisées**.

## 6. Procédure de restauration (et son test)
Les tests ont lieu sur un **projet Firebase de test séparé** (gratuit) et un espace R2 de test, jamais sur la production.
1. Récupérer le fichier de sauvegarde voulu dans R2.
2. Le déchiffrer avec la clé privée (`age -d`).
3. **Code** : `git clone sauvegarde.bundle` → vérifier les branches → lancer `node outils/tests/verifier.mjs`.
4. **Firestore** : script `outils/restauration/importer-firestore.mjs` (à écrire à l'étape Firebase) → réécrit chaque document → comparaison automatique du nombre de documents et de leur contenu avec la sauvegarde.
5. **Comptes** : `firebase auth:import` avec les paramètres d'empreinte du projet → test de connexion avec un compte de test.
6. **Droits** : vérifier qu'un compte Créateur, un invité, un abonné de test et un gratuit retrouvent exactement leurs accès.
7. Compte rendu daté (durée de restauration, écarts constatés).

Calendrier des tests : une fois avant le lancement, **avant toute migration**, puis chaque trimestre.

### Déjà réalisé le 19/11/2026
- Sauvegarde complète du dépôt public (19 branches, tout l'historique, 45 Mo) en un fichier unique.
- **Restauration testée** : `main` restaurée est identique à l'original ; `preproduction` restaurée passe toutes les vérifications automatiques.
