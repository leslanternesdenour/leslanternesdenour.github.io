(function(){
const {M,C,S,J,V,MV,ORDER}=window.D,$=s=>document.getElementById(s);
const DIP="<svg viewBox=\"0 0 600 820\" aria-hidden=\"true\"><defs><pattern id=\"dpat\" width=\"22\" height=\"22\" patternUnits=\"userSpaceOnUse\"><rect width=\"22\" height=\"22\" fill=\"#191345\"/><use href=\"#st8\" x=\"4\" y=\"4\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"#f5b942\" stroke-width=\"1.6\" opacity=\".9\"/></pattern><radialGradient id=\"dbg\" cx=\"50%\" cy=\"30%\" r=\"75%\"><stop offset=\"0\" stop-color=\"#fffdf5\"/><stop offset=\".7\" stop-color=\"#fff6dc\"/><stop offset=\"1\" stop-color=\"#fbe7b4\"/></radialGradient><radialGradient id=\"dgl\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0\" stop-color=\"#ffe7a6\"/><stop offset=\"1\" stop-color=\"#ffe7a600\"/></radialGradient></defs><rect x=\"4\" y=\"4\" width=\"592\" height=\"812\" rx=\"30\" fill=\"#191345\" stroke=\"#f5b942\" stroke-width=\"4\"/><path fill-rule=\"evenodd\" fill=\"url(#dpat)\" d=\"M14 14h572v792H14zM40 40v740h520V40z\"/><rect x=\"40\" y=\"40\" width=\"520\" height=\"740\" rx=\"10\" fill=\"url(#dbg)\" stroke=\"#f5b942\" stroke-width=\"3\"/><rect x=\"52\" y=\"52\" width=\"496\" height=\"716\" rx=\"6\" fill=\"none\" stroke=\"#d9a640\" stroke-width=\"1.5\" stroke-dasharray=\"6 5\"/><circle cx=\"300\" cy=\"230\" r=\"190\" fill=\"url(#dgl)\" opacity=\".7\"/><use href=\"#st8\" x=\"18\" y=\"18\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"538\" y=\"18\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"18\" y=\"758\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"538\" y=\"758\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"34\" y=\"34\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"554\" y=\"34\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"34\" y=\"774\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"554\" y=\"774\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><circle cx=\"300\" cy=\"40\" r=\"34\" fill=\"#191345\" stroke=\"#f5b942\" stroke-width=\"3\"/><path d=\"M312 20a22 22 0 1 0 0 40 18 18 0 1 1 0-40z\" fill=\"#f5b942\"/><path d=\"m318 32 2 4.5 4.8.6-3.5 3.3.9 4.8-4.2-2.4-4.2 2.4.9-4.8-3.5-3.3 4.8-.6z\" fill=\"#ffe3a3\"/><path d=\"M100 52v26\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"82.0\" y=\"74\" width=\"36.0\" height=\"46.08\"/></g><path d=\"M150 52v12\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"137.0\" y=\"60\" width=\"26.0\" height=\"33.28\"/></g><path d=\"M500 52v26\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"482.0\" y=\"74\" width=\"36.0\" height=\"46.08\"/></g><path d=\"M450 52v12\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"437.0\" y=\"60\" width=\"26.0\" height=\"33.28\"/></g><path d=\"M150 143Q150 150 157 150Q150 150 150 157Q150 150 143 150Q150 150 150 143z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M455 134Q455 140 461 140Q455 140 455 146Q455 140 449 140Q455 140 455 134z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M90 324Q90 330 96 330Q90 330 90 336Q90 330 84 330Q90 330 90 324z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M515 353Q515 360 522 360Q515 360 515 367Q515 360 508 360Q515 360 515 353z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M100 555Q100 560 105 560Q100 560 100 565Q100 560 95 560Q100 560 100 555z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M505 579Q505 585 511 585Q505 585 505 591Q505 585 499 585Q505 585 505 579z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M196 104Q196 108 200 108Q196 108 196 112Q196 108 192 108Q196 108 196 104z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M404 107Q404 112 409 112Q404 112 404 117Q404 112 399 112Q404 112 404 107z\" fill=\"#f5b942\" opacity=\".75\"/><path transform=\"translate(40 689) scale(.8667)\" fill=\"#f5b942\" opacity=\"0.3\" d=\"M0 96h600v4H0zM110 100V34h16v66zM104 46h28v5h-28zM106 70h24v4h-24zM108 30h20v4h-20zM108 30C104.5 20.1 112.5 13.5 118 8C123.5 13.5 131.5 20.1 128 30zM117.1 9v-9h1.8v9zM118 -2m-2.4 0a2.4 2.4 0 1 1 4.8 0a2.4 2.4 0 1 1-4.8 0M119 -14a4.5 4.5 0 1 0 0 9.0a5.9 5.9 0 0 1 0-9.0zM474 100V34h16v66zM468 46h28v5h-28zM470 70h24v4h-24zM472 30h20v4h-20zM472 30C468.5 20.1 476.5 13.5 482 8C487.5 13.5 495.5 20.1 492 30zM481.1 9v-9h1.8v9zM482 -2m-2.4 0a2.4 2.4 0 1 1 4.8 0a2.4 2.4 0 1 1-4.8 0M483 -14a4.5 4.5 0 1 0 0 9.0a5.9 5.9 0 0 1 0-9.0zM206 100V60h188v40z M314 100V82a14 14 0 0 0-28 0v18z M248 92V80a7 7 0 0 0-14 0v12z M366 92V80a7 7 0 0 0-14 0v12zM226 54h148v6h-148zM234 54C210.89999999999998 31.5 263.7 16.5 300 4C336.3 16.5 389.1 31.5 366 54zM299 5v-8h2v8zM300 -5m-2.6 0a2.6 2.6 0 1 1 5.2 0a2.6 2.6 0 1 1-5.2 0M302 -20a6 6 0 1 0 0 12a7.8 7.8 0 0 1 0-12zM132 100V72h68v28z M173 100V88a7 7 0 0 0-14 0v12zM140 72C130.9 59.4 151.7 51.0 166 44C180.3 51.0 201.1 59.4 192 72zM165.2 45v-7h1.6v7zM167 31a3.5 3.5 0 1 0 0 7.0a4.5 4.5 0 0 1 0-7.0zM400 100V72h68v28z M441 100V88a7 7 0 0 0-14 0v12zM408 72C398.9 59.4 419.7 51.0 434 44C448.3 51.0 469.1 59.4 460 72zM433.2 45v-7h1.6v7zM435 31a3.5 3.5 0 1 0 0 7.0a4.5 4.5 0 0 1 0-7.0zM18 100V82h44v18zM23 82C17.049999999999997 73.0 30.65 67.0 40 62C49.35 67.0 62.95 73.0 57 82zM538 100V82h44v18zM543 82C537.05 73.0 550.65 67.0 560 62C569.35 67.0 582.95 73.0 577 82z\"/></svg>",ORN="<svg viewBox=\"0 0 260 24\" class=\"orn\"><path d=\"M10 12H100M160 12H250\" stroke=\"#d9a640\" stroke-width=\"2\"/><circle cx=\"104\" cy=\"12\" r=\"3\" fill=\"#f5b942\"/><circle cx=\"156\" cy=\"12\" r=\"3\" fill=\"#f5b942\"/><use href=\"#st8\" x=\"118\" y=\"0\" width=\"24\" height=\"24\" fill=\"#f5b942\" stroke=\"#c58a12\"/></svg>",SEAL="<svg viewBox=\"0 0 120 150\" class=\"seal\"><path d=\"M38 90 24 146l20-12 12 16 6-56zM82 90l14 56-20-12-12 16-6-56z\" fill=\"#8CCFA8\" stroke=\"#3f7d5b\" stroke-width=\"2\"/><use href=\"#st8\" x=\"2\" y=\"2\" width=\"116\" height=\"116\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\".6\"/><circle cx=\"60\" cy=\"60\" r=\"40\" fill=\"#ffe3a3\" stroke=\"#c58a12\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"none\" stroke=\"#c58a12\" stroke-dasharray=\"3 3\"/><text x=\"60\" y=\"64\" text-anchor=\"middle\" font-family=\"Poppins,system-ui\" font-weight=\"800\" font-size=\"30\" fill=\"#191345\">30</text><text x=\"60\" y=\"80\" text-anchor=\"middle\" font-family=\"Poppins,system-ui\" font-weight=\"800\" font-size=\"8.5\" letter-spacing=\"1\" fill=\"#191345\">LANTERNES</text></svg>";
const LT='<svg viewBox="0 0 100 128"><use href="#lt"/></svg>';
let st={kids:[],cur:0};try{st=JSON.parse(localStorage.getItem('lanternes2'))||st}catch(e){}
const save=()=>{try{localStorage.setItem('lanternes2',JSON.stringify(st))}catch(e){}};
const K=()=>st.kids[st.cur],F=()=>K()&&K().g==='f';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),3200)}
/* ---------- voix enregistrées (voix/voix.json : id -> [fichier, début, fin]) ---------- */
let VX=null;try{fetch('voix/voix.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(j=>{VX=j}).catch(()=>{})}catch(e){}
const AU=new Audio();AU.preload='auto';let AUt=0,AUn=0;
function stopV(){clearTimeout(AUt);AUn++;try{AU.pause()}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function playId(id,done){const c=VX&&VX[id];if(!c)return false;const n=AUn;
 const go=()=>{if(n!==AUn)return;try{AU.currentTime=c[1]}catch(e){}const p=AU.play();if(p&&p.catch)p.catch(()=>{});AUt=setTimeout(()=>{AU.pause();if(n===AUn&&done)done()},(c[2]-c[1])*1000+120)};
 if(AU.dataset.f!==c[0]){AU.dataset.f=c[0];AU.src='voix/'+c[0];AU.addEventListener('loadedmetadata',go,{once:true});AU.load()}else go();return true}
function say(ids,txt){stopV();const q=[].concat(ids).filter(i=>VX&&VX[i]);if(!q.length){if(txt)speak(txt);return}const n=AUn;const run=()=>{const i=q.shift();if(i&&n===AUn)playId(i,()=>setTimeout(run,300))};run()}
const ISL=/[âîûÂÎÛ‘ʿʾ]|\b(allah|bismi|ramadan|coran|a[iï]d\b|zak|sourate|f[aâ]tiha|nouh|adam|ibrahim|youss?ouf|younous|mouss?a|ftour|kaaba|qibla|sal[aâ]t|rak|soujou|roukou|takb|tachah|tasl|wudu|mach|inch|assal|soubh|rabb|alhamd|akbar|astagh|jibr|hajj|chah[aâ]da|fajr|dhohr|asr\b|maghrib|icha|sahour|adh[aâ]n)/i;
function speak(t){if(ISL.test(String(t)))return;try{const s=speechSynthesis;s.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[؀-ۿ]+/g,''));u.lang='fr-FR';u.rate=.9;s.speak(u)}catch(e){toast('La lecture à voix haute n\'est pas disponible ici')}}
function qrSvg(q){const[n,rows]=q;let d='';rows.forEach((h,y)=>{const b=BigInt('0x'+h).toString(2).padStart(n,'0');for(let x=0;x<n;x++)if(b[x]==='1')d+=`M${x} ${y}h1v1h-1z`});
 return `<svg viewBox="-2 -2 ${n+4} ${n+4}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/><path d="${d}" fill="#191345"/></svg>`}
function today(){if(!st.start)return 0;const d=Math.floor((new Date().setHours(12)-new Date(st.start+'T12:00').getTime())/864e5)+1;return d>=1&&d<=30?d:0}

/* ---------- navigation ---------- */
function route(){const h=location.hash.slice(1)||'lanternes';close();stopV();
 const v=h.startsWith('video/')?'video':{lanternes:'cal',jeux:'jeux',histoires:'hist'}[h]||'cal';
 ['cal','jeux','hist','video'].forEach(x=>$('v-'+x).hidden=x!==v);
 document.querySelectorAll('.nav a').forEach(a=>a.classList.toggle('on',a.dataset.v===v||(v==='video'&&a.dataset.v==='hist')));
 if(v!=='video')$('v-video').innerHTML='';
 if(v==='video')video(h.slice(6));if(v==='jeux')jeux();if(v==='hist')hist();
 window.scrollTo(0,0)}
addEventListener('hashchange',route);

/* ---------- calendrier ---------- */
function render(){const g=$('grid');g.innerHTML='';
 $('kids').innerHTML=st.kids.map((k,i)=>`<button class="kid ${i===st.cur?'on':''}" data-i="${i}">${esc(k.name)}</button>`).join('');
 document.querySelectorAll('.kid').forEach(b=>b.onclick=()=>{st.cur=+b.dataset.i;save();render();if(!$('v-jeux').hidden)jeux()});
 const k=K();if(!k)return;k.jeux=k.jeux||{};
 $('hello').textContent=`Assalâmou ‘alaykoum ${k.name} !`;
 $('lv1').classList.toggle('on',k.lv==='s');$('lv2').classList.toggle('on',k.lv==='b');
 const t=today();
 M.forEach(m=>{const b=document.createElement('button');b.className='l'+(k.lit[m[0]]?' lit':'')+(t===m[0]?' today':'')+(MV[m[0]]?' vid':'');b.innerHTML=LT+`<span class="n">${m[0]}</span>`;b.setAttribute('aria-label','Mission '+m[0]);b.onclick=()=>card(m);g.appendChild(b)});
 $('star').classList.toggle('lit',!!k.lit['★']);
 const n=M.filter(m=>k.lit[m[0]]).length;$('bar').style.width=(n/30*100)+'%';$('count').textContent=`${n} / 30 lanternes allumées`;
 const tb=$('tonight');if(t){const m=M[t-1];tb.hidden=false;tb.innerHTML=`<b>${t}</b><div><span>Ta mission de ce soir</span><strong>${m[2]}</strong></div>`;tb.onclick=()=>card(m)}else tb.hidden=true}
function card(m){if(!K()){form(false);return}   /* pas encore de profil : on propose d'abord de le créer (au lieu de planter) */
 const k=K(),c=C[m[1]],on=!!k.lit[m[0]];
 const vids=(MV[m[0]]||[]).map(v=>`<a class="vb" href="#video/${v}">▶ Regarder : ${V[v].t}</a>`).join('');
 $('ov').innerHTML=`<div class="card"><div class="ch"><div class="med">${m[0]}</div><span class="tag" style="background:${c[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="#191345" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c[2]}</svg>${c[0]}</span><h2>${m[2]}</h2></div>
 <div class="cb"><h3>${k.lv==='s'?'Petite lanterne · 3-5 ans':'Grande lanterne · 6-10 ans'}</h3><p>${k.lv==='s'?m[3]:m[4]}</p>${vids}${m[5]?`<div class="src">Source : ${m[5]}</div>`:''}
 <button class="say" id="cs">🔊 Écouter</button><div class="acts"><button class="ok" id="lit">${on?'Éteindre':'J\'ai réussi, j\'allume !'}</button><button class="no" id="cl">Fermer</button></div></div></div>`;
 $('ov').classList.add('on');const vid=(k.lv==='s'?'ms':'mb')+(m[0]==='★'?'star':m[0]);$('cs').onclick=()=>say(vid,m[2]+'. '+(k.lv==='s'?m[3]:m[4]));say(vid);$('cl').onclick=close;$('lit').onclick=()=>{k.lit[m[0]]=!on;save();close();render();if(!on)lit(m[0])}}
function close(){stopV();$('ov').classList.remove('on','print');$('ov').innerHTML=''}
const CHEERS=['Bravo !','Machâ\'Allah !','Ta lanterne brille !','Super, continue !','Bârak Allâhou fîk !'];
function lit(n){const k=K(),c=M.filter(m=>k.lit[m[0]]).length;burst(40);
 if(c===30)return setTimeout(fin,600);
 say(c===10?'l10':c===20?'l20':c===29?'l29':n==='★'?[]:'cheer'+(c%CHEERS.length));if(c===10)toast(`Déjà 10 lanternes allumées, ${k.name} ! Machâ'Allah !`);else if(c===20)toast(`20 lanternes ! Plus que 10, ${F()?'tu es presque arrivée':'tu es presque arrivé'} !`);else if(c===29)toast('Plus qu\'une lanterne avant ton diplôme !');
 else if(n!=='★')toast(CHEERS[c%CHEERS.length])}

/* ---------- confettis ---------- */
let parts=[],raf=0;const cv=$('fx'),cx=cv.getContext('2d');
function burst(n,big){cv.width=innerWidth;cv.height=innerHeight;for(let i=0;i<n;i++)parts.push({x:big?Math.random()*cv.width:cv.width/2,y:big?-20-Math.random()*cv.height*.6:cv.height*.45,vx:big?(Math.random()-.5)*1.5:(Math.random()-.5)*9,vy:big?2+Math.random()*3:-3-Math.random()*7,r:3+Math.random()*5,c:['#f5b942','#ffe3a3','#fff','#ffd1e1','#c7f0ff'][i%5],s:Math.random()<.5,l:big?260:90});if(!raf)loop()}
function loop(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.l-->0&&p.y<cv.height+30);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;cx.fillStyle=p.c;if(p.s)star5(p.x,p.y,p.r*1.6);else{cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}});raf=parts.length?requestAnimationFrame(loop):0;if(!raf)cx.clearRect(0,0,cv.width,cv.height)}
function star5(x,y,r){cx.beginPath();for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,q=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}cx.closePath();cx.fill()}

