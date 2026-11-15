(function(){
const {M,C,S,J,V,MV,ORDER}=window.D,$=s=>document.getElementById(s);
const DIP="<svg viewBox=\"0 0 600 820\" aria-hidden=\"true\"><defs><pattern id=\"dpat\" width=\"22\" height=\"22\" patternUnits=\"userSpaceOnUse\"><rect width=\"22\" height=\"22\" fill=\"#191345\"/><use href=\"#st8\" x=\"4\" y=\"4\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"#f5b942\" stroke-width=\"1.6\" opacity=\".9\"/></pattern><radialGradient id=\"dbg\" cx=\"50%\" cy=\"30%\" r=\"75%\"><stop offset=\"0\" stop-color=\"#fffdf5\"/><stop offset=\".7\" stop-color=\"#fff6dc\"/><stop offset=\"1\" stop-color=\"#fbe7b4\"/></radialGradient><radialGradient id=\"dgl\" cx=\"50%\" cy=\"50%\" r=\"50%\"><stop offset=\"0\" stop-color=\"#ffe7a6\"/><stop offset=\"1\" stop-color=\"#ffe7a600\"/></radialGradient></defs><rect x=\"4\" y=\"4\" width=\"592\" height=\"812\" rx=\"30\" fill=\"#191345\" stroke=\"#f5b942\" stroke-width=\"4\"/><path fill-rule=\"evenodd\" fill=\"url(#dpat)\" d=\"M14 14h572v792H14zM40 40v740h520V40z\"/><rect x=\"40\" y=\"40\" width=\"520\" height=\"740\" rx=\"10\" fill=\"url(#dbg)\" stroke=\"#f5b942\" stroke-width=\"3\"/><rect x=\"52\" y=\"52\" width=\"496\" height=\"716\" rx=\"6\" fill=\"none\" stroke=\"#d9a640\" stroke-width=\"1.5\" stroke-dasharray=\"6 5\"/><circle cx=\"300\" cy=\"230\" r=\"190\" fill=\"url(#dgl)\" opacity=\".7\"/><use href=\"#st8\" x=\"18\" y=\"18\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"538\" y=\"18\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"18\" y=\"758\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"538\" y=\"758\" width=\"44\" height=\"44\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\"1\"/><use href=\"#st8\" x=\"34\" y=\"34\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"554\" y=\"34\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"34\" y=\"774\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><use href=\"#st8\" x=\"554\" y=\"774\" width=\"12\" height=\"12\" fill=\"#191345\" stroke=\"#191345\" stroke-width=\"1\"/><circle cx=\"300\" cy=\"40\" r=\"34\" fill=\"#191345\" stroke=\"#f5b942\" stroke-width=\"3\"/><path d=\"M312 20a22 22 0 1 0 0 40 18 18 0 1 1 0-40z\" fill=\"#f5b942\"/><path d=\"m318 32 2 4.5 4.8.6-3.5 3.3.9 4.8-4.2-2.4-4.2 2.4.9-4.8-3.5-3.3 4.8-.6z\" fill=\"#ffe3a3\"/><path d=\"M100 52v26\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"82.0\" y=\"74\" width=\"36.0\" height=\"46.08\"/></g><path d=\"M150 52v12\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"137.0\" y=\"60\" width=\"26.0\" height=\"33.28\"/></g><path d=\"M500 52v26\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"482.0\" y=\"74\" width=\"36.0\" height=\"46.08\"/></g><path d=\"M450 52v12\" stroke=\"#c58a12\" stroke-width=\"1.5\"/><g class=\"dl\"><use href=\"#lt\" x=\"437.0\" y=\"60\" width=\"26.0\" height=\"33.28\"/></g><path d=\"M150 143Q150 150 157 150Q150 150 150 157Q150 150 143 150Q150 150 150 143z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M455 134Q455 140 461 140Q455 140 455 146Q455 140 449 140Q455 140 455 134z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M90 324Q90 330 96 330Q90 330 90 336Q90 330 84 330Q90 330 90 324z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M515 353Q515 360 522 360Q515 360 515 367Q515 360 508 360Q515 360 515 353z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M100 555Q100 560 105 560Q100 560 100 565Q100 560 95 560Q100 560 100 555z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M505 579Q505 585 511 585Q505 585 505 591Q505 585 499 585Q505 585 505 579z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M196 104Q196 108 200 108Q196 108 196 112Q196 108 192 108Q196 108 196 104z\" fill=\"#f5b942\" opacity=\".75\"/><path d=\"M404 107Q404 112 409 112Q404 112 404 117Q404 112 399 112Q404 112 404 107z\" fill=\"#f5b942\" opacity=\".75\"/><g transform=\"translate(40 664) scale(.8667 1)\"><g fill=\"#f5b942\" opacity=\"0.32\"><rect x=\"0\" y=\"84\" width=\"600\" height=\"6\"/><rect x=\"118\" y=\"34\" width=\"14\" height=\"52\"/><path d=\"M116 34 125 10 134 34z\"/><rect x=\"113\" y=\"44\" width=\"24\" height=\"4\"/><rect x=\"468\" y=\"34\" width=\"14\" height=\"52\"/><path d=\"M466 34 475 10 484 34z\"/><rect x=\"463\" y=\"44\" width=\"24\" height=\"4\"/><rect x=\"220\" y=\"56\" width=\"160\" height=\"30\"/><path d=\"M236 58Q236 18 300 10Q364 18 364 58z\"/><rect x=\"298\" y=\"-2\" width=\"4\" height=\"14\"/><path d=\"M148 66Q148 42 180 38Q212 42 212 66z\"/><rect x=\"142\" y=\"64\" width=\"76\" height=\"22\"/><path d=\"M388 66Q388 42 420 38Q452 42 452 66z\"/><rect x=\"382\" y=\"64\" width=\"76\" height=\"22\"/><path d=\"M20 86V70Q20 60 40 56Q60 60 60 70V86z\"/><path d=\"M540 86V70Q540 60 560 56Q580 60 580 70V86z\"/></g></g></svg>",ORN="<svg viewBox=\"0 0 260 24\" class=\"orn\"><path d=\"M10 12H100M160 12H250\" stroke=\"#d9a640\" stroke-width=\"2\"/><circle cx=\"104\" cy=\"12\" r=\"3\" fill=\"#f5b942\"/><circle cx=\"156\" cy=\"12\" r=\"3\" fill=\"#f5b942\"/><use href=\"#st8\" x=\"118\" y=\"0\" width=\"24\" height=\"24\" fill=\"#f5b942\" stroke=\"#c58a12\"/></svg>",SEAL="<svg viewBox=\"0 0 120 150\" class=\"seal\"><path d=\"M38 90 24 146l20-12 12 16 6-56zM82 90l14 56-20-12-12 16-6-56z\" fill=\"#8CCFA8\" stroke=\"#3f7d5b\" stroke-width=\"2\"/><use href=\"#st8\" x=\"2\" y=\"2\" width=\"116\" height=\"116\" fill=\"#f5b942\" stroke=\"#c58a12\" stroke-width=\".6\"/><circle cx=\"60\" cy=\"60\" r=\"40\" fill=\"#ffe3a3\" stroke=\"#c58a12\" stroke-width=\"2\"/><circle cx=\"60\" cy=\"60\" r=\"34\" fill=\"none\" stroke=\"#c58a12\" stroke-dasharray=\"3 3\"/><text x=\"60\" y=\"64\" text-anchor=\"middle\" font-family=\"Poppins,system-ui\" font-weight=\"800\" font-size=\"30\" fill=\"#191345\">30</text><text x=\"60\" y=\"80\" text-anchor=\"middle\" font-family=\"Poppins,system-ui\" font-weight=\"800\" font-size=\"8.5\" letter-spacing=\"1\" fill=\"#191345\">LANTERNES</text></svg>";
const LT='<svg viewBox="0 0 100 128"><use href="#lt"/></svg>';
let st={kids:[],cur:0};try{st=JSON.parse(localStorage.getItem('lanternes2'))||st}catch(e){}
const save=()=>{try{localStorage.setItem('lanternes2',JSON.stringify(st))}catch(e){}};
const K=()=>st.kids[st.cur],F=()=>K()&&K().g==='f';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),3200)}
function speak(t){try{const s=speechSynthesis;s.cancel();const u=new SpeechSynthesisUtterance(t.replace(/[؀-ۿ]+/g,''));u.lang='fr-FR';u.rate=.9;s.speak(u)}catch(e){toast('La lecture à voix haute n\'est pas disponible ici')}}
function qrSvg(q){const[n,rows]=q;let d='';rows.forEach((h,y)=>{const b=BigInt('0x'+h).toString(2).padStart(n,'0');for(let x=0;x<n;x++)if(b[x]==='1')d+=`M${x} ${y}h1v1h-1z`});
 return `<svg viewBox="-2 -2 ${n+4} ${n+4}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect x="-2" y="-2" width="${n+4}" height="${n+4}" fill="#fff"/><path d="${d}" fill="#191345"/></svg>`}
