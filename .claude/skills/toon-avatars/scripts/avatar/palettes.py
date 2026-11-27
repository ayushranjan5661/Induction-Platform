"""Named colours, allowed option values and the random-character generator."""
import random, colorsys
from .helpers import h2rgb

SKIN_TONES = {'porcelain':'#FBE3D0','fair':'#F9D9C0','light':'#F7CBA6','peach':'#EDC09B','golden':'#E0A57C','tan':'#D9A47A',
    'olive':'#C99366','caramel':'#C68B5E','bronze':'#B07A52','brown':'#9C6A48','deep':'#8C5A3C','espresso':'#6B4128','ebony':'#5A3522'}
HAIR_COLORS = {'black':'#1F1613','soft-black':'#2B1E1A','blue-black':'#1E2233','dark-brown':'#3B2418','brown':'#6B4A2E','chestnut':'#A65B2E',
    'auburn':'#8E3A22','ginger':'#C8622A','strawberry':'#D9875A','blonde':'#D9B25F','platinum':'#EAD9B0','grey':'#9A9A9E','white':'#E8E6E2',
    'pink':'#E58FB4','teal':'#2E9E95','blue':'#4D7FD1','purple':'#8A5BC7','green':'#4FA36A'}
EYE_COLORS = {'brown':'#9B5427','dark-brown':'#4A2A14','hazel':'#8E7A3A','amber':'#C07A2A','green':'#4E8A4A','blue':'#3F78B5','grey':'#6E87A6'}
COLORS = {'red':'#D23F3F','tomato':'#D9532C','orange':'#E8792F','mustard':'#D9A23A','yellow':'#F2C14E','olive':'#6B7A3A','green':'#3E8E5A',
    'forest':'#3E6E4A','mint':'#7CC4A4','teal':'#2E8C8C','sky':'#4FA3C7','denim':'#4F6E9E','navy':'#2C3550','royal':'#2C3E7A',
    'lavender':'#B49AD9','purple':'#7A5AA8','pink':'#E58FB4','rose':'#C46A8A','burgundy':'#8C2A3A','brown':'#7A4A2A','tan':'#C29560',
    'khaki':'#B59A6A','cream':'#EDE3CF','white':'#F2F0EB','light-grey':'#C9CBD0','grey':'#8D9096','charcoal':'#3A3A40','black':'#2B2B30',
    'light-wash':'#8FA8C8','mid-wash':'#5D7BA8','dark-wash':'#3D4A66','gum':'#C98B4E','gold':'#E3B23C','silver':'#C9CDD4','lip-rose':'#C2555A',
    'lip-berry':'#A84A4F','lip-coral':'#D9705F'}
BACKGROUNDS = {'teal':'#4A8C8C','purple':'#7A6AA8','blue':'#5B7FB8','mustard':'#E0A33A','sea':'#6FB5A8','terracotta':'#D9714A','ocean':'#3E7CB1',
    'green':'#7DA35A','rose':'#C46A8A','sky':'#4FA3C7','indigo':'#5E6FB8','sun':'#E2B04A','ice':'#8FB8D4','jade':'#3E9C8C','clay':'#C9824E',
    'brick':'#C7584A','cornflower':'#6E8FCF','coral':'#E07A5F','violet':'#9C7AC2','apricot':'#F0A95A','slate':'#56688A'}

OPTIONS = {
    'hair_style': ['swoosh','buzz','afro','curls','long','braids','bob','ponytail','buns','sidepart','mohawk','curlytop','wavy','beanie','cap','hijab'],
    'eye_shape': ['calm','open','sleepy'],
    'lashes': ['none','flick','long'],
    'brows': ['thick','thin','straight','arched','bold'],
    'nose': ['round','small','wide','line'],
    'mouth': ['smile','small','smirk','grin','lips'],
    'top': ['zip','pullover','sweater','denim','flannel','bomber','varsity'],
    'bottom': ['jeans','chinos','cargo','joggers','skirt','shorts'],
    'glasses': ['round','rect'],
    'earrings': ['stud','hoop'],
    'graphic': ['star','heart','bolt'],
    'animation': ['full','idle','none'],
}
HOODED = {'zip','pullover'}