/* ---------- fin + diplôme ---------- */
function fin(){const k=K();let w=0;const rain=setInterval(()=>{burst(60,true);if(++w>5)clearInterval(rain)},500);
 $('ov').innerHTML=`<div class="form" style="text-align:center"><div class="big">${LT}</div><h2>Félicitations ${esc(k.name)} !</h2><p>Tu as allumé tes 30 lanternes pendant le Ramadan. Tu es une vraie lanterne de lumière !</p><button class="ok" id="sd">Voir mon diplôme</button></div>`;
 $('ov').classList.add('on');say('fin');$('sd').onclick=dip}
function dip(){say('diplome');const k=K(),d=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
 $('ov').innerHTML=`<div class="dw"><div class="dip">${DIP}<div class="dc"><small>Les Lanternes de Nour</small><h2>Diplôme de lumière</h2>${ORN}
 <p>${F()?'Bravo à notre petite musulmane':'Bravo à notre petit musulman'}</p><div class="who">${esc(k.name)}</div>
 <p>qui a allumé ses <b>30 lanternes</b> pendant le Ramadan ${new Date().getFullYear()}, à l'âge de ${k.age} ans.<br>${F()?'Tu as été courageuse, généreuse et patiente':'Tu as été courageux, généreux et patient'} !</p>
 <p class="q">« Allah aime ceux qui font le bien. »<span>Coran 2:195</span></p></div>
 <div class="sig"><div>Le ${d}</div>${SEAL}<div>Signature des parents</div></div></div>
 <div class="dact"><button class="ok" id="pr">Imprimer / enregistrer</button><button class="no" id="cl2">Fermer</button></div></div>`;
 $('ov').classList.add('on');$('cl2').onclick=close;$('pr').onclick=()=>{$('ov').classList.add('print');setTimeout(()=>{print();setTimeout(()=>$('ov').classList.remove('print'),800)},100)}}

