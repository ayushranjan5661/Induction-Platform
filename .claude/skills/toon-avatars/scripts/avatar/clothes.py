from .helpers import *
from .base import P
OL='#2E1E16'
PANEL_L="M232 226 Q212 228 198 238 Q188 246 190 264 L197 342 Q198 356.5 212 358 L241 358 L239 252 Q238 236 232 226 Z"
PANEL_R=mirror(PANEL_L,256)
TORSO="M232 226 Q212 228 198 238 Q188 246 190 264 L197 342 Q198 356.5 212 358 L300 358 Q314 356.5 315 342 L322 264 Q324 246 314 238 Q300 228 280 226 Q256 238 232 226 Z"
SHADE='  <path fill="#B5401F" opacity=".65" d="M318 264 L313 342 Q312 352 302 354 L302 302 Q308 282 314 260 Z"/>\n  <path d="M202 250 Q212 238 226 234" fill="none" stroke="#EF7A4E" stroke-width="4" stroke-linecap="round" opacity=".85"/>\n'
def ribband(x,w,fill,dark,stripe=None):
    s=f'  <rect class="o" fill="{fill}" x="{x}" y="342" width="{w}" height="16" rx="5"/>\n'
    s+='  <path d="'+' '.join(f'M{xx} 345 v10' for xx in range(x+4,x+w-2,5))+f'" stroke="{dark}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>\n'
    if stripe: s+=f'  <path d="M{x+1} 347.5 H{x+w-1} M{x+1} 352 H{x+w-1}" stroke="{stripe}" stroke-width="2"/>\n'
    return s
TEE_NECK='  <path class="o" stroke-width="2.2" fill="#5E5550" d="M229 227 Q256 252 283 227 L279 222 Q256 245 233 222 Z"/>\n'
def tee_graphic(kind,col,dy=0):
    if not kind: return ''
    if kind=='star': d="M256 262 L261 275 L275 275 L264 283 L268 297 L256 289 L244 297 L248 283 L237 275 L251 275 Z"
    if kind=='heart': d="M256 296 Q236 282 238 270 Q240 260 250 262 Q255 263 256 269 Q257 263 262 262 Q272 260 274 270 Q276 282 256 296 Z"
    if kind=='bolt': d="M262 258 L244 284 L255 284 L250 304 L270 276 L259 276 Z"
    tr=f' transform="translate(0 {dy})"' if dy else ''
    return f'  <path class="o" stroke-width="2" fill="{col}"{tr} d="{d}"/>\n'
