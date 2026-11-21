# Audit des voix — 21/11/2026

Outil : `node outils/tests/audit-voix.mjs` (détecteur automatique ; **seule l'écoute valide une voix**).

## 1. Couverture
- Catalogue général `audio/voix.json` : 353 identifiants, **tous les fichiers existent**. Ablutions 76, Prière 68, Calendrier 169, Village 16 entrées : **aucun fichier absent**.
- **Voix françaises ElevenLabs** (`audio/fr/…`, 655 phrases selon les catalogues) : complètes pour le français.
- **Voix arabes : 13 textes sans enregistrement** (règle du projet : jamais de synthèse pour l'arabe) → liste complète dans `_documentation/VOIX_ARABES_A_ENREGISTRER.md` (8 mots du village + 5 formules : السَّلَامُ عَلَيْكُمْ, بِسْمِ اللَّهِ, الْحَمْدُ لِلَّهِ, مَا شَاءَ اللَّهُ, إِنْ شَاءَ اللَّهُ). Tant qu'ils manquent, le site affiche le texte sans le lire.
- **Calendrier : 169 extraits** découpés dans 11 longs fichiers (anciennes voix). **Aucune nouvelle voix ElevenLabs n'existe pour le calendrier** : à produire si on veut les remplacer (accueil, bravo, memory, 30 missions petits/grands, devinettes, questions).
- **Pack Premium privé (21 voix)** : hors dépôt, **non vérifié ici**.

## 2. Anciennes voix vérifiées / nouveaux clips ElevenLabs (jeux Ablutions et Prière)
Décision : **les jeux gardent les voix vérifiées**. Historique : #11 « clips décalés » → débranchés ; #20 rebranchés → #21 annulé (« mélangées ») ; ma tentative d'aujourd'hui (rebranchement) a été **annulée** aussitôt (commit `09a6e8b`). Un test (`outils/tests/voix-verifiees.test.mjs`) interdit désormais de rebrancher `audio/fr/` dans ces deux jeux sans décision.
Comparaison automatique des durées (nouveau clip / ancienne voix, même phrase) :
| Jeu | Phrases comparées | Rapport médian | Corrélation d'ordre | Phrases à écouter en priorité |
|---|---|---|---|---|
| Ablutions | 74 | 0,97 | 0,936 | `q2_bras` (3,4 s → 5,8 s) |
| Prière | 64 | 1,04 | 0,953 | `g4ok` (1,6 → 0,9 s), `d_gh` (2,5 → 1,3 s) |
Lecture : aucun décalage d'ensemble détecté, trois clips aberrants (dont `g4ok` et `d_gh`, déjà jugés douteux par une session précédente). **Limite : un échange entre deux phrases de même durée ne serait pas vu.** Avant tout rebranchement : écouter les 138 phrases une par une (outil d'écoute : `/outils/ecoute-voix.html` en préproduction, compare ancienne et nouvelle voix).

## 3. Mots arabes et religieux à vérifier à l'oreille (prononciation française des voix ElevenLabs)
Boukhârî (×12), Allah (×9), Coran, Bismillâh / Bismillah, As-salâmou ʿalaykoum, sourate, Abû Dâwoud, Tirmidhî, Mouslim, Al-Ghâchiya, Ramadan, Kaaba, qibla, takbîr, ainsi que « wudû » et les noms propres des histoires (Nouh, Ibrahim, Youssouf…).
Remède si une prononciation est fautive : dictionnaire de prononciation ElevenLabs (alias ou phonétique), puis régénération de la seule phrase concernée.

## 4. À produire / à décider
1. Écoute et validation des 138 phrases ElevenLabs des Ablutions et de la Prière (puis seulement rebranchement).
2. 13 enregistrements humains arabes.
3. Nouvelles voix du calendrier (169 extraits) si l'on veut remplacer les anciennes.
4. Voix des 5 maisons à venir et des missions Premium (pack privé).
