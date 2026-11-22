# Attribution des voix — jeux « Les Aventures des Lanternes »

**Règle** : seules les **10 voix « Nour - … »** du compte ElevenLabs sont utilisées (liste officielle : `outils/voix/jeux/voix-nour.json`). Aucune voix créée, supprimée ni renommée. La voix de la mascotte Nour est réservée à Nour. Une voix extérieure (ex. « Damien Doré ») avait été utilisée par erreur pour le rôle « narrateur » : **corrigé** (254 audios régénérés avec « Nour - Salim (voyageur) » ; 189 audios déjà conformes conservés ; 10 610 caractères consommés, rien de plus).

## Les 10 voix « Nour » du compte
| Voix ElevenLabs | Identifiant | Attribuée à |
|---|---|---|
| Nour - Narratrice (maitresse) | `hddT377hAwvRoOKqMj0E` | Narratrice (contenus existants et jeux) |
| Nour - Salim (voyageur) | `8aQsvxWbavqMpn00DVgR` | **Narrateur** masculin et explorateur Idriss |
| Nour - Amina (tapis) | `pzZMNBXJh6wfnYfk2wLK` | Loumi |
| Nour - Karim (marchand) | `lM87a4ey2IQxE37nDvti` | Karim, le marchand |
| Nour - Hakim (ancien) | `hbGEl9097evPuRZp5BNY` | Hakim, le sage |
| Nour - Samira (potiere) | `HAjl4nFl1aflZ2gaim1o` | Salma, la maîtresse de maison |
| Nour - Layla (tisserande) | `y01lcQwxER91RfOMk2oG` | Warda, la gardienne de la bibliothèque |
| Nour - Hassan (sellier) | `IbnTg9TZjxSEt8tJQteX` | Yacine, le jardinier |
| Nour - Nabil (ecurie) | `4sifSi2zIrBX7VkoWfjD` | Samir, le puisatier |
| Nour - Nour (mascotte) | `7FhMHxpv3kwYS7eBOJoC` | **Réservée à Nour** (aucun rôle des jeux) |

Un seul partage de voix : Salim dit le narrateur et Idriss (5 phrases d'introduction), car 9 voix sont disponibles (celle de Nour exclue) pour 10 rôles.

## Audios générés (vérifiés fichier par fichier : `node outils/voix/jeux/verifier-audios.mjs`)
| Voix | Identifiant | Personnage | Audios | Chasse | Mystères | Quiz |
|---|---|---|---|---|---|---|
| Nour - Salim (voyageur) | `8aQsvx…` | Narrateur | 254 | 110 | 42 | 102 |
| Nour - Amina (tapis) | `pzZMNB…` | Loumi | 113 | 4 | 10 | 99 |
| Nour - Narratrice (maitresse) | `hddT37…` | Narratrice | 55 | 40 | 11 | 4 |
| Nour - Salim (voyageur) | `8aQsvx…` | Idriss | 5 | 0 | 3 | 2 |
| Nour - Hassan (sellier) | `IbnTg9…` | Yacine | 3 | 1 | 1 | 1 |
| Nour - Layla (tisserande) | `y01lcQ…` | Warda | 3 | 1 | 1 | 1 |
| Nour - Nabil (ecurie) | `4sifSi…` | Samir | 3 | 1 | 1 | 1 |
| Nour - Hakim (ancien) | `hbGEl9…` | Hakim | 3 | 1 | 1 | 1 |
| Nour - Karim (marchand) | `lM87a4…` | Karim | 2 | 1 | 0 | 1 |
| Nour - Samira (potiere) | `HAjl4n…` | Salma | 2 | 1 | 0 | 1 |
| **Total** | | | **443** | 160 | 70 | 213 |

## Ce qui est vérifié automatiquement… et ce qui ne l'est pas
- Vérifié : texte du fichier = texte source du jeu ; voix enregistrée à la génération = voix du rôle = l'une des 10 voix Nour ; fichier MP3 lisible, durée cohérente avec le texte ; aucun fichier conforme réécrit ; chaque identifiant demandé par un jeu a son audio.
- **Non vérifiable par moi : l'écoute.** La voix est garantie par l'appel d'API (l'historique ElevenLabs ne conserve ni voix ni texte), mais la qualité et la prononciation française ne sont pas validées à l'oreille.
- **18 mots arabes de la Chasse aux mots : « à valider »** (prononciation non contrôlée par un humain). Les questions religieuses du quiz et des histoires restent à valider (`docs/QUIZ-VERIFICATION.md`).
