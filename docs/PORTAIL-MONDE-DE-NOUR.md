# Portail d'entrée du Monde de Nour

Version du 22/11/2026 (révisée à la demande du client : **ancienne animation aux lanternes restaurée**, voix retirée en attendant une prononciation validée).

## Historique des décisions
1. Premier portail (porte en bois de palmier, rayons, particules) : **écarté par le client**. Conservé comme prototype : `monde/socle/prototypes/portail-porte-animee.js` (non référencé).
2. **Ancien portail restauré** : l'« ouverture magique » du 17/11 (`monde/socle/ouverture.js`, commit `81927f9`, modifiée le 19/11 `98bd40b`). Le fichier d'origine est conservé tel quel, non référencé.
3. **Voix rejetée** : la prononciation de « مَرْحَبًا » (prise 1, lot 21) a été refusée par le client. Cette prise n'est plus servie (conservée comme source dans `outils/voix/lots/lot21/`). Le 22/11/2026, le client a validé à l'oreille les candidats **B et D du lot 22** : **B est en service** (voir « La voix »).

## Le parcours de l'enfant
1. Le parent se connecte à l'Espace famille (`/compte/`), choisit le profil de l'enfant, touche **« ✨ Entrer dans le monde »**.
2. L'enfant arrive sur `/monde/` : le **portail aux lanternes** apparaît : porte turquoise au cadre doré, sept lanternes éteintes en arc.
3. **Les lanternes s'allument une à une, du centre vers les côtés** (ordre 3-2-4-1-5-0-6 ; la première à 300 ms, puis une toutes les 260 ms), la lueur dorée grandit autour de la porte.
4. La **porte s'ouvre** (à 2,2 s) sur la lumière ; à 2,7 s le salut apparaît : « مَرْحَبًا ! » puis « Bienvenue dans le Monde de Nour ! », avec la voix de la narratrice (lot 22, candidat B).
5. Le bouton **« Entrer dans le Monde de Nour »** apparaît ; au toucher, fondu et zoom d'origine, et l'enfant entre **directement dans son village** (pas de « Qui joue ? » : âge et personnage viennent de son profil, sans jamais écraser un réglage enregistré).
Un visiteur sans compte voit aussi le portail, puis l'écran « Qui joue ? » habituel.

## Départ automatique ou « Touche la porte »
Au chargement, une sonde silencieuse détecte si le navigateur autorise le son. **Autorisé** : la séquence démarre toute seule (0,9 s). **Refusé** (cas fréquent sur téléphone) : l'invitation de l'ancienne version « ✨ Touche la porte pour entrer ✨ » reste affichée ; le toucher sur la porte lance la séquence **et** la voix ensemble. Si la voix est refusée en cours de route : « 🔊 Touche l'écran pour écouter » ; sans toucher pendant 4,5 s, la séquence se déroule en silence.

## Quand le portail apparaît (une fois par session de jeu)
Règle (`monde/socle/portail-logique.js`, testée) : il s'affiche si, dans cet onglet, il n'a pas déjà été joué **pour cet enfant** (clé `sessionStorage « ldn_portail »`).
- **Il apparaît** : nouvelle ouverture du navigateur/onglet, nouvelle connexion (la déconnexion efface la clé), nouvel enfant choisi (choisir un enfant efface la clé), bouton « Entrer dans le monde » de l'Espace famille (`?ouverture=1`).
- **Il n'apparaît pas** : changement de page, retour d'un mini-jeu, rechargement.

## La voix
- Texte exact : « مَرْحَبًا ! Bienvenue dans le Monde de Nour ! ». Voix : « Nour - Narratrice (maitresse) », ElevenLabs. Jamais de synthèse du navigateur pour l'arabe (testé). Aucune musique dans le portail.
- **État : clip en service = lot 22, candidat B** (`monde/voix/accueil-portail.mp3` + `.json` : `valide: true`, durée 3,736 s, bascule arabe→français à 1,24 s). Candidat **D** également validé, disponible : `python3 outils/voix/choisir-accueil.py 22 D --valide`. Si `fichier` est `null`, le portail se déroule en silence (légendes et bouton compris, « Réécouter » masqué).
- Légende affichée : « مَرْحَبًا » (avec tanwin) alors que le son validé est « مَرْحَبَا » : à confirmer avec le client.
- **Candidats à écouter : `/outils/voix/lot?n=22`** : 8 variantes du mot arabe **seul, en mode arabe** (3 modèles ElevenLabs × graphies avec tanwin / fatha finale / sans voyelles) assemblées avec la phrase française déjà générée. Aucune n'est choisie à la place du client.
- Mise en service après validation : `python3 outils/voix/choisir-accueil.py 22 <A..H> --valide` (refuse sans `--valide`). Un test interdit qu'un clip non validé soit en service.
- Si aucun candidat n'est correct : enregistrement par une **voix humaine** (règle du projet pour l'arabe), puis branchement par la même commande.
- Dépense : prises 1-3 = 135 caractères, candidats du lot 22 = 64 caractères (total 199 sur les 300 autorisés).

## Fichiers
Restaurés / modifiés : `monde/socle/portail.js` (portail aux lanternes : style, porte et lanternes repris **à l'identique** de `ouverture.js`, vérifié par test), `monde/socle/portail-logique.js`, `monde/index.html`, `monde/village.js` (entrée directe, attente du portail), `compte/client.js` (nouvelle session à la connexion / au choix d'un enfant).
Conservés (jamais supprimés) : `monde/socle/ouverture.js` (original), `monde/socle/prototypes/portail-porte-animee.js` (porte en bois), `outils/voix/lots/lot21/` (prises rejetées).
Voix : `monde/voix/accueil-portail.json`, `outils/voix/{generer-accueil-arabe.py, choisir-accueil.py}`, `outils/voix/lots/lot22/`.

## Tests
- `node --test outils/tests/portail-logique.test.mjs` (20 tests ; le clip en service doit venir du lot 22, B ou D) : règle « une fois par session », profil sans écrasement, **style/porte/lanternes identiques à l'original**, ordre et rythme des lanternes, prototypes conservés, aucune voix non validée en service.
- `bash outils/tests/portail.sh` : parcours complet dans Chrome avec émulateur (parent, formule Famille simulée, 2 enfants, portail, lanternes une à une mesurées, voix en service testée telle quelle, scénario « sans voix » simulé par interception, entrée directe, progression, déconnexion/reconnexion, autre enfant, retour d'un jeu, visiteur sans voix, lecture automatique refusée), ordinateur **et** téléphone.
