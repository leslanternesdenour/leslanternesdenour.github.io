# Les Lanternes de Nour : dernière phase de finition (20/11/2026)

**Statut : livraison à examiner. NON intégrée.** Dossier `28-finition\livraison\`. La livraison précédente (`27-finalisation\livraison\`), la base officielle (`24-face-rework`) et toutes les versions antérieures sont conservées telles quelles. Aucun fichier du site, des jeux ou du moteur n'a été modifié ; visages, sourires, proportions, squelettes et animations existantes sont inchangés (preuves en section 3).

## 1. Résultats corrigés
| Demande | Résultat |
|---|---|
| **1. Garçon : bourrelets d'épaule, sans peau visible** | **Corrigé.** Le dessus des manches épouse maintenant l'épaule à 2 ou 3 cm de la peau au lieu de former une boule de 5 cm. La peau n'apparaît plus (contrôlé numériquement : le tissu est au moins 14 mm au-dessus du disque de peau du bras, et sur les rendus face, trois-quarts, profil, dos). **Reste** : un petit pli en vue de dos au sommet de chaque manche, bien moins marqué que l'ancienne boule. Planche C1. |
| **2. Fille : lisière et encoches du hijab** | **Corrigé pour l'essentiel.** La fente sous le menton était un vrai trou triangulaire dans le tissu (la boucle d'ouverture du visage passait par un sommet pincé) : fermé par une face. Lisière du bas lissée (déplacement maximal 4 mm, sans rétrécissement). La robe qui perçait le hijab aux manches est repoussée de 7,5 mm sous le tissu (2 sommets). **Reste** : une très petite tache à l'épaule, visible seulement en gros plan macro. Planche C1. |
| **3. N1 : couleurs délavées et ourlet déchiqueté** | **Corrigé.** Les bandes de l'ourlet, la ceinture et les boutons gardent leurs couleurs du N0 (les sommets au contraste de couleur sont protégés de la décimation, couleur reprise du sommet N0 le plus proche). En passant, j'ai corrigé un défaut N1 non signalé jusqu'ici : la peau des bras ressortait à travers la tunique en postures assises (le corps de peau N1 était trop simplifié, résolution relevée). Planche C2. Coût : N1 fille **15 531** triangles (avant 14 323), garçon **15 957** (avant 14 748). |
| **4. Jupe en salâm** | **Vérifiée, rien à corriger.** Le « ×15,6 » du test moteur est mesuré par rapport à la pose debout (déjà froissée entre les jambes). Par rapport au maillage modélisé, l'étirement maximal est ×3,6 (fille) et ×3,9 (garçon) ; 1,2 % et 1,4 % des arêtes dépassent ×2,5, aucune ne dépasse ×4. Aucune déchirure visible aux distances de jeu. Planches C4 et C5 (gros plan en bas). |
| **5. Test sur téléphone** | **Résultats non reçus** : aucun résultat de téléphone n'est arrivé sur le PC, je ne déclare donc aucune performance sur téléphone. Voir section 4. |

## 2. Fichiers livrés
`fille.blend`, `garcon.blend` (N0, budgets : fille **33 235** triangles, garçon **27 614**, limite 35 000) · `fille_N0.glb`, `garcon_N0.glb`, `fille_N1.glb`, `garcon_N1.glb` (+ `.blend` N1) · `planches\C1` à `C5` (C1 corrections avant/après, C2 N1 corrigé, C3 personnages finaux N0 et N1, C4 et C5 les 13 postures de la fille et du garçon en N0 et N1) · résultats bruts des contrôles · `scripts\` (toutes les corrections sont des scripts reproductibles) · `test-telephone\` · `PLAN-INTEGRATION.md` (plan d'intégration Prière et Ablutions, rien n'est intégré) · `MANIFEST-SHA256.txt` (empreintes de tous les fichiers de ce dossier).

## 3. Contrôles effectués et résultats
| Contrôle | Résultat |
|---|---|
| Comparaison avec la livraison précédente (Three.js, tous les maillages : positions, cibles morph, couleurs, poids) | **Squelettes identiques. En N0, seules les pièces corrigées changent** : hijab et robe (fille), robe (garçon). **Peau, yeux, expressions, cheveux, jupe, pantalon, cordon : identiques au bit près** : visages, sourires et proportions non touchés. |
| Audit structurel des 4 fichiers Blender | Squelette identique à l'officiel (55 et 49 os), rotations de repos nulles. N0 : aucune anomalie de poids. N1 : 17 sommets du hijab (fille) et 3 de la jupe (les deux) ont plus de 4 influences, le GLB n'en garde que 4. |
| Compatibilité Three.js r170 avec les GLB officiels | **Tous les contrôles réussis** (4 GLB). |
| Animation complète avec le vrai moteur de gestes, séquence de 17 étapes couvrant les **13 postures de prière** (relevé compris), sur les 4 GLB | **Aucune valeur non finie** (re-vérifié en clôture). Étirements N0 identiques à la précédente livraison (jupe ×15,6 par rapport à la pose debout, voir point 4 de la section 1). |
| Intégrité des 4 GLB (en-tête glTF 2, longueur déclarée = taille du fichier, nombre de nœuds, maillages et peau) | **Réussi** : fille 62 nœuds / 6 maillages, garçon 58 nœuds / 8 maillages, une seule peau, aucune animation embarquée (les animations sont pilotées par le moteur) ; empreintes en section 6. |
| Rendus : 13 postures de prière en N0 et N1 pour les deux personnages, vues face, trois-quarts, profil, dos, visage, épaules de dos, gros plans de la jupe en salâm | Examinés sur les planches C1 à C5. |

## 4. Test sur téléphone : RÉSULTATS NON REÇUS
Vous avez indiqué que le test était terminé, mais **aucun résultat n'est arrivé sur le PC** : le dossier `test-telephone\resultats\` ne contenait aucun fichier de téléphone, et le serveur n'a vu aucune connexion venant d'une autre machine (uniquement des connexions locales du PC). Le test n'a donc pas pu être enregistré (téléphone non relié au serveur, ou envoi bloqué) et **je ne déclare aucune performance sur téléphone**.

Ce qui est établi : sur ce PC (GPU intégré Intel UHD, navigateur intégré), les 6 configurations (fille, garçon, les deux ; N0 et N1) tournent à **60 images/s** (référence dans `test-telephone\resultats-pc\pc-reference`) ; les mesures aberrantes dues à un navigateur ralenti sont conservées à part, et les 6 mesures faites dans le navigateur de l'application Claude (`pc-app-claude-2`) ne sont pas un téléphone. Charge à tester : N1 en duo 31 490 triangles, un personnage N1 environ 16 000.

Pour clore ce point sans refaire de test : relever sur l'écran du téléphone la ligne « RÉSULTAT : … images/s … » affichée à la fin de chaque mesure (ou une capture d'écran) et me la transmettre ; sinon relancer le serveur (`cd 28-finition\test-telephone` puis `python serveur_telephone.py 0.0.0.0 8800`, adresse http://192.168.1.44:8800/, autoriser Python sur le réseau privé si Windows le demande). **Le serveur de test est arrêté.**

## 5. Défauts restants
1. Garçon : petit pli au sommet des manches en vue de dos.
2. Fille : tache minuscule à l'épaule du hijab (macro seulement).
3. Gros plan par l'arrière en salâm : ourlets du hijab et de la jupe effilochés, aussi en N0 ; en N1 un peu de peau de jambe apparaît sous la jupe.
4. N1 : bandes des revers du pantalon du garçon délavées ; jupe du garçon : part d'arêtes extrêmes 15 % (7,7 % avant) même si le maximum baisse de ×10,8 à ×3,5 ; hijab fille : étirement maximal ×24,8 sur 0,57 % des arêtes, comme avant.
5. Cordon caché par les vêtements en roukoû‘ et soujoûd (accepté). Couleurs peintes sur les sommets (pas de textures).
6. Non fait : **performances sur téléphone réel (résultats non reçus, section 4)** ; intégration au moteur (correspondance des formes, `jupe` masquée selon la posture, clignement `clignement` / `clignement_mi` à brancher) : à traiter dans la préparation de l'intégration.

## 6. Empreintes SHA-256 (16 premiers caractères)
| Fichier | SHA-256 |
|---|---|
| `fille.blend` | fb82e6e7d5f4bb31… |
| `fille_N0.glb` | 9e59f3b2a0043cc5… |
| `fille_N1.blend` | 4edfb2ff86326851… |
| `fille_N1.glb` | 919eeb3f4dd5fc69… |
| `garcon.blend` | 6280233ce9b87cdb… |
| `garcon_N0.glb` | 23cce6d633966c9c… |
| `garcon_N1.blend` | 05304844718d4972… |
| `garcon_N1.glb` | 75f608c4ca322673… |
