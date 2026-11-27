# Conseil IA : Claude et Gemini selon la mission

OpenAI a été retiré le 26/11/2026. Son code d'appel reste en sommeil (il sert aux tests des mécanismes à trois modèles) : absent de la configuration, il n'est jamais appelé.

Outil local en Node, sans aucune dépendance à installer. Il n'est pas publié avec le site (`outils/` est exclu de `dist/`).

## 1. Enregistrer les clés (une fois)

Depuis Claude Code, demandez la configuration des clés : Claude lance la commande dans le **panneau Terminal** de la session et vous y tapez les clés. Sinon, dans un terminal, à la racine du dépôt :

```powershell
node outils/conseil-ia/conseil.mjs configurer
```

La saisie est masquée. Collez seulement quand « Cle API … » est affiché (jamais à l'invite `PS …>`, dont l'historique est conservé). Un collage raté ou une clé du mauvais fournisseur est redemandé, trois fois au plus. Les clés sont chiffrées par Windows (DPAPI) dans `%USERPROFILE%\.lanternes-ia\cles\`, hors du dépôt. Puis :

```powershell
node outils/conseil-ia/conseil.mjs verifier
```

```powershell
node outils/conseil-ia/conseil.mjs essai
```

`verifier` est gratuit et liste les modèles ouverts à chaque clé. `essai` fait un petit appel payant par fournisseur, sans aucun fichier du projet (`--profil economique|approfondi`).

- Clé Gemini : https://aistudio.google.com/apikey. En offre gratuite, Google indique utiliser les contenus pour améliorer ses produits, et certains modèles (Gemini 4) n'y sont pas disponibles : activer la facturation pour ce projet.
- La variable d'environnement `GEMINI_API_KEY`, si elle existe, l'emporte sur le coffre.
- Ne collez jamais une clé dans une conversation ni dans un fichier.

Fixez aussi un plafond de dépense dans le tableau de bord Google : les plafonds de cet outil reposent sur des estimations et ne remplacent pas la facture.

## 2. Comment le choix est fait

1. **Classement** par mots-clés écrits dans `conseil.config.json` : domaine (sécurité, code, tests, architecture, visuel, pédagogie, histoire, rédaction) et complexité (petite, moyenne, complexe, critique). `--domaine` et `--complexite` l'imposent.
2. **Nombre de modèles** : un seul pour une tâche petite ou moyenne, deux pour une tâche complexe ou critique.
3. **Qui** : tant que chaque modèle disponible n'a pas au moins 5 constats vérifiés dans le domaine, ils tournent (le moins sollicité d'abord, puis `ordreInitial`). Ensuite, le meilleur taux de constats confirmés l'emporte.
4. L'auteur d'un travail (`--auteur`) ne le relit pas.

`ordreInitial` est un réglage de départ, pas un classement. Seul `tableau` affiche des mesures.

## 3. Quelle réponse est retenue

Chaque constat est « ancré » si son fichier, sa ligne et l'extrait cité se retrouvent dans les documents joints. La **note de preuve** est la part de constats ancrés. La plus haute est retenue ; à égalité, ou sans constat, personne. Cette note mesure la démonstration, pas la justesse.

Désaccord important : verdicts « ok » contre « bloquant », constat critique ou haut vu par un seul, ou gravités très différentes au même endroit. Avec deux modèles, il n'y a pas d'arbitre : chaque point contesté se tranche par un test ou une vérification de la personne (`juger`), ce qui débloque `proposer`.

## 4. Commandes

| Commande | Rôle |
|---|---|
| `mission --mission "…" [--fichier f] [--diff HEAD] [--image i] [--simulation]` | oriente et envoie (`--mission-fichier m.md`, `--agents claude,gemini`, `--auteur claude`) |
| `deposer --dossier ID --fichier r.json [--type analyse\|arbitrage\|proposition\|relecture]` | dépose ce que la session Claude a produit |
| `arbitrer --dossier ID` | sans effet tant qu'il n'y a que deux modèles |
| `proposer --dossier ID [--auteur gemini]` | correctif au format git |
| `controler --dossier ID [--relu --test t]` | essai dans une copie jetable |
| `relire --dossier ID [--agents gemini]` | relecture par un autre modèle |
| `juger --dossier ID --constat gemini:1 --verdict confirme\|rejete (--test t \| --humain "…")` | enregistre une vérification |
| `tableau`, `etat`, `verifier`, `essai`, `configurer` | mesures, état et dépenses, clés, appel d'essai |
| `activer claude\|gemini`, `desactiver …` | interrupteur de chaque modèle (ou `LDN_IA_GEMINI=off`) |

Codes de sortie : 0 réussi, 1 échec, 2 partiel ou « pas prêt », 3 refusé.

## 5. Avant une intégration

« PRÊT À INTÉGRER » demande, sur la même version du correctif : application dans une copie, tests réussis qui ne viennent pas du correctif, et relecture non bloquante par un autre modèle. L'outil n'applique **jamais** rien au projet : Claude le fait ensuite avec ses outils d'édition, hors de `main` et `production`.

Un correctif est refusé s'il touche `.claude/`, `.github/`, `.git*`, `CLAUDE.md`, `wrangler.toml`, `outils/conseil-ia/`, les tests du conseil ou un fichier sensible, s'il renomme, est binaire ou contient une clé.

## 6. Protections et coûts

- Fichiers jamais envoyés : `.env*`, `.dev.vars`, `cles/`, comptes de service, certificats, tout fichier ignoré par git, tout fichier hors du projet (images : dossier temporaire accepté). Les clés reconnues dans le reste sont remplacées par `[SECRET MASQUÉ]`.
- Les modèles externes ne reçoivent aucun outil : texte et images en entrée, texte en sortie.
- Plafonds (`limites`) : par appel, par jour, par mois, appels par jour et par modèle, taille, images, délai. Le coût maximal est réservé avant l'envoi. Un appel interrompu reste compté.
- Reprises seulement sur les refus passagers (429, 5xx), jamais après un délai dépassé.
- Modèles et tarifs : `agents`, `profils`, `tarifs`. Un modèle sans tarif est refusé. Tarifs relevés le 26/11/2026.
- Dossiers, comptes rendus, registre : `%USERPROFILE%\.lanternes-ia\`.

## 7. Limites connues

- La session Claude reste le chef d'orchestre : c'est elle qui lance les commandes et seule à écrire dans le projet. Déléguer économise de la réflexion Claude mais en consomme pour lire les réponses ; la consommation Claude n'est pas mesurée par l'outil.
- L'indépendance de l'analyse de Claude vient de l'ordre (rien n'est envoyé avant son dépôt). L'anonymat d'un arbitrage par Claude est de bonne foi : les dossiers locaux contiennent les noms.
- Le classement par mots-clés peut se tromper : vérifier avec `--simulation`.
- Le bac à sable (permissions de Node) bloque écriture et lecture hors de la copie, réseau, programmes et variables d'environnement. Ce n'est pas une frontière absolue : relire le correctif reste obligatoire. Les tests qui ouvrent un navigateur n'y tournent pas.
- `juger --test` exécute le test dans le projet : un test en échec pour une autre raison fausserait la mesure. `--humain` repose sur l'honnêteté de la saisie.
- Les mots de passe ou jetons sans format reconnaissable ne sont pas détectés : ne pas joindre de fichier qui en contient.

## 8. Tests

```powershell
node --test outils/tests/conseil-ia-*.test.mjs
```
