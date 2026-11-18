(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],A=$('#app');
let sound=true,prog={};try{prog=JSON.parse(localStorage.getItem('priere'))||{}}catch(e){}
try{if(localStorage.getItem('ablutions_son')==='0')sound=false}catch(e){}
const save=()=>{try{localStorage.setItem('priere',JSON.stringify(prog))}catch(e){}};

/* ---------- voix : clips enregistrés (voix/voix.json), récitation du Coran (vrai récitateur), sinon voix du navigateur ---------- */
let VX=null;try{fetch('voix/voix.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{VX=j}).catch(()=>{})}catch(e){}
const AU=new Audio();AU.preload='auto';let AUt=0,AUn=0;
function stopVoice(){clearTimeout(AUt);AUn++;try{AU.pause();AU.playbackRate=1}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function clip(id,rate,done){const c=VX&&VX[id];if(!c)return false;const n=AUn;rate=rate||1;
 const go=()=>{if(n!==AUn)return;AU.playbackRate=rate;try{AU.preservesPitch=true}catch(e){}try{AU.currentTime=c[1]}catch(e){}const p=AU.play();if(p&&p.catch)p.catch(()=>{});AUt=setTimeout(()=>{AU.pause();if(n===AUn&&done)done()},(c[2]-c[1])*1000/rate+150)};
 if(AU.dataset.f!==c[0]){AU.dataset.f=c[0];AU.src='voix/'+c[0];AU.addEventListener('loadedmetadata',go,{once:true});AU.load()}else go();return true}
function url(u,rate,done){const n=AUn;AU.dataset.f='';AU.src=u;AU.playbackRate=rate||1;try{AU.preservesPitch=true}catch(e){}AU.onended=()=>{AU.onended=null;if(n===AUn&&done)done()};const p=AU.play();if(p&&p.catch)p.catch(()=>{done&&done()})}
const ISL=/[âîûÂÎÛ‘ʿʾ]|\b(allah|bismi|ramadan|coran|a[iï]d\b|zak|sourate|f[aâ]tiha|nouh|adam|ibrahim|youss?ouf|younous|mouss?a|ftour|kaaba|qibla|sal[aâ]t|rak|soujou|roukou|takb|tachah|tasl|wudu|mach|inch|assal|soubh|rabb|alhamd|akbar|astagh|jibr|hajj|chah[aâ]da|fajr|dhohr|asr\b|maghrib|icha|sahour|adh[aâ]n)/i;
function tts(t,done){if(ISL.test(String(t))){done&&done();return}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g,'').replace(/[؀-ۿً-ٟ]+/g,''));u.lang='fr-FR';u.rate=.92;u.pitch=1.1;if(done)u.onend=done;speechSynthesis.speak(u)}catch(e){done&&done()}}
/* say : texte français + identifiant de clip */
function say(t,id,done){if(!sound){done&&done();return}stopVoice();if(id&&clip(id,1,done))return;tts(t,done)}
/* suite d'étapes audio : [{id,t,rate}|{url,rate}|{wait:ms}] */
function seq(items,end){if(!sound){end&&end();return}stopVoice();const n=AUn;const q=items.slice();
 const next=()=>{if(n!==AUn)return;const it=q.shift();if(!it){end&&end();return}
  if(it.wait)return AUt=setTimeout(next,it.wait);
  if(it.url)return url(it.url,it.rate,()=>setTimeout(next,350));
  if(it.id&&clip(it.id,it.rate,()=>setTimeout(next,350)))return;
  if(it.t)return tts(it.t,()=>setTimeout(next,350));next()};next()}
