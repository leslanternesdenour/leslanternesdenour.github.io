# Amélioration ciblée du garçon et de la fille 3D — VERSION DE TEST (22/11/2026)

**État : version de test séparée, sur `preproduction`. Rien n'est intégré au site ni aux jeux. En attente de validation du client.**

## Ce qui a été examiné
Les deux personnages du joueur sont construits par le code (Three.js) dans `voyage/js/voyageur.js` (classe `Voyageur`) : squelette articulé (hanches, buste, tête, épaules, coudes, genoux), pièces fusionnées par couleur. Il n'y a pas de fichier Blender pour ces deux modèles (les GLB N1 `personnages3d/modeles/*_N1.glb` sont un autre modèle, non utilisé par défaut). L'amélioration se fait donc **dans une copie du code**, sans toucher à l'original.

## Ce qui a été fait
- **Copie de test** : `outils/personnages/voyageur-v2.js` (classe `VoyageurV2`). L'original `voyage/js/voyageur.js`, les GLB, les prototypes et les anciennes versions sont conservés et non modifiés par ce chantier.
- **Visionneuse** : `/outils/personnages/amelioration.html` (préproduction seulement) : « Avant » à gauche, « Après » à droite, vues face / 3-4 / profil / dos, visage ou corps, boutons d'expressions et d'animations, dialogue, mode sans visage.
- **Yeux** : environ 9 % plus grands (garçon 0,028 → 0,0305 ; fille 0,030 → 0,0325), un second petit reflet ; deux yeux indépendants (clin d'œil possible).
- **Sourcils** : de petits arcs doux et mobiles à la place de bâtonnets droits (même couleur, même place).
- **Sourire et joues : conservés** (même arc, mêmes taches roses) ; ils bougent un peu selon l'expression.
- **Expressions** (`exprimer('joie' | 'surprise' | 'curiosite' | 'tristesse' | 'malice' | 'neutre', durée)`) : joie (grand sourire, bouche ouverte, yeux plissés), surprise (sourcils hauts, yeux grands, bouche en « o »), curiosité (un sourcil levé, tête inclinée, sourire de côté), tristesse (sourcils inclinés, bouche vers le bas), malice (sourire de côté, clin d'œil) ; amplitudes volontairement douces.
- **Animations** : clignement naturel (intervalle variable, parfois double, profil en cloche) ; **inclinaison de la tête pendant les dialogues** (`parler(true)`) avec hochements et petite animation de la bouche ; **signe de la main pour accueillir** (`faire('accueil')`) ; sourire à la réussite (`reussite`) ; surprise, curiosité (main au menton), tristesse ; **joie de récompense** (`recompense` : sauts, deux bras en l'air) ; originaux conservés : `prendre`, `caresser`, `salut`, `joie` (le salut corrigé le 22/11).
- **Identité du garçon** (curieux, aventurier, un peu maladroit) : petite **lanterne dorée** accrochée à sa sacoche, qui se balance quand il marche ; coups d'œil curieux fréquents (regard + sourcil) ; de temps en temps il trébuche, agite les bras, se rattrape et en rit (`maladroit`).
- **Identité de la fille** (douce, attentive, malicieuse, encourageante) : tête très légèrement penchée, hochements de tête avec un sourire, clin d'œil malicieux de temps en temps, **applaudit doucement pour encourager** (`encourager`) ; **finition du voile** : sept petites perles dorées discrètes au-dessus du front.
- **Inchangés** : proportions (vérifiées : hauteur et largeur identiques à 2 cm près), vêtements, silhouettes, couleurs, textures, squelette, marche et animations du corps.

## Compatibilité avec le mode sans visage (vérifiée)
Toutes les pièces mobiles du visage (yeux, sourcils, bouche, joues) sont étiquetées « visage » : en mode sans visage activé, les expressions se calculent mais **ne s'affichent pas** (cinq expressions : images identiques, écart de 0 pixel), alors que les gestes du corps, l'inclinaison de la tête, la lanterne de la sacoche et les perles du voile **restent visibles** (ce ne sont pas des traits du visage).

## Tests
`bash outils/tests/amelioration-personnages.sh` : 48 vérifications dans Chrome (structure des pièces de visage, proportions, chaque expression visible en mode normal et invisible en mode sans visage, clin d'œil, 7 gestes par personnage, dialogue, détails d'identité, originaux intacts, rien branché sur le site ni sur les jeux). Planches de présentation : `docs/personnages-ameliores/` (régénérables : `node outils/tests/planches-personnages.cjs` puis `python3 outils/tests/planches-personnages.py`).

## Points à valider par le client
1. Forme des sourcils (arcs) et taille des yeux : assez « attachants » sans changer le style ?
2. Perles dorées du voile : assez discrètes ? (on peut les réduire, les déplacer ou les retirer)
3. Lanterne de la sacoche du garçon : bon détail ? (taille, couleur)
4. Fréquence des petits comportements spontanés (le garçon qui trébuche toutes les 20 à 40 s à l'arrêt ; le clin d'œil de la fille) : à garder, espacer ou supprimer ?
5. Expression « malice » (clin d'œil) : conservée comme extra ?

## Intégration (non faite)
Après validation : remplacer l'import de `Voyageur` par `VoyageurV2` dans le Grand Voyage, les Ablutions 3D et la Prière 3D, brancher `parler()` sur les voix, `faire('reussite' | 'recompense' | 'accueil')` sur les événements des jeux, ajouter le test de non-régression de chaque jeu, puis passage préproduction → essai du client → production. Les jeux 3D d'Ablutions/Prière ont leur propre copie des gestes (`ablutions/jeu3d/gestes.js`) : à vérifier au moment de l'intégration.
