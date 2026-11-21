// Génère outils/voix/textes-ecoute.json : le texte attendu de chaque clé de voix, DÉRIVÉ des sources du jeu (pas deviné).
// Les clés dont le texte est construit dynamiquement dans le jeu n'ont pas de texte ici (la page l'indique) : on les écoute avec l'ancienne voix pour comparer.
import { ST as AS, HINT as AH } from '../../ablutions/jeu3d/etapes.js';
import { ST as PS, DH, H1 } from '../../priere/jeu3d/contenu.js';
import { writeFileSync } from 'node:fs';
const LBL={mains:'les mains',bouche:'la bouche',nez:'le nez',visage:'le visage',bras:'les bras',tete:'la tête',oreilles:'les oreilles',pieds:'les pieds'};
const a={}, p={};
AS.forEach((s,i)=>{a['s'+i]=s.t+'. '+s.txt; a['t'+i]=s.tip; if(AH[i]!==undefined)a['h'+i]=AH[i];});
for(const [k,l] of Object.entries(LBL)){let q=`Combien de fois on lave ${l} ? Un, deux, ou trois ?`.replace('on lave la tête','on passe les mains sur la tête').replace('on lave les oreilles','on essuie les oreilles');a['q2_'+k]=q;}
PS.forEach(s=>{p['e_'+s.k]=s.t+'. '+s.x;});
for(const [k,d] of Object.entries(DH)){p['d_'+k]=d.tr;p['f_'+k]=d.fr;}
H1.forEach((h,i)=>{p['h1_'+i]=h;});
writeFileSync(new URL('./textes-ecoute.json',import.meta.url),JSON.stringify({ablutions:a,priere:p},null,1));
console.log('ablutions',Object.keys(a).length,'priere',Object.keys(p).length);