function today(){if(!st.start)return 0;const d=Math.floor((new Date().setHours(12)-new Date(st.start+'T12:00').getTime())/864e5)+1;return d>=1&&d<=30?d:0}

/* ---------- navigation ---------- */
function route(){const h=location.hash.slice(1)||'lanternes';close();
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
function card(m){const k=K(),c=C[m[1]],on=!!k.lit[m[0]];
 const vids=(MV[m[0]]||[]).map(v=>`<a class="vb" href="#video/${v}">▶ Regarder : ${V[v].t}</a>`).join('');
 $('ov').innerHTML=`<div class="card"><div class="ch"><div class="med">${m[0]}</div><span class="tag" style="background:${c[1]}"><svg viewBox="0 0 24 24" fill="none" stroke="#191345" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${c[2]}</svg>${c[0]}</span><h2>${m[2]}</h2></div>
 <div class="cb"><h3>${k.lv==='s'?'Petite lanterne · 3-5 ans':'Grande lanterne · 6-10 ans'}</h3><p>${k.lv==='s'?m[3]:m[4]}</p>${vids}${m[5]?`<div class="src">Source : ${m[5]}</div>`:''}
 <div class="acts"><button class="ok" id="lit">${on?'Éteindre':'J\'ai réussi, j\'allume !'}</button><button class="no" id="cl">Fermer</button></div></div></div>`;
 $('ov').classList.add('on');$('cl').onclick=close;$('lit').onclick=()=>{k.lit[m[0]]=!on;save();close();render();if(!on)lit(m[0])}}
function close(){$('ov').classList.remove('on','print');$('ov').innerHTML=''}
const CHEERS=['Bravo !','Machâ\'Allah !','Ta lanterne brille !','Super, continue !','Bârak Allâhou fîk !'];
function lit(n){const k=K(),c=M.filter(m=>k.lit[m[0]]).length;burst(40);
 if(c===30)return setTimeout(fin,600);
 if(c===10)toast(`Déjà 10 lanternes allumées, ${k.name} ! Machâ'Allah !`);else if(c===20)toast(`20 lanternes ! Plus que 10, ${F()?'tu es presque arrivée':'tu es presque arrivé'} !`);else if(c===29)toast('Plus qu\'une lanterne avant ton diplôme !');
 else if(n!=='★')toast(CHEERS[c%CHEERS.length])}

/* ---------- confettis ---------- */
let parts=[],raf=0;const cv=$('fx'),cx=cv.getContext('2d');
function burst(n,big){cv.width=innerWidth;cv.height=innerHeight;for(let i=0;i<n;i++)parts.push({x:big?Math.random()*cv.width:cv.width/2,y:big?-20-Math.random()*cv.height*.6:cv.height*.45,vx:big?(Math.random()-.5)*1.5:(Math.random()-.5)*9,vy:big?2+Math.random()*3:-3-Math.random()*7,r:3+Math.random()*5,c:['#f5b942','#ffe3a3','#fff','#ffd1e1','#c7f0ff'][i%5],s:Math.random()<.5,l:big?260:90});if(!raf)loop()}
function loop(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.l-->0&&p.y<cv.height+30);parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;cx.fillStyle=p.c;if(p.s)star5(p.x,p.y,p.r*1.6);else{cx.beginPath();cx.arc(p.x,p.y,p.r,0,7);cx.fill()}});raf=parts.length?requestAnimationFrame(loop):0;if(!raf)cx.clearRect(0,0,cv.width,cv.height)}
function star5(x,y,r){cx.beginPath();for(let i=0;i<10;i++){const a=Math.PI/5*i-Math.PI/2,q=i%2?r*.45:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q)}cx.closePath();cx.fill()}

