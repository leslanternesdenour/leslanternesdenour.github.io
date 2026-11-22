#!/usr/bin/env python3
"""Assemble les captures « avec / sans visage » (PNG bruts produits par captures-sans-visage.cjs) en planches JPEG comparatives. python3 outils/tests/planches-sans-visage.py [dossier]"""
import glob, os, sys
from PIL import Image, ImageDraw, ImageFont
D = sys.argv[1] if len(sys.argv) > 1 else 'docs/sans-visage'
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 17)
noms = sorted({f.rsplit('-', 1)[0] for f in map(os.path.basename, glob.glob(D + '/*-avec.png') + glob.glob(D + '/*-sans.png'))}, key=lambda s: int(s.split('-')[0]))
for n in noms:
    a = Image.open(f'{D}/{n}-avec.png').convert('RGB'); b = Image.open(f'{D}/{n}-sans.png').convert('RGB')
    if a.width >= 1000 and a.height <= 700:     # larges : l'une au-dessus de l'autre
        w = Image.new('RGB', (a.width, a.height * 2 + 80), 'white'); d = ImageDraw.Draw(w)
        d.rectangle((0, 0, w.width, 39), fill=(42, 33, 102)); d.text((12, 9), 'MODE SANS VISAGE DÉSACTIVÉ — les visages habituels', fill='white', font=F); w.paste(a, (0, 40))
        d.rectangle((0, a.height + 40, w.width, a.height + 79), fill=(245, 185, 66)); d.text((12, a.height + 49), 'MODE SANS VISAGE ACTIVÉ', fill=(42, 33, 102), font=F); w.paste(b, (0, a.height + 80))
    else:                                        # côte à côte
        w = Image.new('RGB', (a.width * 2 + 20, a.height + 40), 'white'); d = ImageDraw.Draw(w)
        d.rectangle((0, 0, a.width, 39), fill=(42, 33, 102)); d.text((12, 9), 'DÉSACTIVÉ — visages habituels', fill='white', font=F); w.paste(a, (0, 40))
        d.rectangle((a.width + 20, 0, w.width, 39), fill=(245, 185, 66)); d.text((a.width + 32, 9), 'ACTIVÉ — sans visage', fill=(42, 33, 102), font=F); w.paste(b, (a.width + 20, 40))
    w.thumbnail((1500, 1500)); w.save(f'{D}/{n}.jpg', quality=80)
for f in glob.glob(D + '/*-avec.png') + glob.glob(D + '/*-sans.png'): os.remove(f)
