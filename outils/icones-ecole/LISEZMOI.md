# Icônes 3D de l'École arabe (village)

Trois icônes dessinées en 3D (three.js, rendu hors-ligne) et enregistrées dans `monde/icones/` :

| Fichier | Maison | Composition |
|---|---|---|
| `ecole-lettres.png` | L'École des lettres arabes | livre d'apprentissage entrouvert, lettres ا ب ت dorées et turquoise en relief, croissant et étoile |
| `ecole-lecture.png` | Je découvre la lecture arabe | grand livre ouvert (mots arabes écrits sur les pages : قلم، بيت، اقرأ، ب + ا + ب = باب), mot « كتاب » lumineux en relief |
| `ecole-chiffres.png` | Les chiffres et les nombres arabes | tableau en bois, chiffres orientaux ١ ٢ ٣ en relief, boulier, craie, crayon, étoile |

Elles sont posées dans les pastilles rondes du village (`image:` dans `monde/batiments.js`, dessin dans `texIcone` de `monde/scene.js`). Les autres maisons gardent leurs icônes.

Régénérer : `node outils/icones-ecole/generer.mjs [lettres|lecture|chiffres]` (Playwright + three ; polices Google *Baloo Bhaijaan 2* ExtraBold et *Amiri* Bold, utilisées seulement pour le rendu — voir les variables `POLICES`, `THREE_DIR` en tête de `generer.mjs`).
