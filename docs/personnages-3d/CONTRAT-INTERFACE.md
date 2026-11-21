# Contrat d'interface : ce que le moteur attend et ce que fournissent les GLB N1

Établi en lecture seule (aucun fichier du site modifié) à partir de `ablutions/jeu3d/gestes.js`, `priere/jeu3d/postures.js`, `voyage/js/voyageur.js` (classe à NE JAMAIS modifier : le Grand Voyage s'en sert) et des deux GLB N1.

## Membres lus ou écrits par le moteur de gestes et par les deux jeux
`racine`, `corps`, `bassin`, `buste`, `tete`, `yeux` (le moteur écrit `yeux.scale.y` pour cligner), `jupe` (le moteur écrit `visible` et `scale.y`), `jambes[2]` = `{haut, bas, cheville, s}`, `bras[2]` = `{haut, bas, main, index, s}`, `clign` (compteur de clignement), et pour les Ablutions la méthode `animer(dt, vitesse, t)` (cycle de marche) et `faire(type)`.

## Correspondance avec les os des GLB N1 (os présents dans les deux fichiers : tous)
| Moteur | Os GLB |
|---|---|
| racine, corps, bassin, buste, tete | `racine`, `corps`, `bassin`, `buste`, `tete` |
| bras[0] (main droite, x négatif) | `epaule_d`, `coude_d`, `main_d`, `index_d` |
| bras[1] (main gauche) | `epaule_g`, `coude_g`, `main_g`, `index_g` |
| jambes[0] / jambes[1] | `hanche_d`, `genou_d`, `cheville_d` / `hanche_g`, `genou_g`, `cheville_g` |
| yeux | pas d'os : groupe factice dont `scale.y` pilote les formes `clignement` et `clignement_mi` du maillage `yeux` |
| jupe | pas d'os : le maillage `jupe` reste visible ; formes `assis`, `penche`, `prosterne` pilotées selon la posture |

Nombre d'os : fille 55, garçon 49 (squelettes identiques à la base officielle `24-face-rework`).

## Formes (morph targets) des maillages
- fille `cuir` : assis, penche, prosterne
- fille `hijab` : assis, penche, prosterne
- fille `jupe` : assis, penche, prosterne
- fille `peau` : sourire, sourire_large, bouche_ouverte, sourcils_etonne, sourcils_concentre, prosterne
- fille `robe` : prosterne
- fille `yeux` : clignement, clignement_mi
- garçon `bonnet` : -
- garçon `cheveux` : -
- garçon `cuir` : assis, penche, prosterne
- garçon `jupe` : assis, penche, prosterne
- garçon `pantalon` : assis
- garçon `peau` : sourire, sourire_large, bouche_ouverte, sourcils_etonne, sourcils_concentre, prosterne
- garçon `robe` : prosterne
- garçon `yeux` : clignement, clignement_mi

## Correspondance posture -> forme de tissu (validée pour la Prière)
soujoûd -> `prosterne` ; roukoû‘ et penché -> `penche` ; assis, tachahhoud, salâm -> `assis` ; autres postures : aucune forme. Lissage conseillé : environ 0,25 s.
**Ablutions : non validée** (position assise sur tabouret, jambes devant, et pied levé : formes correctives à créer avant intégration, voir `PLAN-INTEGRATION.md`, section 4).

## Matériaux et données
Un seul matériau par maillage, couleurs peintes sur les sommets (attribut `color`), pas d'UV ni de texture. Cloner les matériaux par personnage pour teindre le teint et la tenue (l'ami de la Prière doit différer de l'enfant). `frustumCulled = false` sur les maillages à squelette. Aucune animation embarquée.
