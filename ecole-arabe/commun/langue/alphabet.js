// RÉFÉRENCE LINGUISTIQUE UNIQUE DE L'ÉCOLE ARABE DE NOUR — les 28 lettres, leurs noms vocalisés, leurs transcriptions, leurs sons et leurs mots d'exemple.
// Les trois jeux (lettres, lecture, chiffres) lisent CE fichier. Rien n'est jamais déduit d'un nom latin ni de la position dans une liste : chaque audio est rattaché à sa lettre par un identifiant explicite.
//
// TROIS NOTIONS À NE JAMAIS CONFONDRE :
//   A. le NOM de la lettre  → nomAr (vocalisé) / translit        ex. ا = « أَلِف » (Alif)
//   B. le SON de la lettre  → syllabe (la lettre + fatha) / sonFr   ex. بَ = « ba » (jamais le nom « baa »)
//   C. la prononciation DANS UN MOT → mot.ar (vocalisé)           ex. بَطَّة = batta (peut dépendre de la position et des voyelles)
//
// Noms et transcriptions : liste de référence fournie par le fondateur. Statut « a_valider » : aucune prononciation n'est considérée comme correcte tant qu'une personne maîtrisant l'arabe ne l'a pas validée
// (un MP3 qui se lit ne prouve RIEN). Pour valider : mettre statut.<nom|son|mot> à « valide » ET renseigner valideePar / valideeLe.
// syllabeAudio (alif seulement) : texte envoyé à la synthèse vocale pour le SON. « أَ » est lu « Ostev » par la synthèse (erreur constatée) ; « ءَ » (hamza + fatha) donne « a ». À valider par une personne maîtrisant l'arabe.
// Les contours graphiques (formes isolée, initiale, médiane, finale) viennent de la police Amiri (glyphes.json) : aucune forme inventée.
export const ALPHABET = [
 {
  "num": 1,
  "id": "alif",
  "ar": "ا",
  "nomAr": "أَلِف",
  "nomFr": "Alif",
  "translit": "Alif",
  "joint": false,
  "points": [
   0,
   ""
  ],
  "famille": "alif",
  "syllabe": "أَ",
  "syllabeAudio": "ءَ",
  "son": "a",
  "sonFr": "Alif est surtout un « â » long (comme dans « Baa »). Avec une petite coupure de voix (la hamza), il porte une voyelle : أَ se lit « a ».",
  "mot": {
   "ar": "أَسَد",
   "tr": "asad",
   "fr": "le lion",
   "emoji": "🦁"
  },
  "chapitre": "c1",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.alif",
   "son": "son.alif",
   "mot": "mot.alif",
   "motFr": "motfr.alif"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 2,
  "id": "ba",
  "ar": "ب",
  "nomAr": "بَاء",
  "nomFr": "Baa",
  "translit": "Bā",
  "joint": true,
  "points": [
   1,
   "dessous"
  ],
  "famille": "ba",
  "syllabe": "بَ",
  "son": "b",
  "sonFr": "comme « b » dans « bateau »",
  "mot": {
   "ar": "بَطَّة",
   "tr": "batta",
   "fr": "le canard",
   "emoji": "🦆"
  },
  "chapitre": "c1",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.ba",
   "son": "son.ba",
   "mot": "mot.ba",
   "motFr": "motfr.ba"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 3,
  "id": "ta",
  "ar": "ت",
  "nomAr": "تَاء",
  "nomFr": "Taa",
  "translit": "Tā",
  "joint": true,
  "points": [
   2,
   "dessus"
  ],
  "famille": "ba",
  "syllabe": "تَ",
  "son": "t",
  "sonFr": "comme « t » dans « tasse »",
  "mot": {
   "ar": "تُفَّاحَة",
   "tr": "tuffaha",
   "fr": "la pomme",
   "emoji": "🍎"
  },
  "chapitre": "c1",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.ta",
   "son": "son.ta",
   "mot": "mot.ta",
   "motFr": "motfr.ta"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 4,
  "id": "tha",
  "ar": "ث",
  "nomAr": "ثَاء",
  "nomFr": "Thaa",
  "translit": "Thā",
  "joint": true,
  "points": [
   3,
   "dessus"
  ],
  "famille": "ba",
  "syllabe": "ثَ",
  "son": "th",
  "sonFr": "comme le « th » anglais de « think »",
  "mot": {
   "ar": "ثَعْلَب",
   "tr": "tha'lab",
   "fr": "le renard",
   "emoji": "🦊"
  },
  "chapitre": "c1",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.tha",
   "son": "son.tha",
   "mot": "mot.tha",
   "motFr": "motfr.tha"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 5,
  "id": "jim",
  "ar": "ج",
  "nomAr": "جِيم",
  "nomFr": "Jim",
  "translit": "Jīm",
  "joint": true,
  "points": [
   1,
   "dessous"
  ],
  "famille": "jim",
  "syllabe": "جَ",
  "son": "j",
  "sonFr": "comme « j » dans « jour »",
  "mot": {
   "ar": "جَمَل",
   "tr": "jamal",
   "fr": "le chameau",
   "emoji": "🐫"
  },
  "chapitre": "c3",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.jim",
   "son": "son.jim",
   "mot": "mot.jim",
   "motFr": "motfr.jim"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 6,
  "id": "ha",
  "ar": "ح",
  "nomAr": "حَاء",
  "nomFr": "Haa",
  "translit": "Ḥā",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "jim",
  "syllabe": "حَ",
  "son": "ḥ",
  "sonFr": "un « h » soufflé fort, du fond de la gorge",
  "mot": {
   "ar": "حِصَان",
   "tr": "hisan",
   "fr": "le cheval",
   "emoji": "🐴"
  },
  "chapitre": "c3",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.ha",
   "son": "son.ha",
   "mot": "mot.ha",
   "motFr": "motfr.ha"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 7,
  "id": "kha",
  "ar": "خ",
  "nomAr": "خَاء",
  "nomFr": "Khaa",
  "translit": "Khā",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "jim",
  "syllabe": "خَ",
  "son": "kh",
  "sonFr": "comme la « jota » espagnole ou le « ch » allemand de « Bach »",
  "mot": {
   "ar": "خَرُوف",
   "tr": "kharouf",
   "fr": "le mouton",
   "emoji": "🐑"
  },
  "chapitre": "c3",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.kha",
   "son": "son.kha",
   "mot": "mot.kha",
   "motFr": "motfr.kha"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 8,
  "id": "dal",
  "ar": "د",
  "nomAr": "دَال",
  "nomFr": "Daal",
  "translit": "Dāl",
  "joint": false,
  "points": [
   0,
   ""
  ],
  "famille": "dal",
  "syllabe": "دَ",
  "son": "d",
  "sonFr": "comme « d » dans « dattier »",
  "mot": {
   "ar": "دُبّ",
   "tr": "dubb",
   "fr": "l'ours",
   "emoji": "🐻"
  },
  "chapitre": "c4",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.dal",
   "son": "son.dal",
   "mot": "mot.dal",
   "motFr": "motfr.dal"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 9,
  "id": "dhal",
  "ar": "ذ",
  "nomAr": "ذَال",
  "nomFr": "Dhaal",
  "translit": "Dhāl",
  "joint": false,
  "points": [
   1,
   "dessus"
  ],
  "famille": "dal",
  "syllabe": "ذَ",
  "son": "dh",
  "sonFr": "comme le « th » anglais de « this »",
  "mot": {
   "ar": "ذُرَة",
   "tr": "dhura",
   "fr": "le maïs",
   "emoji": "🌽"
  },
  "chapitre": "c4",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.dhal",
   "son": "son.dhal",
   "mot": "mot.dhal",
   "motFr": "motfr.dhal"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 10,
  "id": "ra",
  "ar": "ر",
  "nomAr": "رَاء",
  "nomFr": "Raa",
  "translit": "Rā",
  "joint": false,
  "points": [
   0,
   ""
  ],
  "famille": "ra",
  "syllabe": "رَ",
  "son": "r",
  "sonFr": "un « r » roulé",
  "mot": {
   "ar": "رَمْل",
   "tr": "raml",
   "fr": "le sable",
   "emoji": "🏜️"
  },
  "chapitre": "c4",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.ra",
   "son": "son.ra",
   "mot": "mot.ra",
   "motFr": "motfr.ra"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 11,
  "id": "zay",
  "ar": "ز",
  "nomAr": "زَاي",
  "nomFr": "Zaay",
  "translit": "Zāy",
  "joint": false,
  "points": [
   1,
   "dessus"
  ],
  "famille": "ra",
  "syllabe": "زَ",
  "son": "z",
  "sonFr": "comme « z » dans « zèbre »",
  "mot": {
   "ar": "زَهْرَة",
   "tr": "zahra",
   "fr": "la fleur",
   "emoji": "🌸"
  },
  "chapitre": "c4",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.zay",
   "son": "son.zay",
   "mot": "mot.zay",
   "motFr": "motfr.zay"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 12,
  "id": "sin",
  "ar": "س",
  "nomAr": "سِين",
  "nomFr": "Siin",
  "translit": "Sīn",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "sin",
  "syllabe": "سَ",
  "son": "s",
  "sonFr": "comme « s » dans « soleil »",
  "mot": {
   "ar": "سَمَكَة",
   "tr": "samaka",
   "fr": "le poisson",
   "emoji": "🐟"
  },
  "chapitre": "c5",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.sin",
   "son": "son.sin",
   "mot": "mot.sin",
   "motFr": "motfr.sin"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 13,
  "id": "shin",
  "ar": "ش",
  "nomAr": "شِين",
  "nomFr": "Chiin",
  "translit": "Shīn",
  "joint": true,
  "points": [
   3,
   "dessus"
  ],
  "famille": "sin",
  "syllabe": "شَ",
  "son": "ch",
  "sonFr": "comme « ch » dans « chat »",
  "mot": {
   "ar": "شَمْس",
   "tr": "shams",
   "fr": "le soleil",
   "emoji": "☀️"
  },
  "chapitre": "c5",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.shin",
   "son": "son.shin",
   "mot": "mot.shin",
   "motFr": "motfr.shin"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 14,
  "id": "sad",
  "ar": "ص",
  "nomAr": "صَاد",
  "nomFr": "Saad",
  "translit": "Ṣād",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "sad",
  "syllabe": "صَ",
  "son": "ṣ",
  "sonFr": "un « s » appuyé, plus grave",
  "mot": {
   "ar": "صَقْر",
   "tr": "saqr",
   "fr": "le faucon",
   "emoji": "🦅"
  },
  "chapitre": "c5",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.sad",
   "son": "son.sad",
   "mot": "mot.sad",
   "motFr": "motfr.sad"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 15,
  "id": "dad",
  "ar": "ض",
  "nomAr": "ضَاد",
  "nomFr": "Daad",
  "translit": "Ḍād",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "sad",
  "syllabe": "ضَ",
  "son": "ḍ",
  "sonFr": "un « d » appuyé, plus grave",
  "mot": {
   "ar": "ضِفْدَع",
   "tr": "difda'",
   "fr": "la grenouille",
   "emoji": "🐸"
  },
  "chapitre": "c5",
  "niveau": "intermediaire",
  "audio": {
   "nom": "nom.dad",
   "son": "son.dad",
   "mot": "mot.dad",
   "motFr": "motfr.dad"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 16,
  "id": "ta2",
  "ar": "ط",
  "nomAr": "طَاء",
  "nomFr": "Taa grave",
  "translit": "Ṭā",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "ta2",
  "syllabe": "طَ",
  "son": "ṭ",
  "sonFr": "un « t » appuyé, plus grave",
  "mot": {
   "ar": "طَبْل",
   "tr": "tabl",
   "fr": "le tambour",
   "emoji": "🥁"
  },
  "chapitre": "c6",
  "niveau": "avance",
  "audio": {
   "nom": "nom.ta2",
   "son": "son.ta2",
   "mot": "mot.ta2",
   "motFr": "motfr.ta2"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 17,
  "id": "za2",
  "ar": "ظ",
  "nomAr": "ظَاء",
  "nomFr": "Zhaa grave",
  "translit": "Ẓā",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "ta2",
  "syllabe": "ظَ",
  "son": "ẓ",
  "sonFr": "un « dh » appuyé, plus grave",
  "mot": {
   "ar": "ظَرْف",
   "tr": "zarf",
   "fr": "l'enveloppe",
   "emoji": "✉️"
  },
  "chapitre": "c6",
  "niveau": "avance",
  "audio": {
   "nom": "nom.za2",
   "son": "son.za2",
   "mot": "mot.za2",
   "motFr": "motfr.za2"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 18,
  "id": "ayn",
  "ar": "ع",
  "nomAr": "عَيْن",
  "nomFr": "Aïn",
  "translit": "ʿAyn",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "ayn",
  "syllabe": "عَ",
  "son": "ʿ",
  "sonFr": "un son profond de la gorge, propre à l'arabe",
  "mot": {
   "ar": "عِنَب",
   "tr": "inab",
   "fr": "le raisin",
   "emoji": "🍇"
  },
  "chapitre": "c6",
  "niveau": "avance",
  "audio": {
   "nom": "nom.ayn",
   "son": "son.ayn",
   "mot": "mot.ayn",
   "motFr": "motfr.ayn"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 19,
  "id": "ghayn",
  "ar": "غ",
  "nomAr": "غَيْن",
  "nomFr": "Ghaïn",
  "translit": "Ghayn",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "ayn",
  "syllabe": "غَ",
  "son": "gh",
  "sonFr": "comme un « r » grasseyé",
  "mot": {
   "ar": "غَيْمَة",
   "tr": "ghayma",
   "fr": "le nuage",
   "emoji": "☁️"
  },
  "chapitre": "c6",
  "niveau": "avance",
  "audio": {
   "nom": "nom.ghayn",
   "son": "son.ghayn",
   "mot": "mot.ghayn",
   "motFr": "motfr.ghayn"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 20,
  "id": "fa",
  "ar": "ف",
  "nomAr": "فَاء",
  "nomFr": "Faa",
  "translit": "Fā",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "fa",
  "syllabe": "فَ",
  "son": "f",
  "sonFr": "comme « f » dans « fleur »",
  "mot": {
   "ar": "فِيل",
   "tr": "fil",
   "fr": "l'éléphant",
   "emoji": "🐘"
  },
  "chapitre": "c7",
  "niveau": "avance",
  "audio": {
   "nom": "nom.fa",
   "son": "son.fa",
   "mot": "mot.fa",
   "motFr": "motfr.fa"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 21,
  "id": "qaf",
  "ar": "ق",
  "nomAr": "قَاف",
  "nomFr": "Qaaf",
  "translit": "Qāf",
  "joint": true,
  "points": [
   2,
   "dessus"
  ],
  "famille": "fa",
  "syllabe": "قَ",
  "son": "q",
  "sonFr": "un « k » prononcé tout au fond de la gorge",
  "mot": {
   "ar": "قَمَر",
   "tr": "qamar",
   "fr": "la lune",
   "emoji": "🌙"
  },
  "chapitre": "c7",
  "niveau": "avance",
  "audio": {
   "nom": "nom.qaf",
   "son": "son.qaf",
   "mot": "mot.qaf",
   "motFr": "motfr.qaf"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 22,
  "id": "kaf",
  "ar": "ك",
  "nomAr": "كَاف",
  "nomFr": "Kaaf",
  "translit": "Kāf",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "kaf",
  "syllabe": "كَ",
  "son": "k",
  "sonFr": "comme « k » dans « kilo »",
  "mot": {
   "ar": "كِتَاب",
   "tr": "kitab",
   "fr": "le livre",
   "emoji": "📖"
  },
  "chapitre": "c7",
  "niveau": "avance",
  "audio": {
   "nom": "nom.kaf",
   "son": "son.kaf",
   "mot": "mot.kaf",
   "motFr": "motfr.kaf"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 23,
  "id": "lam",
  "ar": "ل",
  "nomAr": "لَام",
  "nomFr": "Laam",
  "translit": "Lām",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "lam",
  "syllabe": "لَ",
  "son": "l",
  "sonFr": "comme « l » dans « lune »",
  "mot": {
   "ar": "لَيْمُون",
   "tr": "laymoun",
   "fr": "le citron",
   "emoji": "🍋"
  },
  "chapitre": "c7",
  "niveau": "avance",
  "audio": {
   "nom": "nom.lam",
   "son": "son.lam",
   "mot": "mot.lam",
   "motFr": "motfr.lam"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 24,
  "id": "mim",
  "ar": "م",
  "nomAr": "مِيم",
  "nomFr": "Miim",
  "translit": "Mīm",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "mim",
  "syllabe": "مَ",
  "son": "m",
  "sonFr": "comme « m » dans « maman »",
  "mot": {
   "ar": "مَوْز",
   "tr": "mawz",
   "fr": "la banane",
   "emoji": "🍌"
  },
  "chapitre": "c8",
  "niveau": "avance",
  "audio": {
   "nom": "nom.mim",
   "son": "son.mim",
   "mot": "mot.mim",
   "motFr": "motfr.mim"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 25,
  "id": "nun",
  "ar": "ن",
  "nomAr": "نُون",
  "nomFr": "Noun",
  "translit": "Nūn",
  "joint": true,
  "points": [
   1,
   "dessus"
  ],
  "famille": "nun",
  "syllabe": "نَ",
  "son": "n",
  "sonFr": "comme « n » dans « nuage »",
  "mot": {
   "ar": "نَجْمَة",
   "tr": "najma",
   "fr": "l'étoile",
   "emoji": "⭐"
  },
  "chapitre": "c2",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.nun",
   "son": "son.nun",
   "mot": "mot.nun",
   "motFr": "motfr.nun"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 26,
  "id": "ha2",
  "ar": "ه",
  "nomAr": "هَاء",
  "nomFr": "Haa léger",
  "translit": "Hā",
  "joint": true,
  "points": [
   0,
   ""
  ],
  "famille": "ha2",
  "syllabe": "هَ",
  "son": "h",
  "sonFr": "un « h » léger, soufflé",
  "mot": {
   "ar": "هَاتِف",
   "tr": "hatif",
   "fr": "le téléphone",
   "emoji": "📱"
  },
  "chapitre": "c8",
  "niveau": "avance",
  "audio": {
   "nom": "nom.ha2",
   "son": "son.ha2",
   "mot": "mot.ha2",
   "motFr": "motfr.ha2"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 27,
  "id": "waw",
  "ar": "و",
  "nomAr": "وَاو",
  "nomFr": "Waaw",
  "translit": "Wāw",
  "joint": false,
  "points": [
   0,
   ""
  ],
  "famille": "waw",
  "syllabe": "وَ",
  "son": "w",
  "sonFr": "comme « ou » dans « oui »",
  "mot": {
   "ar": "وَرْدَة",
   "tr": "warda",
   "fr": "la rose",
   "emoji": "🌹"
  },
  "chapitre": "c8",
  "niveau": "avance",
  "audio": {
   "nom": "nom.waw",
   "son": "son.waw",
   "mot": "mot.waw",
   "motFr": "motfr.waw"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 },
 {
  "num": 28,
  "id": "ya",
  "ar": "ي",
  "nomAr": "يَاء",
  "nomFr": "Yaa",
  "translit": "Yā",
  "joint": true,
  "points": [
   2,
   "dessous"
  ],
  "famille": "ya",
  "syllabe": "يَ",
  "son": "y",
  "sonFr": "comme « y » dans « yaourt »",
  "mot": {
   "ar": "يَد",
   "tr": "yad",
   "fr": "la main",
   "emoji": "✋"
  },
  "chapitre": "c2",
  "niveau": "debutant",
  "audio": {
   "nom": "nom.ya",
   "son": "son.ya",
   "mot": "mot.ya",
   "motFr": "motfr.ya"
  },
  "statut": {
   "nom": "a_valider",
   "son": "a_valider",
   "mot": "a_valider"
  }
 }
];

export const PAR_ID_ALPHABET = Object.fromEntries(ALPHABET.map(l => [l.id, l]));
// Les six lettres qui ne se lient JAMAIS à la lettre suivante (sens de l'écriture : de droite à gauche) : ا د ذ ر ز و
export const NON_LIEES = ['alif', 'dal', 'dhal', 'ra', 'zay', 'waw'];
// Familles de lettres qui se ressemblent (pédagogie des « jumelles » : forme, nombre et place des points, son)
export const FAMILLES_JUMELLES = [['ba', 'ta', 'tha'], ['jim', 'ha', 'kha'], ['dal', 'dhal'], ['ra', 'zay'], ['sin', 'shin'], ['sad', 'dad'], ['ta2', 'za2'], ['ayn', 'ghayn'], ['fa', 'qaf']];

// ALIF : une lettre à part. Elle n'est pas simplement une consonne « A ». À présenter séparément de la hamza (ء), progressivement.
export const ALIF = {
  nomAr: 'أَلِف', translit: 'Alif',
  forme_simple: { ar: 'ا', texte: "Alif seul : il allonge un son « â » (comme dans « Baa »). Il ne se lie pas à la lettre qui suit." },
  formes: [
    { id: 'hamza_dessus', ar: 'أ', texte: "Alif avec une hamza au-dessus : on entend une petite coupure de la voix, puis « a » (أَ) ou « ou » (أُ)." },
    { id: 'hamza_dessous', ar: 'إ', texte: "Alif avec une hamza au-dessous : une petite coupure de la voix, puis « i » (إِ)." },
    { id: 'madda', ar: 'آ', texte: "Alif madda : une petite coupure de la voix, puis un « â » long (comme آمِن)." },
    { id: 'wasla', ar: 'ٱ', texte: "Alif wasla : on le lit seulement au début d'une phrase ; au milieu, il s'efface et on enchaîne." }
  ],
  hamza: { ar: 'ء', texte: "La hamza est une petite coupure dans la gorge. Elle peut se poser sur un alif, mais l'alif et la hamza ne sont pas la même chose." },
  statut: 'a_valider'
};
// Signes qui modifient la lecture (Jeu 2) : le nom d'une lettre n'est PAS sa lecture avec voyelle.
export const VOYELLES = [
  { id: 'fatha', signe: 'َ', exemple: 'بَ', lecture: 'ba', texte: 'Fatha : petit trait au-dessus → « a »' },
  { id: 'kasra', signe: 'ِ', exemple: 'بِ', lecture: 'bi', texte: 'Kasra : petit trait au-dessous → « i »' },
  { id: 'damma', signe: 'ُ', exemple: 'بُ', lecture: 'bou', texte: 'Damma : petit « و » au-dessus → « ou »' },
  { id: 'soukoun', signe: 'ْ', exemple: 'بْ', lecture: 'b', texte: 'Soukoun : petit rond → pas de voyelle' },
  { id: 'chadda', signe: 'ّ', exemple: 'بّ', lecture: 'bb', texte: 'Chadda : on double la lettre' },
  { id: 'tanwin', signes: ['ً', 'ٍ', 'ٌ'], exemple: 'بًا', lecture: 'ban', texte: 'Tanwin : un « n » en fin de mot' }
];
