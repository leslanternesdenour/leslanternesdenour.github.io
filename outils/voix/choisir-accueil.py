#!/usr/bin/env python3
"""Met EN SERVICE la voix d'accueil du portail (monde/voix/accueil-portail.mp3 + .json). À ne lancer qu'APRÈS validation du client.
Utilisation :
  python3 outils/voix/choisir-accueil.py 22 <A..H> --valide    candidat du lot 22 (mot arabe seul en mode arabe + français) — voir /outils/voix/lot?n=22
  python3 outils/voix/choisir-accueil.py <1|2|3> --valide      prise du lot 21 (1 = prise REJETÉE par le client le 22/11/2026)
  python3 outils/voix/choisir-accueil.py --aucune              retire la voix (le portail se déroule en silence)
Sans --valide, le fichier n'est PAS mis en service (garde-fou : jamais de voix non validée sur le site)."""
import json,re,shutil,subprocess,sys,os
a=[x for x in sys.argv[1:] if not x.startswith('--')];valide='--valide' in sys.argv
J='monde/voix/accueil-portail.json';MP3='monde/voix/accueil-portail.mp3'
j=json.load(open(J))
if '--aucune' in sys.argv:
    if os.path.exists(MP3): os.remove(MP3)
    j.update({'fichier':None,'valide':False});json.dump(j,open(J,'w'),ensure_ascii=False,indent=2);print('voix retirée : portail silencieux');sys.exit(0)
if not valide: sys.exit("Refusé : ajouter --valide une fois la prononciation validée par le client (aucune voix non validée n'est mise en service).")
if len(a)==2 and a[0]=='22': src=f'outils/voix/lots/lot22/accueil-{a[1].upper()}.mp3';desc=f'lot 22, candidat {a[1].upper()}'
else: src=f'outils/voix/lots/lot21/monde-accueil-portail-prise{a[0]}.mp3';desc=f'lot 21, prise {a[0]}'
shutil.copy(src,MP3)
d=float(subprocess.run(['ffprobe','-v','quiet','-show_entries','format=duration','-of','csv=p=0',src],capture_output=True,text=True).stdout)
sil=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',src,'-af','silencedetect=noise=-38dB:d=0.2','-f','null','-'],capture_output=True,text=True).stderr
debuts=[float(x) for x in re.findall(r'silence_start: ([\d.]+)',sil)];fins=[float(x) for x in re.findall(r'silence_end: ([\d.]+)',sil)]
coupe=fins[0] if fins else 1.0                       # fin du premier silence = début de « Bienvenue »
finvoix=debuts[-1] if len(debuts)>1 else d-0.3       # début du silence final = dernière syllabe
j.update({'fichier':'accueil-portail.mp3','duree':round(d,3),'coupe':round(coupe,2),'finVoix':round(finvoix,2),'valide':True,'source':desc})
j.pop('prise',None);json.dump(j,open(J,'w'),ensure_ascii=False,indent=2)
print(f'EN SERVICE ({desc}) : durée {d:.2f} s, coupe {coupe:.2f} s, fin de voix {finvoix:.2f} s')
