from .helpers import *
OL='#2E1E16'
def eye(cx, etype='calm', lash='flick'):
    right = cx>257
    ix = cx-2 if right else cx+2
    hx, lx = ix+4, ix-3.5
    lidx = cx-20
    clip = 'eyeR' if right else 'eyeL'
    if etype=='calm':
        lid=f'<path fill="#EDB591" d="M{lidx} 120 H{lidx+40} V140 Q{cx} 130 {lidx} 140 Z"/>'
        sh=f'<path fill="#8E5E4E" opacity=".35" filter="url(#b2)" d="M{lidx} 123 H{lidx+40} V144 Q{cx} 134 {lidx} 144 Z"/>'
        ys, yc, w = 139, 130, 4
    elif etype=='sleepy':
        lid=f'<path fill="#EDB591" d="M{lidx} 120 H{lidx+40} V143 Q{cx} 133.5 {lidx} 143 Z"/>'
        sh=f'<path fill="#8E5E4E" opacity=".35" filter="url(#b2)" d="M{lidx} 123 H{lidx+40} V147 Q{cx} 137 {lidx} 147 Z"/>'
        ys, yc, w = 142, 133.5, 4
    else:  # open
        lid=''
        sh=f'<path fill="#8E5E4E" opacity=".28" filter="url(#b2)" d="M{lidx} 116 H{lidx+40} V133 Q{cx} 123 {lidx} 133 Z"/>'
        ys, yc, w = 138.4, 115.6, 3.6
    s=f'''      <g clip-path="url(#{clip})">
        <ellipse cx="{cx}" cy="142" rx="17" ry="15" fill="url(#whiteG)"/>
        <g class="look">
        <circle cx="{ix}" cy="144" r="11.5" fill="url(#irisG)" stroke="#4A240E" stroke-width="2"/>
        <path d="M{ix-7} 148 Q{ix} 154.5 {ix+7} 148" fill="none" stroke="#E7A862" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>
        <circle cx="{ix}" cy="144" r="6" fill="#170D08"/>
        <circle cx="{hx}" cy="140" r="3.4" fill="#FFFFFF"/>
        <circle cx="{lx}" cy="148" r="1.7" fill="#FFFFFF" opacity=".9"/>
        </g>
        {sh}
        {lid}
      </g>
      <ellipse cx="{cx}" cy="142" rx="17" ry="15" fill="none" class="o" stroke-width="2.5"/>
      <path d="M{cx-16.6} {ys} Q{cx} {yc} {cx+16.6} {ys}" fill="none" stroke="{OL}" stroke-width="{w}" stroke-linecap="round"/>
'''
    # outer corner is left for left eye, right for right eye
    sgn = 1 if right else -1; ox = cx+sgn*15.5
    if lash in ('flick','long'):
        s+=f'      <path d="M{ox} {ys-0.5} Q{ox+sgn*4.5} {ys-1.5} {ox+sgn*7.5} {ys-5.5}" fill="none" stroke="{OL}" stroke-width="2.6" stroke-linecap="round"/>\n'
    if lash=='long':
        for k,(dx,dy,ex,ey) in enumerate([(-3,-4,1.5,-7.5),(-7.5,-6.5,-3,-10)]):
            bx=ox+sgn*dx; by=ys+dy
            s+=f'      <path d="M{fmt(bx)} {fmt(by)} q{fmt(sgn*2)} {-1.5} {fmt(sgn*(ex-dx+2))} {fmt(ey-dy)}" fill="none" stroke="{OL}" stroke-width="2.2" stroke-linecap="round"/>\n'
    s+=f'      <path d="M{cx-11} 154.5 Q{cx} 159.5 {cx+11} 154.5" fill="none" stroke="#D99472" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>\n'
    return s
def eyes(etype, lash):
    return '    <!-- Eyes (blink) -->\n    <g class="eyes">\n'+eye(230,etype,lash)+eye(284,etype,lash)+'    </g>\n'

