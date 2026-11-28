# Les trois jeux « Bientôt » des Aventures — état au 28/11/2026

Les cartes **Les Bâtisseurs de l'oasis**, **Le Trésor des sourates et des mots** et **Le Défi des cinq prières** sont maintenant jouables (`aventures/oasis/`, `aventures/tresor/`, `aventures/cinq-prieres/`). Joués de bout en bout sur téléphone (390 px) en navigateur : aucune erreur JavaScript, aucun débordement, progression enregistrée.

## Ce qu'ils font
- **Oasis** : chercher la source sous trois dunes, planter, arroser, récolter des dattes ; 9 parcelles, étoiles à 3, 6 et 9 palmiers, diplôme « Bâtisseur de l'oasis ». Aucune perte, aucun chrono.
- **Trésor** : trois coffres de questions douces : les 28 lettres arabes (données de `ecole-arabe/commun/langue/alphabet.js`), 18 mots arabes (ceux de la Chasse aux mots, avec émoji) et les noms de 4 sourates (nom, numéro, sens du nom). **Aucun verset n'est tapé** (test dédié).
- **Cinq prières** : remettre les cinq prières dans l'ordre de la journée, les relier à leur moment, retrouver leur nombre de rak‘at (2, 4, 4, 3, 4).

## Règles respectées
Page derrière le compte parent (liste « fail-closed » du serveur, `_routes.json`), mode « sans visage » chargé, aucun personnage ni image (donc aucune représentation de prophète), aucune synthèse vocale du navigateur, **aucun nouvel audio ni dépense** (les trois jeux n'ont pas de voix : texte seul), progression synchronisée avec le profil (clés `aventure_oasis`, `aventure_tresor`, `aventure_cinq`). Tests : `outils/tests/mini-jeux.test.mjs`.

## Ce qui reste à votre décision
1. **Valider le contenu religieux** (Cinq prières ; sourates du Trésor ; sens « la Sincérité » pour Al-Ikhlâs) : `docs/CONTENUS-A-VALIDER.md`.
2. **Décision du créateur (28/11/2026) : le Défi des cinq prières public est conservé.** **Doublon avec la maison Premium « cinq »** : `serveur/catalogue.js` prévoit une maison Premium « Défi des cinq prières » (aperçu). Ces trois jeux sont des versions simples, réservées aux comptes, **sans contenu du pack privé**. Si vous voulez garder « cinq » exclusivement Premium, retirer `lien` de l'entrée `cinq` dans `aventures/aventures.js` suffit à la remettre en « Bientôt ».
3. **Voix** : aucune. Si vous en voulez, les 10 voix de Nour pourront être ajoutées (génération à votre accord, coût ElevenLabs).
4. Les étoiles de ces trois jeux ne comptent pas encore dans le total du village (`monde/socle/recompenses.js`).