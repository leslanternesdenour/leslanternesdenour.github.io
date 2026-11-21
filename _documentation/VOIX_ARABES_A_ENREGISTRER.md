# Voix arabes à faire enregistrer (par une vraie voix humaine)

Règle du projet : **aucune synthèse vocale pour l'arabe** (testée automatiquement). Les voix françaises sont complètes ; les 13 textes arabes ci-dessous n'ont pas encore d'enregistrement.
Tant qu'ils n'existent pas, le site affiche le texte sans le lire.

| Identifiant | Texte arabe (avec voyelles) | Traduction / contexte français |
|---|---|---|
| `NOUR-VOIX-ARB-001` | بِئْر | Cela veut dire : le puits. C'est là qu'on puise l'eau, au cœur du village. |
| `NOUR-VOIX-ARB-003` | جَمَل | Cela veut dire : le chameau. Le compagnon des caravanes, qui marche longtemps sans boire. |
| `NOUR-VOIX-ARB-005` | سُوق | Cela veut dire : le marché. Le souk, où les marchands vendent tissus, poteries et épices. |
| `NOUR-VOIX-ARB-007` | نَخْلَة | Cela veut dire : le palmier. Le palmier dattier, l'arbre des oasis. |
| `NOUR-VOIX-ARB-009` | تَمْر | Cela veut dire : les dattes. Les fruits sucrés du palmier, la nourriture des voyageurs. |
| `NOUR-VOIX-ARB-011` | مَاء | Cela veut dire : l'eau. L'eau, si précieuse dans le désert. |
| `NOUR-VOIX-ARB-013` | خَيْمَة | Cela veut dire : la tente. La maison des voyageurs, qu'on plie et qu'on emporte. |
| `NOUR-VOIX-ARB-015` | نَجْمَة | Cela veut dire : l'étoile. La nuit, les étoiles aidaient les voyageurs à trouver leur chemin. |
| `NOUR-VOIX-INV-001` | السَّلَامُ عَلَيْكُمْ |  |
| `NOUR-VOIX-INV-002` | بِسْمِ اللَّهِ |  |
| `NOUR-VOIX-INV-003` | الْحَمْدُ لِلَّهِ |  |
| `NOUR-VOIX-INV-004` | مَا شَاءَ اللَّهُ |  |
| `NOUR-VOIX-INV-005` | إِنْ شَاءَ اللَّهُ |  |

## Comment les ajouter ensuite
1. Un fichier `.mp3` par ligne, nommé comme l'identifiant en minuscules (ex. `nour-voix-inv-001.mp3`), voix claire, sans musique.
2. Les placer dans `audio/ar/` et déclarer chaque fichier dans `audio/voix.json` (même format que les voix françaises : `[chemin, 0, durée]`).
3. Je vérifie ensuite que chaque texte a bien son audio (les tests le contrôlent).