def top(kind, c):
    """returns torso block (hood..panels) ; c = colour/token dict"""
    neck=P['neck']; sh=P['shoulders']
    if kind=='zip':
        inner=P['inner']+(tee_graphic(c.get('graphic'),c.get('gcol'),c.get('graphic_dy',0)) if c.get('graphic') else '')
        return P['hood']+inner+neck+P['collar']+sh+P['panels']
    if kind=='pullover':
        cords=''
        for cls,x0,x1,y1 in (('str1',249,247,292),('str2',265,267,290)):
            cords+=f'  <g class="{cls}"><path d="M{x0} 250 L{x1} {y1}" stroke="{OL}" stroke-width="5.6" stroke-linecap="round"/><path d="M{x0} 250 L{x1} {y1}" stroke="#F4EEE8" stroke-width="3.4" stroke-linecap="round"/><rect class="o" fill="#B5401F" stroke-width="1.6" x="{x1-2.8}" y="{y1-3}" width="5.6" height="10" rx="2"/></g>\n'
        return (P['hood']+sh+f'  <path class="o" fill="url(#jacketW)" d="{TORSO}"/>\n'+SHADE
            +'  <path class="o" stroke-width="2.4" fill="url(#jacketW)" d="M219 298 Q256 291 293 298 Q299 318 301 338 L211 338 Q213 318 219 298 Z"/>\n'
            +'  <path d="M221 300 Q215 318 214 336 M291 300 Q297 318 298 336" fill="none" stroke="#8E2F14" stroke-width="2.6" stroke-linecap="round"/>\n'
            +'  <path d="M223 303 Q256 297 289 303" fill="none" stroke="#E46A3A" stroke-width="1.1" stroke-dasharray="2.4 1.8"/>\n'
            +ribband(197,118,'#B5401F','#93330F')
            +neck+'  <path class="o" fill="#A83A18" d="M222 232 Q256 272 290 232 L282 225 Q256 258 230 225 Z"/>\n'
            +'  <circle cx="249" cy="251" r="2.2" fill="#C9C4BC" stroke="#2E1E16" stroke-width="1"/><circle cx="265" cy="251" r="2.2" fill="#C9C4BC" stroke="#2E1E16" stroke-width="1"/>\n'+cords)
    if kind=='sweater':
        pat=''
        if c.get('stripes'): pat=f'  <path fill="url(#stripes)" d="{TORSO}"/>\n'
        return (sh+f'  <path class="o" fill="url(#jacketW)" d="{TORSO}"/>\n'+pat+SHADE
            +'  <path fill="url(#knit)" d="'+TORSO+'"/>\n'
            +tee_graphic(c.get('graphic'),c.get('gcol'),c.get('graphic_dy',0))
            +ribband(197,118,'#B5401F','#93330F')+neck
            +'  <path class="o" fill="#A83A18" d="M226 225 Q256 254 286 225 L281 219 Q256 246 231 219 Z"/>\n'
            +'  <path d="'+' '.join(f'M{fmt(256+ (k-7)*3.6)} {fmt(236+abs(k-7)**1.55*0.36)} l{fmt((k-7)*0.25)} 6' for k in range(15))+'" stroke="#7E2810" stroke-width="1" opacity=".7"/>\n')
    if kind in ('denim','flannel'):
        fl = kind=='flannel'
        st=c.get('stitch','#9C3517')
        HEM="M197 342 L241 342 L241 358 L212 358 Q198 356.5 197 342 Z"
        flap_l="M233 224 Q219 228 208 240 L223 270 L237 247 Q237 236 233 224 Z"
        pk_l="M210 266 L232 264 L233 290 Q222 293 211 290 Z"; pf_l="M208.5 261 L234 259 L234.5 270 L222 274.5 L209 271 Z"
        two=lambda d,extra='': f'  <path class="o" stroke-width="2" fill="url(#jacketW)" d="{d}"/>\n  <path class="o" stroke-width="2" fill="url(#jacketW)" d="{mirror(d,256)}"/>\n'+(f'  <path fill="url(#plaid)" d="{d} {mirror(d,256)}"/>\n' if fl else '')
        out=['  <path class="o" fill="url(#jacketW)" d="M224 228 Q256 214 288 228 L286 238 Q256 226 226 238 Z"/>\n',
             P['inner'], tee_graphic(c.get('graphic'),c.get('gcol'),c.get('graphic_dy',0)), neck, TEE_NECK, sh,
             f'  <path class="o" fill="url(#jacketW)" d="{PANEL_L}"/>\n  <path class="o" fill="url(#jacketW)" d="{PANEL_R}"/>\n']
        if fl: out.append(f'  <path fill="url(#plaid)" d="{PANEL_L} {PANEL_R}"/>\n')
        out.append(SHADE)
        if not fl:
            out.append(f'  <path d="M200 254 Q216 249 236 252 M312 254 Q296 249 276 252 M221 292 L223 342 M291 292 L289 342 M236.5 256 L238 340 M275.5 256 L274 340" fill="none" stroke="{st}" stroke-width="1.2" stroke-dasharray="2.4 1.8"/>\n')
        else:
            out.append(f'  <path d="M236.5 256 L238 340" fill="none" stroke="{st}" stroke-width="1.2" stroke-dasharray="2.4 1.8"/>\n')
        out += [two(pk_l), two(pf_l), two(HEM)]
        if not fl:
            out.append(f'  <path d="M199 345.5 H239 M273 345.5 H313" stroke="{st}" stroke-width="1.1" stroke-dasharray="2.4 1.8"/>\n')
            btn=[(222,271),(290,271),(235,300),(235,325),(219,350),(293,350)]; bf='#C9A15A'
        else:
            btn=[(222,271),(290,271),(235,282),(235,306),(235,330)]; bf='#ECE6DA'
        out.append(f'  <g fill="{bf}" stroke="{OL}" stroke-width="1.1">'+''.join(f'<circle cx="{x}" cy="{y}" r="2.5"/>' for x,y in btn)+'</g>\n')
        out.append(two(flap_l).replace('stroke-width="2"','stroke-width="2.4"'))
        if not fl:
            out.append(f'  <path d="M231 230 Q221 234 213 243 L224 263 M281 230 Q291 234 299 243 L288 263" fill="none" stroke="{st}" stroke-width="1.1" stroke-dasharray="2.4 1.8"/>\n')
        return ''.join(out)
    if kind in ('bomber','varsity'):
        R,RD,STR=c['rib'],shade(c['rib'],-.12),c.get('stripe')
        collar=(f'  <path class="o" fill="{R}" d="M219 231 Q256 211 293 231 L291 244 Q256 226 221 244 Z"/>\n'
            +'  <path d="'+' '.join(f'M{fmt(221+k*5.4)} {fmt(232-math.sin(math.pi*k/13)*9)} l0 {fmt(9)}' for k in range(14))+f'" stroke="{RD}" stroke-width="1.1" opacity=".8"/>\n')
        body=(collar+P['inner']+(tee_graphic(c.get('graphic'),c.get('gcol'),c.get('graphic_dy',0)) if c.get('graphic') else '')+neck+TEE_NECK+sh
            +f'  <path class="o" fill="url(#jacketW)" d="{PANEL_L}"/>\n  <path class="o" fill="url(#jacketW)" d="{PANEL_R}"/>\n'+SHADE
            +'  <path d="M214 262 Q212 300 216 336 M296 262 Q300 300 296 336" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity=".12"/>\n'
            +ribband(197,44,R,RD,STR)+ribband(271,44,R,RD,STR))
        if kind=='bomber':
            body+=P['zipper']
            if c.get('patch'):
                body+=f'  <circle class="o" stroke-width="2" cx="290" cy="276" r="9" fill="{c["patch"]}"/>\n  <path d="M290 270 L292 275 L297 275 L293 278 L294.5 283 L290 280 L285.5 283 L287 278 L283 275 L288 275 Z" fill="#FFFFFF" opacity=".9"/>\n'
        else:
            L=c.get('letter','A')
            body+=f'  <g fill="#E9E3D6" stroke="{OL}" stroke-width="1.1">'+''.join(f'<circle cx="236" cy="{y}" r="2.4"/>' for y in (262,286,310,334))+'</g>\n'
            body+=f'  <text x="219" y="296" text-anchor="middle" font-family="Georgia, \'Times New Roman\', serif" font-weight="700" font-size="30" fill="{c["letterfill"]}" stroke="{c["letteredge"]}" stroke-width="3" paint-order="stroke" stroke-linejoin="round">{L}</text>\n'
        return body
