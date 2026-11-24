# La Route vers La Mecque — suivi technique

## Incidents (23/11/2026) — à lire

### Incident 1 : `launch.json` écrasé sans vérification
- **Fichier** : `C:\Users\zakar\.claude\backups\.claude\launch.json` (dossier de travail de la session, hors dépôt Git).
- **Ce qui s'est passé** : pour lancer un serveur de test local, j'ai écrit ce fichier avec l'outil d'écriture sans avoir d'abord vérifié s'il existait. Il existait déjà : son ancien contenu a été remplacé par ma configuration (`grand-voyage-local`, serveur statique sur le port 8791).
- **Récupération** : l'ancien contenu n'a pas pu être retrouvé (pas de copie, pas dans Git, aucune sauvegarde faite avant l'écriture). Seule ma version actuelle est conservée : `launch.json.sauvegarde-2026-11-23-version-actuelle` (même dossier). Si une autre session avait besoin de l'ancienne configuration (aperçu d'un autre serveur), il faut la recréer.
- **Règle appliquée dorénavant** : avant d'écrire dans un fichier qui existe déjà (configuration, données, sauvegarde), le lire, en faire une copie datée, puis seulement l'écrire. Un fichier de test nouveau reçoit un nom nouveau.

### Incident 2 : données de test écrites dans le stockage du navigateur de l'app (préproduction)
- **Où** : stockage local de `https://preproduction.lanternes-de-nour.pages.dev` dans le panneau navigateur de l'app (profil de TEST : aucun compte réel, les comptes sont en erreur 503 sur la préproduction ; aucune synchronisation possible).
- **Ce que mes essais y ont ajouté** : zones `oasis` + `camp` découvertes, mission `lanternes` marquée finie (sans `n`/`debut`/`fin` : ajout artificiel), `regions.route`, tout `etat.route`, badge `route-depart`, +50 pièces (`route:lieu:seuil`). Le reste (zone village, personnage, école des chiffres, quotidien, soins) existait avant.
- **Sauvegarde faite avant tout nettoyage** : `C:\Users\zakar\.claude\backups\preproduction-localstorage-2026-11-23.json` (lecture seule).
- **Non nettoyé** : le jeu y tourne encore (la position change) : modifier les clés pendant qu'il tourne serait réécrit par le jeu. Nettoyage à faire hors partie en cours, sur décision du créateur (supprimer le profil de test du navigateur, ou retirer les ajouts listés ci-dessus).
- **Aucun profil réel touché** : aucune clé de compte, aucun envoi serveur (les écritures vers `/api` n'ont jamais abouti : 503).

## Prévention : le bac à sable (`?sandbox=1`)
- **Utilisation** : ouvrir le Grand Voyage avec `?sandbox=1`, **en local ou en préproduction uniquement** (`voyage/js/route/bac-a-sable.js`). Un bandeau « 🧪 MODE TEST » reste affiché.
- **Effet** : toutes les clés du stockage sont lues et écrites sous le préfixe `sandbox:` (les vraies clés ne sont ni lues, ni écrites, ni supprimées) ; toute écriture (POST/PUT/PATCH/DELETE) vers `/api` est refusée côté navigateur ; `sendBeacon` est neutralisé. Le bac à sable est installé avant le chargement de la synchronisation du compte (`compte/synchro.js`) et avant tout import du jeu.
- **Sur le vrai site** : jamais actif (même avec `?sandbox=1`). Testé (`outils/tests/route-bac-a-sable.test.mjs`).
- **Règle de test** : tous les essais automatisés ou manuels de la Route utilisent désormais `?sandbox=1` ; on ne modifie jamais `etat` sur une page sans le bac à sable.
- **Vérifié dans le navigateur** : avec `?sandbox=1`, un profil neuf est créé sous `sandbox:*`, les vraies clés restent intactes, un POST vers `/api/…` est refusé.

## Corrections demandées après la première tranche
- Marche à pied sur la Route : facteur 0,88 (2,90 m/s au lieu de 3,3 ; course 5,46 au lieu de 6,2), seulement à pied et seulement sur la Route. Distance du voyage inchangée (5 600 m). Première tranche ≈ 16,6 min, voyage complet ≈ 32 min à pied. Vitesses du village et des montures inchangées.
- Dromadaire Rihla conservé comme récompense à l'oasis. Noms provisoires acceptés : Source Claire, Trois Tentes, Rachid, Dalila, Rihla.
- Sortie à l'est : vérifiée cohérente (zone de l'oasis, gratuite) ; test ajouté : `regions.js` et `premium.js` inchangés, la piste ne traverse aucune zone Premium.

## Avancement : les montagnes, étape 1 (23/11/2026)
- **Fait** (préproduction) : région « Les contreforts et le premier col » (s = 3 200 → 4 500 m), relief de vallée encaissée entre deux parois rouge brique (fond de vallée toujours praticable à pied ; parois infranchissables), 9 nouveaux lieux (puits des voyageurs, plateau de pierres plates, seuil des montagnes, porte de pierre, 2 haltes, lit de galets, belvédère du premier col, grand cairn déplacé en s = 4 200), décor de roches par flancs, carte et carnet étendus (5 haltes). La partie jouable fait désormais ≈ 4 220 m (≈ 24 min à pied à 2,9 m/s).
- **Pas encore fait** : Jabal an-Nour, Jabal Thawr, chemins et vallées suivants, arrivée dans la cité, Kaaba, Zamzam, Safa et Marwa. Les fiches religieuses restent vides et « À VALIDER » : elles ne sont **pas** du contenu terminé et doivent être renseignées puis vérifiées avant toute publication.
- **Perf** (ordinateur, profil automatique) : ≈ 240 000 triangles et ≈ 80 appels de dessin dans la vallée ; à surveiller sur mobile réel (profil « faible » : rayon 3 tuiles et 50 % du décor).
