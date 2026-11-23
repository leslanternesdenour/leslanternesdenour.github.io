// CONTENUS HISTORIQUES ET RELIGIEUX DE LA ROUTE — TOUS « À VALIDER » par le créateur avant intégration définitive.
// Un seul fichier de données, facile à relire. Aucune information non vérifiée n'est figée comme certitude :
//   - statut 'À VALIDER' : affiché avec une mention visible (étiquette) ; passer à 'VALIDÉ' seulement avec validePar + date (accord écrit du créateur) ;
//   - texte null : fiche prévue pour une tranche suivante, rien n'est affiché ;
//   - aucune représentation de prophète, de compagnon ou de personne historique ou religieuse identifiable ;
//   - on distingue ce qui est documenté (sources) et ce qui est un choix artistique (artistique: true).
export const STATUT_A_VALIDER = 'À VALIDER';

export const CONTENU = {
  'intro-grande-route': { sujet: 'La Mecque (présentation de la grande route)', statut: STATUT_A_VALIDER, artistique: false, sources: [],
    texte_3_5: 'Cette grande route est très longue. Elle va jusqu\'à une ville très importante pour les musulmans : La Mecque.',
    texte_6_10: 'Cette grande route est très longue. Tout au bout se trouve La Mecque, une ville très importante pour les musulmans, où se trouve la Kaaba. Tu vas la découvrir petit à petit, étape après étape.' },
  // fiches des tranches suivantes : prévues, vides, à rédiger puis à faire valider
  'kaaba': { sujet: 'La Kaaba, son importance, la Qibla et la prière', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'zamzam': { sujet: 'Zamzam, Hajar et Ismaïl', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'safa-marwa': { sujet: 'Safa et Marwa', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'jabal-nour': { sujet: 'Jabal an-Nour (la grotte de Hira)', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'jabal-thawr': { sujet: 'Jabal Thawr', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'hajj-omra': { sujet: 'Le Hajj et la Omra', statut: STATUT_A_VALIDER, texte_3_5: null, texte_6_10: null, sources: [] },
  'mecque-vii': { sujet: 'La Mecque au VIIe siècle (ville, maisons, rues)', statut: STATUT_A_VALIDER, artistique: true, texte_3_5: null, texte_6_10: null, sources: [] }
};

// La mention affichée à côté d'un contenu non validé
export const etiquette = fiche => fiche && fiche.statut === STATUT_A_VALIDER ? '⚠️ À VALIDER' : '';
// Le texte à afficher pour un âge ('3-5' ou '6-10'), ou null si la fiche n'est pas encore rédigée
export const texteDe = (fiche, age) => (fiche && (age === '3-5' ? fiche.texte_3_5 : fiche.texte_6_10)) || null;
