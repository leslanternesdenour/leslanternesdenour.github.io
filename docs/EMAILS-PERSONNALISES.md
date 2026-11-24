# E-mails des comptes envoyés par notre serveur (vérification, mot de passe oublié)

État au 24/11/2026. Firebase Authentication reste le système des comptes (inscriptions, connexions, sessions, vérification, mots de passe). **Seul l'envoi des e-mails change** : Firebase génère le jeton, notre serveur envoie le message.

## Comment ça marche
1. Le parent s'inscrit (Firebase). Aucun e-mail Firebase n'est envoyé.
2. L'Espace famille appelle `POST /api/email/verification` : le serveur demande à Firebase un code d'action (`accounts:sendOobCode` avec `returnOobLink`, l'appel utilisé par le SDK Firebase Admin ; le SDK Node lui-même ne tourne pas dans Cloudflare), fabrique le lien `https://<site>/compte/action/?mode=verifyEmail&oobCode=…&lang=fr` et envoie l'e-mail par le prestataire.
3. Le parent clique : la page `/compte/action/` applique le code (usage unique, durée limitée, géré par Firebase), puis renvoie vers `/compte/?verifie=1` : l'Espace famille se débloque tout seul et un e-mail de confirmation part (une fois).
4. Mot de passe oublié : `POST /api/email/reinitialisation` (réponse identique que le compte existe ou non), lien `mode=resetPassword`, page `/compte/action/` avec formulaire du nouveau mot de passe.
5. Tant que le prestataire n'est pas configuré, ces routes répondent 503 `email-non-configure` et le navigateur **retombe sur l'envoi Firebase** : rien n'est coupé.

Sécurité : l'adresse destinataire vient toujours de la session (vérification) ou de la demande normalisée (réinitialisation, sans énumération) ; 90 s entre deux envois et 6 par jour et par compte ; 8 demandes de réinitialisation par IP et 15 minutes ; liens construits uniquement sur nos domaines ; aucune clé dans le navigateur ni dans le dépôt ; la vérification reste obligatoire côté serveur avant tout jeu.

## Prestataire recommandé : Resend
| | Resend | Brevo |
|---|---|---|
| Offre gratuite | 3 000 e-mails/mois, 100/jour, 3 domaines (pricing officiel) | 300 e-mails/jour, gratuit sans carte (aide Brevo) |
| Marque dans les e-mails gratuits | non indiquée | « Sent with Brevo » **toujours présent** sur l'offre gratuite (FAQ officielle) |
| Appel HTTPS | `POST https://api.resend.com/emails`, simple `fetch` | `POST https://api.brevo.com/v3/smtp/email`, simple `fetch` |
| Cloudflare Pages Functions | oui (HTTPS, sans SDK) | oui (HTTPS, sans SDK) |
| Domaine d'envoi | SPF + DKIM (+ DMARC conseillé), valeurs données par le tableau de bord | expéditeur à valider, détails DNS non lus (pages inaccessibles) |
| Si on dépasse | Pro à 20 $/mois (50 000/mois) | à partir d'environ 7 €/mois (source secondaire, à vérifier) |

**Coût réel aujourd'hui : 0 €** avec Resend (offre gratuite). Le plafond de 100 e-mails/jour suffit largement pour les vérifications et réinitialisations au démarrage ; au-delà, le repli Firebase reste disponible et une offre payante serait à décider par vous. Brevo est plus généreux en volume (300/jour) mais ajoute sa marque. Le code gère les deux : changer de prestataire = changer `EMAIL_FOURNISSEUR`.

## Variables Cloudflare (environnement Aperçu / Preview uniquement)
- **Déjà dans `wrangler.toml` (rien à saisir)** : `EMAIL_FOURNISSEUR = "resend"`, `EMAIL_EXPEDITEUR_ADRESSE = "bonjour@leslanternesdenour.fr"`, `EMAIL_EXPEDITEUR_NOM = "Les Lanternes de Nour"`.
- **À saisir : un seul secret** `EMAIL_CLE_API` = la clé API créée chez Resend (type Secret). Facultatif : `EMAIL_REPONSE` (adresse de réponse).
- Production : rien tant que vous ne la promouvez pas ; elle aura sa propre clé (différente).

## À faire chez Resend et dans les DNS (par vous)
1. Créer un compte gratuit sur resend.com (aucun abonnement payant).
2. Ajouter le domaine `leslanternesdenour.fr` (choisir la région Europe si proposée) : Resend affiche les enregistrements exacts (DKIM en TXT, SPF et MX de retour, en général sur une sous-adresse dédiée). **Ne modifiez pas le SPF existant de l'adresse principale** (`v=spf1 include:mx.ovh.com -all`, utilisé pour vos boîtes OVH) sans m'envoyer ce que Resend affiche : je vous donne alors la ligne exacte.
3. Ajouter ces enregistrements dans Cloudflare en « DNS seulement » (nuage gris), attendre « Verified ».
4. Ajouter le DMARC (observation) : TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:ADRESSE@leslanternesdenour.fr; adkim=r; aspf=r`.
5. Créer une clé API Resend limitée à l'envoi, la saisir comme secret `EMAIL_CLE_API` dans Cloudflare (Aperçu), relancer le déploiement. `/api/sante` affichera `courriel: "resend"`.

## Contrôle après configuration
Inscription → e-mail de Les Lanternes de Nour (expéditeur `bonjour@leslanternesdenour.fr`) en français → clic → retour sur le site → jeu débloqué + e-mail de confirmation → « Mot de passe oublié » → e-mail → nouveau mot de passe. Dans « Afficher l'original » : `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