let T=[];const later=(f,ms)=>T.push(setTimeout(f,ms));const stopAll=()=>{T.forEach(clearTimeout);T=[];stopVoice()};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- décor ---------- */
$('#deco').innerHTML=[[6,12],[88,8],[18,40],[94,34],[4,70],[90,62],[50,4],[70,88],[12,90]].map(([x,y],i)=>`<span class="st" style="left:${x}%;top:${y}%;font-size:${12+i%3*6}px;animation-delay:${-i*.5}s">${i%4===3?'☾':'✦'}</span>`).join('');
$('#guir').innerHTML='<svg viewBox="0 0 400 58" preserveAspectRatio="xMidYMin meet"><path d="M0 4Q200 34 400 4" fill="none" stroke="#d9952a88" stroke-width="1.5"/>'+[30,95,160,240,305,370].map((x,i)=>{const u=x/400,y=4+60*u*(1-u),l=[10,18,12,12,18,10][i];return `<g class="gl" style="animation-delay:${-i*.6}s"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+l}" stroke="#d9952a" stroke-width="1.5"/><g transform="translate(${x-9} ${y+l}) scale(.18)"><path d="M30 32 38 16h24l8 16z" fill="#f5b942"/><rect x="26" y="32" width="48" height="8" rx="2" fill="#d9952a"/><rect x="28" y="40" width="44" height="60" rx="3" fill="${['#fff2c4','#ffd3e0','#c9f1f7'][i%3]}" stroke="#d9952a" stroke-width="4"/><rect x="24" y="100" width="52" height="8" rx="2" fill="#d9952a"/></g></g>`}).join('')+'</svg>';
/* ---------- Sajjadou, le petit tapis de prière (mascotte de l'univers prière) ---------- */
// Humeurs : '' sourire · 'clin' clin d'œil (accueil) · 'wow' joie + scintillement · 'oh' « pas grave » (il s'incline pour encourager)
let SJn=0;
function sajjadou(m='',cls=''){const u=++SJn;
 const pomp=(x,y,haut,i)=>`<g class="pp ${haut?'ph':'pb'}" style="animation-delay:${-i*.4}s"><line x1="${x}" y1="${haut?y:y}" x2="${x}" y2="${haut?y-7:y+7}" stroke="#d9952a" stroke-width="2" stroke-linecap="round"/><circle cx="${x}" cy="${haut?y-9:y+9}" r="3.4" fill="#f5b942" stroke="#d9952a" stroke-width="1"/></g>`;
 const xs=[33,46.5,60,73.5,87];
 const oeilD=m==='clin'?'<path d="M64 59q5-5 10 0" stroke="#173a5e" stroke-width="3" fill="none" stroke-linecap="round"/>':'<ellipse cx="69" cy="58" rx="5.2" ry="6.8" fill="#173a5e"/><circle cx="71" cy="55" r="2" fill="#fff"/>';
 const oeilG='<ellipse cx="51" cy="58" rx="5.2" ry="6.8" fill="#173a5e"/><circle cx="53" cy="55" r="2" fill="#fff"/>';
 const bouche=m==='wow'?'<path d="M52 69q8 13 16 0z" fill="#7a2c3b"/><path d="M55 74q5 4 10 0" fill="#ff8fa3"/>'
  :m==='oh'?'<ellipse cx="60" cy="72" rx="3.6" ry="4.2" fill="#7a2c3b"/>'
  :'<path d="M52 69q8 9 16 0" fill="#7a2c3b"/><path d="M55 72q5 3 10 0" fill="#ff8fa3"/>';
 const sourcils=m==='oh'?'<path d="M45 50.5l8-2.5M75 50.5l-8-2.5" stroke="#1d8f9c" stroke-width="2.4" stroke-linecap="round"/>':'';
 const etin=(m==='wow'||cls.includes('brille'))?`<g class="etin">${[[12,34,1],[108,28,.8],[8,98,.7],[110,96,1]].map(([x,y,s],i)=>`<path d="M${x} ${y-7*s}L${x+2*s} ${y-2*s}L${x+7*s} ${y}L${x+2*s} ${y+2*s}L${x} ${y+7*s}L${x-2*s} ${y+2*s}L${x-7*s} ${y}L${x-2*s} ${y-2*s}Z" fill="#f5b942" style="animation-delay:${-i*.3}s"/>`).join('')}</g>`:'';
 return `<svg class="sj ${m==='oh'?'incline':''} ${cls}" viewBox="0 0 120 152" role="img" aria-label="Sajjadou, le petit tapis de prière"><defs><linearGradient id="sjc${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9f1f7"/><stop offset="1" stop-color="#8fd8ef"/></linearGradient></defs>
 <ellipse cx="60" cy="148" rx="34" ry="4" fill="#1d8f9c" opacity=".18"/>${etin}
 <g class="tapis">${xs.map((x,i)=>pomp(x,13,1,i)).join('')}${xs.map((x,i)=>pomp(x,137,0,i)).join('')}
 <rect x="23" y="12" width="74" height="126" rx="8" fill="#2bb3c0" stroke="#1d8f9c" stroke-width="2.5"/>
 <rect x="28.5" y="17.5" width="63" height="115" rx="5" fill="#fff8e7"/>
 <rect x="31.2" y="20.2" width="57.6" height="109.6" rx="4" fill="none" stroke="#f5b942" stroke-width="2.6" stroke-dasharray="1.5 4.2" stroke-linecap="round"/>
 <rect x="34.5" y="23.5" width="51" height="103" rx="3" fill="url(#sjc${u})" stroke="#2bb3c0" stroke-width="1.2"/>
 <path d="M39 88V53C39 42 52 35 60 27C68 35 81 42 81 53V88Z" fill="#fff8e7" stroke="#f5b942" stroke-width="2.4" stroke-linejoin="round"/>
 <path d="M60 27v6" stroke="#d9952a" stroke-width="1.4"/><circle cx="60" cy="35" r="2" fill="#f5b942"/>
 <g class="visage">${sourcils}<g class="yeux">${oeilG}${oeilD}</g>
 <circle cx="44.5" cy="68" r="4.3" fill="#ff9fb2" opacity=".7"/><circle cx="75.5" cy="68" r="4.3" fill="#ff9fb2" opacity=".7"/>${bouche}</g>
 <g transform="translate(60 107)"><rect x="-8" y="-8" width="16" height="16" fill="#f5b942" stroke="#d9952a" stroke-width="1.2"/><rect x="-8" y="-8" width="16" height="16" fill="#f5b942" stroke="#d9952a" stroke-width="1.2" transform="rotate(45)"/><circle r="4.2" fill="#2bb3c0"/><circle r="1.6" fill="#fff8e7"/></g>
 <path d="M42 107l3-3.5 3 3.5-3 3.5zM72 107l3-3.5 3 3.5-3 3.5z" fill="#1d8f9c"/>
 <path d="M38 121h44" stroke="#f5b942" stroke-width="2" stroke-dasharray="3 3"/></g></svg>`}
