# Sauvegarde de l'ancien village (avant la refonte graphique)

| | |
|---|---|
| **Branche de sauvegarde** | `backup-village-avant-refonte` (sur le dépôt distant et en local) |
| **Commit sauvegardé** | `4179ccb3dfe9c254b07eb4c0a0d1b9f607122778` (« Village : trois maisons ouvertes sur les jeux de l'École arabe… ») |
| **Contenu** | l'intégralité du dépôt à ce commit : `monde/` (scène 3D, bâtiments, icônes, caméra, interactions), `monde/socle/`, voix, musique, jeux, tests, configuration |
| **Version en ligne au moment de la sauvegarde** | préproduction = `4179ccb` (identique) |

## Vérifications faites avant toute modification
- La branche pointe exactement sur le commit de la version alors en ligne (`git diff backup-village-avant-refonte 4179ccb` : vide ; 2 228 fichiers suivis dans les deux).
- Empreintes (MD5) des fichiers du village en ligne **identiques** à ceux de la branche : `scene.js`, `village.js`, `batiments.js`, `monde.css` et la page `/monde/`.
- La branche a été **reconstruite à part** (copie de travail séparée) : `dist/monde/` obtenu = octet pour octet la version en ligne.
- Aucune ressource externe : le village est entièrement construit par code (aucun modèle 3D, texture ou image à part) ; tout est dans la branche.

## Règle
La branche `backup-village-avant-refonte` ne se modifie, ne se déplacent et ne se suppriment JAMAIS. Toute la refonte se fait sur `preproduction`.

## Retrouver exactement l'ancien village (sans toucher aux comptes ni aux sauvegardes)
Le village ne stocke rien de nouveau : les comptes, les progressions et les réglages sont ailleurs (stockage du navigateur, base des comptes) et ne dépendent pas des fichiers du village. Restaurer ne perd donc aucune donnée.

Sur la branche `preproduction` :
```bash
git checkout preproduction
git checkout backup-village-avant-refonte -- monde/        # remet tous les fichiers du village à l'identique
git rm -f --ignore-unmatch monde/icones3d.js               # retire les fichiers ajoutés par la refonte
git commit -m "Retour à l'ancien village (sauvegarde backup-village-avant-refonte)"
git push origin preproduction
```
Pour comparer sans rien changer : `git diff backup-village-avant-refonte preproduction -- monde/` ou ouvrir l'ancienne version dans une copie séparée : `git worktree add ../ancien-village backup-village-avant-refonte`.