def arms(kind, c):
    a=P['arms']
    if kind in ('bomber','varsity'):
        a=a.replace('<rect class="o" fill="#B5401F" x="307" y="318" width="34" height="16" rx="7"/>',f'<rect class="o" fill="{c["rib"]}" x="307" y="318" width="34" height="16" rx="7"/>')
        a=a.replace('stroke="#93330F"',f'stroke="{shade(c["rib"],-.12)}"')
        if c.get('stripe'):
            a=a.replace(f'<rect class="o" fill="{c["rib"]}" x="307" y="318" width="34" height="16" rx="7"/>',f'<rect class="o" fill="{c["rib"]}" x="307" y="318" width="34" height="16" rx="7"/><path d="M308 323.5 H340 M308 328 H340" stroke="{c["stripe"]}" stroke-width="1.8"/>')
    if kind=='varsity':
        a=a.replace('url(#jacketWm)','url(#sleeveWm)').replace('url(#jacketW)','url(#sleeveW)')
    if kind=='flannel':
        a=re.sub(r'(<path d="([^"]+)" fill="url\(#jacketWm?\)"/>)', lambda m: m.group(1)+f'<path d="{m.group(2)}" fill="url(#plaid)"/>', a)
        a=re.sub(r'(<circle cx="310" cy="251" r="18" fill="url\(#jacketWm?\)"/>)', lambda m: m.group(1)+'<circle cx="310" cy="251" r="18" fill="url(#plaid)"/>', a)
    return a