/* ---------- jeux ---------- */
let jt='dev',ji={dev:0,qr:0},shown=false;
document.querySelectorAll('.seg2 button').forEach(b=>b.onclick=()=>{jt=b.dataset.t;shown=false;jeux()});
function jeux(){const k=K();if(!k)return;k.jeux=k.jeux||{};
 document.querySelectorAll('.seg2 button').forEach(b=>b.classList.toggle('on',b.dataset.t===jt));
 if(jt==='mem')return memory();
 const L=J[jt][k.lv],all=J.dev[k.lv].concat(J.qr[k.lv]),i=ji[jt]=(ji[jt]+L.length)%L.length,x=L[i],found=!!k.jeux[x.id];
 const nf=all.filter(y=>k.jeux[y.id]).length;
 $('jstars').textContent=`⭐ ${nf} / ${all.length} trouvées par ${k.name}`;
 $('jcard').innerHTML=`<div class="jc"><div class="jh"><span>${jt==='dev'?'Devinette':'Question'} <b>${i+1}</b> / ${L.length}</span><span>${k.lv==='s'?'3-5 ans':'6-10 ans'}${found?' · ⭐':''}</span></div>
 <div class="jb"><div class="jq">${x.q}</div><button class="say" id="sq">🔊 Écouter</button>
 ${shown?`<div class="ans"><div class="a">${x.a}</div>
  <div class="word"><div class="ar" lang="ar">${x.ar}</div><div class="t">${x.tr}</div><div class="f">= ${x.fr}</div></div>
  <div class="rep">🗣 Répète le mot arabe avec tes parents, puis dis-le en français !</div>${x.src?`<div class="src">Source : ${x.src}</div>`:''}</div>
  <div class="jn"><button class="ok" id="jf">${found?'⭐ Déjà trouvée':'⭐ On a trouvé !'}</button><button class="no" id="jx">Suivante →</button></div>`
 :`<div class="jn"><button class="no" id="jp">← Avant</button><button class="ok" id="jr">Voir la réponse</button></div>`}</div></div>`;
 const pre=(jt==='dev'?'d':'q')+(k.lv==='s'?'p':'g')+i;window.__jq=()=>say(pre+'q');
 $('sq').onclick=()=>say(shown?[pre+'q',pre+'a']:[pre+'q'],x.q+(shown?'. Réponse : '+x.a:''));
 if(shown){$('jx').onclick=()=>{ji[jt]++;shown=false;jeux();window.__jq()};$('jf').onclick=()=>{if(!found){k.jeux[x.id]=true;save();burst(30);const n2=nf+1;toast(n2===all.length?`Machâ'Allah ${k.name}, tu as tout trouvé !`:CHEERS[n2%CHEERS.length]);say('cheer'+(n2%CHEERS.length))}ji[jt]++;shown=false;jeux()}}
 else{$('jr').onclick=()=>{shown=true;jeux();say(pre+'a')};$('jp').onclick=()=>{ji[jt]--;jeux()}}}


