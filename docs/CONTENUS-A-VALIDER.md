# Revue des contenus historiques, religieux et pédagogiques — 28/11/2026

Revue faite par Claude (relecture de texte, pas d'autorité religieuse). **Aucune erreur certaine trouvée, donc aucun texte religieux modifié.**
Règle respectée : aucune représentation de prophète (textes uniquement ; tests `quiz`, `mysteres`, `route-*` déjà en place ; « mode sans visage » disponible).

## Déjà validé par le créateur
- La Route / La Mecque : récits et lieux, validés le 24/11/2026 (`voyage/js/route/validation-contenu.js`). Les références (versets, sources) y restent « à vérifier ».

## Relu : cohérent avec les connaissances de base, mais À VALIDER par vous
| Contenu | Fichier | Ce qui a été contrôlé / ce qui reste à valider |
|---|---|---|
| Quiz de Nour (20 questions marquées `religieux`) | `aventures/quiz-nour/contenu.js`, détail dans `docs/QUIZ-VERIFICATION.md` | Une seule bonne réponse chacune, faits élémentaires (5 prières, 5 piliers, 114 sourates, Al-Fatiha, Aïd al-Fitr, Fajr…). À valider : formulation pour enfants. |
| Quiz « Les mots » (arabe) | idem | Écriture arabe affichée, voix = translittération : prononciation à faire valider. |
| Ablutions (9 étapes) | `ablutions/index.html`, `ablutions/jeu3d/etapes.js` | Ordre des étapes cohérent (intention, Bismillâh, mains, bouche, nez, visage, bras, tête et oreilles, pieds). Références hadith cohérentes (Boukhârî 1, 159, 168, 185 ; Mouslim 226 ; Abû Dâwoud 101 ; Coran 5:6). **À vérifier : « Tirmidhî 36 » (oreilles) et « Abû Dâwoud 101 » (Bismillâh) : numéros non confirmés, l'authenticité du second est discutée.** |
| Prière (13 étapes) | `priere/app.js`, `priere/jeu3d/contenu.js` | Formules (takbîr, roukoû‘, soujoûd, tachahhoud, taslîm) et références cohérentes. Le texte arabe d'Al-Fâtiha et Al-Ikhlâs n'est pas tapé dans le dépôt : il vient de alquran.cloud (récitation Al-Housary). **À valider : note sur les différences entre écoles ; mention « Mouhammad est Son serviteur et Son messager » (dans le tachahhoud, texte de prière, pas une représentation).** |
| Calendrier du Ramadan (30 missions) | `calendrier/data.js` | Missions « prophètes » (Adam, Nouh, Ibrahim, Youssouf, Younous) renvoient aux 5 épisodes de la chaîne (existants). Références cohérentes (Coran 7:23, 29:14, 12:92, 21:87, 97:3, 2:185). **À valider : chaque référence de hadith, la zakât al-fitr (donnée aux enfants « même les enfants » : formulation à confirmer), les devinettes à la première personne (« Mes frères m'ont jeté dans un puits… ») : texte seulement, aucun visage.** |
| Mystères du désert | `aventures/mysteres-desert/contenu.js` | Aucun contenu religieux (énigmes d'observation). Rien à valider. |
| Page Conditions | `conditions/index.html` | Clause de rétractation (L221-28 13°) : relecture juridique avant ouverture commerciale. |
| Halte de repos de la Route (8 textes courts, 2 âges) | `voyage/js/route/textes-halte.js` | Aucun contenu religieux ni fait historique inventé : matériaux et vivres de l'Arabie du VIIe siècle (tente en poils de chèvre, tapis de laine, outres, jarres, dattes, pain d'orge, palmiers). Un conseil de voyageur (boire souvent, à petites gorgées) et un fait (les dattes se gardent longtemps). Relecture de ton souhaitée, rien d'obligatoire. |
| Portail de pierre vers la grande route (4 textes : nom, bouton « Franchir le portail », indice, panneau) | `voyage/js/route/portail-plan.js` (TEXTES_PORTAIL) | Textes sobres (pierre, lumière, piste) : aucun contenu religieux, aucun personnage historique, rien de punitif. Motifs du portail purement géométriques (briques, losanges), sans écriture. Marches : 3 blocs de pierre à 20, 40 et 60 cm, positions des personnages dans le même fichier. |
| Panneaux de bois de la Route (« Route vers La Mecque » au départ, « Retour au village » au retour ; dialogues petit / grand) | `voyage/js/route/panneaux-plan.js` (TEXTES_PANNEAUX) | Inscriptions lisibles gravées sur bois, flèche simple, aucune signalisation moderne. Aucun contenu religieux ajouté : le nom du but est celui de la mission de la Route. Relecture de ton souhaitée. |
| Portail de retour vers le village (nom, bouton « Retourner au village », indice, dialogue de confirmation petit / grand, boutons « Retourner au village » / « Rester sur la route ») | `voyage/js/route/retour-plan.js` (TEXTES_RETOUR) | Même architecture de pierre que le portail de départ. Le dialogue rassure l'enfant : sac, lanternes, découvertes et missions sont gardés. Carte : légende « Retour au village » (`carte-route.js`). |

## Règle pour les jeux « Bientôt »
Les trois cartes restantes de la page Aventures ne contiennent AUCUN texte coranique tapé, aucune sourate, aucun récit de prophète : voir `docs/AVENTURES-NOUVEAUX-JEUX.md`.
