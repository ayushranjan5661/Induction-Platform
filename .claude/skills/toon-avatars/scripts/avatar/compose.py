"""Assemble a complete animated SVG character from a spec dict.

Public API:
    build(spec) -> str            full SVG document
    normalize(spec) -> dict       resolve aliases, named colours and defaults
    namespace(svg, prefix) -> str prefix ids/classes/keyframes for safe inline use
"""
import re
from .helpers import remap, shade
from .base import P
from . import face, hair, clothes
from .palettes import resolve_color, OPTIONS

SKIN=['#FDDDBF','#F6C7A1','#EAAE86','#FAD5B5','#EDB590','#E7A984','#F5C6A0','#F7CBA6','#E9B08C','#C98663','#FCE0CC','#FBE3D2','#D99472','#EDB08B','#EDB591','#C98361','#E2A27E','#FBE0CD','#F9BCA6','#E88D76','#F2867A','#E39A7E','#8E5E4E','#B5734E','#B8704E']
HAIR=['#C47640','#A65B2E','#83421F','#7E4021','#5E2E16','#7C4524','#5A2D14','#6E3519','#9A5A32','#C88048','#D99459']
EYES=['#D99448','#9B5427','#572B10','#E7A862','#4A240E']
JACKET=['#EC6C35','#D9532C','#BF421C','#D0501F','#A83A18','#7E2810','#8E2F14','#93330F','#9C3517','#A93B19','#B5401F','#E46A3A','#EE7C4E','#EF7A4E','#B9431F','#9E3516']
SHIRT=['#877C75','#655B55','#6A605A','#5E5550','#4B4440','#B5ACA6','#8E857F','#776C66']
PANTS=['#8090A6','#6E7B90','#5C687B','#56627A','#8D9AAD','#97A4B6','#A3B0C2','#56616F','#525D6C','#47526A']
SHOE=['#EC6C40','#C2431C','#F2805A','#D9572E','#7A260C','#5E1F0E','#9E3516','#A93B19','#C4471F','#D9562F','#F48C64','#F7A07E']
LACE=['#F3E7DA','#D2C2B2','#B9AC9C']
SOLE=['#FFFFFF','#E2D9CC','#E6DDD1','#F4EEE6','#CDBFAE','#D8CEC1','#E0D6C9']
SOCK=['#B8B0A6','#E9E5E0','#F3F0EC','#CFC8BF','#BDB5AB']
BG=['#7E93B6','#56688A','#2F3748']
FAM={'skin':(SKIN,'#F7CBA6'),'hair':(HAIR,'#A65B2E'),'eyes':(EYES,'#9B5427'),'jacket':(JACKET,'#D9532C'),'sleeve':(JACKET,'#D9532C'),
     'shirt':(SHIRT,'#776C66'),'pants':(PANTS,'#6E7B90'),'shoe':(SHOE,'#D9562F'),'lace':(LACE,'#F3E7DA'),'sole':(SOLE,'#F4EEE6'),
     'sock':(SOCK,'#E9E5E0'),'bg':(BG,'#56688A'),'browcol':(HAIR,'#A65B2E')}

# friendly spec name -> internal key
ALIASES = {'skin_tone':'skin','hair_color':'hair','eye_color':'eyes','brow_color':'browc','top_color':'jacket','sleeve_color':'sleeve',
    'shirt_color':'shirt','bottom_color':'pants','shoe_color':'shoe','lace_color':'lace','sole_color':'sole','sock_color':'sock',
    'background':'bg','accent':'acc','lip_color':'lip','eye_shape':'eye','lashes':'lash','brows':'brow','top_options':'top_c',
    'bottom_options':'bottom_c'}