/* ---------- memory ---------- */
const MEM=[{"k": "fanous", "fr": "la lanterne", "ar": "الْفَانُوس", "tr": "Al-fânoûs", "ic": "<g style=\"--lb:#f5b942;--lw:#fff2c4;--ls:#c58a12\"><use href=\"#lt\" x=\"14\" y=\"9\" width=\"36\" height=\"46\"/></g>"}, {"k": "hilal", "fr": "le croissant de lune", "ar": "الْهِلَال", "tr": "Al-hilâl", "ic": "<path d=\"M36 8a24 24 0 1 0 0 48a30 30 0 0 1 0-48z\" fill=\"#f5b942\"/><use href=\"#st8\" x=\"38\" y=\"22\" width=\"16\" height=\"16\" fill=\"#e9a21f\"/>"}, {"k": "masjid", "fr": "la mosquée", "ar": "الْمَسْجِد", "tr": "Al-masjid", "ic": "<path fill=\"#2e7d5b\" d=\"M10 58V34h44v24z M36 58V48a4 4 0 0 0-8 0v10zM16 34C10.399999999999999 23.2 23.2 16.0 32 10C40.8 16.0 53.6 23.2 48 34zM31.4 11V6h1.2v5zM33 0a3 3 0 1 0 0 6a3.9 3.9 0 0 1 0-6zM50 58V22h6v36zM49 22C47.6 18.4 50.8 16.0 53 14C55.2 16.0 58.4 18.4 57 22zM54 8a2 2 0 1 0 0 4a2.6 2.6 0 0 1 0-4z\"/>"}, {"k": "quran", "fr": "le Coran", "ar": "الْقُرْآن", "tr": "Al-Qour'ân", "ic": "<rect x=\"12\" y=\"7\" width=\"40\" height=\"50\" rx=\"4\" fill=\"#2e7d5b\"/><rect x=\"16\" y=\"11\" width=\"32\" height=\"42\" rx=\"2\" fill=\"none\" stroke=\"#f5b942\" stroke-width=\"2\"/><use href=\"#st8\" x=\"21\" y=\"21\" width=\"22\" height=\"22\" fill=\"#f5b942\"/>"}, {"k": "tamr", "fr": "les dattes", "ar": "التَّمْر", "tr": "At-tamr", "ic": "<ellipse cx=\"32\" cy=\"50\" rx=\"27\" ry=\"8\" fill=\"#e8d3a8\"/><g transform=\"rotate(-25 20 36)\"><ellipse cx=\"20\" cy=\"36\" rx=\"7.5\" ry=\"13\" fill=\"#7a3e12\"/><ellipse cx=\"17.5\" cy=\"32\" rx=\"2\" ry=\"5\" fill=\"#fff\" opacity=\".3\"/></g><g transform=\"rotate(0 32 32)\"><ellipse cx=\"32\" cy=\"32\" rx=\"7.5\" ry=\"13\" fill=\"#7a3e12\"/><ellipse cx=\"29.5\" cy=\"28\" rx=\"2\" ry=\"5\" fill=\"#fff\" opacity=\".3\"/></g><g transform=\"rotate(25 44 36)\"><ellipse cx=\"44\" cy=\"36\" rx=\"7.5\" ry=\"13\" fill=\"#7a3e12\"/><ellipse cx=\"41.5\" cy=\"32\" rx=\"2\" ry=\"5\" fill=\"#fff\" opacity=\".3\"/></g>"}, {"k": "sajjada", "fr": "le tapis de prière", "ar": "السَّجَّادَة", "tr": "As-sajjâda", "ic": "<path d=\"M18 7V3M23 7V3M28 7V3M33 7V3M38 7V3M43 7V3M18 61v-4M23 61v-4M28 61v-4M33 61v-4M38 61v-4M43 61v-4\" stroke=\"#f5b942\" stroke-width=\"1.6\"/><rect x=\"14\" y=\"7\" width=\"36\" height=\"50\" rx=\"2\" fill=\"#b23a48\"/><rect x=\"18\" y=\"11\" width=\"28\" height=\"42\" fill=\"none\" stroke=\"#f5b942\" stroke-width=\"2\"/><path d=\"M24 50V27a8 8 0 0 1 16 0v23z\" fill=\"#7d1f2e\" stroke=\"#f5b942\" stroke-width=\"1.5\"/>"}, {"k": "kaaba", "fr": "la Kaaba", "ar": "الْكَعْبَة", "tr": "Al-Ka‘ba", "ic": "<path d=\"M8 24 30 17 56 22 34 30z\" fill=\"#3a3a3e\"/><path d=\"M8 24 34 30 34 58 8 51z\" fill=\"#1d1d20\"/><path d=\"M34 30 56 22 56 51 34 58z\" fill=\"#0d0d0f\"/><path d=\"M8 30 34 36 34 40 8 34z\" fill=\"#f5b942\"/><path d=\"M34 36 56 28 56 32 34 40z\" fill=\"#d9952a\"/><path d=\"M18 44l7 1.6v10L18 54z\" fill=\"#c58a12\"/>"}, {"k": "misbaha", "fr": "le chapelet", "ar": "الْمِسْبَحَة", "tr": "Al-misbaha", "ic": "<circle cx=\"48.0\" cy=\"26.0\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"46.9\" cy=\"31.8\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"43.8\" cy=\"36.8\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"39.1\" cy=\"40.3\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"33.5\" cy=\"41.9\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"27.6\" cy=\"41.4\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"22.4\" cy=\"38.8\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"18.4\" cy=\"34.4\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"16.3\" cy=\"28.9\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"16.3\" cy=\"23.1\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"18.4\" cy=\"17.6\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"22.4\" cy=\"13.2\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"27.6\" cy=\"10.6\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"33.5\" cy=\"10.1\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"39.1\" cy=\"11.7\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"43.8\" cy=\"15.2\" r=\"3.2\" fill=\"#6a4c93\"/><circle cx=\"46.9\" cy=\"20.2\" r=\"3.2\" fill=\"#6a4c93\"/><path d=\"M32 42v8\" stroke=\"#6a4c93\" stroke-width=\"2\"/><circle cx=\"32\" cy=\"50\" r=\"3.6\" fill=\"#6a4c93\"/><path d=\"M29 53h6l2 9h-10z\" fill=\"#f5b942\"/>"}];let mem=null;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function memNew(){const k=K(),n=k.lv==='s'?6:8,pick=shuffle(MEM.slice()).slice(0,n),cards=[];
 pick.forEach((m,i)=>{cards.push({p:i,t:'img'});cards.push({p:i,t:k.lv==='s'?'img':'word'})});
 mem={key:st.cur+k.lv,pick,cards:shuffle(cards),open:[],found:{},moves:0,lock:false}}
