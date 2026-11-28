# Scripts d'audit des jeux (navigateur automatisé) — session du 23/11/2026

Écrits pendant l'audit des six jeux ; **conservés ici pour ne pas être perdus** (ils vivaient dans `/tmp`). Ils ne sont **pas publiés** (`outils/` est exclu du site) et **ne sont pas dans `tout.sh`**.

## Prérequis (machine de la session cloud)
- Un serveur statique local : `node outils/serveur-preprod.mjs 8791` (il s'arrête parfois : le relancer).
- Playwright à `/opt/node-tools/node_modules/playwright` ; three.js à `/home/user/node_modules/three` (redirigé depuis le CDN par `base.js`). **Chemins codés en dur** dans `base.js` et dans les `page.screenshot({ path: '/tmp/claude-0/aud/…' })` : `mkdir -p /tmp/claude-0/aud` ou adapter.
- Lancer depuis ce dossier : `cd outils/audit-jeux && NODE_PATH=/opt/node-tools/node_modules node <script> <arguments>`.
- Chaque script affiche une ligne JSON (`tests`, `ok`, `erreursJS`, `reseau`, `paroleNavigateur` = voix de repli du navigateur, signe d'un clip manquant) puis la liste `ÉCHECS`. Le 404 `/api/moi` est **normal en local** (pas d'API).

## Scripts de jeu (parties réelles)
| Script | Arguments | Couvre |
|---|---|---|
| `quiz-jeu.js` | `pc\|tel\|tab` `petits\|moyens\|grands` | 24 parties (8 thèmes × 3 niveaux ; sur téléphone : 2 thèmes × niveau moyen), bonne/mauvaise réponse, aide, fin, sauvegarde/reprise |
| `chasse-jeu.js` | `pc\|tel` `moyens` | 6 lieux niv. 1 + niveaux 2–5, clic/toucher réel sur l'objet 3D, aide, collection, reprise |
| `desert-jeu.js` | `pc\|tel` `moyens` `7` | 7 chapitres, 5 types d'énigmes, trésors, reprise |
| `ramadan-jeu.js` | `pc\|tel` | profil, 30 lanternes, paliers, diplôme, jeux, memory, histoires |
| `monde2d-jeu.js` | `ablutions\|priere` `pc\|tel` | apprendre, jeux, résultats, diplôme (prière), reprise, son |
| `ablu3d-jeu.js` | `pc` | modes Apprendre / S'entraîner / Libre — **bloque à l'étape 5 (voir `TODO-RESTANT-PROJET.md` P1-1)** |
| `pri3d-jeu.js` | `pc` | modes Guidé / S'entraîner (2 rak‘at) / Libre — **jamais exécuté** |
| `fumee.js` | — | chargement des 11 pages × 3 tailles (JS, réseau, débordement) |
| `soutenir.js` | — | page `/soutenir/` : état « bientôt » sur 3 tailles + formulaire de don (réponses serveur simulées, aucun paiement) |

## Scripts de contenu (lecture seule, sans navigateur)
`quiz-contenu.mjs` (liste des 96 questions), `quiz-ids-voix.mjs` (213 voix requises présentes), `cal-data.mjs`/`cal-contenu.mjs` (structure et contenu du calendrier), `cal-ids-voix.mjs` (identifiants de voix du calendrier), `ablutions-2d-vs-3d.mjs` (contenus identiques). L'audit audio des 313 clips du Monde est `outils/tests/audit-audio-monde.mjs`.

## Pièges rencontrés
- Le calendrier affiche d'abord une **carte de bienvenue** (`#gok`) avant le formulaire de profil ; la grille n'existe qu'après la création du profil.
- L'accueil du site affiche d'abord l'**introduction plein écran** (bouton « Passer ») qui recouvre le pied de page.
- Mystères du désert, énigme de mémoire : attendre le message « À toi ! » avant de cliquer (sinon les clics sont ignorés).
- Les jeux utilisent le moteur 3D logiciel (swiftshader) : lents ; prévoir de longs délais.

## Sous Windows (vérifié le 28/11/2026)
- Variables : `PLAYWRIGHT_DIR` (dossier du module playwright) et `THREE_DIR` (dossier du module three 0.170), lues par `base.js`. Les captures restent écrites dans `/tmp/claude-0/aud` : sous Windows, créer `C:\tmp\claude-0\aud`.
- Serveur : `node outils/construire.mjs` puis `node outils/serveur-preprod.mjs 8791` (sans `LDN_EMULATEUR`, les pages protégées ne bloquent pas : le garde laisse passer quand l'API des comptes répond 404).
- Ne lancer qu'un script à la fois (rendu 3D logiciel très gourmand). Le parcours Ablutions 3D dure environ 15 minutes ; Mystères du désert environ 4 minutes.
- Les boutons qui pulsent volontairement (« Suivant », « J'ai fini ») sont cliqués avec `{ force: true }` : sans cela Playwright les juge instables.
