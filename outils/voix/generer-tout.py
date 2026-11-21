#!/usr/bin/env python3
"""Génère TOUTES les phrases restantes (jeux + calendrier) avec la voix de la narratrice, en lots de 20 à écouter.
La clé API n'est jamais ici (injectée par le proxy). Sortie : outils/voix/lots/lot<N>/ + lot<N>.json + lots/index.json. Rien n'est branché dans les jeux."""
import csv,json,subprocess,os,glob,time
from concurrent.futures import ThreadPoolExecutor
VOIX='hddT377hAwvRoOKqMj0E'
src={}
for r in csv.DictReader(open('_documentation/VOIX_JEUX_A_REFAIRE-avec-texte-voix.csv',encoding='utf-8-sig')): src[r['jeu']+'/'+r['identifiant']]=r
for r in csv.DictReader(open('_documentation/VOIX_CALENDRIER_A_PRODUIRE-avec-texte-voix.csv',encoding='utf-8-sig')): src['calendrier/'+r['identifiant']]=r
deja=set()
for f in glob.glob('outils/voix/lots/lot*.json'):
    for x in json.load(open(f)): deja.add(x['cle'])
reste=[k for k in src if k not in deja]
print(len(src),'phrases au total ;',len(deja),'déjà générées ;',len(reste),'à générer ;',sum(len(src[k]['texte_pour_la_voix']) for k in reste),'caractères')
def gen(args):
    n,k=args;t=src[k]['texte_pour_la_voix'];out=f'outils/voix/lots/lot{n}/'+k.replace('/','-')+'.mp3'
    body=json.dumps({"text":t,"model_id":"eleven_v4","voice_settings":{"stability":0.5,"similarity_boost":0.75,"style":0.0,"use_speaker_boost":True,"speed":1.0}})
    for essai in range(4):
        code=subprocess.run(['curl','-s','--max-time','120','-o',out+'.tmp','-w','%{http_code}','-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{VOIX}?output_format=mp3_44100_64','-H','Content-Type: application/json','-d',body],capture_output=True,text=True).stdout
        if code=='200':os.replace(out+'.tmp',out);return k,out
        if os.path.exists(out+'.tmp'):os.remove(out+'.tmp')
        if code in ('401','402'):break
        time.sleep(3*(essai+1))
    return k,None
num0=max([int(''.join(c for c in os.path.basename(f) if c.isdigit())) for f in glob.glob('outils/voix/lots/lot*.json')]+[2])+1;lots={}
for i,k in enumerate(reste):lots.setdefault(num0+i//20,[]).append(k)
for n in lots:os.makedirs(f'outils/voix/lots/lot{n}',exist_ok=True)
jobs=[(n,k) for n,ks in lots.items() for k in ks]
with ThreadPoolExecutor(4) as ex:res=dict(ex.map(gen,jobs))
echecs=[k for k,v in res.items() if not v]
for n,ks in lots.items():
    lot=[{'cle':k,'texte':src[k]['texte'],'texte_voix':src[k]['texte_pour_la_voix'],'fichier':res[k].split('lots/')[1],'a_tester':src[k].get('termes_a_tester','')} for k in ks if res[k]]
    json.dump(lot,open(f'outils/voix/lots/lot{n}.json','w'),ensure_ascii=False,indent=1)
idx=[]
for f in sorted(glob.glob('outils/voix/lots/lot*.json'),key=lambda x:int(''.join(c for c in os.path.basename(x) if c.isdigit()))):
    n=int(''.join(c for c in os.path.basename(f) if c.isdigit()));L=json.load(open(f))
    idx.append({'n':n,'nb':len(L),'jeux':sorted({x['cle'].split('/')[0] for x in L})})
json.dump(idx,open('outils/voix/lots/index.json','w'),ensure_ascii=False,indent=1)
print('générés :',len(res)-len(echecs),'/',len(res),'; échecs :',echecs)