function memory(){const k=K();if(!mem||mem.key!==st.cur+k.lv)memNew();k.mem=k.mem||{};
 const face=c=>{const m=mem.pick[c.p];return c.t==='img'?`<svg viewBox="0 0 64 64">${m.ic}</svg>`:`<span class="ar" lang="ar">${m.ar}</span><small>${m.tr}</small>`};
 $('jcard').innerHTML=`<p class="mi">${k.lv==='s'?'Retourne les cartes et trouve les paires !':'Trouve chaque image avec son mot en arabe !'}</p>
 <div class="mg ${k.lv==='s'?'g3':'g4'}">${mem.cards.map((c,i)=>`<button class="mc${mem.found[c.p]?' on ok':''}" data-i="${i}" aria-label="Carte ${i+1}"><span class="mb"><svg viewBox="0 0 20 20"><use href="#st8" width="20" height="20"/></svg></span><span class="mf">${face(c)}</span></button>`).join('')}</div>
 <div class="mfound" id="mfound"></div><button class="ok mre" id="mre">Nouvelle partie</button>`;
 Object.keys(mem.found).forEach(p=>chip(mem.pick[p]));memUpd();
 document.querySelectorAll('.mc').forEach(b=>b.onclick=()=>flip(+b.dataset.i,b));
 $('mre').onclick=()=>{memNew();memory()};if(!mem.moves)say(k.lv==='s'?'mem_s':'mem_b')}
