#!/usr/bin/env python3
"""Candidats de prononciation du mot arabe de l'accueil du portail (lot 22). NE CHOISIT RIEN : le client écoute et tranche.
Le mot arabe est généré SEUL en mode arabe (language_code=ar) pour ne pas être lu avec un accent français, puis assemblé avec la phrase
française déjà générée (prise 1, lot 21, non contestée) : arabe + pause de 0,35 s + « Bienvenue dans le Monde de Nour ! ».
Clé API : jamais ici (injectée par le proxy de la session)."""
import json,os,subprocess,sys
VOIX='hddT377hAwvRoOKqMj0E'
CANDIDATS=[('A','eleven_v4','مَرْحَبًا','tanwin'),('B','eleven_v4','مَرْحَبَا','fatha finale'),('C','eleven_v3','مَرْحَبًا','tanwin'),('D','eleven_v3','مَرْحَبَا','fatha finale'),
 ('E','eleven_multilingual_v2','مَرْحَبًا','tanwin'),('F','eleven_multilingual_v2','مَرْحَبَا','fatha finale'),('G','eleven_v4','مرحبا','sans voyelles'),('H','eleven_v3','مرحبا','sans voyelles')]
os.makedirs('outils/voix/lots/lot22/ar',exist_ok=True);lot=[];tot=0
# phrase française : extraite de la prise 1 (à partir de « Bienvenue »)
subprocess.run(['ffmpeg','-y','-loglevel','error','-ss','1.08','-i','outils/voix/lots/lot21/monde-accueil-portail-prise1.mp3','-af','loudnorm=I=-19:TP=-2:LRA=7','-ar','44100','-ac','1','/tmp/fr-bienvenue.wav'],check=True)
for k,modele,texte,desc in CANDIDATS:
    ar=f'outils/voix/lots/lot22/ar/{k}.mp3';tot+=len(texte)
    corps={"text":texte,"model_id":modele,"language_code":"ar","voice_settings":{"stability":0.5,"similarity_boost":0.75}}
    c=subprocess.run(['curl','-s','--max-time','120','-o',ar+'.tmp','-w','%{http_code}','-X','POST',f'https://api.elevenlabs.io/v1/text-to-speech/{VOIX}?output_format=mp3_44100_128','-H','Content-Type: application/json','-d',json.dumps(corps)],capture_output=True,text=True).stdout
    if c!='200': print('ERREUR',k,modele,c,open(ar+'.tmp','rb').read(160));continue
    os.replace(ar+'.tmp',ar)
    out=f'outils/voix/lots/lot22/accueil-{k}.mp3'
    # arabe (normalisé) + 0,35 s de pause + français (normalisé)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-i',ar,'-f','lavfi','-t','0.35','-i','anullsrc=r=44100:cl=mono','-i','/tmp/fr-bienvenue.wav','-filter_complex',
      '[0:a]silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=1:stop_threshold=-45dB:stop_duration=0.15,loudnorm=I=-19:TP=-2:LRA=7,aresample=44100,aformat=channel_layouts=mono[a];[1:a]aformat=channel_layouts=mono[p];[2:a]aformat=channel_layouts=mono[f];[a][p][f]concat=n=3:v=0:a=1[o]','-map','[o]','-ar','44100','-ac','1','-b:a','64k',out],check=True)
    d=float(subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',ar],capture_output=True,text=True).stdout)
    lot.append({'cle':f'monde/accueil-portail-candidat-{k}','texte':'مَرْحَبًا ! Bienvenue dans le Monde de Nour !','texte_voix':f'Mot arabe seul « {texte} » ({desc}), modèle {modele}, langue arabe — puis français : « Bienvenue dans le Monde de Nour ! »','fichier':f'lot22/accueil-{k}.mp3','a_tester':'مَرْحَبًا : écoute la prononciation du mot arabe (ح, ر, voyelles) ; le français est celui de la prise 1'})
    print('OK',k,modele,texte,f'arabe {d:.2f}s')
json.dump(lot,open('outils/voix/lots/lot22.json','w'),ensure_ascii=False,indent=1)
idx=[x for x in json.load(open('outils/voix/lots/index.json')) if x['n']!=22]+[{'n':22,'nb':len(lot),'jeux':['monde']}]
json.dump(sorted(idx,key=lambda x:x['n']),open('outils/voix/lots/index.json','w'),ensure_ascii=False,indent=1)
print(len(lot),'candidats ;',tot,'caractères')
