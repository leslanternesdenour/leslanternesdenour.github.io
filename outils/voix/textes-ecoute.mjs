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
// Phrases construites dans le code des jeux (recopiées de ablutions/index.html, ablutions/jeu3d/jeu.js, priere/app.js, priere/jeu3d/jeu.js).
Object.assign(a,{
 home:"Assalâmou ‘alaykoum ! Je suis Nour. Tu viens avec moi apprendre les ablutions ?",
 done:"Machâ'Allah ! Tu connais maintenant les ablutions. Après les ablutions, on dit l'attestation de foi. Demande à tes parents de la répéter avec toi.",
 why:"Pourquoi on fait les ablutions ? Parce qu'Allah nous le demande avant la prière. Sans ablutions, la prière n'est pas acceptée. Et l'eau emporte les petites fautes. Laver trois fois, c'est la sunna, mais une fois bien lavé, c'est déjà valable. La tête, on la passe une seule fois.",
 games:'Choisis un jeu !',
 r3:'Parfait ! Tu as toutes les étoiles !',r2:'Très bien ! Encore un petit effort pour la 3e étoile.',r1:"Bravo d'avoir essayé ! On rejoue ?",
 g1i:'Touche les cartes dans le bon ordre, de la première à la neuvième étape !',
 g1ok:"Bravo ! (ou : Oui ! / C'est ça ! / Super !) Et maintenant, l'étape N ?",
 g2ok3:"Bravo ! 3 fois, c'est la sunna. Mais une fois bien lavé, c'est déjà valable !",g2ko3:"Presque ! 3 fois, c'est la sunna. Mais une fois bien lavé, c'est déjà valable !",
 g2okt:'Bravo ! La tête, on passe les mains mouillées une seule fois.',g2kot:'Presque ! La tête, on passe les mains mouillées une seule fois.',
 g2oke:'Bravo ! Les oreilles, on les essuie une seule fois, avec la tête.',g2koe:'Presque ! Les oreilles, on les essuie une seule fois, avec la tête.',
 q3_start:'Par quoi commence-t-on à laver ?',
 g3ok:'Oui, bravo !',
 g4i:"Regarde bien les ablutions de ce petit. Qu'est-ce qui ne va pas ?",
 g4ok:'Bien vu, détective !',
 g4ko_nez:'La bonne réponse : Il a oublié le nez.',g4ko_bras:'La bonne réponse : Il a commencé par le bras gauche.',g4ko_pieds:'La bonne réponse : Il a oublié les pieds.',
 g4ko_ordre:'La bonne réponse : Il a lavé les pieds avant la tête.',g4ko_oreilles:'La bonne réponse : Il a oublié les oreilles.',g4ko_juste:'La bonne réponse : Tout est juste.',g4ko_visage:'La bonne réponse : Il a lavé le visage avant les mains.',
 j3_fin0:"Bravo ! Tu as trouvé toi-même l'ordre des ablutions, sans aucun indice !",j3_fin:"Bravo ! Tu as fait toutes les étapes des ablutions, dans l'ordre.",
});
const LQ={mains:'les mains',bouche:'la bouche',nez:'le nez',visage:'le visage',bras:'les bras',tete:'la tête et les oreilles'};
for(const [k,l] of Object.entries(LQ))a['q3_'+k]=`Quelle partie lave-t-on après ${l} ?`;
for(const [k,l] of Object.entries({mains:'les mains',bouche:'la bouche',nez:'le nez',visage:'le visage',bras:'les bras',tete:'la tête',pieds:'les pieds'}))a['g3ko_'+k]=`Non, c'est ${l} !`;
const N3={qiyam:'Qiyâm (debout)',roukou:'Roukoû‘ (penché)',soujoud:'Soujoûd (prosterné)','jouloûs':'Jouloûs (assis)'};
for(const [k,l] of Object.entries(N3)){p['g3ok_'+k]=`Bravo ! C'est le ${l} !`;p['g3ko_'+k]=`Presque ! C'est le ${l}.`;}
Object.assign(p,{
 rep:'À toi ! Répète.',slow:'Encore une fois, plus lentement.',sens:'Ça veut dire :',learn_ok:'Bravo ! Tu peux réécouter autant de fois que tu veux.',
 home:'Assalâmou ‘alaykoum ! Après les ablutions, on apprend la prière. Tu viens avec moi ?',
 done:"Machâ'Allah ! Tu connais toutes les étapes de la prière ! Maintenant, on joue ?",
 games:'Choisis un jeu ! Gagne les 9 étoiles !',
 r3:'Parfait ! Tu as toutes les étoiles !',r2:'Très bien ! Encore un petit effort pour la 3e étoile.',r1:"Bravo d'avoir essayé ! On rejoue ?",
 g1i:'Touche les positions dans le bon ordre !',g1ok:"Bravo ! (ou : Oui ! / C'est ça ! / Super !) Et ensuite ?",
 g3i:"Comment s'appelle cette position ?",g3q:'Et celle-ci ?',
 g4i:'Pour chaque position, choisis la bonne parole !',g4q:'Et maintenant ?',g4ok:'Bravo ! (puis la formule en transcription : « Ici, on dit : … »)',g4ko:'Presque ! (puis la formule en transcription : « Ici, on dit : … »)',
 dip:'Félicitations ! Tu connais les étapes de ta prière. Voici ton diplôme !',
 dip_no:'Pour avoir ton diplôme, allume les 4 lanternes : apprends les étapes, puis gagne au moins une étoile dans chaque jeu !',
 j3_h7:'Pour la deuxième rak‘a, on se relève et on récite…',j3_h13:'Après la deuxième rak‘a, on reste assis pour le tachahhoud…',j3_h14:'Pour finir, on tourne la tête à droite, puis à gauche…',
 j3_fin:'Bravo ! Tu as fait une prière de 2 rak‘at dans le bon ordre.',
});
const variable={ablutions:['g1ok'],priere:['g1ok','g4ok','g4ko']};
// ---- Calendrier Ramadan : textes dérivés de calendrier/data.js et calendrier/app.js (anciennes voix uniquement, aucune nouvelle voix n'existe) ----
globalThis.window={};await import('../../calendrier/data.js');
const D=window.D, c={}, incertain=[];
for(const m of D.M){c['ms'+m[0]]=m[2]+'. '+m[3];c['mb'+m[0]]=m[2]+'. '+m[4];}
const S=D.S;c.msstar=S[2]+'. '+S[3];c.mbstar=S[2]+'. '+S[4];
['Bravo !',"Machâ'Allah !",'Ta lanterne brille !','Super, continue !','Bârak Allâhou fîk !'].forEach((t,i)=>c['cheer'+i]=t);
Object.assign(c,{
 l10:"Déjà 10 lanternes allumées, … ! Machâ'Allah !",l20:'20 lanternes ! Plus que 10, tu es presque arrivé(e) !',l29:"Plus qu'une lanterne avant ton diplôme !",
 fin:"Félicitations … ! Tu as allumé tes 30 lanternes pendant le Ramadan. Tu es une vraie lanterne de lumière !",
 debut:"Ramadan moubârak … ! Allume ta première lanterne ce soir.",
 guide:"Allume ta lanterne, c'est le calendrier du Ramadan des enfants de 3 à 10 ans : une petite mission chaque soir, pendant tout le mois béni.",
 guide2:"Comment ça marche : Présente-toi. Prénom, âge, garçon ou fille : les missions s'adaptent toutes seules (3-5 ans ou 6-10 ans). Chaque soir du Ramadan : touche la lanterne du jour et lis la mission avec tes parents. Mission réussie ? Appuie sur « J'ai réussi, j'allume ! » et regarde ta lanterne briller. Joue et regarde : devinettes, questions-réponses, memory et histoires des prophètes en vidéo. À la 30e lanterne : une grande fête et ton diplôme de lumière à imprimer !",
 guide3:"Pourquoi c'est bien : vivre le Ramadan à sa hauteur, les enfants n'ont pas besoin de jeûner pour participer, chaque bonne action compte. Prendre de bonnes habitudes : dire Bismillâh, sourire, aider, partager, pardonner. Apprendre l'islam avec des sources vérifiées (Coran et hadiths authentiques). Découvrir des mots en arabe avec leur traduction en français. Un moment en famille chaque soir, sans écran trop long et sans rien acheter. Être fier de soi en voyant ses lanternes s'allumer jour après jour.",
 guide4:"Conseil aux parents : 10 minutes par soir suffisent. On encourage, on ne gronde pas : une mission oubliée se fait le lendemain. Les petits ne sont jamais obligés de jeûner.",
});
incertain.push('l10','l20','l29','fin','debut','guide','guide2','guide3','guide4');
const jeux={dp:D.J.dev.s,dg:D.J.dev.b,qp:D.J.qr.s,qg:D.J.qr.b};
for(const [pre,L] of Object.entries(jeux))L.forEach((x,i)=>{c[pre+i+'q']=x.q;c[pre+i+'a']=x.a;});
for(const w of ['fanous','hilal','masjid','quran','tamr','sajjada','kaaba','misbaha']){}
const MEMW=await import('node:fs').then(f=>f.readFileSync(new URL('../../calendrier/app.js',import.meta.url),'utf8').match(/const MEM=(\[.*?\]);/s));
if(MEMW){try{for(const m of JSON.parse(MEMW[1]))c['w_'+m.k]=m.fr+' ('+m.tr+')';}catch(e){}}
Object.keys(c).filter(k=>k.startsWith('w_')).forEach(k=>incertain.push(k));
const calendrier=c;
writeFileSync(new URL('./textes-ecoute.json',import.meta.url),JSON.stringify({ablutions:a,priere:p,calendrier,incertain,variable},null,1));
console.log('ablutions',Object.keys(a).length,'priere',Object.keys(p).length);