function memUpd(){const k=K(),best=k.mem[k.lv];$('jstars').textContent=`🃏 ${Object.keys(mem.found).length} / ${mem.pick.length} paires · ${mem.moves} coup${mem.moves>1?"s":""}`+(best?` · record : ${best}`:'')}
function chip(m){$('mfound').insertAdjacentHTML('beforeend',`<span class="chip"><span class="ar" lang="ar">${m.ar}</span>${m.tr} = ${m.fr}</span>`)}
function flip(i,b){const c=mem.cards[i];if(mem.lock||mem.found[c.p]||mem.open.includes(i))return;b.classList.add('on');mem.open.push(i);
 if(mem.open.length<2)return;mem.moves++;const[a,z]=mem.open,ca=mem.cards[a],cz=mem.cards[z],btn=x=>document.querySelector(`.mc[data-i="${x}"]`);
 if(ca.p===cz.p){mem.found[ca.p]=1;mem.open=[];[a,z].forEach(x=>btn(x).classList.add('ok'));const m=mem.pick[ca.p];chip(m);burst(25);say('w_'+m.k,m.fr);memUpd();
  if(Object.keys(mem.found).length===mem.pick.length){const k=K();if(!k.mem[k.lv]||mem.moves<k.mem[k.lv])k.mem[k.lv]=mem.moves;save();memUpd();
   setTimeout(()=>{let w=0;const r=setInterval(()=>{burst(50,true);if(++w>3)clearInterval(r)},400);toast(`Machâ'Allah ${k.name} ! Toutes les paires en ${mem.moves} coups !`);say('mem_win')},500)}}
 else{memUpd();mem.lock=true;setTimeout(()=>{[a,z].forEach(x=>btn(x).classList.remove('on'));mem.open=[];mem.lock=false},1000)}}