# ---------------- bottoms ----------------
LEG="M212 328 L258 328 L257 348 Q250 372 247 394 Q244.5 412 243.5 426 Q221 433 198.5 427 Q199 412 201 394 Q204 368 210 350 Z"
def bottoms(kind, c):
    if kind=='jeans':
        return P['legs'].replace('#C9A464',c.get('stitch','#C9A464'))+P['fly'].replace('#C9A464',c.get('stitch','#C9A464'))
    use='<use xlink:href="#legL" transform="matrix(-1 0 0 1 512 0)"/>\n'
    if kind in ('chinos','cargo'):
        g=(f'<g id="legL">\n  <path class="o" fill="url(#jeansG)" d="{LEG}"/>\n'
           '  <path fill="#56627A" opacity=".7" d="M256 352 Q249 376 246.5 396 Q244 413 243 425 L236 426.5 Q238 412 240.5 394 Q244 372 250 352 Z"/>\n'
           '  <path d="M223 356 Q222 392 221.5 428" fill="none" stroke="#56616F" stroke-width="1.4" opacity=".75"/>\n  <path d="M226 358 Q225.5 392 225 427" fill="none" stroke="#97A4B6" stroke-width="1.6" opacity=".6"/>\n'
           '  <path d="M207 391 Q216 395 223 392 M202.5 412 Q212 416 222 412.5 M225.5 414 Q234 418 242.5 413" fill="none" stroke="#56616F" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>\n'
           '  <path d="M199.3 423.8 Q221 430 243.2 422.8" fill="none" stroke="#525D6C" stroke-width="1.4" stroke-linecap="round"/>\n')
        if kind=='cargo':
            g+=('  <path class="o" stroke-width="2" fill="url(#jeansG)" d="M204 376 L222 374 L223 404 L206 406 Q204 391 204 376 Z"/>\n'
                '  <path d="M207 380 L220 378.5 M206.5 401 L220.5 399.5" fill="none" stroke="#56616F" stroke-width="1" stroke-dasharray="2 1.6"/>\n'
                '  <path class="o" stroke-width="2" fill="url(#jeansG)" d="M203 371 L223 369 L223.5 380 L203.5 382 Z"/>\n  <circle cx="213.3" cy="377" r="1.8" fill="#525D6C"/>\n')
        g+='</g>\n'
        fly='<path d="M256 350 L256 372" stroke="#47526A" stroke-width="1.5" stroke-linecap="round"/>\n<path d="M262.5 350 L262.5 366 Q262.5 371.5 257 373.5" fill="none" stroke="#525D6C" stroke-width="1.2" stroke-dasharray="2.4 1.8"/>\n'
        return '<!-- Pants -->\n'+g+use+fly
    if kind=='joggers':
        J="M212 328 L258 328 L257 348 Q251 372 248 392 Q245.5 405 242 414 L203 414 Q199 404 200 392 Q203 368 210 350 Z"
        S=c.get('stripe','#F2F0EB')
        g=(f'<g id="legL">\n  <path class="o" fill="url(#jeansG)" d="{J}"/>\n'
           '  <path fill="#56627A" opacity=".7" d="M256 352 Q250 376 247 396 Q245 406 242 413 L236 413 Q239 404 241 394 Q244 372 250 352 Z"/>\n'
           f'  <path d="M210.5 352 Q205 372 203 392 Q202 404 203.5 413" fill="none" stroke="{OL}" stroke-width="6.4" stroke-linecap="butt" opacity=".25"/>\n'
           f'  <path d="M211 352 Q205.5 372 203.6 392 Q202.6 404 204 413" fill="none" stroke="{S}" stroke-width="2"/>\n  <path d="M215 352 Q209.5 372 207.6 392 Q206.6 404 208 413" fill="none" stroke="{S}" stroke-width="2"/>\n'
           '  <path d="M210 400 Q216 406 214 413 M222 401 Q224 407 222 413 M234 400 Q232 406 234 413" fill="none" stroke="#56616F" stroke-width="1.4" stroke-linecap="round"/>\n'
           '  <path class="o" fill="#5C687B" d="M202.5 411 L242.5 411 Q244 419 241 427 Q222 431.5 204 427 Q201 419 202.5 411 Z"/>\n'
           '  <path d="'+' '.join(f'M{x} {413} v12' for x in range(206,242,3))+'" stroke="#47526A" stroke-width="1" opacity=".8"/>\n</g>\n')
        return '<!-- Joggers -->\n'+g+use+'<path d="M256 350 L256 368" stroke="#47526A" stroke-width="1.5" stroke-linecap="round"/>\n'
    if kind=='skirt':
        T,TD=c['tights'],shade(c['tights'],-.1)
        leg=f'<g id="legL">\n  <path class="o" fill="{T}" d="M206 372 L234 372 L233 430 Q220 433 207 430 Z"/>\n  <path fill="{TD}" d="M226 372 L234 372 L233 429 L226 430 Z"/>\n  <path d="M212 376 L211 424" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".12"/>\n</g>\n'
        SK="M211 338 L301 338 L318 397 Q256 410 194 397 Z"
        sk=(f'<path class="o" fill="url(#jeansG)" d="{SK}"/>\n'+(f'<path fill="url(#plaid)" d="{SK}"/>\n' if c.get('plaid') else '')
            +'<path d="M229 342 L222 402 M243 342 L240 405 M256 342 L256 406 M269 342 L272 405 M283 342 L290 402" fill="none" stroke="#47526A" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>\n'
            +'<path d="M197 393 Q256 405 315 393" fill="none" stroke="#97A4B6" stroke-width="1.2" stroke-dasharray="2.4 1.8"/>\n'
            +'<path fill="#56627A" opacity=".5" d="M301 338 L318 397 Q312 399 306 400 L294 338 Z"/>\n')
        return '<!-- Skirt -->\n'+leg+use+sk
    if kind=='shorts':
        SA=c.get('sockacc','#E2574C')
        leg=('<g id="legL">\n  <path class="o" fill="url(#skinH)" d="M206 376 L234 376 L233 430 L207 430 Z"/>\n'
             '  <path d="M210 398 Q220 402 230 398" fill="none" stroke="#C98663" stroke-width="1.6" stroke-linecap="round"/>\n  <path fill="#C98663" opacity=".35" d="M226 378 L234 378 L233 430 L227 430 Z"/>\n'
             f'  <path class="o" fill="url(#sockG)" d="M206.5 408 L233.5 408 L233 431 L207 431 Z"/>\n  <path d="M207 412 H233 M207 416 H233" stroke="{SA}" stroke-width="2.2"/>\n</g>\n')
        SH="M210 334 L302 334 L315 386 Q288 392 262 386 L256 368 L250 386 Q224 392 197 386 Z"
        sh=(f'<path class="o" fill="url(#jeansG)" d="{SH}"/>\n'
            '<path d="M199 380 Q224 386 249 380 M263 380 Q288 386 313 380" fill="none" stroke="#525D6C" stroke-width="1.4"/>\n'
            '<path d="M256 340 L256 366" stroke="#47526A" stroke-width="1.5"/>\n<path fill="#56627A" opacity=".6" d="M256 368 L250 386 L244 387 L252 360 Z"/>\n')
        return '<!-- Shorts -->\n'+leg+use+sh
