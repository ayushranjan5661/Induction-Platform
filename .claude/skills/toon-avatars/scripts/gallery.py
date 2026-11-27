#!/usr/bin/env python3
"""Build a labelled contact sheet (PNG) and a self-contained animated HTML gallery.

  python gallery.py assets/avatars/*.svg --out assets/avatars [--title "Team avatars"]
Contact sheet needs playwright + pillow; the HTML gallery needs nothing.
"""
import argparse, asyncio, base64, glob, html, os, re, sys

def label(svg_text, path):
    m = re.search(r'<title[^>]*>(.*?):', svg_text); return m.group(1) if m else os.path.splitext(os.path.basename(path))[0]

async def sheet(files, out, cols, tile, pose):
    from playwright.async_api import async_playwright
    from PIL import Image, ImageDraw, ImageFont
    def font(sz):
        for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/Library/Fonts/Arial Bold.ttf', 'C:/Windows/Fonts/arialbd.ttf', '/System/Library/Fonts/Supplemental/Arial Bold.ttf']:
            if os.path.exists(p): return ImageFont.truetype(p, sz)
        return ImageFont.load_default()
    rows = -(-len(files) // cols); LH = int(tile * .14)
    W = Image.new('RGB', (cols * tile, rows * (tile + LH)), (24, 27, 36)); d = ImageDraw.Draw(W); f = font(int(tile * .07))
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=tile / 512)
        for i, path in enumerate(files):
            await pg.goto('file://' + os.path.abspath(path)); await pg.wait_for_timeout(120)
            await pg.evaluate(f'document.getAnimations().forEach(x=>{{x.pause();x.currentTime={pose * 1000};}})')
            tmp = out + '.tmp.png'; await pg.screenshot(path=tmp)
            x = (i % cols) * tile; y = (i // cols) * (tile + LH)
            W.paste(Image.open(tmp).convert('RGB'), (x, y)); os.remove(tmp)
            d.text((x + tile / 2, y + tile + LH * .2), label(open(path, encoding='utf-8').read(), path), font=f, fill=(240, 240, 245), anchor='ma')
        await br.close()
    W.save(out)

def gallery(files, out, title):
    cards = ''
    for path in files:
        t = open(path, encoding='utf-8').read(); b = base64.b64encode(t.encode()).decode(); n = html.escape(label(t, path))
        cards += f'<figure><img src="data:image/svg+xml;base64,{b}" alt="{n}, animated avatar"><figcaption>{n}<a download="{html.escape(os.path.basename(path))}" href="data:image/svg+xml;base64,{b}">SVG</a></figcaption></figure>\n'
    doc = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(title)}</title>
<style>:root{{--bg:#F4F2EE;--card:#FFF;--ink:#1F2230;--muted:#5E6474;--line:#E2DED6}}@media (prefers-color-scheme:dark){{:root{{--bg:#14161D;--card:#1E212B;--ink:#EEF0F5;--muted:#A3A9B8;--line:#2C303C;color-scheme:dark}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}h1{{max-width:1400px;margin:0 auto;padding:28px 20px 0;font-size:clamp(22px,3vw,30px)}}
main{{max-width:1400px;margin:0 auto;padding:20px;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(210px,1fr))}}figure{{margin:0;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden}}
img{{display:block;width:100%;height:auto;aspect-ratio:1}}figcaption{{padding:10px 14px;display:flex;justify-content:space-between;font-weight:600}}figcaption a{{color:var(--muted);font-weight:500;font-size:13px}}</style></head>
<body><h1>{html.escape(title)}</h1><main>{cards}</main></body></html>'''
    open(out, 'w', encoding='utf-8').write(doc)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('svgs', nargs='+'); ap.add_argument('--out', required=True); ap.add_argument('--title', default='Avatars')
    ap.add_argument('--cols', type=int, default=5); ap.add_argument('--tile', type=int, default=400); ap.add_argument('--pose', type=float, default=1.5)
    ap.add_argument('--no-sheet', action='store_true')
    a = ap.parse_args()
    files = []
    for g in a.svgs: files += sorted(glob.glob(g))
    files = [f for f in files if f.endswith('.svg')]
    os.makedirs(a.out, exist_ok=True)
    gallery(files, os.path.join(a.out, 'gallery.html'), a.title); print(os.path.join(a.out, 'gallery.html'))
    if not a.no_sheet:
        try:
            asyncio.run(sheet(files, os.path.join(a.out, 'contact-sheet.png'), min(a.cols, len(files)), a.tile, a.pose)); print(os.path.join(a.out, 'contact-sheet.png'))
        except ImportError:
            print('contact sheet skipped (pip install playwright pillow && python -m playwright install chromium)')
