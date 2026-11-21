#!/usr/bin/env python3
"""Génère un LOT de phrases avec la voix de la narratrice (ElevenLabs, eleven_v4, stabilité 0,5 / similarité 0,75).
Utilisation : python3 outils/voix/generer-lot.py <numéro> jeu/identifiant [jeu/identifiant ...]
La clé API n'est JAMAIS dans ce script : le proxy de la session l'injecte. Sortie : outils/voix/lots/lot<N>/ + lot<N>.json (non branché dans les jeux)."""
import csv,json,subprocess,sys,os
VOIX='hddT377hAwvRoOKqMj0E'
n=sys.argv[1];demandes=sys.argv[2:]
src={}
for f,jeux in (('_documentation/VOIX_JEUX_A_REFAIRE-avec-texte-voix.csv',None),):
    for r in csv.DictReader(open(f,encoding='utf-8-sig')): src[r['jeu']+'/'+r['identifiant']]=r
os.makedirs(f'outils/voix/lots/lot{n}',exist_ok=True)
lot=[];total=0
for d in demandes:
    r=src[d];t=r['texte_pour_la_voix'];total+=len(t)
    out=f'outils/voix/lots/lot{n}/'+d.replace('/','-')+'.mp3'
    body=json.dumps({"text":t,"model_id":"eleven_v4","voice_settings":{"stability":0.5,"similarity_boost":0.75,"style":0.0,"use_speaker_boost":True,"speed":1.0}})
    code=subprocess.run(['curl','-s','--max-time','120','-o',out,'-w','%{http_code}','-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{VOIX}?output_format=mp3_44100_64','-H','Content-Type: application/json','-d',body],capture_output=True,text=True).stdout
    if code!='200':print('ERREUR',d,code,open(out,'rb').read(200));continue
    lot.append({'cle':d,'texte':r['texte'],'texte_voix':t,'fichier':out.split('lots/')[1]})
    print('OK',d,len(t),'car.')
json.dump(lot,open(f'outils/voix/lots/lot{n}.json','w'),ensure_ascii=False,indent=1)
print(len(lot),'/',len(demandes),'générés ;',total,'caractères')
