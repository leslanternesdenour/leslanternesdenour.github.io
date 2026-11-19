# La clé privée des sauvegardes : création, conservation, contrôle (D10)

Les sauvegardes contenant des données personnelles (comptes, profils enfants) sont chiffrées avec **age**.
- La **clé publique** sert à chiffrer. Elle est donnée au système de sauvegarde (secret GitHub du dépôt privé). Elle ne permet **pas** de lire les sauvegardes.
- La **clé privée** sert à déchiffrer. **Vous seul la détenez.** Ni Claude, ni GitHub, ni Cloudflare ne la possèdent.

Conséquence : sans la clé privée, **aucune restauration n'est possible**, même pour vous. D'où deux copies.

## 1. Création (une seule fois, sur VOTRE ordinateur)
1. Installer age (Windows : `winget install FiloSottile.age`).
2. Dans un terminal : `age-keygen -o lanternes-cle-privee.txt`
   Le fichier contient une ligne `AGE-SECRET-KEY-1…` (clé privée) et, en commentaire, la clé publique `age1…`.
3. Copier **uniquement la ligne `age1…`** (clé publique) et me la transmettre : c'est la seule qui va dans le système.

## 2. Conservation (deux copies indépendantes)
| Copie | Où | Pourquoi |
|---|---|---|
| A | Votre **gestionnaire de mots de passe** (entrée « Lanternes — clé de sauvegarde », contenu du fichier en note sécurisée) | accès pratique |
| B | **Papier** : impression de la ligne `AGE-SECRET-KEY-1…`, sous enveloppe, rangée chez vous (ou chez une personne de confiance) | survit à la perte du téléphone ou de l'ordinateur |

Ensuite, **supprimer le fichier** `lanternes-cle-privee.txt` de l'ordinateur (et vider la corbeille).
À ne jamais faire : l'envoyer par e-mail, WhatsApp, la photographier, la mettre dans GitHub, Google Drive ou le dépôt.

## 3. Contrôle (une fois par an, et avant toute migration)
Je vous fournis une sauvegarde chiffrée de test ; vous la déchiffrez avec votre copie A puis votre copie B :
`age -d -i lanternes-cle-privee.txt sauvegarde.age > test.json`. Si les deux fonctionnent, les copies sont bonnes.

## 4. Incidents
| Situation | Conséquence | Que faire |
|---|---|---|
| Une copie perdue | aucune si l'autre existe | refaire une copie depuis l'autre |
| Les deux copies perdues | les sauvegardes **déjà faites** sont illisibles | créer une nouvelle clé immédiatement ; les sauvegardes suivantes seront lisibles |
| Clé privée possiblement vue par quelqu'un | risque de lecture si cette personne obtient aussi l'accès aux sauvegardes | nouvelle clé, rotation des accès R2, purge anticipée des anciennes sauvegardes |

## 5. Exercice réalisé le 19/11/2026 (données fictives)
`bash outils/sauvegarde/exercice-restauration.sh` : 5/5 vérifications réussies
- fichier sauvegardé illisible sans la clé ;
- restauration identique à l'octet près (empreinte SHA-256) ;
- contenu complet (1 000 familles, 3 000 profils enfants, compte Créateur) ;
- mauvaise clé refusée ; fichier altéré détecté et refusé.
Taille : 528 Ko d'export → 17 Ko chiffrés et compressés (données fictives ; les vraies seront un peu plus lourdes).