const bubble=(t,c='',id='',m)=>`<div class="nb">${sajjadou(m!=null?m:c==='ok'?'wow':c==='ko'?'oh':'')}<div class="bul ${c}" id="bul" data-id="${id}">${t}</div></div>`;
const topbar=t=>`<div class="bar"><button class="rb" id="home" aria-label="Accueil">🏠</button><div class="ttl">${t}</div><button class="rb" id="snd" aria-label="Voix">${sound?'🔊':'🔇'}</button></div>`;
function wire(){const h=$('#home');if(h)h.onclick=()=>go('home');const s=$('#snd');if(s)s.onclick=()=>{sound=!sound;try{localStorage.setItem('ablutions_son',sound?'1':'0')}catch(e){}s.textContent=sound?'🔊':'🔇';if(!sound)stopVoice()};
 const b=$('#bul');if(b){b.style.cursor='pointer';b.onclick=()=>say(b.textContent,b.dataset.id)}}

/* ---------- l'enfant qui prie (silhouette sans visage, vue de côté, la qibla est à droite) ---------- */
const SK='#f3c9a4',TU='#2bb3c0',TU2='#1d8f9c',CAP='#fff8e7';
const L=(pts,c=TU,w=13)=>`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const H=(x,y)=>`<circle cx="${x}" cy="${y}" r="11" fill="${SK}" stroke="#cf916b" stroke-width="2"/><path d="M${x-11} ${y-2}a11 11 0 0 1 22 0z" fill="${CAP}" stroke="#d9952a" stroke-width="1.5"/>`;
const HAND=(x,y)=>`<circle cx="${x}" cy="${y}" r="4.5" fill="${SK}" stroke="#cf916b" stroke-width="1.5"/>`;
const MAT='<rect x="14" y="110" width="98" height="7" rx="3" fill="#3f9b6e" stroke="#f5b942" stroke-width="2"/><path d="M104 104l8 6-8 6" fill="none" stroke="#f5b94288" stroke-width="2"/>';
const POSE={
 debout:L('58,74 56,108',TU2)+L('62,74 64,108',TU2)+L('60,38 60,74')+L('60,42 57,70',TU2,9)+HAND(57,72)+H(60,24),
 takbir:L('58,74 56,108',TU2)+L('62,74 64,108',TU2)+L('60,38 60,74')+L('60,42 70,34 69,24',TU2,9)+HAND(69,22)+H(60,24),
 mains:L('58,74 56,108',TU2)+L('62,74 64,108',TU2)+L('60,38 60,74')+L('60,42 69,54 64,56',TU2,9)+HAND(64,56)+H(60,24),
 roukou:L('54,72 52,108',TU2)+L('56,72 58,108',TU2)+L('55,70 92,68')+L('86,69 64,86',TU2,9)+HAND(60,89)+H(102,66),
 soujoud:L('46,84 60,108 36,110',TU2)+L('48,84 82,98')+L('80,98 90,108',TU2,9)+HAND(92,109)+H(94,100),
 assis:L('52,100 78,103',TU2)+L('52,100 40,108',TU2)+L('52,100 56,62')+L('56,68 72,94',TU2,9)+HAND(74,96)+H(58,48),
 tachahhoud:L('52,100 78,103',TU2)+L('52,100 40,108',TU2)+L('52,100 56,62')+L('56,68 72,94',TU2,9)+HAND(74,96)+'<line x1="77" y1="94" x2="84" y2="86" stroke="#cf916b" stroke-width="3" stroke-linecap="round"/>'+H(58,48),
 salam:L('52,100 78,103',TU2)+L('52,100 40,108',TU2)+L('52,100 56,62')+L('56,68 72,94',TU2,9)+HAND(74,96)+H(58,48)+'<path d="M74 40q10-4 16 2" fill="none" stroke="#f5b942" stroke-width="3" marker-end=""/><path d="M86 38l5 4-6 2" fill="none" stroke="#f5b942" stroke-width="3"/>'
};
const pose=(k,cls='')=>`<svg class="pose ${cls}" viewBox="10 10 106 112" role="img" aria-label="${k}">${MAT}<g class="pz">${POSE[k]}</g></svg>`;

/* ---------- paroles (vérifiées : Coran et hadiths authentiques) ---------- */
const DH={
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
/* Coran : texte et récitation de cheikh Mahmoud Khalil Al-Housary (via alquran.cloud) */
const SUR={1:{n:'Al-Fâtiha',ay:7,first:1,tr:['Bismi llâhi r-rahmâni r-rahîm','Al-hamdou lillâhi rabbi l-‘âlamîn','Ar-rahmâni r-rahîm','Mâliki yawmi d-dîn','Iyyâka na‘boudou wa iyyâka nasta‘în','Ihdinâ s-sirâta l-moustaqîm','Sirâta lladhîna an‘amta ‘alayhim, ghayri l-maghdoûbi ‘alayhim wa la d-dâllîn'],
 fr:['Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux.','Louange à Allah, Seigneur des mondes.','Le Tout Miséricordieux, le Très Miséricordieux.','Le Maître du Jour de la rétribution.','C’est Toi seul que nous adorons, et c’est Toi seul dont nous implorons le secours.','Guide-nous sur le droit chemin,','le chemin de ceux que Tu as comblés de bienfaits, non pas de ceux qui ont encouru Ta colère, ni des égarés.']},
 112:{n:'Al-Ikhlâs',ay:4,first:6222,tr:['Qoul houwa llâhou ahad','Allâhou s-samad','Lam yalid wa lam yoûlad','Wa lam yakoun lahoû koufouwan ahad'],
 fr:['Dis : Il est Allah, Unique.','Allah, Celui vers qui tout le monde se tourne.','Il n’a jamais engendré et n’a pas été engendré.','Et nul n’est égal à Lui.']}};
const ayUrl=(s,i)=>`https://cdn.islamic.network/quran/audio/128/ar.husary/${SUR[s].first+i}.mp3`;
let QT={};function loadSur(s){if(QT[s])return Promise.resolve(QT[s]);return fetch(`https://api.alquran.cloud/v1/surah/${s}/quran-uthmani`).then(r=>r.json()).then(j=>{QT[s]=j.data.ayahs.map((a,i)=>i===0&&s!==1?a.text.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/,''):a.text);return QT[s]}).catch(()=>null)}

