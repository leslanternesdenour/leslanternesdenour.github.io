// Réglages par défaut des formules et des fonctionnalités.
// En production, ces valeurs sont lues dans Firestore (document « reglages/acces »), que seul l'administrateur
// peut modifier depuis le tableau de bord : changer une fonctionnalité de gratuit à Premium ne demande
// donc jamais de modifier le code. Ce fichier ne sert que de valeurs de départ et de secours.
//
// niveau d'une fonctionnalité : 'libre'   = ouverte à tous, même sans compte
//                               'gratuit' = ouverte avec le compte gratuit
//                               'premium' = réservée aux abonnés (payants, offerts, essai) et à l'administrateur
//                               'bientot' = en préparation : jamais présentée comme disponible
// limite : pour une fonctionnalité « gratuit », un aperçu limité (nombre de leçons, d'étapes…).

export const REGLAGES_PAR_DEFAUT = {
  version: 1,

  // Les prix sont des PROJETS, à valider. Aucun prix barré n'est affiché tant que prixHabituelValide est faux.
  tarifs: {
    mensuel: { promo: 4.99, habituel: 7.99 },
    annuel: { promo: 49.99, habituel: 79.90 }
  },
  promotion: {
    active: false,          // désactivée tant que tu n'as pas validé les dates et les prix
    debut: null,            // « AAAA-MM-JJ » : jamais inventé
    fin: null,
    prixHabituelValide: false,
    tarifPromoAcquisAuRenouvellement: true   // true : le prix promo suit l'abonné ; false : 1re période seulement
  },

  essai: { actif: true, jours: 7 },

  // Les fonctionnalités du site. « page » sert aux liens de la page d'abonnements.
  fonctionnalites: {
    decouverte:   { nom: 'Découverte du site', niveau: 'libre' },
    mascottes:    { nom: 'Présentation des mascottes', niveau: 'libre' },
    videos:       { nom: 'Vidéos YouTube', niveau: 'libre' },
    lecons:       { nom: 'Leçons islamiques', niveau: 'gratuit', limite: 3 },
    ablutions:    { nom: 'Parcours des ablutions', niveau: 'gratuit', limite: 'decouverte' },
    priere:       { nom: 'Apprentissage de la prière', niveau: 'gratuit', limite: 1 },
    jeux:         { nom: 'Jeux éducatifs', niveau: 'gratuit', limite: 2 },
    voyage:       { nom: 'Monde de Nour en 3D', niveau: 'gratuit', limite: 'zone-decouverte' },
    ramadan:      { nom: 'Calendrier du Ramadan', niveau: 'gratuit', limite: 'decouverte' },
    activites:    { nom: 'Activités éducatives', niveau: 'gratuit', limite: 'selection' },
    nouveautes:   { nom: 'Nouveaux jeux et nouvelles leçons', niveau: 'premium' },
    alphabet:     { nom: 'Alphabet arabe', niveau: 'bientot' },
    ecriture:     { nom: 'Écriture arabe', niveau: 'bientot' },
    lecture:      { nom: 'Lecture arabe', niveau: 'bientot' }
  },

  // Fonctionnalités ouvertes à tous pour une durée limitée (déblocage temporaire décidé par l'administrateur).
  // Exemple : { ramadan: '2027-03-30' } ouvre le calendrier complet jusqu'à cette date.
  deblocagesTemporaires: {}
};
