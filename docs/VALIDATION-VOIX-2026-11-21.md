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
- Lots 3 à 7 générés (82 phrases), en attente d'écoute. 140 phrases restantes bloquées par la limite de crédits de la clé API (4 000), à relancer après levée de la limite.
- Rien n'est branché dans les jeux : branchement uniquement après validation et accord du client.
