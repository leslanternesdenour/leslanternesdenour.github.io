// Données de la page de validation des prononciations des 28 lettres (outil interne, préproduction seulement).
// ⚠ Les indications de point d'articulation (مخرج الحرف) ci-dessous sont PROPOSÉES d'après la classification classique du tajwid : elles sont à FAIRE VALIDER
// par une personne compétente en arabe littéraire ou en phonétique arabe. Une IA n'est pas garante de leur exactitude.
// Fiche d'enregistrement : pour chaque lettre, 4 clips — le NOM de la lettre, puis son SON avec chacune des trois voyelles courtes (فتحة، ضمّة، كسرة).
// Le son d'une lettre n'est jamais son nom : « بَ » (ba) et non « بَاء » (baa). L'alif porte ses voyelles par la hamza (ءَ ءُ ءِ).
export const VOYELLES = { fatha: 'َ', damma: 'ُ', kasra: 'ِ' };
export function fiche(alphabet) {
  const lignes = [];
  for (const a of alphabet) {
    lignes.push({ id: a.id, num: a.num, lettre: a.ar, element: 'nom', texte: a.nomAr, fichier: `${a.id}/nom.mp3` });
    for (const [v, signe] of Object.entries(VOYELLES)) lignes.push({ id: a.id, num: a.num, lettre: a.ar, element: v, texte: (a.id === 'alif' ? 'ء' : a.ar) + signe, fichier: `${a.id}/${v}.mp3` });
  }
  return lignes;
}

// Audios ACTUELS du site (synthèse vocale, NON validés) : consultés en lecture seule, jamais modifiés par cet outil.
export const audioActuel = id => ({ nom: `audio/jeux/ecole-lettres/nom.${id}.mp3`, fatha: `audio/jeux/ecole-lettres/son.${id}.mp3` });
// Audios CANDIDATS (enregistrements à valider) : dossier INTERNE, copié en préproduction seulement. Rien ici n'est jamais publié en production.
export const urlCandidat = (id, element) => `outils/voix/lettres-candidats/${id}/${element}.mp3`;

// Lettres aux sons proches mais DISTINCTS : à écouter l'une après l'autre. (Groupes proposés, à compléter ou corriger par la personne qui valide.)
export const PROCHES = [
  { titre: 'ت ث س ص — quatre « t / s » à ne pas confondre', ids: ['ta', 'tha', 'sin', 'sad'] },
  { titre: 'ت ط — léger et appuyé', ids: ['ta', 'ta2'] },
  { titre: 'د ض — léger et appuyé', ids: ['dal', 'dad'] },
  { titre: 'ذ ز ظ — trois sons voisés', ids: ['dhal', 'zay', 'za2'] },
  { titre: 'س ص — sifflant léger et appuyé', ids: ['sin', 'sad'] },
  { titre: 'ح خ ه — trois souffles de la gorge', ids: ['ha', 'kha', 'ha2'] },
  { titre: 'خ غ — sans voix et avec voix', ids: ['kha', 'ghayn'] },
  { titre: 'ع ء(ا) — la gorge qui se resserre et la coupure de voix', ids: ['ayn', 'alif'] },
  { titre: 'ق ك — fond de la gorge et palais', ids: ['qaf', 'kaf'] }
];

