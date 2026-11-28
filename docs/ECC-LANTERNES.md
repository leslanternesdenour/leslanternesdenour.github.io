# ECC (Everything Claude Code) — installation et usage pour Les Lanternes de Nour

Installé le 28/11/2026, version **2.2.3** (dépôt officiel `affaan-m/ECC`, commit `4adeee6`), par `npx ecc-universal@2.2.3 setup --mode claude-plugin --scope local --hooks minimal`.

## Ce qui a changé sur cette machine
- Plugin `ecc@ecc`, **portée « local »** (privée à ce projet, non commitée) : `.claude/settings.local.json` (marketplace + `enabledPlugins`). Fichiers du plugin : `~/.claude/plugins/cache/ecc/ecc/2.2.3/`.
- `~/.claude/settings.json` : ajout de `pluginConfigs."ecc@ecc".options` (`hooks_enabled: true`, `hook_profile: "minimal"`). C'est le seul changement restant par rapport à la sauvegarde (comparé avec `diff`). L'installateur avait aussi ajouté `includeCoAuthoredBy: false` ; il a été retiré à votre demande.
- Aucun fichier du site, aucune règle (`rules/`), aucune donnée, aucun audio touchés. `main` inchangée (`da30277`).
- Sauvegarde de l'état d'avant : `~/.claude/backups/ecc-avant-2026-11-28/` (settings utilisateur, plugins installés, `.claude/` du projet, références Git).

## Retour arrière (sans rien supprimer d'autre)
1. `claude plugin uninstall ecc@ecc` (ou supprimer `ecc@ecc` de `.claude/settings.local.json`).
2. Retirer `pluginConfigs."ecc@ecc"` de `~/.claude/settings.json`, ou restaurer le fichier de la sauvegarde.
3. Facultatif : supprimer `~/.claude/session-data/` (résumés de session écrits par les hooks ECC, voir plus bas).

## Mode d'emploi réduit (le plugin apporte 72 agents, 328 compétences, 99 commandes : n'en utiliser que quelques-uns)
| Besoin | Où chercher |
|---|---|
| Revue de sécurité du code | compétences `security-review`, `security-scan`, agent `security-reviewer` |
| Revue JS / base de données | agents `code-reviewer`, `typescript-reviewer`, `database-reviewer` |
| Tests / régression | compétences `tdd-workflow`, `e2e-testing`, `ai-regression-testing`, `verification-loop`, `browser-qa` |
| Parcours utilisateur cassés | `click-path-audit`, `production-audit` |
| Sobriété de contexte | `context-budget`, `strategic-compact` |
Aucune compétence ECC spécifique à Firestore, Wrangler/Cloudflare Workers ni Stripe (recherche dans le dépôt : 0 résultat pour firestore/wrangler). Ces sujets restent couverts par nos fichiers `serveur/`, `functions/` et `outils/tests/`.

## Hooks (profil `minimal`)
Seuls des hooks sans blocage s'exécutent (mesuré : ~0,3 s par appel de test). **Le profil minimal n'ajoute AUCUNE protection de `main`** : l'essai de `git push --force origin main` n'est pas bloqué par ECC. La protection de `main` reste celle de GitHub.
Effet observé : un hook ECC écrit un résumé de session dans `~/.claude/session-data/AAAA-MM-JJ-<id>-session.tmp` (prompts tronqués, fichiers modifiés). Ces données restent en local mais reprennent le texte de vos messages ; ne pas les partager.

## Validation fonctionnelle du 28/11/2026 (résultats réels)
- **Agent `ecc:security-reviewer`** : lancé, lecture seule, sur `serveur/droits.js` (+ `jeton.js`, `session.js`, `catalogue.js`, `base-firestore.js`, `api.js`, `firestore.rules`). Rapport exploitable en 3 min 14 s, aucun fichier modifié (`git diff -- serveur` vide). Verdict : aucun constat critique ni haut. 6 constats moyens/faibles, dont deux que j'ai relus dans le code et confirmés : (1) `session.js` stocke une `version` de session que rien ne compare (le rôle Créateur reste valable jusqu'à 5 jours) ; (2) `accesOffertActif` traite une date de fin illisible comme « accès permanent » (`droits.js` l. 34). Les autres (clés `Object.prototype`, concurrence sur `majDroits`, e-mails vides, double facturation) n'ont pas été reproduits. Aucun correctif appliqué.
- **Commande `/ecc-guide`** : chargée et exécutée (lecture de `hooks/README.md`).
- **Compétence `context-budget`** : chargée ; son mode par défaut ne lit rien et renvoie vers `/context`.
- **Hooks** : preuve d'exécution = le fichier de session ci-dessus, créé pendant la session. Les autres hooks (`pre:hookify-runtime`, etc.) n'ont pas de trace observable : non vérifiés individuellement.

## Première utilisation réelle : correctif de sécurité des sessions et des dates (28/11/2026)
- `ecc:security-reviewer` (lecture seule) a audité `serveur/droits.js` : deux constats confirmés (sessions Créateur non révocables, date de fin illisible = accès permanent).
- Le correctif a été écrit par Claude puis relu par `ecc:security-reviewer` sur le diff. Détails, procédure d'urgence et risques restants : `docs/SECURITE-SESSIONS-DROITS.md`.