/* ---------- fin + diplôme ---------- */
function fin(){const k=K();let w=0;const rain=setInterval(()=>{burst(60,true);if(++w>5)clearInterval(rain)},500);
 $('ov').innerHTML=`<div class="form" style="text-align:center"><div class="big">${LT}</div><h2>Félicitations ${esc(k.name)} !</h2><p>Tu as allumé tes 30 lanternes pendant le Ramadan. Tu es une vraie lanterne de lumière !</p><button class="ok" id="sd">Voir mon diplôme</button></div>`;
 $('ov').classList.add('on');$('sd').onclick=dip}
function dip(){const k=K(),d=new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
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
 $('sq').onclick=()=>speak(x.q+(shown?'. Réponse : '+x.a:''));
 if(shown){$('jx').onclick=()=>{ji[jt]++;shown=false;jeux()};$('jf').onclick=()=>{if(!found){k.jeux[x.id]=true;save();burst(30);const n2=nf+1;toast(n2===all.length?`Machâ'Allah ${k.name}, tu as tout trouvé !`:CHEERS[n2%CHEERS.length])}ji[jt]++;shown=false;jeux()}}
 else{$('jr').onclick=()=>{shown=true;jeux()};$('jp').onclick=()=>{ji[jt]--;jeux()}}}