/* ---------- les étapes d'une prière de 2 rak‘at ---------- */
const ST=[
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

/* bloc « j'apprends la phrase » : arabe, pause pour répéter, plus lentement, phonétique, sens */
function dhBlock(id){const d=DH[id];return `<div class="dh"><div class="ar" lang="ar" dir="rtl">${d.ar}</div><div class="trl">${d.tr}</div><div class="frm">« ${d.fr} »</div>
 <div class="acts2"><button class="mini" data-play="${id}">▶ Écouter</button><button class="mini" data-slow="${id}">🐢 Lentement</button><button class="mini b" data-learn="${id}">🎓 J'apprends</button></div><div class="src">Source : ${d.src}</div></div>`}
function learnSeq(id){const b=$('#bul');const set=(t,c)=>{if(b){b.textContent=t;b.className='bul '+(c||'')}};
 set('Écoute bien…');seq([{id:'d_'+id},{t:'',wait:300},{id:'rep',t:'À toi ! Répète.'},{wait:2600},{id:'slow',t:'Encore une fois, plus lentement.'},{id:'d_'+id,rate:.72},{wait:2200},{id:'sens',t:'Ça veut dire :'},{id:'f_'+id,t:DH[id].fr}],()=>{set('Bravo ! Tu peux réécouter autant de fois que tu veux.','ok');say('','learn_ok')})}
function wireDh(){$$('[data-play]').forEach(b=>b.onclick=()=>say(DH[b.dataset.play].tr,'d_'+b.dataset.play));
 $$('[data-slow]').forEach(b=>b.onclick=()=>{if(!sound)return;stopVoice();if(!clip('d_'+b.dataset.slow,.72))tts(DH[b.dataset.slow].tr)});
 $$('[data-learn]').forEach(b=>b.onclick=()=>learnSeq(b.dataset.learn))}
function surBlock(s){const S=SUR[s];return `<div class="dh"><div class="ttl2">Sourate ${S.n} · récitation de cheikh Al-Housary</div><div id="qv">${S.tr.map((t,i)=>`<div class="ay" data-i="${i}"><div class="ar" lang="ar" dir="rtl" id="qa${i}">…</div><div class="trl">${t}</div><div class="frm">${S.fr[i]}</div>
 <div class="acts2"><button class="mini" data-ay="${i}">▶</button><button class="mini" data-ays="${i}">🐢</button></div></div>`).join('')}</div>
 <div class="acts2"><button class="mini b" id="qall">▶ Toute la sourate</button></div><div class="src">Texte du Coran : édition uthmânî (alquran.cloud) · Voix : Mahmoud Khalil Al-Housary</div></div>`}
function wireSur(s){loadSur(s).then(t=>{if(t)t.forEach((a,i)=>{const e=$('#qa'+i);if(e)e.textContent=a})});
 const hl=i=>$$('.ay').forEach(e=>e.classList.toggle('on',+e.dataset.i===i));
 $$('[data-ay]').forEach(b=>b.onclick=()=>{if(!sound)return;stopVoice();hl(+b.dataset.ay);url(ayUrl(s,+b.dataset.ay),1,()=>hl(-1))});
 $$('[data-ays]').forEach(b=>b.onclick=()=>{if(!sound)return;stopVoice();hl(+b.dataset.ays);url(ayUrl(s,+b.dataset.ays),.75,()=>hl(-1))});
 $('#qall').onclick=()=>{if(!sound)return;stopVoice();const n=AUn;let i=0;const nx=()=>{if(n!==AUn||i>=SUR[s].ay)return hl(-1);hl(i);url(ayUrl(s,i++),1,()=>setTimeout(nx,400))};nx()}}

/* ---------- écrans ---------- */
const GAMES=['g1','g3','g4'];
const stars=k=>`<span class="stars">${'★'.repeat(prog[k]||0)}${'☆'.repeat(3-(prog[k]||0))}</span>`;
const lanterns=()=>{const done=[!!prog.learn,...GAMES.map(k=>(prog[k]||0)>0)];return `<div class="lts">${done.map(d=>`<svg viewBox="20 10 60 116" class="lt ${d?'on':''}"><path d="M30 32 38 16h24l8 16z" fill="#f5b942"/><rect x="26" y="32" width="48" height="8" rx="2" fill="#d9952a"/><rect x="28" y="40" width="44" height="60" rx="3" fill="${d?'#fff2c4':'#e8eef1'}" stroke="#d9952a" stroke-width="4"/><rect x="24" y="100" width="52" height="8" rx="2" fill="#d9952a"/>${d?'<circle cx="50" cy="70" r="12" fill="#f5b942" opacity=".8"/>':''}</svg>`).join('')}</div>`};
const canDip=()=>prog.learn&&GAMES.every(k=>(prog[k]||0)>0);
function home(){
 A.innerHTML=`<div class="bar"><a class="rb" href="../ablutions/" aria-label="Ablutions" style="text-decoration:none">💧</a><span></span><button class="rb" id="snd" aria-label="Voix">${sound?'🔊':'🔇'}</button></div>
 <div class="hero">${sajjadou('','accueil')}<h1>J'apprends <span>ma prière</span></h1><p>Avec Sajjadou, ton petit tapis de prière, découvre la salât étape par étape : les gestes, les paroles et leur sens.</p></div>
 ${lanterns()}
 <div class="menu"><button class="big b1" id="m1"><span class="ic">🕌</span><span>Apprendre<small>Les ${ST.length} étapes de la prière${prog.learn?' · ✔':''}</small></span></button>
 <a class="big b1" id="m4" href="jeu3d/" style="background:#1d8f9c;text-decoration:none"><span class="ic">🧎</span><span>La prière en 3D<small>Fais les positions avec ton ami, sur ton tapis</small></span></a>
 <button class="big b2" id="m2"><span class="ic">🎮</span><span>Jouer<small>3 jeux · ${GAMES.reduce((a,k)=>a+(prog[k]||0),0)} / 9 étoiles</small></span></button>
 <button class="big b3" id="m3"><span class="ic">📜</span><span>Mon diplôme<small>${canDip()?'Il est prêt !':'Allume les 4 lanternes'}</small></span></button></div>
 <div class="parc"><b>Mon parcours</b><a href="../ablutions/">1 · Mes ablutions ✔</a><span class="here">2 · Ma prière</span><span class="soon">3 · Les sourates (bientôt)</span><span class="soon">4 · Le grand quiz (bientôt)</span></div>
 ${bubble("Assalâmou ‘alaykoum ! Après les ablutions, on apprend la prière. Tu viens avec moi ?",'','home','clin')}`;
 wire();$('#m1').onclick=()=>go('learn',0);$('#m2').onclick=()=>go('games');$('#m3').onclick=()=>go('dip')}
function learn(i){const s=ST[i];
 A.innerHTML=topbar(`Étape ${i+1} / ${ST.length}`)+`<div class="card"><div class="num">${i+1}</div><h2>${s.t}</h2><div class="pbox">${pose(s.p,'big')}</div><p class="txt">${s.x}</p>
 ${s.d?dhBlock(s.d):''}${s.d2?dhBlock(s.d2):''}${s.s?surBlock(s.s):''}<div class="src">Source : ${s.src}</div></div>
 <div class="nav"><button class="go2 sm" id="pv" ${i?'':'disabled'}>←</button><button class="go2" id="nx">${i<ST.length-1?'Étape suivante →':'J\'ai fini !'}</button></div>
 ${compagnon(i)}
 ${i===ST.length-1?`<div class="note"><b>Bon à savoir.</b> Il existe de petites différences entre les écoles (par exemple la place des mains debout, ou lever les mains au roukoû‘). Elles sont toutes valables : fais comme on t'a appris à la maison ou à la mosquée.</div>`:''}`;
 wire();wireDh();if(s.s)wireSur(s.s);
 $('#pv').onclick=()=>i&&go('learn',i-1);$('#nx').onclick=()=>{if(i<ST.length-1)go('learn',i+1);else{prog.learn=1;save();go('done')}};
 say(s.t+'. '+s.x,'e_'+s.k)}
// Sajjadou accompagne chaque étape (il n'explique pas : il encourage). Il scintille quand on passe une étape.
const ENC=["Bravo, tu avances bien !","Prends ton temps, je suis avec toi.","Regarde bien le geste, puis écoute.","Super ! On continue ensemble ?","Tu apprends vite, machâ'Allah !"];
function compagnon(i){const der=i===ST.length-1;
 const t=i===0?"Je suis Sajjadou, ton petit tapis de prière. On apprend ensemble, étape par étape !":der?"Dernière étape ! Tu y es presque.":ENC[(i-1)%ENC.length];
 return `<div class="nb comp">${sajjadou(i===0?'clin':der?'wow':'',i>0?'brille':'')}<div class="bul">${t}</div></div>`}
function done(){burst(140,1);A.innerHTML=topbar('Bravo !')+`<div class="win">${sajjadou('wow')}<h2>Machâ'Allah !</h2><p class="txt">Tu connais toutes les étapes de la prière ! Une lanterne s'allume.</p></div>${lanterns()}
 <button class="go2" id="gj">🎮 Maintenant, on joue !</button>`;wire();$('#gj').onclick=()=>go('games');say("Machâ'Allah ! Tu connais toutes les étapes de la prière ! Maintenant, on joue ?",'done')}
function games(){A.innerHTML=topbar('Les jeux de Sajjadou')+`<div class="menu">
 <button class="big b3" id="g1"><span class="ic">🔢</span><span>Remets la prière dans l'ordre<small>${stars('g1')}</small></span></button>
 <button class="big b3" id="g3"><span class="ic">❓</span><span>Quelle position ?<small>${stars('g3')}</small></span></button>
 <button class="big b3" id="g4"><span class="ic">🧱</span><span>Construis ta prière<small>${stars('g4')}</small></span></button></div>
 ${bubble(GAMES.every(k=>prog[k]===3)?"Tu as toutes les étoiles ! Tu es un vrai champion de la prière !":"Choisis un jeu ! Gagne les 9 étoiles !",GAMES.every(k=>prog[k]===3)?'ok':'','games')}`;
 wire();GAMES.forEach(k=>$('#'+k).onclick=()=>go(k));say('Choisis un jeu !','games')}
function result(k,ok,tot){const s=ok>=tot?3:ok>=tot*.6?2:1;if(!prog[k]||s>prog[k])prog[k]=s;save();burst(s===3?140:60,1);
 const msg=s===3?"Parfait ! Tu as toutes les étoiles !":s===2?"Très bien ! Encore un petit effort pour la 3e étoile.":"Bravo d'avoir essayé ! On rejoue ?";
 A.innerHTML=topbar('Résultat')+`<div class="win">${sajjadou(s===1?'':'wow')}<h2>${s===3?"Machâ'Allah !":'Bravo !'}</h2><div class="stars">${'★'.repeat(s)}${'☆'.repeat(3-s)}</div><p class="txt">${msg}</p></div>${lanterns()}
 <button class="go2" id="ag">🔁 Rejouer</button><button class="go2 w" id="og">🎮 Les autres jeux</button>${canDip()?'<button class="go2 w" id="dg">📜 Mon diplôme</button>':''}`;
 wire();$('#ag').onclick=()=>go(k);$('#og').onclick=()=>go('games');if($('#dg'))$('#dg').onclick=()=>go('dip');say(msg,'r'+s)}

/* JEU 1 : remets la rak‘a dans l'ordre */
const R1=[{k:'takbir',l:'Allâhou akbar'},{k:'mains',l:'Al-Fâtiha'},{k:'roukou',l:'Roukoû‘'},{k:'debout',l:'Redressement'},{k:'soujoud',l:'Soujoûd'},{k:'assis',l:'Assis'},{k:'soujoud',l:'2e soujoûd',id:'s2'}];
const H1=["On commence la prière en levant les mains…","Debout, les mains posées, on récite…","Après la récitation, on se penche, le dos droit…","Après le roukoû‘, on se relève bien droit…","Ensuite, le front va sur le tapis…","Entre les deux prosternations, on s'assoit…","Et pour finir la rak‘a, une deuxième prosternation !"];
function g1(){const items=R1.map((r,i)=>({...r,i}));let placed=0,err=0;const pool=shuffle(items);
 const draw=(msg,c,id)=>{A.innerHTML=topbar("Remets dans l'ordre")+`<div class="gh"><h2>Une rak‘a, dans l'ordre</h2></div>
  <div class="slots s7">${items.map((r,i)=>i<placed?`<div class="slot f">${pose(r.k)}</div>`:`<div class="slot">${i+1}</div>`).join('')}</div>
  ${bubble(msg,c,id)}<div class="pool">${pool.map(r=>r.i<placed?'':`<button class="pc" data-i="${r.i}">${pose(r.k)}${r.l}</button>`).join('')}</div>`;
  wire();$$('.pc').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;const ok=i===placed||(R1[i].k===R1[placed].k&&R1[i].l.includes('oujo')&&R1[placed].l.includes('oujo'));
   if(ok){if(i!==placed){const a=pool.findIndex(x=>x.i===i),z=pool.findIndex(x=>x.i===placed);[pool[a],pool[z]]=[pool[z],pool[a]]}placed++;burst(20);
    if(placed===R1.length)return later(()=>result('g1',err===0?7:err<=2?5:2,7),500);const m=["Bravo !","Oui !","C'est ça !","Super !"][placed%4]+' Et ensuite ?';draw(m,'ok','g1ok');say(m,'g1ok')}
   else{err++;b.classList.add('sh');const m='Pas encore ! Petit indice : '+H1[placed];draw(m,'ko','h1_'+placed);say(m,'h1_'+placed)}})};
 draw("Touche les positions dans le bon ordre, de la première à la dernière !",'','g1i');say("Touche les positions dans le bon ordre !",'g1i')}