OPT_ALIASES = {'graphic_color':'gcol','letter_fill':'letterfill','letter_edge':'letteredge','sock_accent':'sockacc'}
COLOR_KIND = {'skin':'skin','hair':'hair','browc':'hair','eyes':'eyes','bg':'bg'}
COLOR_KEYS = ['skin','hair','browc','eyes','jacket','sleeve','shirt','pants','shoe','lace','sole','sock','bg','acc','lip','headphones','hat_color','hijab_color']
OPT_COLOR_KEYS = ['rib','stripe','stripes','gcol','patch','letterfill','letteredge','stitch','tights','sockacc']
DEFAULTS = {'name':'Character','hair_style':'swoosh','top':'zip','bottom':'jeans','eye':'calm','lash':'flick','brow':'thick','nose':'round',
            'mouth':'smile','animation':'full','transparent':False,'shadow':True}

def normalize(spec):
    c = {}
    for k, v in spec.items():
        c[ALIASES.get(k, k)] = v
    for k, v in DEFAULTS.items(): c.setdefault(k, v)
    for k in COLOR_KEYS:
        if c.get(k) is not None: c[k] = resolve_color(c[k], COLOR_KIND.get(k, 'cloth'))
    for ok in ('top_c', 'bottom_c'):
        o = {OPT_ALIASES.get(k, k): v for k, v in (c.get(ok) or {}).items()}
        for k in OPT_COLOR_KEYS:
            if o.get(k): o[k] = resolve_color(o[k])
        c[ok] = o
    for k in ('glasses', 'earrings'):
        if c.get(k): c[k] = (c[k][0], resolve_color(c[k][1]))
    if c.get('hat_color'): c['hat'] = (c['hat_color'], shade(c['hat_color'], -.12), shade(c['hat_color'], .14))
    if c['hair_style'] == 'hijab':
        h = c.get('hijab_color') or '#5E8C7A'; c['hat'] = (h, shade(h, -.1), shade(h, .07))
    if c['hair_style'] in ('beanie', 'cap') and not c.get('hat'): c['hat'] = ('#D23F3F', shade('#D23F3F', -.12), shade('#D23F3F', .14))
    tc = c['top_c']
    if c['top'] in ('bomber', 'varsity'): tc.setdefault('rib', c.get('jacket') or '#B5401F')
    if c['top'] == 'varsity':
        c.setdefault('sleeve', '#EDE6D6'); tc.setdefault('letter', str(c['name'])[:1].upper() or 'A')
        tc.setdefault('letterfill', c['sleeve']); tc.setdefault('letteredge', tc.get('stripe') or c.get('jacket') or '#2B2B30')
    if c['bottom'] == 'skirt': c['bottom_c'].setdefault('tights', '#2B2B33')
    if c['hair_style'] == 'hijab' and tc.get('graphic'): tc['graphic_dy'] = 36   # keep the chest graphic below the drape
    c['browcol'] = c.get('browc', c.get('hair'))
    return c

def _mapping(cfg, fams):
    mp = {}
    for f in fams:
        cols, base = FAM[f]; t = cfg.get(f)
        if t: mp.update({x.upper(): remap(x, base, t) for x in cols})
    return mp

def _apply(seg, mp): return re.sub(r'#[0-9A-Fa-f]{6}', lambda m: mp.get(m.group(0).upper(), m.group(0)), seg)

FREEZE_WAVE = ('.shrug,.armU,.armF,.look,.brows{animation:none!important}.handO{animation:none!important;opacity:0!important}'
               '.handR{animation:none!important;opacity:1!important}.smO{animation:none!important;opacity:0!important}.smC{animation:none!important;opacity:1!important}')

