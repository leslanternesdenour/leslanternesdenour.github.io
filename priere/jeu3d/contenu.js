// Contenus copiés À L'IDENTIQUE depuis la leçon /priere/ (app.js) : étapes, paroles, sourates, ordre d'une rak‘a et indices.
// Mêmes textes, mêmes sources, mêmes voix (e_…, d_…, f_…, h1_…). Si la leçon change, changer ici aussi.
export const DH={
 ak:{ar:'اللَّهُ أَكْبَرُ',tr:'Allâhou akbar',fr:'Allah est le plus Grand.',src:'Takbîr : Boukhârî 789, Mouslim 392'},
 rk:{ar:'سُبْحَانَ رَبِّيَ الْعَظِيمِ',tr:'Soubhâna rabbiya l-‘adhîm',fr:'Gloire à mon Seigneur, le Très-Grand.',src:'Mouslim 772, Nasâ’î 1145'},
 sm:{ar:'سَمِعَ اللَّهُ لِمَنْ حَمِدَهُ',tr:'Sami‘a llâhou liman hamidah',fr:'Allah entend celui qui Le loue.',src:'Boukhârî 789'},
 rb:{ar:'رَبَّنَا وَلَكَ الْحَمْدُ',tr:'Rabbanâ wa laka l-hamd',fr:'Notre Seigneur, à Toi la louange.',src:'Boukhârî 789'},
 sj:{ar:'سُبْحَانَ رَبِّيَ الْأَعْلَى',tr:'Soubhâna rabbiya l-a‘lâ',fr:'Gloire à mon Seigneur, le Très-Haut.',src:'Mouslim 772, Nasâ’î 1145'},
 gh:{ar:'رَبِّ اغْفِرْ لِي',tr:'Rabbi ghfir lî',fr:'Mon Seigneur, pardonne-moi.',src:'Abou Dâwoud 874, Nasâ’î 1145, Ibn Mâjah 897'},
 th:{ar:'التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ، السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ، السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ، أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا اللَّهُ، وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
  tr:'At-tahiyyâtou lillâhi wa s-salawâtou wa t-tayyibât. As-salâmou ‘alayka ayyouha n-nabiyyou wa rahmatou llâhi wa barakâtouh. As-salâmou ‘alaynâ wa ‘alâ ‘ibâdi llâhi s-sâlihîn. Ach-hadou an lâ ilâha illa llâh, wa ach-hadou anna Mouhammadan ‘abdouhou wa rasoûlouh.',
  fr:'Les salutations sont pour Allah, ainsi que les prières et les bonnes paroles. Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d’Allah et Ses bénédictions. Que la paix soit sur nous et sur les bons serviteurs d’Allah. J’atteste qu’il n’y a de divinité qu’Allah, et j’atteste que Mouhammad est Son serviteur et Son messager.',src:'Tachahhoud d’Ibn Mas‘oûd : Boukhârî 831, Mouslim 402'},
 ts:{ar:'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ',tr:'As-salâmou ‘alaykoum wa rahmatou llâh',fr:'Que la paix soit sur vous, ainsi que la miséricorde d’Allah.',src:'Mouslim 582, Abou Dâwoud 996'}
};
export const SUR={1:{n:'Al-Fâtiha',ay:7,first:1,tr:['Bismi llâhi r-rahmâni r-rahîm','Al-hamdou lillâhi rabbi l-‘âlamîn','Ar-rahmâni r-rahîm','Mâliki yawmi d-dîn','Iyyâka na‘boudou wa iyyâka nasta‘în','Ihdinâ s-sirâta l-moustaqîm','Sirâta lladhîna an‘amta ‘alayhim, ghayri l-maghdoûbi ‘alayhim wa la d-dâllîn'],
 fr:['Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.','Louange à Allah, Seigneur des mondes.','Le Tout Miséricordieux, le Très Miséricordieux.','Le Maître du Jour de la rétribution.','C’est Toi seul que nous adorons, et c’est Toi seul dont nous implorons le secours.','Guide-nous sur le droit chemin,','le chemin de ceux que Tu as comblés de bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.']},
 112:{n:'Al-Ikhlâs',ay:4,first:6222,tr:['Qoul houwa llâhou ahad','Allâhou s-samad','Lam yalid wa lam yoûlad','Wa lam yakoun lahoû koufouwan ahad'],
 fr:['Dis : Il est Allah, Unique.','Allah, Celui vers qui tout le monde se tourne.','Il n’a jamais engendré et n’a pas été engendré.','Et nul n’est égal à Lui.']}};