/* JEU 3 : quelle position ? */
const Q3=[{p:'debout',a:'qiyam'},{p:'mains',a:'qiyam'},{p:'roukou',a:'roukou'},{p:'soujoud',a:'soujoud'},{p:'assis',a:'jouloûs'},{p:'tachahhoud',a:'jouloûs'},{p:'takbir',a:'qiyam'},{p:'soujoud',a:'soujoud'}];
const N3={qiyam:'Qiyâm (debout)',roukou:'Roukoû‘ (penché)',soujoud:'Soujoûd (prosterné)','jouloûs':'Jouloûs (assis)'};
function g3(){const qs=shuffle(Q3).slice(0,6);let n=0,ok=0;
 const draw=(msg,c,id)=>{const q=qs[n];A.innerHTML=topbar('Quelle position ?')+`<div class="gh"><h2>Question ${n+1} / ${qs.length}</h2></div><div class="pbox">${pose(q.p,'big')}</div>
  ${bubble(msg,c,id)}<div class="opts o2">${Object.keys(N3).map(k=>`<button class="opt" data-a="${k}">${N3[k]}</button>`).join('')}</div>`;
  wire();$$('.opt').forEach(b=>b.onclick=()=>{const good=b.dataset.a===q.a;$$('.opt').forEach(x=>{x.disabled=true;if(x.dataset.a===q.a)x.classList.add('good')});if(good){ok++;burst(25);b.classList.add('good')}else b.classList.add('bad');
   const m=good?'Bravo ! C\'est le '+N3[q.a]+' !':'Presque ! C\'est le '+N3[q.a]+'.';const bb=$('#bul');bb.textContent=m;bb.className='bul '+(good?'ok':'ko');say(m,(good?'g3ok_':'g3ko_')+q.a);
   later(()=>{n++;if(n<qs.length)draw('Et celle-ci ?','','g3q');else result('g3',ok,qs.length)},2600)})};
 draw("Comment s'appelle cette position ?",'','g3i');say("Comment s'appelle cette position ?",'g3i')}

