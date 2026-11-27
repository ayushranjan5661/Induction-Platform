#!/usr/bin/env python3
"""Validate a character spec file before generating.   python validate.py spec.json"""
import difflib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from avatar.palettes import OPTIONS, resolve_color

KNOWN = {'name','skin_tone','hair_style','hair_color','brow_color','eye_color','eye_shape','lashes','brows','nose','mouth','lip_color',
    'freckles','mole','glasses','earrings','beard','headphones','hat_color','hijab_color','accent','top','top_color','sleeve_color',
    'shirt_color','top_options','bottom','bottom_color','bottom_options','shoe_color','lace_color','sole_color','sock_color','background',
    'transparent','shadow','animation',
    # internal short names are accepted too
    'skin','hair','browc','eyes','eye','lash','brow','lip','hat','acc','jacket','sleeve','shirt','pants','shoe','lace','sole','sock','bg','top_c','bottom_c'}
ENUM = {'hair_style':'hair_style','eye_shape':'eye_shape','eye':'eye_shape','lashes':'lashes','lash':'lashes','brows':'brows','brow':'brows',
        'nose':'nose','mouth':'mouth','top':'top','bottom':'bottom','animation':'animation'}
COLORS = {'skin_tone':'skin','skin':'skin','hair_color':'hair','hair':'hair','brow_color':'hair','browc':'hair','eye_color':'eyes','eyes':'eyes',
          'background':'bg','bg':'bg'}
CLOTH = ['lip_color','headphones','hat_color','hijab_color','accent','top_color','sleeve_color','shirt_color','bottom_color','shoe_color',
         'lace_color','sole_color','sock_color','lip','acc','jacket','sleeve','shirt','pants','shoe','lace','sole','sock']
TOP_OPTS = {'rib','stripe','stripes','graphic','graphic_color','gcol','patch','letter','letter_fill','letter_edge','letterfill','letteredge','stitch'}
BOTTOM_OPTS = {'stitch','stripe','tights','plaid','sock_accent','sockacc'}

def validate_one(s, idx):
    e = []; tag = f'#{idx} {s.get("name","?")}'
    if not isinstance(s, dict): return [f'{tag}: each character must be a JSON object']
    for k, v in s.items():
        if k not in KNOWN:
            sug = difflib.get_close_matches(k, KNOWN, 1); e.append(f'{tag}: unknown key "{k}"' + (f' (did you mean "{sug[0]}"?)' if sug else ''))
        elif k in ENUM and v not in OPTIONS[ENUM[k]]:
            sug = difflib.get_close_matches(str(v), OPTIONS[ENUM[k]], 1)
            e.append(f'{tag}: {k}="{v}" not allowed; use one of {OPTIONS[ENUM[k]]}' + (f' (did you mean "{sug[0]}"?)' if sug else ''))
        elif k in COLORS or k in CLOTH:
            try: resolve_color(v, COLORS.get(k, 'cloth'))
            except ValueError as ex: e.append(f'{tag}: {ex}')
        elif k in ('glasses', 'earrings'):
            kinds = OPTIONS[k]
            if not (isinstance(v, (list, tuple)) and len(v) == 2 and v[0] in kinds): e.append(f'{tag}: {k} must be ["{kinds[0]}"|..., "<colour>"], kinds: {kinds}')
            else:
                try: resolve_color(v[1])
                except ValueError as ex: e.append(f'{tag}: {ex}')
        elif k in ('top_options', 'top_c', 'bottom_options', 'bottom_c'):
            allowed = TOP_OPTS if k.startswith('top') else BOTTOM_OPTS
            for ok, ov in (v or {}).items():
                if ok not in allowed: e.append(f'{tag}: unknown {k} key "{ok}"; allowed {sorted(allowed)}')
                elif ok == 'graphic' and ov not in OPTIONS['graphic']: e.append(f'{tag}: graphic must be one of {OPTIONS["graphic"]}')
                elif ok not in ('graphic', 'letter', 'plaid') and ov is not None:
                    try: resolve_color(ov)
                    except ValueError as ex: e.append(f'{tag}: {k}.{ok}: {ex}')
    if s.get('hair_style') == 'hijab' and s.get('top', 'zip') in ('zip', 'pullover'):
        e.append(f'WARN {tag}: hijab looks best with a non-hooded top (sweater, denim, flannel, bomber, varsity)')
    return e

def validate_list(specs):
    out = []
    for i, s in enumerate(specs, 1): out += validate_one(s, i)
    return out

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    d = json.load(open(sys.argv[1], encoding='utf-8'))
    specs = d['characters'] if isinstance(d, dict) and 'characters' in d else (d if isinstance(d, list) else [d])
    allm = validate_list(specs); errs = [m for m in allm if not m.startswith('WARN')]
    for w in allm:
        if w.startswith('WARN'): print(w)
    print('OK: %d character(s) valid' % len(specs) if not errs else 'Problems:\n  ' + '\n  '.join(errs))
    sys.exit(1 if errs else 0)
