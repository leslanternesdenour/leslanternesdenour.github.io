const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs=require('fs');
const OUT=process.env.SORTIE || 'docs/sans-visage/';   // PNG bruts : à assembler avec outils/tests/planches-sans-visage.py
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const BASE=process.argv[2] || 'http://localhost:8797';
async function ctx(w,h,mobile,sv){const c=await b.newContext(mobile?{viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:2,locale:'fr-FR'}:{viewport:{width:w,height:h},deviceScaleFactor:1,locale:'fr-FR'});
 await c.route(/cdn\.jsdelivr\.net\/npm\/three@[^/]+\/(.*)/, r=>{const f='/home/user/node_modules/three/'+r.request().url().match(/three@[^/]+\/(.*)/)[1]; fs.existsSync(f)?r.fulfill({path:f,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}}):r.abort();});
 await c.route(/fonts\.|ytimg|googleusercontent/,r=>r.abort());
 await c.addInitScript(([sv])=>{try{localStorage.setItem('ldn_sans_visage',sv);localStorage.setItem('lanternes_intro',JSON.stringify({off:1}));sessionStorage.setItem('ldn_portail','*');}catch(e){}},[sv]);return c;}
async function shot(nom,url,w,h,mobile,sv,attente=2500,extra){const c=await ctx(w,h,mobile,sv);const p=await c.newPage();await p.goto(BASE+url);if(url.includes('sans-visage.html'))await p.waitForFunction(()=>window.__pret,null,{timeout:40000});await p.waitForTimeout(attente);if(extra)await extra(p);await p.screenshot({path:OUT+nom+'-'+(sv==='1'?'sans':'avec')+'.png'});await c.close();}
for(const sv of ['0','1']){
 await shot('1-enfants-3D-face','/outils/personnages/sans-visage.html?groupe=humains&vue=face',1400,520,false,sv,2500);
 await shot('2-enfants-3D-profil','/outils/personnages/sans-visage.html?groupe=humains&vue=profil',1400,520,false,sv,2500);
 await shot('3-enfants-3D-dos','/outils/personnages/sans-visage.html?groupe=humains&vue=dos',1400,520,false,sv,2500);
 await shot('4-montures-3D','/outils/personnages/sans-visage.html?groupe=montures&vue=trois',1400,560,false,sv,2500);
 await shot('5-animaux-gazelle-fennec','/outils/personnages/sans-visage.html?groupe=animaux&vue=trois&cx=-5.4&cy=0.85&cz=3.2',1000,520,false,sv,2500);
 await shot('6-GLB-N1-fille','/outils/personnages/sans-visage.html?groupe=glb&vue=face&cx=-0.8&cy=1.28&cz=1.1',900,520,false,sv,3500);
 await shot('7-GLB-N1-garcon','/outils/personnages/sans-visage.html?groupe=glb&vue=face&cx=0.8&cy=1.28&cz=1.1',900,520,false,sv,3500);
 await shot('8-accueil-banniere-ordinateur','/',1280,640,false,sv,1500);
 await shot('9-accueil-banniere-telephone','/',390,800,true,sv,1500);
 await shot('10-ablutions-Nour','/ablutions/',900,640,false,sv,1500);
 await shot('11-priere-Sajjadou','/priere/',900,640,false,sv,1500);
 await shot('12-ablutions-3D-choix','/ablutions/jeu3d/',900,640,false,sv,6000);
 await shot('13-grand-voyage-mon-personnage','/voyage/',1000,640,false,sv,6000);
 await shot('14-village-choix-personnage','/monde/',900,700,false,sv,2500,async p=>{await p.evaluate(()=>{const a=document.getElementById('accueil');if(a)a.scrollIntoView();});});
}
await shot('15-reglages-famille-telephone','/compte/',390,860,true,'1',1500);
await shot('16-reglages-famille-ordinateur','/compte/',1000,860,false,'1',1500);
await b.close();})();
