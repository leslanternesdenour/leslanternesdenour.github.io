#!/usr/bin/env python3
"""Branche les voix VALIDÉES par le client (21-22/11/2026) dans ablutions/voix/voix.json, priere/voix/voix.json, calendrier/voix/voix.json.
 - clé refaite avec la voix de la narratrice  -> audio/narratrice/<jeu>/<clé>.mp3 (copié depuis outils/voix/lots)
 - clé jugée valide dans l'ancien catalogue   -> clip audio/fr/... (voix-catalogue.json), validé à l'oreille
 - toute autre clé                            -> ENTRÉE ANCIENNE CONSERVÉE (aucune perte)
Produit docs/voix-narratrice-manifeste.json (liste exacte de ce qui est validé : le test s'y réfère)."""
import csv,json,glob,os,re,shutil,subprocess,unicodedata
VAR={'ablutions/s1':'ablutions/s1-variante-A','calendrier/qg1a':'calendrier/qg1a-variante-B','calendrier/w_kaaba':'calendrier/w_kaaba-variante-A'}  # choix du client
slug=lambda s:unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode()
dur=lambda p:round(float(subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',p],capture_output=True,text=True).stdout),3)
lots={}
for f in glob.glob('outils/voix/lots/lot*.json'):
    for x in json.load(open(f)): lots[x['cle']]='outils/voix/lots/'+x['fichier']
refaire={r['jeu']+'/'+r['identifiant'] for r in csv.DictReader(open('_documentation/VOIX_JEUX_A_REFAIRE.csv',encoding='utf-8-sig'))}
manifeste={};rapport={}
for jeu in ('ablutions','priere','calendrier'):
    vj=f'{jeu}/voix/voix.json';ancien=json.load(open(vj))
    if not os.path.exists(f'{jeu}/voix/voix-ancienne.json'):shutil.copy(vj,f'{jeu}/voix/voix-ancienne.json')   # sauvegarde (jamais supprimée)
    cat=json.load(open(f'{jeu}/voix/voix-catalogue.json')) if os.path.exists(f'{jeu}/voix/voix-catalogue.json') else {}
    new={};n_nv=n_cat=n_anc=0;os.makedirs(f'audio/narratrice/{jeu}',exist_ok=True)
    for k,v in ancien.items():
        cle=f'{jeu}/{k}';src=lots.get(VAR.get(cle,cle))
        if src and (jeu=='calendrier' or cle in refaire):                       # clip neuf validé
            dest=f'audio/narratrice/{jeu}/{slug(k)}.mp3';shutil.copy(src,dest)
            new[k]=[f'../../{dest}',0,dur(dest)];n_nv+=1;manifeste[cle]={'source':'narratrice','fichier':dest,'valide':True}
        elif jeu!='calendrier' and k in cat and cle not in refaire:               # ancien catalogue validé à l'oreille
            c=cat[k];new[k]=[c[0],c[1],c[2]];n_cat+=1;manifeste[cle]={'source':'catalogue','fichier':os.path.normpath(os.path.join(jeu,'voix',c[0])),'valide':True}
        else: new[k]=v;n_anc+=1;manifeste[cle]={'source':'ancienne','fichier':os.path.normpath(os.path.join(jeu,'voix',v[0])),'valide':False}
    json.dump(new,open(vj,'w'),ensure_ascii=False,indent=1)
    rapport[jeu]={'clés':len(ancien),'narratrice':n_nv,'catalogue validé':n_cat,'ancienne conservée':n_anc}
json.dump(manifeste,open('docs/voix-narratrice-manifeste.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(rapport,ensure_ascii=False,indent=1))