export const ayUrl=(s,i)=>`https://cdn.islamic.network/quran/audio/128/ar.husary/${SUR[s].first+i}.mp3`;
export const ST=[
 {k:'niyya',p:'debout',t:"L'intention",x:"Avant de commencer, tu décides dans ton cœur quelle prière tu vas faire, par exemple la prière du Fajr. Pas besoin de le dire à voix haute.",src:'« Les actes ne valent que par les intentions » : Boukhârî 1, Mouslim 1907'},
 {k:'qiyam',p:'debout',t:'Debout, vers la qibla',x:"Tu te tiens debout, tourné vers la Kaaba, la qibla. Tes yeux regardent l'endroit où ira ton front.",src:'Coran 2:144'},
 {k:'takbir',p:'takbir',t:"Le takbîr d'ouverture",x:"Tu lèves les mains à hauteur des épaules ou des oreilles et tu dis : Allâhou akbar. La prière commence !",d:'ak',src:'Boukhârî 735, Mouslim 390'},
 {k:'fatiha',p:'mains',t:'Al-Fâtiha',x:"Tu récites Al-Fâtiha, la sourate d'ouverture. On la récite dans chaque rak‘a. Écoute le récitateur, puis répète verset par verset.",s:1,src:'« Pas de prière pour qui ne récite pas la Fâtiha » : Boukhârî 756, Mouslim 394'},
 {k:'sourate',p:'mains',t:'Une petite sourate',x:"Dans les deux premières rak‘at, on ajoute une petite sourate après Al-Fâtiha, par exemple Al-Ikhlâs.",s:112,src:'Boukhârî 776'},
 {k:'roukou',p:'roukou',t:'Le roukoû‘ (inclinaison)',x:"Tu dis Allâhou akbar et tu te penches, le dos bien droit, les mains sur les genoux. Tu dis trois fois : Soubhâna rabbiya l-‘adhîm.",d:'rk',src:'Mouslim 772'},
 {k:'itidal',p:'debout',t:'Le redressement',x:"Tu te relèves en disant : Sami‘a llâhou liman hamidah. Une fois bien droit, tu dis : Rabbanâ wa laka l-hamd.",d:'sm',d2:'rb',src:'Boukhârî 789'},
 {k:'soujoud1',p:'soujoud',t:'Le soujoûd (prosternation)',x:"Tu dis Allâhou akbar et tu te prosternes sur 7 parties : le front avec le nez, les deux mains, les deux genoux et le bout des pieds. Tu dis trois fois : Soubhâna rabbiya l-a‘lâ.",d:'sj',src:'Les 7 parties : Boukhârî 812, Mouslim 490'},
 {k:'jalsa',p:'assis',t:'Assis entre les deux prosternations',x:"Tu te redresses en disant Allâhou akbar et tu t'assois un instant. Tu dis : Rabbi ghfir lî.",d:'gh',src:'Abou Dâwoud 874'},
 {k:'soujoud2',p:'soujoud',t:'La deuxième prosternation',x:"Allâhou akbar, et tu te prosternes une deuxième fois, comme la première : Soubhâna rabbiya l-a‘lâ.",d:'sj',src:'Boukhârî 757'},
 {k:'rakaa',p:'takbir',t:'La rak‘a suivante',x:"Bravo, tu as fini une rak‘a ! Tu te relèves en disant Allâhou akbar, et tu recommences : Al-Fâtiha, le roukoû‘ et les deux prosternations.",d:'ak',src:'Boukhârî 757'},
 {k:'tachahhoud',p:'tachahhoud',t:'Le tachahhoud',x:"Après la deuxième rak‘a, tu restes assis et tu récites le tachahhoud, en levant l'index. À la fin de la prière, on ajoute aussi la prière sur le Prophète, paix et salut sur lui.",d:'th',src:'Boukhârî 831, Mouslim 402 ; prière sur le Prophète : Boukhârî 3370'},
 {k:'taslim',p:'salam',t:'Le salut final (taslîm)',x:"Tu tournes la tête à droite en disant : As-salâmou ‘alaykoum wa rahmatou llâh, puis à gauche. Ta prière est terminée, machâ’Allah !",d:'ts',src:'Mouslim 582, Abou Dâwoud 996'}
];
export const R1=[{k:'takbir',l:'Allâhou akbar'},{k:'mains',l:'Al-Fâtiha'},{k:'roukou',l:'Roukoû‘'},{k:'debout',l:'Redressement'},{k:'soujoud',l:'Soujoûd'},{k:'assis',l:'Assis'},{k:'soujoud',l:'2e soujoûd',id:'s2'}];
export const H1=["On commence la prière en levant les mains…","Debout, les mains posées, on récite…","Après la récitation, on se penche, le dos droit…","Après le roukoû‘, on se relève bien droit…","Ensuite, le front va sur le tapis…","Entre les deux prosternations, on s'assoit…","Et pour finir la rak‘a, une deuxième prosternation !"];
export const NOTE_ECOLES=`<b>Bon à savoir.</b> Il existe de petites différences entre les écoles (par exemple la place des mains debout, ou lever les mains au roukoû‘). Elles sont toutes valables : fais comme on t'a appris à la maison ou à la mosquée.`;
