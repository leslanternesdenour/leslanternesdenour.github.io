# REPRISE DE LA MIGRATION — à lire en premier dans la nouvelle session

> **MISE À JOUR 22/11/2026 (fin de session)** : le client confirme que la **zone Cloudflare est ACTIVE** (donc serveurs de noms changés chez OVH) et qu'il a créé le **jeton** (à enregistrer dans les réglages de l'environnement, JAMAIS dans le chat). Autorisation EXPLICITE du client : publier sur `leslanternesdenour.fr` ce qui est terminé et validé sur `preproduction`, terminer la migration (DNS inclus), sauvegarde avant toute modification, e-mails/MX/SPF/DKIM/DMARC préservés, HTTPS vérifié sur l'apex et `www`, audit complet ordinateur + mobile, **rapport final précis** (publié / fonctionne / en attente / erreurs / tests). Aucun achat ni abonnement. Confirmation DNSSEC OFF : implicite (zone active) mais à re-vérifier (`GET /zones/<id>/dnssec` doit indiquer « disabled », ou aucun DS) avant `--appliquer --dnssec-desactive`.
> Contenu prêt sur `preproduction` (commit b206eba) : site, Monde de Nour + portail aux lanternes (voix validée lot 22 B), jeux, voix validées (Ablutions, Prière, Calendrier, 19 clips du Grand Voyage), mode sans visage global, corrections du personnage (salut, yeux, joues, sacoche, cheveux). **À NE PAS publier** : la version de test des personnages améliorés (`outils/personnages/*`, exclu de la production par construction) ; Stripe/paiements (non configurés, aucun paiement réel) : vérifier que `/tarifs/` n'affiche pas de bouton cassé ; Premium/R2 non activés.
> Ordre : 1) contrôle d'accès API (`GET /user/tokens/verify`, projet Pages, zone) ; 2) sauvegarde (branche `sauvegarde-avant-publication-2026-11-22` = `main` + `production` actuelles, sauvegarde DNS via le diagnostic) ; 3) tests complets sur le commit à publier ; 4) `bash outils/migration/promouvoir.sh --pousser` (met `production` à jour, déploie sur pages.dev) et `verifier-production.mjs` sur pages.dev ; 5) diagnostic puis `basculer-cloudflare.mjs --appliquer --dnssec-desactive` ; 6) `verifier-production.mjs https://leslanternesdenour.fr --mode production --navigateur` + idem `www` + audit mobile ; 7) fusion `production` → `main` (ff-only) ; 8) rapport.

Rédigé le 22/11/2026. Le client a demandé : « **reprends la migration** » après avoir configuré le jeton Cloudflare. Autorisation explicite du client : connexion du domaine, DNS, HTTPS, vérifications complètes, déploiement public, modification de `main`, **avec sauvegarde DNS préalable**, sans supprimer de données utiles, sans toucher aux secrets existants, sans achat ni abonnement.