/* ---------- histoires ---------- */
function hist(){$('hlist').innerHTML=ORDER.map(v=>`<a class="hc" href="#video/${v}" style="text-decoration:none"><span class="pl">▶</span><span><strong>${V[v].t}</strong><span>Histoire chantée · Les Lanternes de Nour</span></span></a>`).join('')}
function video(key){const v=V[key];if(!v){location.hash='histoires';return}
 $('v-video').innerHTML=`<div class="vp"><button class="back" id="bk">← Retour</button><h2>${v.t}</h2>
 <div class="vf"><iframe src="https://www.youtube-nocookie.com/embed/${v.id}?rel=0&playsinline=1" title="${esc(v.t)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>
 <a class="yt" href="https://youtu.be/${v.id}" target="_blank" rel="noopener">Ouvrir sur YouTube</a>
 <div class="qrb">${qrSvg(v.qr)}<p><b>Regarder sur un autre écran</b>Scanne ce QR code avec un autre téléphone ou une tablette pour ouvrir la vidéo.</p></div></div>`;
 $('bk').onclick=()=>{history.length>1?history.back():location.hash='histoires'}}

/* ---------- profils ---------- */
function form(edit){const k=edit?K():{name:'',age:'',g:''};
 $('ov').innerHTML=`<div class="form"><h2>${edit?'Modifier':'Bienvenue !'}</h2><p>${edit?'':'Avant de commencer, présente-toi :'}</p>
 <label>Ton prénom<input id="fn" maxlength="20" value="${esc(k.name)}" placeholder="Prénom"></label>
 <label>Ton âge<select id="fa"><option value="">Choisis</option>${[3,4,5,6,7,8,9,10].map(a=>`<option ${+k.age===a?'selected':''}>${a}</option>`).join('')}</select></label>
 <label>Tu es<div class="seg"><button data-g="g" class="${k.g==='g'?'on':''}">Un garçon</button><button data-g="f" class="${k.g==='f'?'on':''}">Une fille</button></div></label>
 <label>Premier soir du Ramadan (pour les parents, facultatif)<input id="fd" type="date" value="${st.start||''}"></label>
 <button class="ok" id="go">${edit?'Enregistrer':'Commencer'}</button>${edit?'<button class="link" id="del">Supprimer cet enfant</button><button class="link" id="rz">Éteindre toutes ses lanternes</button>':''}${st.kids.length&&!edit?'<button class="link" id="cl3">Annuler</button>':''}</div>`;
 $('ov').classList.add('on');let g=k.g;
 document.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{g=b.dataset.g;document.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x===b))});
 $('go').onclick=()=>{const name=$('fn').value.trim(),age=+$('fa').value;if(!name||!age||!g){toast('Remplis ton prénom, ton âge et garçon ou fille');return}
  st.start=$('fd').value||st.start||'';
  if(edit){Object.assign(k,{name,age,g})}else{st.kids.push({name,age,g,lv:age<=5?'s':'b',lit:{},jeux:{}});st.cur=st.kids.length-1}
  save();close();render();if(!$('v-jeux').hidden)jeux();if(!edit)toast(`Ramadan moubârak ${name} ! Allume ta première lanterne ce soir.`)};
 if(edit){$('del').onclick=()=>{if(confirm('Supprimer '+k.name+' ?')){st.kids.splice(st.cur,1);st.cur=0;save();close();st.kids.length?render():form()}};
  $('rz').onclick=()=>{if(confirm('Éteindre toutes les lanternes de '+k.name+' ?')){k.lit={};save();close();render()}}}
 if($('cl3'))$('cl3').onclick=close}
const setLv=l=>{K().lv=l;save();render();if(!$('v-jeux').hidden){shown=false;jeux()}};
$('lv1').onclick=()=>setLv('s');$('lv2').onclick=()=>setLv('b');
$('star').onclick=()=>card(S);$('add').onclick=()=>form(false);$('set').onclick=()=>form(true);
$('ov').onclick=e=>{if(e.target.id==='ov')close()};
render();route();if(!st.kids.length)form(false);
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