/* ---------- histoires ---------- */
function hist(){$('hlist').innerHTML=ORDER.map(v=>`<a class="hc" href="#video/${v}" style="text-decoration:none"><span class="pl">▶</span><span><strong>${V[v].t}</strong><span>Histoire chantée · Les Lanternes de Nour</span></span></a>`).join('')}
function video(key){const v=V[key];if(!v){location.hash='histoires';return}
 $('v-video').innerHTML=`<div class="vp"><button class="back" id="bk">← Retour</button><h2>${v.t}</h2>
 <div class="vf"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&playsinline=1" title="${esc(v.t)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>
 <a class="yt" href="https://youtu.be/${v.id}" target="_blank" rel="noopener">Ouvrir sur YouTube</a>
 <div class="qrb">${qrSvg(v.qr)}<p><b>Regarder sur un autre écran</b>Scanne ce QR code avec un autre téléphone ou une tablette pour ouvrir la vidéo.</p></div></div>`;
 $('bk').onclick=()=>{history.length>1?history.back():location.hash='histoires'}}


/* ---------- fiche explicative ---------- */
function guide(first){
 const st1=[['Présente-toi','Prénom, âge, garçon ou fille : les missions s\'adaptent toutes seules (3-5 ans ou 6-10 ans).'],
  ['Chaque soir du Ramadan','Touche la lanterne du jour et lis la mission avec tes parents.'],
  ['Mission réussie ?','Appuie sur « J\'ai réussi, j\'allume ! » et regarde ta lanterne briller.'],
  ['Joue et regarde','Devinettes, questions-réponses, memory et histoires des prophètes en vidéo.'],
  ['À la 30e lanterne','Une grande fête et ton diplôme de lumière à imprimer !']];
 const st2=['Vivre le Ramadan à sa hauteur : les enfants n\'ont pas besoin de jeûner pour participer, chaque bonne action compte.',
  'Prendre de bonnes habitudes : dire Bismillâh, sourire, aider, partager, pardonner.',
  'Apprendre l\'islam avec des sources vérifiées (Coran et hadiths authentiques).',
  'Découvrir des mots en arabe avec leur traduction en français.',
  'Un moment en famille chaque soir, sans écran trop long et sans rien acheter.',
  'Être fier de soi en voyant ses lanternes s\'allumer jour après jour.'];
 $('ov').innerHTML=`<div class="form gd"><div class="big gl1">${LT}</div><h2>${first?'Bienvenue !':'Comment ça marche ?'}</h2>
 <p>Allume ta lanterne, c'est le calendrier du Ramadan des enfants de 3 à 10 ans : une petite mission chaque soir, pendant tout le mois béni.</p>
 <h3>Comment ça marche</h3><ol class="steps">${st1.map(s=>`<li><b>${s[0]}</b>${s[1]}</li>`).join('')}</ol>
 <h3>Pourquoi c'est bien</h3><ul class="why">${st2.map(s=>`<li>${s}</li>`).join('')}</ul>
 <div class="tip"><b>Conseil aux parents</b>10 minutes par soir suffisent. On encourage, on ne gronde pas : une mission oubliée se fait le lendemain. Les petits ne sont jamais obligés de jeûner.</div>
 <button class="say" id="gsay">🔊 Écouter l'explication</button><button class="ok" id="gok">${first?'C\'est parti !':'J\'ai compris'}</button></div>`;
 $('ov').classList.add('on');$('ov').scrollTop=0;$('gsay').onclick=()=>say(['guide','guide2','guide3','guide4']);$('gok').onclick=()=>{close();if(first&&!st.kids.length)form(false)}}