BROWS={
 'thick':"M210 118 Q226 102 248 110 Q251 114 247 117 Q228 110 213 123 Z",
 'thin':"M211 119 Q227 104 249 111 Q250.5 113.5 248 114.5 Q228 109 213 121.5 Z",
 'straight':"M210 115 Q229 108 249 110 Q251.5 113 249 116.5 Q229 113.5 211.5 120 Q208 118 210 115 Z",
 'arched':"M211 117 Q223 99 249 107 Q251 110 248 112 Q227 105 213.5 121 Z",
 'bold':"M208 116 Q229 105 251 109 Q253 115.5 249.5 119 Q229 115 211 123 Q206 121 208 116 Z",
}
def brows(kind):
    d=BROWS[kind]
    hl='      <path d="M218 112 Q228 107 240 108.5 M294 112 Q284 107 272 108.5" fill="none" stroke="#9A5A32" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>\n' if kind in('thick','bold') else ''
    return f'    <g class="brows">\n      <path fill="url(#browG)" d="{d}"/>\n      <path fill="url(#browG)" d="{mirror(d,257)}"/>\n{hl}    </g>\n'
def nose(kind):
    if kind=='round':
        return '''    <ellipse cx="259" cy="179" rx="11" ry="3.2" fill="#C98361" opacity=".55" filter="url(#b2)"/>
    <ellipse class="o" fill="url(#noseG)" stroke-width="2.5" cx="257" cy="168" rx="13" ry="10"/>
    <ellipse fill="#FFFFFF" opacity=".7" cx="252" cy="163.8" rx="4.2" ry="2.6"/>\n'''
    if kind=='small':
        return '''    <ellipse cx="258.5" cy="176.5" rx="7.5" ry="2.4" fill="#C98361" opacity=".55" filter="url(#b2)"/>
    <ellipse class="o" fill="url(#noseG)" stroke-width="2.2" cx="257" cy="169" rx="8.5" ry="7"/>
    <ellipse fill="#FFFFFF" opacity=".7" cx="254" cy="166" rx="2.8" ry="1.8"/>\n'''
    if kind=='wide':
        return '''    <ellipse cx="259" cy="179" rx="14" ry="3.4" fill="#C98361" opacity=".55" filter="url(#b2)"/>
    <ellipse class="o" fill="url(#noseG)" stroke-width="2.5" cx="257" cy="169" rx="15.5" ry="9.5"/>
    <path d="M247 172 Q249 175 252 174.5 M267 172 Q265 175 262 174.5" fill="none" stroke="#C98361" stroke-width="1.6" stroke-linecap="round"/>
    <ellipse fill="#FFFFFF" opacity=".7" cx="251.5" cy="165" rx="4.6" ry="2.6"/>\n'''
    if kind=='line':
        return '''    <path d="M259 154 Q266 166 262 172" fill="none" stroke="#C98361" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M252 172.5 Q257 176.5 262 172.5" fill="none" stroke="#B8704E" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse fill="#FFFFFF" opacity=".55" cx="256" cy="166" rx="2.6" ry="3.6"/>\n'''
def mouth(kind, lip=None):
    c='#6E2C1E'
    if kind=='smile':
        m=f'''      <path fill="{c}" d="M237 186.5 Q258 204 280.5 184.5 Q258 198.5 237 186.5 Z" stroke="{c}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M280 185 Q284 184 285 180 M237.5 187 Q234.5 186 234 183" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>
      <path d="M252 201.5 Q258.5 203.5 265 201" fill="none" stroke="#E39A7E" stroke-width="1.5" stroke-linecap="round"/>\n'''
    elif kind=='small':
        m=f'''      <path fill="{c}" d="M245 189 Q258 199 271 188 Q258 195 245 189 Z" stroke="{c}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M252.5 199.5 Q258 201 263.5 199" fill="none" stroke="#E39A7E" stroke-width="1.4" stroke-linecap="round"/>\n'''
    elif kind=='smirk':
        m=f'''      <path fill="{c}" d="M241 190.5 Q259 196.5 279 182.5 Q259 192 241 190.5 Z" stroke="{c}" stroke-width="1" stroke-linejoin="round"/>
      <path d="M279 183 Q283.5 181.5 284 177.5" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>
      <path d="M254 199 Q260 200.5 266 198" fill="none" stroke="#E39A7E" stroke-width="1.4" stroke-linecap="round"/>\n'''
    elif kind=='grin':
        m=f'''      <path fill="#5E1E14" d="M236 185 Q258 206 282 183 Q259 191 236 185 Z"/>
      <path fill="#FFFFFF" d="M238.5 186 Q259 191.5 279.5 184.5 Q276 189 270 191.5 Q259 194 247 192 Q241 190 238.5 186 Z"/>
      <path fill="none" stroke="{OL}" stroke-width="2.2" stroke-linejoin="round" d="M236 185 Q258 206 282 183 Q259 191 236 185 Z"/>
      <path d="M282 183.5 Q286 182 287 178 M236 185.5 Q232.5 184.5 232 181" fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round"/>\n'''
    elif kind=='lips':
        L=lip or '#C2555A'; Ld=shade(L,-.12); Ll=shade(L,.12)
        m=f'''      <path fill="{Ll}" stroke="{Ld}" stroke-width="1.4" stroke-linejoin="round" d="M244 190 Q258 200.5 272 189 Q258 205 244 190 Z"/>
      <path fill="{L}" stroke="{Ld}" stroke-width="1.4" stroke-linejoin="round" d="M240 188 Q248 183 253 185.5 Q258 183.5 263 185.5 Q269 183 276 187.5 Q258 195 240 188 Z"/>
      <path fill="{Ld}" d="M240 188 Q258 196 276 187.5 Q258 193 240 188 Z"/>
      <ellipse cx="262" cy="196" rx="3.5" ry="1.4" fill="#FFFFFF" opacity=".45"/>\n'''
    return '    <g class="smC">\n'+m+'    </g>\n'
