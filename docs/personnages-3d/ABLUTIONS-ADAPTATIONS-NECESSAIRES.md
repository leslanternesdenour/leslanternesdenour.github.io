## État au 21/11/2026 (session autonome) : intégration technique faite, modèle à finir
**Fait et testé** : le cycle de marche et les petits gestes de `Voyageur.animer` sont portés dans l'adaptateur (`personnages3d/personnage-glb.js`) : mêmes mouvements que l'ancien personnage à moins de 2 mm (fille et garçon, 4 vitesses, gestes `prendre`, `caresser`, `salut`, `joie`) ; le jeu `ablutions/jeu3d` crée son personnage par la fabrique (secours automatique), `?perso=nouveau` active le nouveau modèle ; les 12 séquences du jeu sont jouées sur ordinateur et mobile sans valeur aberrante. **Par défaut l'ancien personnage reste actif** (`PAR_DEFAUT = 'ancien'` dans `ablutions/jeu3d/jeu.js`).
**Défauts visibles restants (captures dans `captures/`)** : assise sur le tabouret : la robe s'écrase et l'ourlet orange traverse le tabouret ; pied levé : le tissu traverse la jambe et le tabouret ; la marche est correcte. Les formes de tissu de la Prière ne sont volontairement pas appliquées (`lier(…, { sansTissu: true })`).
**Ce qui reste, et qui exige Blender + l'espace de travail 3D du client** : formes correctives `tabouret` (assise), `pied levé droit/gauche` (et éventuellement `tabouret_penche`), correction des fesses enfoncées d'environ 5 cm, régénération N1, nouveaux GLB à déposer dans `personnages3d/modeles/`. Ensuite seulement : brancher ces formes dans `suivre()` pour les Ablutions et passer `PAR_DEFAUT` à `'nouveau'`.

---
# Jeu des Ablutions : adaptations nécessaires (préparation uniquement, 20/11/2026)

**Aucune intégration n'est commencée pour les Ablutions** (consigne du client : après validation de la Prière). Ceci est le diagnostic des adaptations à prévoir, fait hors site, en lecture seule sur le moteur de gestes.

## 1. Méthode
- Les **26 postures réelles des Ablutions** (`ablutions/jeu3d/gestes.js`) ont été posées sur les deux squelettes avec le **vrai moteur** : `29-integration-prep\ablutions\poses-ablutions-fille.json` et `-garcon.json` (même format que les poses de la Prière), diagnostic dans `diagnostic-portee-*.json` (inclut les 12 séquences du jeu).
- Rendus Blender (fille et garçon, N0) de 12 postures représentatives sur un **tabouret de pierre aux cotes du jeu** (cylindre r 0,17 m, haut 0,29 m, mur à 0,64 m), sans puis avec la forme `assis` de la Prière : `rendus-ablutions\` et planche `planches\A1-ablutions-profil.png`. Scripts : `scripts\10-poses-ablutions.txt`, `11-longueurs-os.txt`, `20-rendu-ablutions.txt`.

## 2. Ce qui est déjà compatible
- **Squelette et longueurs** : épaule-coude-main 240/250 mm et hanche-genou-cheville 300/285 mm, soit les constantes de la cinématique inverse du moteur (300/290 pour la jambe : 5 mm d'écart, sans effet visible).
- **Portée** : sur les 26 postures, les chevilles atteignent leur cible à 5 mm près, et les mains à moins de 15 mm sauf `piedDroitFrotter` et `piedGaucheFrotter` (mains à 34 à 52 mm de leur cible : le moteur étire le bras au maximum, comportement identique à l'ancien personnage dont les segments ont les mêmes longueurs) et `debout` (cible mains hors de portée, 164 mm, même remarque). Aucune valeur non finie.

## 3. Ce qu'il faut adapter (avant d'intégrer ce jeu)
1. **Tissu en position assise sur tabouret** : la forme `assis` de la Prière a été cuite pour l'assise sur les talons ; sur le tabouret (jambes devant, genoux plus hauts que les hanches) elle donne une jupe en tas autour des genoux, et sans forme la jupe s'étire sur les cuisses en plis réguliers qui restent acceptables mais ne pendent pas naturellement entre les genoux. → **créer une forme `tabouret`** (simulation de tissu avec collision du tabouret, pour la jupe, le hijab, le pantalon du garçon, le cordon), puis une variante pour **le pied levé** (`piedDroit*`, `piedGauche*`), N0 puis N1 (nouveau budget de triangles).
2. **Assise dans le tabouret** : le bassin est à 0,335 m alors que le plateau est à 0,29 m : les fesses s'enfoncent d'environ 5 cm dans la pierre ; de la peau apparaît au creux de la cuisse côté siège (fille, de profil). → à traiter dans la forme `tabouret` (ou ajuster la hauteur de bassin côté jeu, ce que je ne ferai pas sans accord).
3. **Marche** : le GLB n'a aucune animation ; le cycle de `Voyageur.animer` (jambes, bras, rebond, regard) doit être recopié dans l'adaptateur et contrôlé visuellement (jupe, hijab, pantalon).
4. **Yeux et jupe** : mêmes adaptations que pour la Prière (clignement par formes, jupe toujours visible) ; le moteur masque la jupe (`activer(true)`) pour les Ablutions aussi.
5. **Mains/doigts** : à contrôler en gros plan sous le robinet (`puiser`, `mainsFrotter`, `oreilles`, `visage*`), index levé non utilisé.

## 4. Effort et ordre
Prière d'abord (aucun nouveau travail de modèle). Pour les Ablutions : un lot de modèle (point 1 et 2) comparable à la passe cordon, puis l'intégration (points 3 à 5).