def build(spec):
    cfg = normalize(spec)
    T = P['top']
    T = re.sub(r'<title id="t">.*?</title>', f'<title id="t">{cfg["name"]}: 2D animated avatar</title>', T)
    jw = re.search(r'<linearGradient id="jacketW".*?</linearGradient>', T, flags=re.S).group(0)
    jwm = re.search(r'<linearGradient id="jacketWm".*?</linearGradient>', T, flags=re.S).group(0)
    stub = remap('#5E2E16', '#A65B2E', cfg.get('hair') or '#A65B2E')
    stripe = cfg['top_c'].get('stripes', '#F2EFE8')
    extra = (jw.replace('id="jacketW"', 'id="sleeveW"') + '\n  ' + jwm.replace('id="jacketWm"', 'id="sleeveWm"') + '\n'
        f'  <pattern id="stubble" width="3" height="3" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".55" fill="{stub}" fill-opacity=".55"/><circle cx="2.4" cy="2.2" r=".45" fill="{stub}" fill-opacity=".4"/></pattern>\n'
        f'  <pattern id="stripes" width="12" height="12" patternUnits="userSpaceOnUse"><rect y="0" width="12" height="5" fill="{stripe}"/></pattern>\n'
        '  <pattern id="plaid" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="8" fill="#000" fill-opacity=".26"/><rect width="8" height="22" fill="#000" fill-opacity=".26"/><rect y="13" width="22" height="1.6" fill="#FFF" fill-opacity=".35"/><rect x="13" width="1.6" height="22" fill="#FFF" fill-opacity=".35"/></pattern>\n'
        '  <pattern id="knit" width="5" height="6" patternUnits="userSpaceOnUse"><path d="M0 0 L2.5 3 L5 0 M0 3 L2.5 6 L5 3" fill="none" stroke="#000" stroke-opacity=".08" stroke-width=".8"/></pattern>\n')
    T = T.replace('</defs>', extra + '</defs>')
    css = '  .tail{transform-box:view-box;transform-origin:300px 64px;animation:sway 3s ease-in-out infinite alternate}\n'
    if cfg['animation'] == 'idle': css += '  ' + FREEZE_WAVE + '\n'
    if cfg['animation'] == 'none': css += '  ' + FREEZE_WAVE + '\n  *{animation:none!important}\n'
    T = T.replace('  .look{', css + '  .look{')
    G = {'skinF':'skin','skinH':'skin','neckG':'skin','blush':'skin','noseG':'skin','hairG':'hair','hairB':'hair','browG':'browcol','irisG':'eyes',
         'jacketW':'jacket','jacketWm':'jacket','hoodG':'jacket','sleeveW':'sleeve','sleeveWm':'sleeve','innerG':'shirt','jeansG':'pants',
         'shoeUp':'shoe','tongueG':'shoe','soleG':'sole','toeG':'sole','sockG':'sock','bg':'bg'}
    for gid, f in G.items():
        m = re.search(r'<(linear|radial)Gradient id="%s".*?</\1Gradient>' % gid, T, flags=re.S)
        T = T[:m.start()] + _apply(m.group(0), _mapping(cfg, [f])) + T[m.end():]
    for pat, fams in ((r'<pattern id="canvasT".*?</pattern>', ['shoe']), (r'<g id="handRest">.*?</g>', ['skin'])):
        m = re.search(pat, T, flags=re.S); T = T[:m.start()] + _apply(m.group(0), _mapping(cfg, fams)) + T[m.end():]
    bg = P['bg']
    if cfg['transparent']:
        bg = '<!-- Background (transparent) -->\n' + ''.join(l + '\n' for l in bg.splitlines() if 'filter="url(#b' in l and cfg['shadow'])
    shoes = _apply(P['shoes'], _mapping(cfg, ['shoe', 'lace', 'sole', 'sock']))
    legs = _apply(clothes.bottoms(cfg['bottom'], cfg['bottom_c']), _mapping(cfg, ['pants', 'skin']))
    tc = cfg['top_c']
    torso = _apply(clothes.top(cfg['top'], tc), _mapping(cfg, ['jacket', 'shirt', 'skin']))
    arms = _apply(clothes.arms(cfg['top'], tc), _mapping(cfg, ['sleeve' if cfg['top'] == 'varsity' else 'jacket', 'skin']))
    if cfg.get('headphones'):
        hp = cfg['headphones']; hd = shade(hp, -.18); hl = shade(hp, .15)
        band = "M231 229 Q236 221 244.5 219.5 M281 229 Q276 221 267.5 219.5"
        torso += (f'  <path d="{band}" fill="none" stroke="#2E1E16" stroke-width="7.5" stroke-linecap="round"/><path d="{band}" fill="none" stroke="{hd}" stroke-width="4.2" stroke-linecap="round"/>\n'
                  f'  <g stroke="#2E1E16" stroke-width="2.4"><ellipse cx="229" cy="242" rx="12" ry="14" fill="{hp}"/><ellipse cx="283" cy="242" rx="12" ry="14" fill="{hp}"/></g>\n'
                  f'  <ellipse cx="230.5" cy="243" rx="6.5" ry="8" fill="{hd}"/><ellipse cx="281.5" cy="243" rx="6.5" ry="8" fill="{hd}"/>\n'
                  f'  <path d="M221 236 Q223 231 228 230 M275 236 Q277 231 282 230" fill="none" stroke="{hl}" stroke-width="2" stroke-linecap="round"/>\n')
    h = hair.style(cfg['hair_style'], acc=cfg.get('acc'), hat=cfg.get('hat'))
    ex = face.extras(cfg)
    head = '  <!-- Head (tilts) -->\n  <g class="head">\n' + h['tail'] + h['back'] + h['braids'] + h['hijab_back']
    if not h['noears']: head += P['ears'] + ex.get('earrings', '')
    head += P['face'] + P['blush'] + ex.get('freckles', '') + ex.get('beard', '')
    head += f'    <g clip-path="url(#faceClip)"><path d="{h["cast"]}" transform="translate(2 7)" fill="#C98361" opacity=".55" filter="url(#b2)"/></g>\n'
    head += (face.eyes(cfg['eye'], cfg['lash']) + _apply(face.brows(cfg['brow']), _mapping(cfg, ['browcol'])) + ex.get('glasses', '') + ex.get('mustache', ''))
    head += face.nose(cfg['nose']) + face.mouth(cfg['mouth'], cfg.get('lip')) + P['smO'] + h['front'] + '  </g>\n'
    head = _apply(head, _mapping(cfg, ['skin', 'hair', 'eyes']))
    return (T + bg + shoes + legs + P['hemshadow'] + '<!-- Upper body (breathes) -->\n<g class="upper">\n'
            + torso + arms + head + '</g>\n</svg>\n')

