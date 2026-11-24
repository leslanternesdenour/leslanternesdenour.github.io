# E-mails des comptes (vérification, mot de passe oublié) — français et délivrabilité

État au 24/11/2026. Le projet Firebase `lanternes-de-nour` est **partagé entre la préproduction et la production** : tout réglage de la console s'applique aux deux.

## Ce que fait le code (déjà publié)
- `a.languageCode = 'fr'` est posé à l'initialisation de Firebase (`compte/client.js`) : **tous les envois** (inscription, renvoi, mot de passe oublié) demandent le modèle **français**. Sans ce réglage, Firebase envoie son modèle anglais (c'était la cause de l'e-mail en anglais).
- Chaque e-mail porte un lien de retour vers le site (`/compte/?verifie=1` ou `/compte/#connexion`). Si le domaine n'est pas dans les « Domaines autorisés » de Firebase, l'envoi se fait sans lien de retour (repli automatique).
- Au retour (`?verifie=1`), la page vérifie tout de suite et débloque le jeu ; le renvoi a un compte à rebours de 60 s.

## À régler dans la console Firebase (par le propriétaire du projet)
Console Firebase → projet `lanternes-de-nour` → **Authentication**.

1. **Paramètres → Nom public du projet** : `Les Lanternes de Nour` (il remplace `%APP_NAME%` dans les e-mails et s'affiche sur l'écran Google).
2. **Paramètres → Domaines autorisés** : vérifier la présence de `leslanternesdenour.fr`, `www.leslanternesdenour.fr` et `preproduction.lanternes-de-nour.pages.dev`.
3. **Modèles (Templates) → choisir la langue « Français »** dans le sélecteur du modèle, puis modifier **le modèle français** (le modèle anglais est un autre modèle) :

**Vérification de l'adresse e-mail**
- Nom de l'expéditeur : `Les Lanternes de Nour`
- Répondre à : une adresse que vous lisez (par exemple `contact@leslanternesdenour.fr`)
- Objet : `Vérifiez votre adresse e-mail pour %APP_NAME%`
- Message :
```
Bonjour,

Merci d'avoir créé un compte parent sur Les Lanternes de Nour.

Pour protéger les enfants, le jeu s'ouvre dès que votre adresse e-mail est vérifiée. Cliquez sur ce lien :

%LINK%

Revenez ensuite sur la page « Espace famille » : elle se met à jour toute seule et ouvre le jeu.

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : rien ne sera activé.

L'équipe des Lanternes de Nour
https://leslanternesdenour.fr
```

**Réinitialisation du mot de passe**
- Objet : `Réinitialisez votre mot de passe — %APP_NAME%`
- Message :
```
Bonjour,

Vous avez demandé à choisir un nouveau mot de passe pour votre compte parent Les Lanternes de Nour (%EMAIL%). Cliquez sur ce lien :

%LINK%

Si vous n'êtes pas à l'origine de cette demande, ignorez simplement ce message : votre mot de passe ne changera pas.

L'équipe des Lanternes de Nour
https://leslanternesdenour.fr
```

## Délivrabilité : pourquoi les messages risquent d'arriver en indésirables
Constats vérifiés (DNS public, 24/11/2026) :
- L'expéditeur par défaut de Firebase est `noreply@lanternes-de-nour.firebaseapp.com` : un domaine générique de Google, **sans lien visible avec la marque**, avec un lien long vers `firebaseapp.com`. Les filtres (Gmail en tête) se méfient de ce profil, surtout pour un tout premier message.
- Le modèle était en **anglais** pour un parent français : signal négatif supplémentaire (corrigé).
- Le domaine `leslanternesdenour.fr` : MX chez OVH (boîtes), SPF `v=spf1 include:mx.ovh.com -all` (seul OVH est autorisé), **aucun DMARC**, aucun DKIM Firebase.
- Je n'ai pas pu lire le message reçu (classé en indésirables, le connecteur Gmail ne l'expose pas) : les en-têtes SPF/DKIM/DMARC réels restent à confirmer (Gmail → ⋮ → « Afficher l'original »).

## Options pour un expéditeur professionnel `@leslanternesdenour.fr` (aucune n'est activée)
- **A. Domaine d'expéditeur personnalisé de Firebase** (recommandé en premier) : console → Authentication → Modèles → crayon d'un modèle → « Personnaliser le domaine ». Firebase affiche les enregistrements DNS exacts (vérification + DKIM) à ajouter dans Cloudflare, en « DNS seulement » (nuage gris). L'expéditeur devient `noreply@leslanternesdenour.fr`. Pas de service payant annoncé par la console pour cette option ; vérifier l'écran avant de valider.
- **B. SMTP personnalisé** (Identity Platform) : exige le passage à Identity Platform (compte de facturation) : **service potentiellement payant, à ne pas activer sans accord**.
- **C. Envoi par un prestataire e-mail transactionnel** (compte, clé API et DNS à créer ; les e-mails sont alors générés par notre serveur) : contrôle total du modèle et du lien, séparation préproduction / production ; **à valider avant toute mise en place**.

## Enregistrements DNS à ajouter (Cloudflare, uniquement après votre accord)
1. **DMARC** (sans risque, mode observation) : type `TXT`, nom `_dmarc`, valeur `v=DMARC1; p=none; rua=mailto:ADRESSE_A_CHOISIR@leslanternesdenour.fr; adkim=r; aspf=r`. Indiquez l'adresse qui recevra les rapports.
2. **Option A** : les enregistrements affichés par la console Firebase. Il ne doit exister qu'**un seul** enregistrement SPF : si Firebase demande un `include:`, je vous donne la ligne fusionnée, par exemple `v=spf1 include:mx.ovh.com include:<valeur Firebase> -all`.
3. Ne rien changer aux MX ni à l'enregistrement SPF actuel avant d'avoir la valeur exacte de la console.

## Contrôle après réglage
Demander un lien (inscription ou « Renvoyer le lien »), puis vérifier : objet et texte en français, expéditeur au nom des Lanternes de Nour, lien fonctionnel, retour sur `/compte/?verifie=1`, déblocage du jeu sans clic, et, dans « Afficher l'original », `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS`.
