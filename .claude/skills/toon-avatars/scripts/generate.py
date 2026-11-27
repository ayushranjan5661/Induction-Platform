#!/usr/bin/env python3
"""Generate animated 2D avatar SVGs.

Examples
  python generate.py --spec characters.json --out assets/avatars
  python generate.py --preset all --out assets/avatars
  python generate.py --preset maya,kofi --transparent --animation idle --out public/avatars
  python generate.py --random 12 --seed 7 --out assets/avatars --save-spec assets/avatars/spec.json
  python generate.py --spec team.json --inline-safe --out src/assets/avatars   # namespaced ids/classes
"""
import argparse, json, os, random, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from avatar.compose import build, namespace
from avatar.palettes import random_character
from validate import validate_list

PRESETS = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'presets', 'characters.json'))

def slug(s): return re.sub(r'[^a-z0-9]+', '-', str(s).lower()).strip('-') or 'avatar'

def load_specs(a):
    specs = []
    if a.spec:
        data = json.load(open(a.spec, encoding='utf-8'))
        specs += data['characters'] if isinstance(data, dict) and 'characters' in data else (data if isinstance(data, list) else [data])
    if a.preset:
        pre = json.load(open(PRESETS, encoding='utf-8'))['characters']
        if a.preset.strip().lower() == 'all': specs += pre
        else:
            want = [w.strip().lower() for w in a.preset.split(',')]
            byname = {p['name'].lower(): p for p in pre}
            for w in want:
                if w not in byname: sys.exit(f'Unknown preset "{w}". Available: {", ".join(sorted(byname))}')
                specs.append(byname[w])
    if a.random:
        from avatar.palettes import NAMES
        rng = random.Random(a.seed); used = set()
        pool = rng.sample(NAMES, min(a.random, len(NAMES)))
        for i in range(a.random):
            nm = pool[i] if i < len(pool) else f'{pool[i % len(pool)]} {i // len(pool) + 1}'
            specs.append(random_character(rng, used, name=nm))
    return specs

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--spec', help='JSON file: one character object, a list, or {"characters": [...]}')
    ap.add_argument('--preset', help='"all" or comma-separated preset names (see assets/presets/characters.json)')
    ap.add_argument('--random', type=int, default=0, help='generate N random, mutually different characters')
    ap.add_argument('--seed', type=int, default=None, help='seed for --random (reproducible sets)')
    ap.add_argument('--out', required=True, help='output folder for .svg files')
    ap.add_argument('--transparent', action='store_true', help='no background (keeps ground shadow unless --no-shadow)')
    ap.add_argument('--no-shadow', action='store_true', help='with --transparent, drop the ground shadow too')
    ap.add_argument('--animation', choices=['full', 'idle', 'none'], help='override animation for all characters')
    ap.add_argument('--inline-safe', action='store_true', help='prefix ids/classes/keyframes so several SVGs can be inlined in one page')
    ap.add_argument('--numbered', action='store_true', help='prefix file names with 01-, 02-, ...')
    ap.add_argument('--save-spec', help='write the final list of specs (useful after --random) to this JSON file')
    a = ap.parse_args()
    specs = load_specs(a)
    if not specs: ap.error('nothing to generate: pass --spec, --preset or --random')
    for s in specs:
        if a.transparent: s['transparent'] = True
        if a.no_shadow: s['shadow'] = False
        if a.animation: s['animation'] = a.animation
    allm = validate_list(specs); errs = [m for m in allm if not m.startswith('WARN')]
    for w in allm:
        if w.startswith('WARN'): print(w)
    if errs:
        print('Spec problems:\n  ' + '\n  '.join(errs)); sys.exit(1)
    os.makedirs(a.out, exist_ok=True)
    seen = {}
    for i, s in enumerate(specs, 1):
        base = slug(s.get('name', f'avatar{i}'))
        seen[base] = seen.get(base, 0) + 1
        if seen[base] > 1: base = f'{base}-{seen[base]}'
        fn = (f'{i:02d}-' if a.numbered else '') + base + '.svg'
        svg = build(s)
        if a.inline_safe: svg = namespace(svg, 'av-' + base)
        open(os.path.join(a.out, fn), 'w', encoding='utf-8').write(svg)
        print(os.path.join(a.out, fn))
    if a.save_spec:
        json.dump({'characters': specs}, open(a.save_spec, 'w', encoding='utf-8'), indent=2)
        print('spec saved:', a.save_spec)

if __name__ == '__main__':
    main()