export const MAKHRAJ = {
  alif:  { ar: 'الجَوْف (حرف مدّ) — والهمزة (ء) من أقصى الحلق', fr: 'Alif long : l\'air traverse la gorge et la bouche, sans contact. Avec la hamza (ء) : fond de la gorge, petite coupure nette de la voix.' },
  ba:    { ar: 'الشَّفَتان (انطباقهما)', fr: 'Les deux lèvres se ferment puis s\'ouvrent. Avec voix.' },
  ta:    { ar: 'طَرَف اللسان مع أصول الثنايا العليا', fr: 'Le bout de la langue touche la base des incisives du haut. Sans voix, léger.' },
  tha:   { ar: 'طَرَف اللسان مع أطراف الثنايا العليا', fr: 'Le bout de la langue touche le bord des incisives du haut ; le souffle passe. Sans voix.' },
  jim:   { ar: 'وَسَط اللسان مع ما يحاذيه من الحنك الأعلى', fr: 'Le milieu de la langue monte vers le palais. Avec voix.' },
  ha:    { ar: 'وَسَط الحَلْق', fr: 'Milieu de la gorge : un souffle frotté, profond, sans voix.' },
  kha:   { ar: 'أَدْنى الحَلْق (من جهة الفم)', fr: 'Haut de la gorge : un frottement rauque, sans voix.' },
  dal:   { ar: 'طَرَف اللسان مع أصول الثنايا العليا', fr: 'Le bout de la langue touche la base des incisives du haut. Avec voix, léger.' },
  dhal:  { ar: 'طَرَف اللسان مع أطراف الثنايا العليا', fr: 'Le bout de la langue touche le bord des incisives du haut ; le souffle passe. Avec voix.' },
  ra:    { ar: 'طَرَف اللسان (أدخل قليلاً في ظهر اللسان) مع لثة الثنايا العليا', fr: 'Le bout de la langue vibre contre la gencive du haut : un r roulé.' },
  zay:   { ar: 'طَرَف اللسان قرب الثنايا (حرف صفير)', fr: 'Le bout de la langue est proche des incisives : un sifflement. Avec voix.' },
  sin:   { ar: 'طَرَف اللسان قرب الثنايا (حرف صفير)', fr: 'Même endroit que le zay : un sifflement. Sans voix, léger.' },
  shin:  { ar: 'وَسَط اللسان مع الحنك الأعلى', fr: 'Le milieu de la langue vers le palais ; le souffle s\'étale. Sans voix.' },
  sad:   { ar: 'طَرَف اللسان قرب الثنايا مع إطباق (حرف صفير مفخَّم)', fr: 'Comme le sin, mais la langue se creuse et se relève vers le palais : un son plus grave, appuyé.' },
  dad:   { ar: 'حافَّة اللسان مع الأضراس العليا (مع إطباق)', fr: 'Le côté de la langue contre les molaires du haut ; langue creusée : un d appuyé, grave.' },
  ta2:   { ar: 'طَرَف اللسان مع أصول الثنايا العليا (مع إطباق)', fr: 'Comme le ta, mais la langue se creuse et se relève : un t appuyé, grave.' },
  za2:   { ar: 'طَرَف اللسان مع أطراف الثنايا العليا (مع إطباق)', fr: 'Comme le dhal, mais la langue se creuse et se relève : un son appuyé, grave.' },
  ayn:   { ar: 'وَسَط الحَلْق', fr: 'Milieu de la gorge, avec voix : un son profond, la gorge se resserre.' },
  ghayn: { ar: 'أَدْنى الحَلْق (من جهة الفم)', fr: 'Haut de la gorge, avec voix : un frottement doux et grave.' },
  fa:    { ar: 'باطِن الشَّفة السُّفلى مع أطراف الثنايا العليا', fr: 'La lèvre du bas touche le bord des dents du haut ; le souffle passe.' },
  qaf:   { ar: 'أَقْصى اللسان مع ما يحاذيه من اللَّهاة والحنك الأعلى', fr: 'Le fond de la langue touche tout au fond du palais : un k très profond, sans souffle.' },
  kaf:   { ar: 'أَقْصى اللسان (أسفل من القاف قليلاً) مع الحنك الأعلى', fr: 'Le fond de la langue touche le palais, un peu plus en avant que le qaf : un k léger.' },
  lam:   { ar: 'حافَّة اللسان مع لثة الأسنان العليا', fr: 'Le bord de la langue touche la gencive du haut ; l\'air sort sur les côtés.' },
  mim:   { ar: 'الشَّفَتان (انطباقهما)', fr: 'Les deux lèvres se ferment ; le son passe par le nez.' },
  nun:   { ar: 'طَرَف اللسان مع أصول الثنايا العليا (أسفل من اللام قليلاً)', fr: 'Le bout de la langue touche la gencive du haut ; le son passe par le nez.' },
  ha2:   { ar: 'أَقْصى الحَلْق', fr: 'Fond de la gorge : un simple souffle léger, sans voix.' },
  waw:   { ar: 'الشَّفَتان (انفتاحهما مع انضمام)', fr: 'Les lèvres s\'arrondissent sans se fermer, comme pour « ou ».' },
  ya:    { ar: 'وَسَط اللسان مع الحنك الأعلى (انفتاح)', fr: 'Le milieu de la langue monte vers le palais sans le toucher, comme pour « i ».' }
};
