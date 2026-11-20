# Reprise du projet « nouveaux personnages 3D N1 » (Prière puis Ablutions)

**À lire en premier par toute session Claude qui reprend ce travail.** Dernière mise à jour : 20/11/2026. Ce document est autonome : il n'y a pas besoin de la conversation d'origine.

## 1. Mission et règles absolues
Intégrer les personnages **fille et garçon N1** (modèles glTF/GLB, `personnages3d/modeles/`) dans **le Jeu de la Prière** (d'abord) puis **le Jeu des Ablutions** (ensuite, après adaptation de ses postures), en gardant le moteur de gestes et les animations existants.
- **Ne jamais modifier le Grand Voyage, la classe `Voyageur` (`voyage/js/voyageur.js`), ses personnages, ses animations, ses fichiers.** Les deux jeux importent `Voyageur` (secours) : on l'importe, on ne le modifie pas.
- Ne jamais modifier `ablutions/jeu3d/gestes.js` ni `priere/jeu3d/postures.js` (partagés), ni aucune autre page du site.
- Anciens personnages (`Voyageur`) conservés comme **solution de secours avec retour automatique**.
- Branche dédiée `integration-personnages-n1-priere` ; **ne rien fusionner dans `main`, ne rien publier sans l'autorisation explicite du client** (le site se publie depuis `main`).
- **Respecter le garde TDD** (plugin `tdd-guard`) : un test rouge à la fois, code minimal, jamais de code écrit par un autre chemin que Write/Edit ; **ne jamais contourner ni désactiver le garde**. S'il est indisponible, s'arrêter et le dire.
- Aucun fichier ni ancienne version supprimé. Données personnelles : ne jamais écrire de chemin local, nom d'utilisateur ou adresse dans le dépôt (il est public).

## 2. Où en est-on exactement (20/11/2026)
- **Personnages : terminés et validés par le client** (livraison définitive, `docs/personnages-3d/RAPPORT-FINAL.md`). Fille N1 : 15 531 triangles, 55 os ; garçon N1 : 15 957 triangles, 49 os ; squelettes identiques à la base officielle, aucune animation embarquée, couleurs peintes sur les sommets. Plus de corrections esthétiques ni de refonte.
- **Intégration : non commencée côté code.** Seuls ont été faits : la sauvegarde du site, la branche, le **premier test (rouge)** et la préparation. Le garde TDD refuse tout fichier d'implémentation (voir section 5).
- **Test de performance sur téléphone : jamais enregistré** (aucun résultat reçu). Performances mesurées seulement sur un PC à GPU intégré : 60 images/s, un personnage N1 ≈ 16 000 triangles, deux ≈ 31 500.
- **Prière** : aucun nouveau travail de modèle ; postures déjà validées (13 postures, formes de tissu `assis` / `penche` / `prosterne`).
- **Ablutions** : travail de modèle préalable nécessaire (forme de tissu pour l'assise sur tabouret et pour le pied levé, fesses enfoncées d'environ 5 cm dans le tabouret, cycle de marche à porter) : voir `ABLUTIONS-ADAPTATIONS-NECESSAIRES.md`.

## 3. Documents (dans ce dossier)
| Fichier | Contenu |
|---|---|
| `PLAN-DE-TRAVAIL-COMPLET.md` | le plan d'exécution par étapes, critères de passage, garde-fous |
| `SPECIFICATION-TESTS-PRIERE.md` | les 13 tests à écrire un par un (logique pure, adaptateur) et le branchement du jeu de la Prière |
| `ABLUTIONS-ADAPTATIONS-NECESSAIRES.md` | diagnostic des Ablutions (26 postures posées avec le vrai moteur) |
| `PLAN-INTEGRATION.md` | architecture proposée (module `personnages3d/`, fabrique avec secours) |
| `CONTRAT-INTERFACE.md` | ce que le moteur de gestes attend d'un personnage, correspondance des os |
| `LISTE-DE-CONTROLE-AVANT-FUSION.md` | liste de contrôle de sécurité |
| `RAPPORT-FINAL.md` | rapport de la livraison des personnages (contrôles, défauts résiduels) |
Données de test : `personnages3d/donnees-tests/` (poses de la Prière et des Ablutions extraites du vrai moteur, diagnostic de portée). Modèles : `personnages3d/modeles/fille_N1.glb` (SHA-256 `919eeb3f4dd5fc69…`) et `garcon_N1.glb` (`75f608c4ca322673…`).

## 4. Le test déjà écrit (non versionné ici : il contient un chemin local)
Premier test TDD, **rouge** (module absent), fichier `personnages3d/logique.test.js` à recréer à l'identique :
```js
const test = require('node:test');
const assert = require('node:assert/strict');
test("la forme de tissu suit la posture de prière (soujoûd, roukoû‘, assis…)", async () => {
  const { formeTissu } = await import('./logique.js');
  assert.equal(formeTissu('soujoud'), 'prosterne');
  assert.equal(formeTissu('roukou'), 'penche');
  assert.equal(formeTissu('penche'), 'penche');
  for (const p of ['assis', 'tachahhoud', 'salamDroite', 'salamGauche']) assert.equal(formeTissu(p), 'assis');
  assert.equal(formeTissu('debout'), null);
});
```
Cycle suivant (méthode du garde) : stub vide `export function formeTissu(posture) {}` dans `personnages3d/logique.js`, test rouge sur assertion, puis le code minimal.

## 5. Blocage du garde TDD (compte Claude partagé)
- Le garde appelle l'IA de Claude (Agent SDK, modèle `claude-sonnet-4-6`) avec la **connexion Claude de la machine** pour valider chaque modification de code. Sa réponse actuelle : « You're out of extra usage · resets Nov 22, 7am (Europe/Paris) », pour Sonnet comme pour Haiku.
- **La limite est portée par le compte Claude (plan Pro), pas par une configuration locale** : toute session qui utilise ce compte avec le plugin `tdd-guard` activé subit le même refus, jusqu'au 22/11/2026 à 7 h (Paris). Une session sur une autre machine ou dans le cloud n'a le garde que si son propre plugin est activé ; si elle ne l'a pas, la règle du client reste de faire quand même les tests d'abord et de ne rien contourner.
- Options (décision du client uniquement) : attendre le 22/11 ; activer des crédits d'usage avec plafond (Settings > Usage) ; fournir une clé API dédiée au garde (`VALIDATION_CLIENT=api`, `TDD_GUARD_ANTHROPIC_API_KEY`) ; la commande `tdd-guard off` désactiverait le garde : **ne pas l'utiliser sans ordre explicite du client**.
- Fichiers ignorés par le garde (`*.md`, `*.json`, `*.html`, `*.txt`…) : ne pas s'en servir pour y glisser du code.

## 6. Reprendre le travail : commandes
```
git clone https://github.com/leslanternesdenour/leslanternesdenour.github.io.git
cd leslanternesdenour.github.io
git fetch origin integration-personnages-n1-priere
git switch integration-personnages-n1-priere
git log --oneline -5            # le dernier commit est "Intégration N1 : documentation de reprise et modèles"
node --version                  # Node 22 ou plus ; Three.js 0.170.0 doit être installé hors dépôt (npm install three@0.170.0 dans un dossier parent) pour les tests
git diff --stat main...HEAD     # ne doit montrer que docs/personnages-3d/ et personnages3d/
```
Lancer un test : `node --test personnages3d/logique.test.js` (avec le garde actif, utiliser le reporter du garde de la machine ; ce reporter est propre à chaque poste et n'est pas versionné).
**Garde-fou avant chaque commit** : `git diff --name-only main...HEAD` ne doit contenir que `docs/personnages-3d/`, `personnages3d/`, `priere/jeu3d/index.html`, `priere/jeu3d/jeu.js`, `ablutions/jeu3d/index.html`, `ablutions/jeu3d/jeu.js`, `tests/versions.test.js`. Toute autre ligne = erreur : annuler.

## 7. Ce qui reste uniquement sur l'ordinateur du client (pas sur GitHub)
Espace de travail 3D hors dépôt (`Lanternes-de-Nour-3d`, ≈ 1,2 Go dont Blender portable) : fichiers Blender définitifs (`fille.blend`, `garcon.blend` et N1), GLB N0, planches, rapports détaillés, scripts de la chaîne (génération, simulation de tissu, export, tests, extraction des poses), rendus des 26 postures des Ablutions ; **sauvegarde complète du site** (copie + `.bundle`) ; mémoire de projet de l'assistant. Sans eux on peut intégrer les N1 dans la Prière, mais **le lot de modèle des Ablutions (nouvelles formes de tissu) exige cet espace de travail et Blender**.
