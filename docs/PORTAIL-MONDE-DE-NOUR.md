# Portail d'entrée du Monde de Nour

Mis en service le 22/11/2026 sur la préproduction. Remplace l'ancienne « ouverture magique » (`monde/socle/ouverture.js`, **conservée dans le dépôt**, plus référencée).

## Le parcours de l'enfant
1. Le parent se connecte à l'Espace famille (`/compte/`), choisit le profil de l'enfant, puis touche **« ✨ Entrer dans le monde »**.
2. L'enfant arrive sur `/monde/` : le **portail** apparaît progressivement (nuit étoilée, lune en croissant, dunes et palmiers, porte en bois de palmier cloutée de bronze dans un cadre de brique crue, deux lanternes).
3. Le portail **s'illumine** (halo, rayons de lumière, liseré lumineux sur le cadre, particules dorées).
4. La **maîtresse-narratrice** accueille l'enfant : « مَرْحَبًا ! Bienvenue dans le Monde de Nour ! ». Le mot arabe s'affiche avec le premier mot, la phrase française quand la voix passe au français.
5. Les **portes s'ouvrent progressivement, au rythme de la voix** (la dernière syllabe finit d'ouvrir les portes) et révèlent le village doré.
6. Le bouton **« Entrer dans le Monde de Nour »** apparaît. Au toucher : la lumière emporte le portail et l'enfant entre **directement dans son village**, sans écran « Qui joue ? » : âge et personnage viennent de son profil (3-5 ans → petits, 6-10 ans → grands ; fille/garçon), **sans jamais écraser** un réglage déjà enregistré.

Un visiteur sans compte voit aussi le portail, puis l'écran « Qui joue ? » habituel.

## Quand le portail apparaît (une fois par session de jeu)
Règle (fichier `monde/socle/portail-logique.js`, testée) : le portail s'affiche si, dans cet onglet, il n'a pas déjà été joué **pour cet enfant** (clé `sessionStorage « ldn_portail »`).
- **Il apparaît** : nouvelle ouverture du navigateur/onglet, nouvelle connexion (la déconnexion efface la clé), nouvel enfant choisi par le parent (choisir un enfant efface la clé), bouton « Entrer dans le monde » de l'Espace famille (`?ouverture=1`).
- **Il n'apparaît pas** : changement de page, retour d'un mini-jeu (Ablutions, Prière, Calendrier…), rechargement.
- La clé est posée dès l'affichage : un rechargement en plein portail ne rejoue jamais la voix.

## La voix
- Fichier : `monde/voix/accueil-portail.mp3` (3,6 s) + repères de synchronisation `monde/voix/accueil-portail.json` (durée, coupure entre « مَرْحَبًا » et « Bienvenue », fin de voix).
- Voix : « Nour - Narratrice (maitresse) », ElevenLabs `eleven_v4`, mêmes réglages que les 237 phrases validées. Texte **exact**, mot arabe écrit en arabe avec ses voyelles. Jamais de synthèse du navigateur (testé).
- **État : prise 1 sur 3, prononciation de مَرْحَبًا À VALIDER par le client** (écoute : `/outils/voix/lot?n=21`). Pour changer de prise ou valider : `python3 outils/voix/choisir-accueil.py <1|2|3> [--valide]`.
- Dépense : 3 prises × 45 caractères = 135 caractères ElevenLabs (autorisés jusqu'à 300).
- Volume : réglage « voix » du village ; à 0, le portail s'anime sans voix. Aucune musique dans le portail (un seul fichier sonore, testé).

## Lecture automatique refusée par le navigateur
Si le navigateur refuse (cas fréquent sur téléphone sans geste préalable) : message « 🔊 Touche l'écran pour écouter », les portes attendent ; **un premier toucher** (ou une touche) lance la voix. Sans toucher pendant 4,5 s, l'animation se déroule en silence et le bouton « 🔊 Réécouter l'accueil » pulse. **« Réécouter l'accueil »** relance la voix à la demande (les portes restent ouvertes). Une seule lecture automatique, jamais de doublon.

## Animation et performance
CSS (transformations 3D des portes pilotées par `--portes`) + un petit canvas (étoiles, 44 particules sur ordinateur, 22 sur téléphone). La création de la scène 3D du village attend que le portail soit prêt : l'animation reste fluide sur un vieux téléphone, le village se prépare pendant que l'enfant lit le bouton. `prefers-reduced-motion` : pas de mouvement superflu. « Passer » et la touche Échap restent disponibles.

## Fichiers
Nouveaux : `monde/socle/portail.js`, `monde/socle/portail-logique.js`, `monde/voix/accueil-portail.{mp3,json}`, `outils/tests/portail-logique.test.mjs`, `outils/tests/portail.{mjs,sh}`, `outils/voix/choisir-accueil.py`.
Modifiés : `monde/index.html`, `monde/village.js` (entrée directe, attente du portail), `compte/client.js` (nouvelle session à la connexion/choix d'enfant), `outils/tests/*.mjs` (le portail est passé avec `sessionStorage ldn_portail = *` dans les tests qui ne le concernent pas), `outils/tests/tout.sh`, `docs/voix-narratrice-manifeste.json`.

## Tests
- `node --test outils/tests/portail-logique.test.mjs` (16 tests) : règle « une fois par session », synchronisation voix/portes, profil sans écrasement, fichier audio cohérent.
- `bash outils/tests/portail.sh` : parcours complet dans Chrome avec émulateur (parent, formule Famille simulée, 2 enfants, portail, voix, entrée directe, progression, déconnexion/reconnexion sur « nouvel appareil », autre enfant, retour d'un jeu, visiteur, lecture automatique refusée), ordinateur **et** téléphone.

## Vérifié sur le site de préproduction (22/11/2026, commit 2122dfe)
Chrome réel sur https://lanternes-de-nour.pages.dev/monde/, ordinateur et téléphone, visiteur et profil enfant : 28/28 vérifications (portail affiché, voix automatique en une seule lecture, bouton « Entrer », entrée directe dans le village sans « Qui joue ? », âge/personnage du profil, retour d'un mini-jeu sans portail, aucune erreur JavaScript). Parcours complet avec comptes (parent, 2 enfants, Famille, déconnexion/reconnexion, progression) : 83/83 sur le serveur local avec émulateur ; suite complète `tout.sh` : verte.
**Non vérifié en conditions réelles** : la connexion Google / e-mail d'un vrai parent sur Firebase (demande les identifiants du client ; aucun compte réel n'a été créé par les tests).
**À valider par le client** : la prononciation de « مَرْحَبًا » dans le clip d'accueil (prise 1 sur 3).