/* ---------- profils ---------- */
function form(edit){if(edit&&!K())edit=false;   /* « Modifier » sans profil = créer le premier */
 const k=edit?K():{name:'',age:'',g:''};
 $('ov').innerHTML=`<div class="form"><h2>${edit?'Modifier':'Bienvenue !'}</h2><p>${edit?'':'Avant de commencer, présente-toi :'}</p>
 <label>Ton prénom<input id="fn" maxlength="20" value="${esc(k.name)}" placeholder="Prénom"></label>
 <label>Ton âge<select id="fa"><option value="">Choisis</option>${[3,4,5,6,7,8,9,10].map(a=>`<option ${+k.age===a?'selected':''}>${a}</option>`).join('')}</select></label>
 <label>Tu es<div class="seg"><button data-g="g" class="${k.g==='g'?'on':''}">Un garçon</button><button data-g="f" class="${k.g==='f'?'on':''}">Une fille</button></div></label>
 <label>Premier soir du Ramadan (pour les parents, facultatif)<input id="fd" type="date" value="${st.start||''}"></label>
 <button class="ok" id="go">${edit?'Enregistrer':'Commencer'}</button>${edit?'<button class="link" id="del">Supprimer cet enfant</button><button class="link" id="rz">Éteindre toutes ses lanternes</button>':''}${st.kids.length&&!edit?'<button class="link" id="cl3">Annuler</button>':''}</div>`;
 $('ov').classList.add('on');if(!edit)say('inscription');let g=k.g;
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{g=b.dataset.g;document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b))});
 $('go').onclick=()=>{const name=$('fn').value.trim(),age=+$('fa').value;if(!name||!age||!g){toast('Remplis ton prénom, ton âge et garçon ou fille');return}
  st.start=$('fd').value||st.start||'';
  if(edit){Object.assign(k,{name,age,g})}else{st.kids.push({name,age,g,lv:age<=5?'s':'b',lit:{},jeux:{}});st.cur=st.kids.length-1}
  save();close();render();if(!$('v-jeux').hidden)jeux();if(!edit){toast(`Ramadan moubârak ${name} ! Allume ta première lanterne ce soir.`);say('debut')}};
 if(edit){$('del').onclick=()=>{if(confirm('Supprimer '+k.name+' ?')){st.kids.splice(st.cur,1);st.cur=0;save();close();st.kids.length?render():form()}};
  $('rz').onclick=()=>{if(confirm('Éteindre toutes les lanternes de '+k.name+' ?')){k.lit={};save();close();render()}}}
 if($('cl3'))$('cl3').onclick=close}
const setLv=l=>{if(!K()){form(false);return}K().lv=l;save();render();if(!$('v-jeux').hidden){shown=false;jeux()}};
$('lv1').onclick=()=>setLv('s');$('lv2').onclick=()=>setLv('b');
$('star').onclick=()=>card(S);$('add').onclick=()=>form(false);$('set').onclick=()=>form(true);
$('ov').onclick=e=>{if(e.target.id==='ov')close()};
render();route();if(!st.kids.length)guide(true);
$('aide').onclick=()=>guide(false);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