FRECKLES=''.join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x,y,r in [(214,163,1.4),(221,167,1.2),(209,169,1.3),(218,173,1.1),(226,161,1),(300,163,1.4),(293,167,1.2),(305,169,1.3),(296,173,1.1),(288,161,1),(248,158,1),(266,158,1)])
def extras(cfg):
    out={}
    if cfg.get('freckles'): out['freckles']=f'    <g fill="#B5734E" opacity=".75">{FRECKLES}</g>\n'
    if cfg.get('mole'): out['freckles']=out.get('freckles','')+'    <circle cx="291" cy="190" r="1.7" fill="#5A3020"/>\n'
    g=cfg.get('glasses')
    if g:
        kind,col=g
        if kind=='round':
            fr=f'<circle cx="230" cy="142" r="20.5"/><circle cx="284" cy="142" r="20.5"/>'
        else:
            fr=f'<rect x="208" y="127" width="44" height="30" rx="9"/><rect x="262" y="127" width="44" height="30" rx="9"/>'
        out['glasses']=f'''    <g fill="#FFFFFF" fill-opacity=".08" stroke="{OL}" stroke-width="6.5">{fr}</g>
    <g fill="none" stroke="{col}" stroke-width="3.6">{fr}</g>
    <path d="M250 139 Q257 133.5 264 139" fill="none" stroke="{OL}" stroke-width="5.5" stroke-linecap="round"/><path d="M250 139 Q257 133.5 264 139" fill="none" stroke="{col}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M210 137 L197 134 M304 137 L317 134" stroke="{col}" stroke-width="3" stroke-linecap="round"/>
    <path d="M216 133 Q221 128 228 127.5 M270 133 Q275 128 282 127.5" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".7"/>\n'''
    e=cfg.get('earrings')
    if e:
        kind,col=e
        if kind=='stud':
            out['earrings']=f'    <g fill="{col}" stroke="{OL}" stroke-width="1.2"><circle cx="189" cy="168" r="2.8"/><circle cx="323" cy="167" r="2.8"/></g>\n'
        else:
            out['earrings']=f'    <g fill="none" stroke="{OL}" stroke-width="4.6"><circle cx="189" cy="175" r="6"/><circle cx="323" cy="174" r="6"/></g><g fill="none" stroke="{col}" stroke-width="2.4"><circle cx="189" cy="175" r="6"/><circle cx="323" cy="174" r="6"/></g>\n'
    if cfg.get('beard'):
        out['beard']='''    <path fill="url(#browG)" opacity=".92" d="M196 146 Q192 202 256 215 Q320 202 316 146 Q312 166 302 174 Q290 180 285 188 Q281 200 270 203.5 Q256 207.5 242 203.5 Q231 200 227 188 Q222 180 210 174 Q200 166 196 146 Z"/>
    <path fill="url(#stubble)" d="M196 146 Q192 202 256 215 Q320 202 316 146 Q312 166 302 174 Q290 180 285 188 Q281 200 270 203.5 Q256 207.5 242 203.5 Q231 200 227 188 Q222 180 210 174 Q200 166 196 146 Z"/>
    <path d="M204 168 Q214 182 230 190 M308 168 Q298 182 282 190 M244 207 Q256 211 268 207" fill="none" stroke="#6E3519" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>
'''
        out['mustache']='    <path class="o" stroke-width="1.6" fill="url(#browG)" d="M240 183 Q248 176.5 257.5 180 Q267 176.5 275 183 Q266 185.5 257.5 182.5 Q249 185.5 240 183 Z"/>\n'
    return out
