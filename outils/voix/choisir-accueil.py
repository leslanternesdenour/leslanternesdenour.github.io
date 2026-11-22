#!/usr/bin/env python3
"""Choisit la prise de la voix d'accueil du portail (monde/voix/accueil-portail.mp3) parmi les 3 prises du lot 21.
Mesure la durée et la coupure entre « مَرْحَبًا » et « Bienvenue… » (ffmpeg silencedetect) et met à jour monde/voix/accueil-portail.json.
Utilisation : python3 outils/voix/choisir-accueil.py <1|2|3> [--valide]   (--valide : le client a écouté et approuvé la prononciation)"""
import json,re,shutil,subprocess,sys
n=sys.argv[1];valide='--valide' in sys.argv
src=f'outils/voix/lots/lot21/monde-accueil-portail-prise{n}.mp3'
shutil.copy(src,'monde/voix/accueil-portail.mp3')
d=float(subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True).stdout)
sil=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',src,'-af','silencedetect=noise=-38dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
debuts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',sil)];fins=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',sil)]
coupe=fins[0] if fins else 1.0                       # fin du premier silence = début de « Bienvenue »
finvoix=debuts[-1] if len(debuts)>1 else d-0.3       # début du silence final = dernière syllabe
j=json.load(open('monde/voix/accueil-portail.json'))
j.update({'prise':int(n),'duree':round(d,3),'coupe':round(coupe,2),'finVoix':round(finvoix,2),'valide':valide})
json.dump(j,open('monde/voix/accueil-portail.json','w'),ensure_ascii=False,indent=2)
print(f'prise {n} : durée {d:.2f} s, coupe {coupe:.2f} s, fin de voix {finvoix:.2f} s, validée par le client : {valide}')