## 1. État exact (rien à refaire)
- **Branches** : `preproduction` (travail, aperçu Cloudflare), **`production`** = `preproduction` + `wrangler.toml` de production (créée par `bash outils/migration/promouvoir.sh --pousser`), `main` = ancien site GitHub Pages (`dc39d93`, 19/11, **inchangée**), sauvegarde `sauvegarde-production-2026-11-22` = `main` d'origine. Le clone de la session peut être « superficiel / une seule branche » : faire `git fetch --unshallow` et `git fetch origin '+refs/heads/*:refs/remotes/origin/*'`.
- **Cloudflare (fait par le client)** : projet Pages `lanternes-de-nour`, **branche de production = `production`**, déploiements automatiques activés ; domaines Firebase `leslanternesdenour.fr` et `www.leslanternesdenour.fr` **autorisés**. `https://lanternes-de-nour.pages.dev` sert la **production** (branche `production`). L'aperçu de la préproduction : `https://preproduction.lanternes-de-nour.pages.dev` (environnement Preview : **sans secrets**, les comptes n'y fonctionnent pas ; l'écoute des voix et le portail y fonctionnent).
- **Production vérifiée sur Cloudflare** (`node outils/migration/verifier-production.mjs https://lanternes-de-nour.pages.dev --mode production`) : 58/59 (le 59e, `www`, ne vaut que pour le domaine public). Variables : le serveur répond 503 si `SESSION_SECRET`, `FIREBASE_PROJET` ou `FIREBASE_COMPTE_SERVICE` manque ; la production répond normalement (401 « jeton-invalide » à un faux jeton) → les trois sont définies. Aucune variable `STRIPE_*` ni R2 en production (voulu : aucun paiement réel).
- **Le domaine public `leslanternesdenour.fr` est encore servi par GitHub Pages** (en-tête `server: GitHub.com`, `last-modified` 19/11). **C'est ce qu'il reste à basculer.**
- Hôtes autorisés dans l'environnement : `lanternes-de-nour.pages.dev`, `leslanternesdenour.fr`, `www.leslanternesdenour.fr`, `preproduction.lanternes-de-nour.pages.dev`.

## 2. Ce que le client doit avoir fait AVANT de dire « reprends la migration »
1. Créé un **jeton API Cloudflare** (profil → API Tokens → Custom Token) avec exactement : **Account → Cloudflare Pages → Edit** et **Zone → DNS → Edit** ; ressources : son compte et la zone `leslanternesdenour.fr` seulement ; **expiration 24 h**.
2. Enregistré ce jeton dans les **réglages de l'environnement** (menu de l'environnement dans la barre de titre → *Edit* → **Network secrets** / API credentials) : hôte `api.cloudflare.com`, en-tête `Authorization`, valeur `Bearer <jeton>`. Le formulaire sécurisé de la session précédente était inutilisable (session trop longue) : **ne jamais demander le jeton dans le chat**.
3. Relevé deux identifiants NON secrets : **Account ID** et **Zone ID** de `leslanternesdenour.fr` (page *Overview* de la zone). Si la zone n'est pas dans son compte Cloudflare (DNS chez le registrar), la bascule DNS est impossible par jeton : il faut d'abord ajouter le site à Cloudflare (forfait gratuit) et changer les serveurs de noms chez le registrar (action du client) → s'arrêter et lui expliquer précisément.

## 2 bis. PRÉREQUIS DNS (OVH → Cloudflare) — à valider AVANT toute modification
Contexte : domaine chez **OVH**, zone ajoutée à Cloudflare (forfait gratuit) ; **DNSSEC** en cours de désactivation chez OVH ; **serveurs de noms pas encore changés** (au moment de la rédaction). Ordre impératif :
1. **DNSSEC OFF** : statut OVH « désactivé », ET le DS a disparu des résolveurs publics. Vérification (Windows, sans Node) :
   `nslookup -type=DS leslanternesdenour.fr 1.1.1.1` puis la même avec `8.8.8.8` → ne doit renvoyer **aucun** enregistrement DS (aussi : https://dnsviz.net/d/leslanternesdenour.fr/dnssec/). Marge de prudence recommandée : **1 heure de plus** (le DS peut rester en cache chez des résolveurs). Tant que ce n'est pas le cas : **ne pas changer les serveurs de noms**.
2. **Comparer les zones** (messagerie !) : copier la zone OVH (Manager → le domaine → *Zone DNS* → *Modifier en mode textuel*) et l'export Cloudflare (DNS → Enregistrements → *Exporter*) dans deux fichiers, puis
   `node outils/migration/comparer-zones.mjs ovh.txt cloudflare.txt` → doit afficher « Aucun enregistrement … ne manque ». S'il en manque (surtout MX / SPF / DKIM / DMARC / autoconfig) : les ajouter dans Cloudflare **avant** l'étape 3 ; les hôtes de messagerie (`mail`, `smtp`, `imap`, `autoconfig`…) en **DNS seul (nuage gris)**.
3. **Changer les serveurs de noms chez OVH** (Noms de domaine → le domaine → *Serveurs DNS* → *Modifier*) : mettre les **deux serveurs Cloudflare** affichés dans Cloudflare pour la zone (`xxx.ns.cloudflare.com`). Les libellés OVH peuvent évoluer. Le site continue de fonctionner (les enregistrements GitHub importés sont identiques) ; propagation : de quelques minutes à quelques heures.
4. Attendre que la zone soit **« Active »** dans Cloudflare (e-mail de Cloudflare, ou bouton *Vérifier les serveurs de noms*), puis seulement : jeton, nouvelle session, bascule.
**Verrou de l'outil** : `basculer-cloudflare.mjs --appliquer` **refuse de s'exécuter** sans `--dnssec-desactive`, drapeau à ne passer qu'après la confirmation écrite du client que DNSSEC est OFF (testé). Le diagnostic (sans `--appliquer`) reste possible à tout moment : il ne modifie rien et écrit la sauvegarde DNS.

## 3. Déroulé (outil prêt et testé : `outils/migration/basculer-cloudflare.mjs`, 7 tests contre une fausse API)
```bash
# 0. contrôle d'accès (lecture) — doit répondre success:true
curl -s https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/pages/projects/lanternes-de-nour | head -c 300
# 1. DIAGNOSTIC : contrôles du projet, SAUVEGARDE DNS (docs/migration/dns-avant-bascule.json), plan. AUCUNE modification distante.
node outils/migration/basculer-cloudflare.mjs --compte <ACCOUNT_ID> --zone <ZONE_ID>
# 2. Si le plan est conforme (seuls les enregistrements GitHub sont supprimés ; MX/TXT intacts ; aucun enregistrement inconnu) :
node outils/migration/basculer-cloudflare.mjs --compte <ACCOUNT_ID> --zone <ZONE_ID> --appliquer --dnssec-desactive   # seulement si le client a confirmé DNSSEC OFF
# 3. VÉRIFICATION COMPLÈTE du domaine public
NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node outils/migration/verifier-production.mjs https://leslanternesdenour.fr --mode production --navigateur
```
- **Committer la sauvegarde DNS** (`docs/migration/dns-avant-bascule.json`, enregistrements publics, aucun secret) sur `preproduction`, puis `bash outils/migration/promouvoir.sh --pousser` pour garder `production` synchronisée.
- Le diagnostic affiche aussi la **messagerie** (nombre de MX/TXT, SPF/DKIM/DMARC) et signale tout hôte de courrier **proxifié** ; **MX/TXT ne sont jamais modifiés**.
- **Arrêts obligatoires** (ne rien forcer) : enregistrement inattendu sur l'apex/`www` ; contrôle du projet en échec (branche ≠ `production`, secret manquant, variable STRIPE présente) ; zone absente.
- **Retour en arrière** : `node outils/migration/basculer-cloudflare.mjs --compte … --zone … --restaurer` (supprime nos CNAME, recrée les enregistrements GitHub sauvegardés). Attention : si `main` a été modifiée entre-temps, GitHub Pages servirait le NOUVEAU `main` brut (sans fonctions serveur) : avant un retour DNS, restaurer d'abord `main` : `git push origin sauvegarde-production-2026-11-22:main --force-with-lease`.
- HTTP→HTTPS ne se contrôle pas depuis le réseau de la session (connexion en clair bloquée) : le demander au client (`http://leslanternesdenour.fr` doit rediriger vers `https://`).
- Délais : certificat HTTPS de quelques minutes ; propagation DNS possible (TTL). L'apex en CNAME proxifié est géré par Cloudflare (aplatissement).

## 4. Après la bascule réussie
1. Vérifier à la main avec le client (identifiants requis) : inscription e-mail, **connexion Google** (domaines Firebase déjà autorisés), profil enfant, portail, déconnexion/reconnexion.
2. **Fusionner `production` dans `main`** (autorisé) : `git checkout main && git merge --ff-only production && git push origin main` (`main` est un ancêtre de `production`). Faire cette fusion **après** que le domaine public a été vérifié.
3. Rappeler au client : **supprimer le jeton Cloudflare** (dès la fin) et retirer le secret réseau `api.cloudflare.com` des réglages de l'environnement ; optionnel : désactiver GitHub Pages (Settings → Pages) et supprimer le fichier `CNAME` du dépôt.
4. Mettre à jour `docs/MIGRATION-PRODUCTION.md` (état final) et le rapport demandé : transféré, opérationnel, fichiers/branches, commits, modifications DNS, tests, erreurs, restes, adresse publique définitive.

## 5. Points encore OUVERTS indépendants de la migration (à rappeler au client)
- **Voix du portail** : validée par le client le 22/11 (lot 22, candidats B et D) ; **B en service** (D disponible via `choisir-accueil.py 22 D --valide`). Question ouverte : la légende affichée « مَرْحَبًا » (tanwin) diffère du son validé « مَرْحَبَا ».
- **Portail** : ancienne animation aux lanternes restaurée, **en attente de validation explicite du client**.
- Aucun paiement réel (Stripe non configuré en production), stockage Premium non activé, 5 maisons Premium et 13 voix arabes humaines à venir, connexion Apple reportée.
- Voix du Grand Voyage : branche `voix-reparation` jamais déployée (à écouter avant décision).

## 6. Règles à ne jamais enfreindre
Jamais de secret dans le dépôt, le chat ou un message ; ne pas modifier variables, secrets, branche de production ni liaisons du projet Pages ; aucun achat ni abonnement ; ne rien supprimer sans sauvegarde relue ; tester avant de publier ; ne jamais enchaîner un commit derrière un test sans lire son résultat.
