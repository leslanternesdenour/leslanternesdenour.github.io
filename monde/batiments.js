// Les bâtiments du village. Chaque bâtiment ouvre une activité.
// emplacement : place sur le cercle (0 = porte d'entrée du village, 1 à 9 = maisons).
// univers : l'ambiance graphique de l'activité (voir univers/univers.css).
// etat : 'ouvert' (lien actif) | 'bientot' (maison qui se prépare).
// pleinePage : l'activité est un monde 3D à part entière, ouvert en pleine page (pas dans le cadre du village).
// Les jeux déjà en ligne restent à leur adresse ; le Parcours des ablutions
// passera à sa version 3D (jeux/ablutions/) à la phase 3.

export const BATIMENTS = [
  { id: 'ablutions', univers: 'ablutions', emplacement: 5, forme: 'dome', couleur: '#2bb3c0', icone: '💧',
    nom: 'Parcours des ablutions', texte: 'Apprends les gestes des ablutions, pas à pas.',
    etat: 'ouvert', lien: '../ablutions/' },
  { id: 'priere', univers: 'priere', emplacement: 4, forme: 'mosquee', couleur: '#f5b942', icone: '🕌',
    nom: 'Construis ta prière', texte: 'Mets les gestes de la prière dans le bon ordre.',
    etat: 'ouvert', lien: '../priere/' },
  { id: 'ramadan', univers: 'histoires', emplacement: 6, forme: 'lanternes', couleur: '#ff8a3d', icone: '🏮',
    nom: 'Les 30 lanternes du Ramadan', texte: 'Allume une lanterne chaque jour du Ramadan.',
    etat: 'ouvert', lien: '../calendrier/' },
  { id: 'sons', univers: 'sourates', emplacement: 3, forme: 'tour', couleur: '#8a6cf0', icone: '🔤', image: 'icones/ecole-lettres.png',
    nom: "L'École des lettres arabes", texte: 'Découvre les 28 lettres arabes, leurs sons et leurs formes avec Maktoub.',
    etat: 'bientot' },   // en cours de création : le jeu reste à ../ecole-arabe/lettres/ (préproduction), la maison rouvrira quand il sera prêt
  { id: 'jardin', univers: 'jeux', emplacement: 7, forme: 'jardin', couleur: '#3fbf7f', icone: '📖', image: 'icones/ecole-lecture.png',
    nom: 'Je découvre la lecture arabe', texte: 'Lis tes premières syllabes, tes premiers mots et tes premières phrases.',
    etat: 'bientot' },   // en cours de création : le jeu reste à ../ecole-arabe/lecture/ (préproduction), la maison rouvrira quand il sera prêt
  { id: 'mots', univers: 'quiz', emplacement: 2, forme: 'large', couleur: '#4a90e2', icone: '🔎',
    nom: 'Chasse aux mots', texte: 'Retrouve les mots cachés dans le village.',
    etat: 'bientot' },
  { id: 'cinq', univers: 'quiz', emplacement: 8, forme: 'plat', couleur: '#e5677b', icone: '🌅',
    nom: 'Défi des cinq prières', texte: 'Retrouve les cinq prières de la journée.',
    etat: 'bientot' },
  { id: 'etoiles', univers: 'jeux', emplacement: 1, forme: 'dome', couleur: '#5b4bc4', icone: '🔢', image: 'icones/ecole-chiffres.png',
    nom: 'Les chiffres et les nombres arabes', texte: 'Compte avec Maktoub et apprends les chiffres arabes.',
    etat: 'ouvert', lien: '../ecole-arabe/chiffres/' },
  { id: 'desert', univers: 'histoires', emplacement: 9, forme: 'tente', couleur: '#c8664a', icone: '🐪',
    nom: 'Voyage dans le désert', texte: 'Pars à l\'aventure, à pied et à dos de chameau : l\'oasis, le désert et les montagnes.',
    etat: 'ouvert', lien: '../voyage/', pleinePage: true }
];