CLASSES = ['o','upper','head','eyes','tuft','shrug','armU','armF','handO','handR','look','brows','smO','smC','str1','str2','tail']
KEYFRAMES = ['breathe','tilt','blink','sway','shrug','raise','wave','showO','showR','look','brows','smO','smC','swing']

def namespace(svg, prefix):
    """Prefix every id, class and keyframe so many avatars can be inlined in one HTML page."""
    p = re.sub(r'[^A-Za-z0-9_-]', '', prefix) or 'av'
    ids = set(re.findall(r'\bid="([^"]+)"', svg))
    for i in sorted(ids, key=len, reverse=True):
        svg = re.sub(r'\bid="%s"' % re.escape(i), f'id="{p}-{i}"', svg)
        svg = re.sub(r'url\(#%s\)' % re.escape(i), f'url(#{p}-{i})', svg)
        svg = re.sub(r'href="#%s"' % re.escape(i), f'href="#{p}-{i}"', svg)
        svg = svg.replace(f'aria-labelledby="{i}"', f'aria-labelledby="{p}-{i}"')
    def cls(m): return 'class="' + ' '.join(f'{p}-{x}' if x in CLASSES else x for x in m.group(1).split()) + '"'
    svg = re.sub(r'class="([^"]+)"', cls, svg)
    st0 = svg.index('<style>'); st1 = svg.index('</style>')
    css = svg[st0:st1]
    css = re.sub(r'\.(%s)(?=[\s{,:])' % '|'.join(sorted(CLASSES, key=len, reverse=True)), lambda m: f'.{p}-{m.group(1)}', css)
    css = re.sub(r'@keyframes (%s)\{' % '|'.join(KEYFRAMES), lambda m: f'@keyframes {p}-{m.group(1)}{{', css)
    css = re.sub(r'animation:(%s)\b' % '|'.join(KEYFRAMES), lambda m: f'animation:{p}-{m.group(1)}', css)
    return svg[:st0] + css + svg[st1:]
