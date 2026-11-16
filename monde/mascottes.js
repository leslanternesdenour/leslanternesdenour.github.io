// Mascottes des univers, reprises telles quelles de leurs pages pour qu'on les reconnaisse dans le village.
// Nour = ablutions · Sajjadou = prière. Les autres univers auront les leurs plus tard.
function nour(m){const mouth=m==='wow'?'<ellipse cx="60" cy="106" rx="9" ry="10" fill="#7a2c3b"/><ellipse cx="60" cy="110" rx="5" ry="4" fill="#ff8fa3"/>':m==='oh'?'<ellipse cx="60" cy="106" rx="5" ry="6" fill="#7a2c3b"/>':'<path d="M47 101q13 14 26 0" fill="#7a2c3b"/><path d="M52 106q8 5 16 0" fill="#ff8fa3"/>';
 return `<svg class="nour" viewBox="0 0 120 150" role="img" aria-label="Nour"><defs><linearGradient id="ng${m||''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8be3ef"/><stop offset="1" stop-color="#1fa3c9"/></linearGradient></defs>
 <ellipse cx="60" cy="144" rx="30" ry="5" fill="#1d8f9c" opacity=".18"/><path d="M60 6C55 18 16 62 16 94a44 44 0 0 0 88 0C104 62 65 18 60 6z" fill="url(#ng${m||''})" stroke="#1784a8" stroke-width="3"/>
 <path d="M38 70c4-12 10-22 16-30" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".55" fill="none"/>
 <ellipse cx="45" cy="86" rx="8" ry="10" fill="#173a5e"/><ellipse cx="75" cy="86" rx="8" ry="10" fill="#173a5e"/><circle cx="48" cy="82" r="3" fill="#fff"/><circle cx="78" cy="82" r="3" fill="#fff"/>
 <circle cx="34" cy="100" r="6" fill="#ff9fb2" opacity=".7"/><circle cx="86" cy="100" r="6" fill="#ff9fb2" opacity=".7"/>${mouth}<path d="M84 34a10 10 0 1 0 0 14a12 12 0 0 1 0-14z" fill="#f5b942"/></svg>`}
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

export function mascotte(univers) {
  if (univers === 'ablutions') return nour('').replace('class="nour"', 'class="masc-nour"');
  if (univers === 'priere') return sajjadou('', 'accueil');
  return null;
}