/* JEU 4 : construis ta prière (que dit-on ici ?) */
const R4=[{p:'takbir',d:'ak'},{p:'roukou',d:'rk'},{p:'debout',d:'sm'},{p:'soujoud',d:'sj'},{p:'assis',d:'gh'},{p:'soujoud',d:'sj'},{p:'salam',d:'ts'}];
function g4(){let n=0,ok=0;const keys=['ak','rk','sm','sj','gh','ts'];
 const draw=(msg,c,id)=>{const q=R4[n];const opts=shuffle([q.d,...shuffle(keys.filter(k=>k!==q.d)).slice(0,2)]);
  A.innerHTML=topbar('Construis ta prière')+`<div class="gh"><h2>Que dit-on ici ?</h2></div><div class="build">${R4.map((r,i)=>`<span class="bp ${i<n?'f':i===n?'cur':''}">${pose(r.p)}</span>`).join('')}</div>
  <div class="pbox">${pose(q.p,'big')}</div>${bubble(msg,c,id)}<div class="opts o1">${opts.map(k=>`<button class="opt ar2" data-d="${k}"><span lang="ar" dir="rtl">${DH[k].ar}</span><small>${DH[k].tr}</small></button>`).join('')}</div>`;
  wire();$$('.opt').forEach(b=>b.onclick=()=>{const good=b.dataset.d===q.d;$$('.opt').forEach(x=>{x.disabled=true;if(x.dataset.d===q.d)x.classList.add('good')});if(good){ok++;burst(25);b.classList.add('good')}else b.classList.add('bad');
   const m=good?'Bravo ! Ici, on dit : '+DH[q.d].tr+'.':'Presque ! Ici, on dit : '+DH[q.d].tr+'.';const bb=$('#bul');bb.textContent=m;bb.className='bul '+(good?'ok':'ko');
   seq([{id:good?'g4ok':'g4ko',t:good?'Bravo !':'Presque !'},{id:'d_'+q.d,t:''}]);
   later(()=>{n++;if(n<R4.length)draw('Et maintenant ?','','g4q');else result('g4',ok,R4.length)},3600)})};
 draw("Pour chaque position, choisis la bonne parole. Ta prière se construit !",'','g4i');say("Pour chaque position, choisis la bonne parole !",'g4i')}

