// PARCOURS NOURANIA — carte des niveaux (préproduction seulement, derrière un drapeau). Étapes jamais mélangées.
import { ALPHABET } from '../../commun/langue/alphabet.js';
const ETAPES = ['reconnaissance', 'nom', 'son', 'fatha', 'kasra', 'damma', 'combinaisons', 'syllabes', 'exercices'];
export const NIVEAUX = ETAPES.map((etape, i) => ({ id: 'n' + i, etape }));
// Statut d'un clip : a_valider (synthèse brouillon) | valide_humain (écouté et validé par une personne compétente) | refuse. Seul valide_humain se joue dans ce parcours.
export const jouable = statut => statut === 'valide_humain';
// Progression du parcours : clé PROPRE (jamais celles de ecole_lettres / ecole_lecture / ecole_chiffres / du profil) pour ne rien toucher aux profils existants.
export const CLE_STOCKAGE = 'ecole_nourania_v1';
// Lettres à surveiller (ث ح خ ذ ص ض ط ظ ع غ ق) : au niveau « son », elles reçoivent en plus un repère d'articulation (مخرج الحرف) — à faire valider.
export const LETTRES_DIFFICILES = ['tha', 'ha', 'kha', 'dhal', 'sad', 'dad', 'ta2', 'za2', 'ayn', 'ghayn', 'qaf'];
export const besoinRepere = id => LETTRES_DIFFICILES.includes(id);
// Clips de référence (112 = 28 lettres × nom + 3 voyelles), identifiés « <élément>.<lettre> » : n1 = nom, n3 = fatha, n4 = kasra, n5 = damma. Les autres niveaux n'ont pas de clip propre (assemblés ou repris).
const ELEMENT_DU_NIVEAU = { n1: 'nom', n3: 'fatha', n4: 'kasra', n5: 'damma' };
export const clipsDuNiveau = niveau => ELEMENT_DU_NIVEAU[niveau] ? ALPHABET.map(l => `${ELEMENT_DU_NIVEAU[niveau]}.${l.id}`) : [];
