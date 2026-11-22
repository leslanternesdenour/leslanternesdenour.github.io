#!/usr/bin/env python3
"""Assemble les cadres de planches-personnages.cjs en planches JPEG commentées. python3 outils/tests/planches-personnages.py [dossier-cadres] [dossier-sortie]"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
IN = sys.argv[1] if len(sys.argv) > 1 else '/tmp/ldn-planches'; OUT = sys.argv[2] if len(sys.argv) > 2 else 'docs/personnages-ameliores'; os.makedirs(OUT, exist_ok=True)
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15); FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 19)
NOM = {'garcon': 'GARÇON', 'fille': 'FILLE'}
def img(n): return Image.open(f'{IN}/{n}.png').convert('RGB')
def planche(titre, lignes, lw=130):
    """lignes : liste de (étiquette, [images]) ; en-tête = titre"""
    w = max(len(l[1]) for l in lignes) * lignes[0][1][0].width + lw; h = sum(l[1][0].height for l in lignes) + 44
    P = Image.new('RGB', (w, h), 'white'); d = ImageDraw.Draw(P); d.rectangle((0, 0, w, 40), fill=(42, 33, 102)); d.text((12, 9), titre, fill='white', font=FT)
    y = 44
    for et, ims in lignes:
        d.text((8, y + ims[0].height // 2 - 8), et, fill=(42, 33, 102), font=F)
        for i, im in enumerate(ims): P.paste(im, (lw + i * im.width, y))
        y += ims[0].height
    return P
def sauve(P, nom, maxw=1600):
    P.thumbnail((maxw, 3000)); P.save(f'{OUT}/{nom}.jpg', quality=82)
# 1. avant / après : vues de face, de trois quarts, de profil et de dos
L = []
for g in ('garcon', 'fille'):
    for v in ('avant', 'apres'):
        L.append((f'{NOM[g]}\n{"AVANT" if v == "avant" else "APRÈS"}', [img(f'vue-{g}-{v}-{k}') for k in ('face', 'trois', 'profil', 'dos')]))
sauve(planche('1 · Avant / après : face · trois quarts · profil · dos (mêmes proportions, mêmes vêtements)', L), '1-avant-apres-vues')
# 2. visages avant / après
sauve(planche('2 · Visages : avant | après (yeux un peu plus grands et plus vivants, sourcils doux et arqués, sourire et joues conservés)',
              [(NOM['garcon'], [img('visage-garcon-avant'), img('visage-garcon-apres')]), (NOM['fille'], [img('visage-fille-avant'), img('visage-fille-apres')])]), '2-visages-avant-apres')
# 3. expressions
EX = [('neutre', 'Neutre'), ('joie', 'Joie'), ('surprise', 'Surprise'), ('curiosite', 'Curiosité'), ('tristesse', 'Tristesse'), ('malice', 'Malice (clin d\'œil)')]
P = planche('3 · Expressions : joie · surprise · curiosité · tristesse (+ neutre et malice)', [(NOM[g], [img(f'expr-{g}-{e}') for e, _ in EX]) for g in ('garcon', 'fille')], lw=90)
d = ImageDraw.Draw(P)
for i, (_, n) in enumerate(EX): d.text((90 + i * 300 + 8, 46), n, fill=(42, 33, 102), font=F)
sauve(P, '3-expressions')
# 4. gestes
LB = {'accueil': 'Signe de la main\n(accueil)', 'reussite': 'Réussite', 'recompense': 'Récompense', 'surprise': 'Surprise', 'curiosite': 'Curiosité', 'tristesse': 'Tristesse', 'maladroit': 'Maladroit\n(il trébuche, en rit)', 'encourager': 'Encourage\n(elle applaudit)', 'dialogue': 'Dialogue\n(tête inclinée)'}
G = {'garcon': ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'maladroit', 'dialogue'], 'fille': ['accueil', 'reussite', 'recompense', 'surprise', 'curiosite', 'tristesse', 'encourager', 'dialogue']}
for g, gs in G.items():
    for part, sub in (('a', gs[:4]), ('b', gs[4:])):
        sauve(planche(f'4{part} · Animations du {"garçon" if g == "garcon" else "de la fille"} (images successives, de gauche à droite)', [(LB[x], [img(f'geste-{g}-{x}-{i}') for i in range(5)]) for x in sub], lw=150), f'4{part}-animations-{g}')
# 5. clignement et clin d'œil
sauve(planche('5 · Clignement naturel (de l\'œil ouvert à l\'œil fermé) et clin d\'œil', [(NOM[g], [img(f'clin-{g}-{i}') for i in range(5)] + [img(f'clin-{g}-oeil')]) for g in ('garcon', 'fille')], lw=90), '5-clignement-et-clin-d-oeil')
# 6. détails d'identité
sauve(planche('6 · Identité : sacoche du garçon (petite lanterne dorée qui se balance) · finition du voile de la fille (perles dorées discrètes)',
              [('Sacoche\navant | après', [img('sac-avant'), img('sac-apres')]), ('Voile\navant | après', [img('visage-fille-avant'), img('visage-fille-apres')])], lw=110), '6-identite-sacoche-et-voile')
# 7. compatibilité avec le mode sans visage
L = []
for g in ('garcon', 'fille'):
    L.append((f'{NOM[g]}\nexpressions', [img(f'exprsv-{g}-{e}') for e, _ in EX]))
sauve(planche('7 · Mode sans visage ACTIVÉ : les expressions ne se voient pas (têtes, cheveux, voile conservés)', L, lw=100), '7a-mode-sans-visage-expressions')
sauve(planche('7 · Mode sans visage ACTIVÉ : les animations du corps restent visibles', [(f'{NOM[g]}\n{LB[x].split(chr(10))[0]}', [img(f'gestesv-{g}-{x}-{i}') for i in range(5)]) for g, x in (('garcon', 'accueil'), ('garcon', 'maladroit'), ('fille', 'accueil'), ('fille', 'encourager'))], lw=130), '7b-mode-sans-visage-animations')
print('planches écrites dans', OUT)