/* ---------- diplôme ---------- */
function dip(){if(!canDip()){A.innerHTML=topbar('Mon diplôme')+`${lanterns()}${bubble("Pour avoir ton diplôme, allume les 4 lanternes : apprends les étapes, puis gagne au moins une étoile dans chaque jeu !",'','dip_no')}<button class="go2" id="gl">🕌 Apprendre</button><button class="go2 w" id="gg">🎮 Jouer</button>`;
  wire();$('#gl').onclick=()=>go('learn',0);$('#gg').onclick=()=>go('games');say($('#bul').textContent,'dip_no');return}
 const nm=prog.name||'';const d=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
 A.innerHTML=topbar('Mon diplôme')+`<label class="nmf">Ton prénom <input id="nm" maxlength="20" value="${esc(nm)}" placeholder="Prénom"></label>
 <div class="dipl" id="dipl"><div class="dm">${sajjadou('wow')}</div><div class="dl">${'✦ ☾ ✦'}</div><div class="dt">Diplôme de lumière</div><div class="dn" id="dn">${esc(nm)||'…'}</div><div class="dx">Je connais les étapes de ma prière</div>
 <div class="dp">${['takbir','roukou','soujoud','assis'].map(p=>pose(p)).join('')}</div><div class="dd">Le ${d} · Les Lanternes de Nour</div><div class="dv">« La prière est la lumière » · Mouslim 223</div></div>
 <button class="go2" id="pr">🖨 Imprimer mon diplôme</button>`;
 wire();$('#nm').oninput=e=>{prog.name=e.target.value.trim();save();$('#dn').textContent=prog.name||'…'};$('#pr').onclick=()=>window.print();burst(120,1);say("Félicitations ! Tu connais les étapes de ta prière. Voici ton diplôme !",'dip')}

/* ---------- confettis ---------- */
let parts=[],raf=0;const cv=$('#fx'),cx=cv.getContext('2d');
function burst(n,big){cv.width=innerWidth;cv.height=innerHeight;for(let i=0;i<n;i++)parts.push({x:big?Math.random()*cv.width:cv.width/2,y:big?-20-Math.random()*cv.height*.5:cv.height*.45,vx:big?(Math.random()-.5)*1.5:(Math.random()-.5)*9,vy:big?2+Math.random()*3:-3-Math.random()*7,r:3+Math.random()*5,c:['#f5b942','#2bb3c0','#fff','#ffd1e1','#8fd8ef'][i%5],l:big?260:90});if(!raf)loop()}
function loop(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.l-->0&&p.y<cv.height+30);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;cx.fillStyle=p.c;cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()});raf=parts.length?requestAnimationFrame(loop):0;if(!raf)cx.clearRect(0,0,cv.width,cv.height)}

const SCR={home,learn,done,games,g1,g3,g4,dip};
function go(s,...a){stopAll();SCR[s](...a);window.scrollTo(0,0)}
window.__go=go;home();
})();
