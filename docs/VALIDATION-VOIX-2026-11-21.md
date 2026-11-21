# Résultat de l'écoute des voix (client) — 21/11/2026

Écoute faite par le client avec `/outils/voix/validation` : **76 validées, 7 doutes, 94 refusées**.
Constat principal : la majorité des refus sont « mauvaise phrase » (clip rangé sous le mauvais identifiant), pas seulement un défaut de prononciation.

## Ablutions
**Validées (garder la nouvelle voix)** : g3ko_* (7), g3ok, g4i, g4ok, g4ko_* (7), h0 à h7, j3_fin, j3_fin0, q3_bouche, q3_bras, q3_mains, q3_nez, q3_tete, q3_visage, s7, s8, t3 à t8.
**Refusées** : done, g1i, g1ok, g2ko3, g2koe, g2kot, g2ok3, g2oke, g2okt, games, h8, q2_* (8, mauvaise phrase), q3_start, r1, r2, r3, s0 (la nouvelle dit « la bouche »), s1 (parle de l'étape 5), s2 (étape 6), s3 (mots du désert, du wadi…), s4 (rien à voir), s5, s6, t0, t1 (mal prononcé).
**Doutes** : home (phrase mélangée), t2 (« Bismillâh » mal prononcé), why (« Allah » mal prononcé).

## Prière
**Validées** : d_gh, d_rk, d_sm, dip_no, f_gh, f_rb, f_rk, f_sj, f_ts, g1i, g1ok, g3i, g3ko_qiyam/roukou/soujoud, g3ok_qiyam/roukou/soujoud, g3q, g4i, games, h1_0 à h1_4, j3_fin, j3_h13, j3_h14, j3_h7, r1, r2, r3, rep, slow.
**Refusées** : d_ak, d_ts, dip, done, e_fatiha, e_itidal, e_jalsa, e_niyya, e_qiyam, e_rakaa, e_roukou, e_soujoud1, e_soujoud2, e_sourate, e_takbir (mauvaise phrase), e_tachahhoud (mal prononcé), f_ak, f_sm, f_th (**faute grave de sens** : « j'atteste qu'Allah est son serviteur »), g3ko_jouloûs, g3ok_jouloûs, g4ko, g4ok (dit « presque »), g4q, h1_5, h1_6, home, learn_ok, sens.
**Doutes** : d_rb, d_sj, d_th (mal prononcé), e_taslim (manque le mot « prière »).

## Calendrier Ramadan
**Toutes les 169 voix actuelles sont à refaire** (décision du client : pas d'ancienne voix). Script : `_documentation/VOIX_CALENDRIER_A_PRODUIRE.csv`.

## Suite
Les clips validés peuvent être branchés (après accord). Les refusés sont à régénérer ou à ré-associer ; les doutes de prononciation (Allah, Bismillâh) passent par le dictionnaire de prononciation ElevenLabs.

---

## Nouvelles voix de la narratrice (voix « Nour - Narratrice », ElevenLabs eleven_v4) — validations par lots

- **Prononciation arabe (14 termes écrits en arabe)** : 14/14 corrects (Allah, Bismillah, Alhamdulillah, SubhanAllah, In sha Allah, MashaAllah, Assalamu alaykum, Al-Qur'an, Muhammad, Ibrahim, Musa, Isa, Yusuf, Yunus).
- **Lot 1 (5 phrases)** : 5/5 validées — ablutions/home, ablutions/g1i, ablutions/q2_bras, ablutions/r3, priere/learn_ok.
- **Lot 2 (15 phrases)** : 15/15 validées — ablutions/done, g2koe, g2kot, g2oke, g2okt, games, h8, q2_mains, q2_bouche, q2_nez, q2_visage, q2_tete, q2_oreilles, q2_pieds, q3_start.
- **Lot 3 (20 phrases)** : 19/20 validées ; **refusée : ablutions/s1** (« au nom d'Allah » dit « illeh » : cause = apostrophe collée au mot arabe « d'اللَّه » ; règle corrigée en « de اللَّه », à régénérer).
- **Lot 4 (20 phrases)** : 19/20 validées (dont priere/f_th, validée avec le texte « miséricorde d’اللَّه » : ne pas la régénérer) ; **non jugée : priere/e_jalsa** (à écouter).
- Lots 5 à 7 générés (42 phrases), en attente d'écoute. 140 phrases restantes bloquées par la limite de crédits de la clé API (4 000), à relancer après levée de la limite.
- Rien n'est branché dans les jeux : branchement uniquement après validation et accord du client.

- **Génération complète (21/11/2026)** : les 237 phrases (68 jeux + 169 calendrier) sont générées avec la voix de la narratrice, en 15 lots, non branchées. Crédits ElevenLabs utilisés : environ 5 900 sur 126 441. Écoute en cours.
- **Lot 5 (20 phrases)** : 20/20 validées — priere/h1_5, h1_6, home, sens, d_rb, d_sj, d_th, e_taslim ; calendrier/ms1 à ms6 et mb1 à mb6.
- **Cumul validé : 78 phrases** (lots 1 à 5, hors ablutions/s1 à réécouter dans le lot 8 et priere/e_jalsa non jugée). Restent à écouter : lots 6 à 15.
- **Lot 6 (14 phrases)** : 13/14 validées ; **non jugée : calendrier/ms10**. Cumul validé : 91 phrases.
- **Lot 7 (3 phrases)** : 3/3 validées — calendrier/ms17, mb17, ms18. Cumul validé : 94 phrases.
- **Lot 8 (19 phrases)** : 18/19 validées (calendrier mb13, ms14 à ms16, mb15, mb16, mb18, ms19 à ms24, mb19 à mb24) ; **ablutions/s1 refusée de nouveau** (« alleh » au lieu d'« Allah » avec « (au nom de اللَّه) »). 3 variantes de s1 générées dans le lot 16. Cumul validé : 112 phrases.
- **Lot 16 (variantes de ablutions/s1)** : variantes A et C validées, B refusée. **Retenue : A** (« …(au nom de اللَّهِ). »). Cumul validé : 113 phrases.
- **Lot 9 (20 phrases)** : 18/20 validées (calendrier ms25 à ms30, mb25 à mb30, cheer0 à cheer4, l10) ; **msstar et mbstar refusées : le texte envoyé commençait par « undefined » (bug du script, corrigé)**. Régénérées dans le lot 17. Cumul validé : 131 phrases.
- **Lot 17 (2 phrases)** : 2/2 validées — calendrier/msstar, mbstar. Cumul validé : 133 phrases.
- **Lot 10 (20 phrases)** : 20/20 validées — calendrier l20, l29, fin, debut, guide à guide4, dp0q à dp5a. Cumul validé : 153 phrases.
- **Lot 11 (20 phrases)** : 19/20 validées ; **calendrier/dp6a refusée** (« Al Coran » : l'article arabe « الْ » avait été écrit ; règle corrigée : « Coran » = قُرْآن, sans article). dg1a validée (texte « Le sahour » encore en transcription, non écrit en arabe). dp6a, qp2a, qg4q, qg5q, w_quran régénérées dans le lot 18. Cumul validé : 172 phrases.
- **Correction « Coran » (décision du client)** : on garde le « Al » arabe (الْقُرْآن) et on retire l'article français devant (« le Coran » → « الْقُرْآن »), pour ne pas entendre « le Al Coran ». Lot 18 régénéré avec cette règle.
- **Lot 18 (5 phrases : dp6a, qp2a, qg4q, qg5q, w_quran)** : validées sur décision du client (« pas grave, valide, vas-y au suivant »), avec « الْقُرْآن » sans article français. Cumul validé : 177 phrases. Restent à écouter : lots 12 à 15, plus priere/e_jalsa (lot 4) et calendrier/ms10 (lot 6) non jugées.