def resolve_color(v, kind='cloth'):
    if v is None: return None
    if isinstance(v, str) and v.startswith('#') and len(v) == 7: return v.upper()
    table = {'skin':SKIN_TONES,'hair':HAIR_COLORS,'eyes':EYE_COLORS,'bg':BACKGROUNDS}.get(kind, {})
    key = str(v).lower().strip()
    if key in table: return table[key]
    if key in COLORS: return COLORS[key]
    if key in BACKGROUNDS and kind == 'bg': return BACKGROUNDS[key]
    raise ValueError(f'Unknown colour "{v}" for {kind}. Use #RRGGBB or a named colour (see references/options.md).')

def _hue(c):
    h, l, s = colorsys.rgb_to_hls(*h2rgb(c)); return h, l, s

def _far(c1, c2, min_dh=0.08, min_dl=0.18):
    h1, l1, s1 = _hue(c1); h2, l2, s2 = _hue(c2)
    dh = min(abs(h1 - h2), 1 - abs(h1 - h2))
    return dh >= min_dh or abs(l1 - l2) >= min_dl or (s1 < .15) != (s2 < .15)

NAMES = ['Alex','Ari','Avery','Bailey','Blake','Cameron','Casey','Charlie','Dakota','Devon','Drew','Eden','Ellis','Emery','Finley','Harper',
         'Hayden','Jamie','Jesse','Jordan','Kai','Kendall','Logan','Morgan','Noa','Parker','Quinn','Reese','Riley','River','Robin','Rowan',
         'Sage','Sam','Sasha','Skyler','Tatum','Taylor','Remy','Rio','Sol','Ash','Indigo','Nico','Shay','Jules','Lane','Marlo','Oakley','Wren','Zion']

