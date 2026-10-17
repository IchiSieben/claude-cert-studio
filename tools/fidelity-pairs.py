# Joins the mockup capture and the app capture side by side, each half labelled at the top.
#   python tools/fidelity-pairs.py <short sha of the app commit>
# pair-<theme>-<width>.png = [mockup | app sample]; pair-fresh-<theme>-<width>.png = [mockup | app fresh]
import sys, os
from PIL import Image, ImageDraw, ImageFont
sha = sys.argv[1]
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'evidence', 'identidad')
fix = os.path.join(root, 'fix')
try: font = ImageFont.truetype('arial.ttf', 13)
except Exception: font = ImageFont.load_default()
BAR, GAP = 26, 12
out = []
for state in ('sample', 'fresh'):
    for theme in ('dark', 'light'):
        for w in (1440, 390):
            a = Image.open(os.path.join(root, f'raycast-{theme}-{w}.png')).convert('RGB')
            b = Image.open(os.path.join(fix, f'{state}-{theme}-{w}.png')).convert('RGB')
            h = max(a.height, b.height)
            bg = (24, 24, 26) if theme == 'dark' else (225, 225, 228)
            fg = (230, 230, 230) if theme == 'dark' else (20, 20, 22)
            im = Image.new('RGB', (a.width + b.width + GAP, h + BAR), bg)
            im.paste(a, (0, BAR)); im.paste(b, (a.width + GAP, BAR))
            d = ImageDraw.Draw(im)
            d.text((8, 6), 'mockup 45ad075', fill=fg, font=font)
            d.text((a.width + GAP + 8, 6), f'app {sha} ({state})', fill=fg, font=font)
            name = f'pair-{theme}-{w}.png' if state == 'sample' else f'pair-fresh-{theme}-{w}.png'
            p = os.path.join(fix, name); im.save(p); out.append(os.path.abspath(p))
print('\n'.join(out))
