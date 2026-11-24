# Parcours Nourania — plan (préproduction uniquement)

Décisions du créateur (23/11/2026) :
1. **Validation** : toute mise en avant définitive exige l'écoute et la validation par une personne compétente en arabe littéraire et en phonétique. La synthèse vocale reste un **brouillon**. Personne n'est encore identifiée : la validation reste **à organiser**.
2. **Parcours** : ajouté **à côté** des 8 chapitres actuels, derrière un drapeau de préproduction, avec une clé de stockage séparée (`ecole_nourania_v1`). On ne touche ni aux profils, ni aux comptes, ni aux progressions, ni aux audios actuels.
3. **Son isolé** : pas de consonne nue synthétisée ; on s'appuie sur la voyelle courte, avec un repère d'articulation (مخرج الحرف) pour ث ح خ ذ ص ض ط ظ ع غ ق.

## Niveaux (étapes jamais mélangées)
| Niveau | Étape | Clips propres |
|---|---|---|
| n0 | reconnaissance visuelle | aucun |
| n1 | nom de la lettre | 28 (`nom.<lettre>`) |
| n2 | son réel (via la voyelle courte + repère d'articulation) | repris de n3 |
| n3 | fatha | 28 (`fatha.<lettre>`) |
| n4 | kasra | 28 (`kasra.<lettre>`) |
| n5 | damma | 28 (`damma.<lettre>`) |
| n6 | combinaisons, lettres proches | assemblés à partir de clips validés |
| n7 | syllabes, voyelles longues, mots courts | réutilise l'École de lecture |
| n8 | exercices (écoute, association, répétition, récompenses) | transversal |

Données : `ecole-arabe/nourania/donnees/parcours.js`. Tests : `outils/tests/nourania.test.mjs`.

## Statut d'un clip
`a_valider` (synthèse brouillon) → `valide_humain` (écouté et validé par une personne compétente) ou `refuse`. Le parcours ne joue que `valide_humain` (fonction `jouable`).

## Étapes
1. Tableau de revue des audios (fait) — `outils/voix/lettres-validation/revue-audio`.
2. Choix de la technique du son (essais A/B/C) puis génération des 84 clips voyelles, voix Nour existantes seulement.
3. Données et tests (en cours : carte des niveaux, statuts, clé de stockage, clips par niveau, lettres difficiles).
4. Construction derrière le drapeau : n0 à n2, puis n3 à n5, puis n6 à n8.
5. Validation humaine, puis intégration seulement avec l'accord du créateur et sauvegarde des anciens audios.