def random_character(rng: random.Random, used: set, name=None):
    """Return a varied, valid character spec. `used` tracks combos to keep a set unique."""
    for _ in range(200):
        hs = rng.choice(OPTIONS['hair_style']); top = rng.choice(OPTIONS['top']); bottom = rng.choice(OPTIONS['bottom'])
        if hs == 'hijab' and top in HOODED: continue
        key = (hs, top, bottom)
        if key in used: continue
        used.add(key); break
    skin = rng.choice(list(SKIN_TONES.values()))
    natural = ['black','soft-black','dark-brown','brown','chestnut','auburn','ginger','blonde','platinum']
    hair_name = rng.choice(natural + natural + ['pink','teal','blue','purple','grey'])
    hair = HAIR_COLORS[hair_name]
    c = {'name': name or rng.choice(NAMES), 'skin_tone': skin, 'hair_style': hs, 'hair_color': hair,
         'eye_color': rng.choice(list(EYE_COLORS.values())), 'brows': rng.choice(OPTIONS['brows']), 'nose': rng.choice(OPTIONS['nose']),
         'mouth': rng.choice(['smile','smile','small','smirk','grin','lips']), 'eye_shape': rng.choice(['calm','open','open','sleepy']),
         'lashes': rng.choice(['flick','flick','long','none'])}
    if hair_name in ('pink','teal','blue','purple','green'): c['brow_color'] = rng.choice([HAIR_COLORS['dark-brown'], HAIR_COLORS['brown']])
    if c['mouth'] == 'lips': c['lip_color'] = rng.choice([COLORS['lip-rose'], COLORS['lip-berry'], COLORS['lip-coral']])
    if rng.random() < .25: c['freckles'] = True
    if rng.random() < .22: c['glasses'] = [rng.choice(OPTIONS['glasses']), rng.choice(['#1E1E22', COLORS['gold'], '#C23A3A', '#7A4A2A'])]
    if rng.random() < .25: c['earrings'] = [rng.choice(OPTIONS['earrings']), rng.choice([COLORS['gold'], COLORS['silver']])]
    if hs in ('sidepart','buzz','swoosh','curlytop') and rng.random() < .15 and 'brow_color' not in c: c['beard'] = True
    if rng.random() < .1 and hs != 'hijab': c['headphones'] = rng.choice([COLORS['yellow'], COLORS['sky'], '#4D7FD1', COLORS['red']])
    cloth = [v for k, v in COLORS.items() if not k.startswith('lip') and k not in ('gum','gold','silver')]
    bg = rng.choice(list(BACKGROUNDS.values()))
    top_color = rng.choice([x for x in cloth if _far(x, bg)] or cloth)
    c.update({'top': top, 'top_color': top_color, 'background': bg})
    opts = {}
    if top in ('zip','denim','flannel','bomber','varsity'): c['shirt_color'] = rng.choice(['#F2F0EB','#EDE3CF','#3A3A40','#D9A43A','#F2A7B8','#8D9096'])
    if top in ('bomber','varsity'):
        opts['rib'] = rng.choice([top_color, '#2B2B30', '#2C3550', '#EDE3CF']); opts['stripe'] = rng.choice([COLORS['gold'], '#F2F0EB', COLORS['red'], None])
        if top == 'varsity':
            c['sleeve_color'] = rng.choice(['#EDE6D6', '#F2F0EB', '#2B2B30'])
            opts.update(letter=c['name'][0].upper(), letterfill=c['sleeve_color'], letteredge=opts.get('stripe') or '#2B2B30')
        elif rng.random() < .5: opts['patch'] = rng.choice([COLORS['red'], COLORS['yellow'], COLORS['pink']])
    if top == 'denim': opts['stitch'] = '#D8A85A'
    if top in ('sweater','zip') and rng.random() < .45: opts['graphic'] = rng.choice(OPTIONS['graphic']); opts['graphic_color'] = rng.choice([COLORS['red'], COLORS['yellow'], '#F2F0EB', COLORS['sky']])
    if top == 'sweater' and 'graphic' not in opts and rng.random() < .5: opts['stripes'] = rng.choice(['#F2EFE8', '#2C3550', COLORS['yellow']])
    if opts: c['top_options'] = {k: v for k, v in opts.items() if v is not None}
    pants = {'jeans':['light-wash','mid-wash','dark-wash','black'],'chinos':['khaki','tan','cream','grey','navy','olive'],'cargo':['khaki','olive','charcoal','tan'],
             'joggers':['charcoal','grey','navy','black'],'skirt':['navy','burgundy','denim','black','olive'],'shorts':['khaki','denim','navy','olive']}[bottom]
    c['bottom'] = bottom; c['bottom_color'] = COLORS[rng.choice(pants)]
    bo = {}
    if bottom == 'joggers': bo['stripe'] = rng.choice(['#F2F0EB', COLORS['red'], COLORS['yellow']])
    if bottom == 'skirt': bo['tights'] = rng.choice(['#2B2B33', '#3A2E2E', '#EDEBE6', '#2C3550']); bo['plaid'] = rng.random() < .4
    if bottom == 'shorts': bo['sock_accent'] = top_color
    if bo: c['bottom_options'] = bo
    c['shoe_color'] = rng.choice(['#F2F0EB', COLORS['red'], '#2E2E33', COLORS['navy'], COLORS['brown'], COLORS['teal'], COLORS['pink'], COLORS['mustard']])
    if rng.random() < .2: c['sole_color'] = COLORS['gum']
    if hs in ('beanie', 'cap'): c['hat_color'] = rng.choice([COLORS['red'], COLORS['mustard'], COLORS['navy'], COLORS['green'], COLORS['black'], COLORS['pink']])
    if hs == 'hijab': c['hijab_color'] = rng.choice(['#5E8C7A', '#8C2A3A', '#2C3550', '#C9A27A', '#7A5AA8', '#3A3A40'])
    if hs in ('ponytail', 'buns', 'braids'): c['accent'] = rng.choice([COLORS['red'], COLORS['yellow'], COLORS['mint'], COLORS['pink'], COLORS['lavender']])
    return c
