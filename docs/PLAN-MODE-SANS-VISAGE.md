# Mode sans visage : audit et plan d'intégration (22/11/2026)

**État : AUDIT SEUL. Aucun fichier existant n'a été modifié.** Le plan attend la validation du client.

## 1. Règle fonctionnelle (confirmée par le client)
- Réglage **global de la famille** « Mode sans visage : ACTIVÉ / DÉSACTIVÉ », dans les réglages parentaux, avec le texte d'explication fourni par le client (affiché tel quel).
- Activé : plus d'yeux, de sourcils, de nez, de bouche, ni d'expressions faciales. On garde têtes, silhouettes, vêtements, cheveux, hijabs et animations du corps. Désactivé : visages habituels.
- Enregistré dans les préférences de la famille, même réglage pour tous les profils enfants, conservé après déconnexion/reconnexion, appliqué immédiatement sans perte de progression.
- Une seule version de chaque personnage : les éléments du visage sont **masqués**, pas remplacés ni dupliqués.

## 2. Audit : où apparaissent des visages

### A. Personnages 3D (Three.js, construits par le code)
| Support | Fichier | Visage actuel | Comment le masquer |
|---|---|---|---|
| Garçon et fille (Grand Voyage, jeux Ablutions 3D et Prière 3D, via l'ancien modèle par défaut) | `voyage/js/voyageur.js` | Yeux (groupe `yeux`) ; nez, joues, bouche, sourcils **fusionnés dans le maillage de la tête** | Séparer ces traits en un maillage à part `traits` (mêmes formes, même rendu) ; masquer `yeux` + `traits` |
| Enfants du voyage (Salim, gardiens, etc.) | `voyage/js/personnages.js` (classe `Enfant`), appelée par `aventure.js`, `montures.js` | Groupe `yeux` + cils ; visage « tout simple » | Même méthode : masquer `yeux` et les traits |
| Montures et animaux (chameau, cheval, 6 animaux, faucon, oiseaux) | `voyage/js/montures.js`, `animaux.js`, `faucon.js`, `oiseaux.js` | Yeux (points sombres) | **Question au client** (voir §5) |
| GLB N1 fille/garçon (pas utilisés par défaut ; `?perso=nouveau`) | `personnages3d/modeles/*.glb`, `personnage-glb.js` | Maillage `yeux` ; bouche, nez, sourcils dans le maillage `peau` (couleurs de sommets `COLOR_0`) + formes `sourire`, `bouche_ouverte`, `sourcils_*` | Masquer `yeux`, mettre à zéro les formes faciales, neutraliser les couleurs de sommets du visage. Le relief du nez ne peut être retiré sans Blender : à signaler |

### B. Personnages et mascottes 2D (SVG)
| Support | Fichier | Visage actuel | Comment le masquer |
|---|---|---|---|
| Nour, la petite goutte (Ablutions) | `ablutions/index.html` (fonction `nour`), `monde/mascottes.js` | Yeux, joues, bouche, sourcils | Regrouper les traits dans un groupe classé `sv-visage` (même dessin), masqué par CSS |
| Sajjadou, mascotte de la Prière | `priere/app.js` (fonction `sajjadou`), `monde/mascottes.js` | Groupe `visage` déjà présent | Ajouter la classe `sv-visage` |
| Visages d'enfants du choix « fille/garçon » | `monde/socle/peaux.js` (`visageSVG`), `monde/index.html` | Deux yeux dessinés | Classe `sv-visage` sur les yeux : il reste la tête, le voile ou la calotte et la teinte de peau |

### C. Images (non modifiables par le code)
| Support | Fichier | Contenu |
|---|---|---|
| Bannière de l'accueil | `accueil/banniere-1280.webp`, `banniere-2172.webp`, `banniere-mobile-780.webp`, `banniere-mobile-1122.webp` | **Deux enfants illustrés (garçon et fille) avec visages** |
| Image de partage | `accueil/og-partage.jpg` | Même illustration (réseaux sociaux : ne peut pas dépendre du réglage de la famille) |
| Autres images | `village.webp` (village et chameau), `portail.webp`, `carte.webp`, `manette.webp`, logos | Pas de visage humain |
| Vignette YouTube (accueil) | externe | Hors de notre contrôle |

### D. Émojis à visage ou à personne (affichés tels quels dans l'interface)
👦 👧 🧒 🧕 👳 👨 👩 😊 dans : `compte/index.html`, `compte/synchro.js`, `decouvrir/index.html`, `apercu/index.html`, `voyage/index.html`, `voyage/js/main.js`, `voyage/js/catalogue.js` (icônes de vêtements), `ablutions/jeu3d/index.html` et `jeu.js`, `priere/jeu3d/index.html`, `monde/socle/portail.js`. Solution : en mode activé, un petit module les remplace par une **silhouette neutre sans visage** (SVG), sans toucher au texte d'origine.

### E. Sans visage ou sans objet (vérifié)
- Prière 2D : l'enfant qui prie est déjà une silhouette sans visage.
- Calendrier du Ramadan : aucun personnage (cartes, lanternes, diplôme, QR code).
- Illustrations des découvertes (`voyage/js/illustrations.js`) : peintes en canvas, formes d'objets et de lieux, aucun visage dessiné.
- Portail du Monde de Nour (lanternes, porte), village (bâtiments, mascottes par maison : voir B), voix : aucune image de visage.

## 3. Plan d'intégration (solution globale, sans doublons)
1. **Module central** `monde/socle/sans-visage.js` (+ version « script classique » pour les pages sans modules) : lit l'état, le met sur `<html data-sans-visage>`, diffuse l'événement `ldn:sans-visage`, applique aux onglets ouverts via l'événement `storage`. Chargé **tôt dans le `<head>`** de chaque page pour éviter tout éclair de visage.
2. **CSS commun** : `[data-sans-visage="1"] .sv-visage { display: none }` pour tous les SVG.
3. **3D** : fonction `marquerVisage(objet)` (étiquette `userData.visage`) et `appliquerSansVisage(racine, actif)` qui parcourt et règle `visible`. Chaque classe 3D (`Voyageur`, `Enfant`, montures, animaux, adaptateur GLB) l'appelle à la création et s'abonne au changement : **application immédiate**, sans recharger, sans perte de progression. Les clignements et expressions restent inoffensifs car masqués.
4. **Émojis** : `silhouette(emoji)` remplace les émojis de personnes par une silhouette SVG sans visage quand le mode est actif.
5. **Accueil** : en mode activé, la bannière à deux enfants est remplacée par une image sans visage (voir §5).
6. **Réglage et stockage** :
   - Compte famille : champ `preferences.sansVisage` dans le document `familles/{uid}` ; nouvelle route `PATCH /api/famille` (réservée au parent connecté, même origine, vérifiée côté serveur) ; `GET /api/moi` renvoie la préférence. Même valeur pour tous les profils enfants ; aucun profil, aucune progression touchés.
   - Application instantanée : copie locale (`localStorage`) mise à jour à la connexion (le compte fait foi), à la déconnexion elle reste sur l'appareil ; reconnexion : relue depuis le compte.
   - Visiteur sans compte : même réglage, conservé localement.
   - Interface : nouvelle section **« Réglages de la famille »** dans `/compte/` avec l'interrupteur et le texte du client ; lien depuis « Qui joue ? ». Aucun enfant n'y accède seul.
7. **Futurs jeux et personnages** : règle écrite dans `docs/` + test automatique qui échoue si un maillage ou un SVG de visage n'est pas étiqueté (`marquerVisage` / `sv-visage`).

## 4. Tests prévus
- Unitaires : module (lecture, écriture, événement, valeurs invalides), remplacement des émojis, étiquetage des maillages.
- Pour chaque support (garçon, fille, enfants du voyage, mascottes, GLB, village, Ablutions 2D/3D, Prière 2D/3D, accueil) : mode activé → aucun maillage/SVG de visage visible (parcours de la scène), tête, cheveux, voile et vêtements toujours visibles ; mode désactivé → visages identiques à aujourd'hui (comparaison d'images).
- Parcours complet avec émulateurs : parent, 2 enfants, activation, passage d'un jeu à l'autre, déconnexion/reconnexion, autre appareil, progression inchangée.
- Captures de chaque support dans les deux modes présentées au client avant publication.

## 5. Décisions demandées au client
1. **Animaux** (chameau, cheval, faucon, oiseaux, autres) : masquer aussi leurs yeux ? *Recommandé : oui, pour une application cohérente à tous les êtres vivants.*
2. **Bannière de l'accueil** : en mode activé, utiliser l'image du village (sans personne) ? Une illustration sans visage dédiée demanderait un nouveau visuel. L'image de partage (réseaux sociaux) ne peut pas suivre le réglage.
3. **Émojis de personnes** : silhouette neutre sans visage à la place, d'accord ?
4. **Visiteur sans compte** : proposer le réglage aussi (local à l'appareil) ?
5. **Ordre de travail** : mode sans visage **d'abord**, puis l'amélioration des personnages (expressions), pour que les nouvelles expressions soient masquables dès le départ.

## 6. Précautions
Aucun personnage ni fichier original supprimé ni remplacé ; aucune modélisation refaite ; modifications sur la branche `preproduction` d'abord, essai du client avant la production ; pas de changement des données des familles et des profils.
