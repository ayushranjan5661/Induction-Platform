from .helpers import *
from .base import P
OL='#2E1E16'
DK='#6E3519'   # strand colour (hair family)
SH='#D99459'   # shine (hair family)
def strands(d,w=2.2,op=1): return f'    <path d="{d}" fill="none" stroke="{DK}" stroke-width="{w}" stroke-linecap="round" opacity="{op}"/>\n'
def shine(d,op=.5): return f'    <path fill="{SH}" opacity="{op}" d="{d}"/>\n'
def curls(pts): return '    <path d="'+' '.join(f'M{x} {y} q3 -4.5 6.5 -.5' for x,y in pts)+f'" fill="none" stroke="{DK}" stroke-width="1.8" stroke-linecap="round"/>\n'
BACK_STD="M186 160 Q174 76 256 60 Q338 76 326 160 Z"
BUZZ_F="M193 130 Q188 90 222 72 Q256 60 290 72 Q324 90 319 130 Q314 112 303 104 Q282 97 256 99 Q230 97 209 104 Q198 112 193 130 Z"
def style(name, acc=None, hat=None):
    h={'tail':'','back':'','braids':'','front':'','cast':None,'noears':False,'hijab_back':''}
    if name=='swoosh':
        h['back']=P['h1_back']; h['front']=P['h1_front']
        h['cast']="M188 142 Q180 118 188 102 Q168 98 158 86 Q180 82 192 86 Q198 60 226 50 Q252 32 284 42 Q312 48 324 72 Q344 68 358 80 Q342 86 334 98 Q340 122 330 148 Q324 128 316 110 Q300 96 280 98 Q284 88 270 82 Q262 96 240 96 Q222 98 212 104 Q202 112 202 136 Z"
    elif name=='buzz':
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M188 158 Q178 96 220 70 Q256 54 292 70 Q334 96 324 158 Q318 136 312 122 L200 122 Q194 136 188 158 Z"/>\n'
        h['front']=f'    <path class="o" fill="url(#hairG)" d="{BUZZ_F}"/>\n    <path fill="url(#stubble)" d="{BUZZ_F}"/>\n'+shine("M214 84 Q240 68 280 72 Q262 72 240 78 Q224 82 216 90 Z",.45)
        h['cast']=BUZZ_F
    elif name=='afro':
        A=scallop_ellipse(256,102,94,80,22,7.5,0.15)
        hl=[(322,134)]+arc_pts(256,140,66,44,-20,-160,9)+[(190,134)]
        F="M190 136 Q184 70 256 56 Q328 70 322 136"+scallop_line(hl,4.5,(256,170))+" Z"
        edge="M322 136"+scallop_line(hl,4.5,(256,170))
        h['back']=f'    <path class="o" fill="url(#hairG)" d="{A}"/>\n'+curls([(178,92),(196,62),(222,44),(262,36),(300,46),(326,66),(338,98),(186,128),(330,130),(208,40),(286,30),(170,116),(344,116)])
        h['front']=f'    <path fill="url(#hairG)" d="{F}"/>\n    <path d="{edge}" fill="none" stroke="{OL}" stroke-width="3" stroke-linejoin="round"/>\n'+curls([(214,88),(236,78),(258,74),(280,78),(300,88),(226,64),(252,58),(276,62)])+shine("M200 70 Q236 40 290 44 Q262 46 236 56 Q214 64 204 78 Z",.35)
        h['cast']=F
    elif name=='curls':
        A=scallop_ellipse(256,112,90,80,22,6.5,0.1)
        SL=scallop_ellipse(186,176,28,58,12,5.5,0.3); SR=scallop_ellipse(326,176,28,58,12,5.5,0.3)
        hl=[(324,150)]+arc_pts(256,142,64,46,-14,-166,10)+[(188,150)]
        F="M188 152 Q182 70 256 58 Q330 70 324 152"+scallop_line(hl,4,(256,175))+" Z"
        edge="M324 152"+scallop_line(hl,4,(256,175))
        h['back']=f'    <path class="o" fill="url(#hairB)" d="{SL}"/>\n    <path class="o" fill="url(#hairB)" d="{SR}"/>\n    <path class="o" fill="url(#hairB)" d="{A}"/>\n'+curls([(170,128),(166,168),(172,206),(184,226),(328,226),(340,206),(346,168),(342,128),(190,64),(322,64),(216,42),(296,42),(256,34),(180,96),(334,96)])
        h['front']=f'    <path fill="url(#hairG)" d="{F}"/>\n    <path d="{edge}" fill="none" stroke="{OL}" stroke-width="3" stroke-linejoin="round"/>\n'+curls([(212,90),(234,80),(256,76),(278,80),(298,90),(222,66),(250,60),(278,64),(198,118),(312,118)])+shine("M204 74 Q236 48 288 52 Q262 54 238 62 Q216 70 208 82 Z",.35)
        h['cast']=F
    elif name in ('long','braids'):
        CAP="M196 124 Q186 70 256 62 Q326 70 316 124 Q306 100 280 94 Q264 92 256 102 Q248 92 232 94 Q206 100 196 124 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M178 200 Q164 70 256 58 Q348 70 334 200 Z"/>\n' if name=='long' else f'    <path class="o" fill="url(#hairB)" d="{BACK_STD}"/>\n'
        lock="M199 100 Q179 128 177 180 Q175 238 182 292 Q187 299 193 294 Q197 300 204 295 Q208 298 211 292 Q205 244 206 196 Q207 150 215 116 Z"
        if name=='long':
            h['front']=(f'    <path class="o" fill="url(#hairG)" d="{lock}"/>\n    <path class="o" fill="url(#hairG)" d="{mirror(lock,256)}"/>\n'
                +strands(both("M188 150 Q184 210 190 284 M198 170 Q196 230 200 288"),1.8,.85)
                +f'    <path class="o" fill="url(#hairG)" d="{CAP}"/>\n'+strands("M256 66 L256 100 M236 92 Q220 80 228 66 M276 92 Q292 80 284 66",1.8)
                +shine("M208 82 Q240 62 288 66 Q300 68 306 74 Q290 70 262 71 Q232 73 212 88 Z",.5))
        else:
            seg=''
            for side in (0,1):
                for k in range(9):
                    cx=193+(1 if k%2 else -1)*1.5; cy=172+k*13
                    d=f"M{cx-11} {cy} Q{cx-11} {cy-9} {cx} {cy-9} Q{cx+11} {cy-9} {cx+11} {cy} Q{cx+11} {cy+8} {cx} {cy+8} Q{cx-11} {cy+8} {cx-11} {cy} Z"
                    if side: d=mirror(d,256)
                    seg+=f'    <path class="o" stroke-width="2.4" fill="url(#hairG)" d="{d}"/>\n'
                    sd=f"M{cx-7} {cy-4} Q{cx} {cy+3} {cx+7} {cy-4}"
                    seg+=strands(mirror(sd,256) if side else sd,1.4,.8)
                bd=f"M184 287 L202 287 L201 295 L185 295 Z"; td="M186 295 Q183 306 188 312 Q193 305 194 312 Q199 305 200 312 Q204 304 200 295 Z"
                if side: bd=mirror(bd,256); td=mirror(td,256)
                seg+=f'    <path class="o" stroke-width="2.2" fill="url(#hairG)" d="{td}"/>\n    <path class="o" stroke-width="2" fill="{acc or "#E2574C"}" d="{bd}"/>\n'
            h['braids']=seg
            side_l="M198 102 Q186 126 188 160 L204 160 Q200 128 214 112 Z"
            h['front']=(f'    <path class="o" fill="url(#hairG)" d="{side_l}"/>\n    <path class="o" fill="url(#hairG)" d="{mirror(side_l,256)}"/>\n'
                +f'    <path class="o" fill="url(#hairG)" d="{CAP}"/>\n'+strands("M256 66 L256 100 M236 92 Q220 80 228 66 M276 92 Q292 80 284 66",1.8)
                +shine("M208 82 Q240 62 288 66 Q300 68 306 74 Q290 70 262 71 Q232 73 212 88 Z",.5))
        h['cast']=CAP
    elif name=='bob':
        F="M180 208 Q170 150 182 108 Q196 64 256 60 Q316 64 330 108 Q342 150 332 208 Q321 214 309 206 Q315 166 309 124 L307 104 Q282 107 256 104 Q230 107 205 104 L203 124 Q197 166 203 206 Q191 214 180 208 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M178 206 Q162 76 256 60 Q350 76 334 206 Q320 214 306 206 L206 206 Q192 214 178 206 Z"/>\n'
        h['front']=f'    <path class="o" fill="url(#hairG)" d="{F}"/>\n'+strands("M220 84 L218 103 M236 80 L235 104 M252 78 L252 103 M268 80 L269 104 M284 82 L286 103 M298 88 L301 102",1.6,.75)+strands(both("M190 130 Q186 170 192 202"),1.6,.8)+shine("M200 82 Q236 60 292 66 Q306 70 314 80 Q292 72 262 72 Q230 74 204 92 Z",.5)
        h['cast']=F
    elif name in ('ponytail','buns'):
        F="M192 134 Q184 76 256 62 Q328 76 320 134 Q314 106 296 96 Q276 88 256 90 Q236 88 216 96 Q198 106 192 134 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="{BACK_STD}"/>\n'
        if name=='ponytail':
            T="M297 60 Q342 36 360 78 Q373 126 352 182 Q349 150 340 136 Q338 156 330 168 Q332 130 326 108 Q318 82 299 74 Z"
            h['tail']=f'    <g class="tail"><path class="o" fill="url(#hairG)" d="{T}"/>'+strands("M312 66 Q346 66 352 110 Q354 140 346 168 M306 72 Q332 80 338 116",1.6,.8).strip()+'</g>\n'
            h['front']=f'    <path class="o" fill="url(#hairG)" d="{F}"/>\n'+strands("M214 94 Q248 72 296 64 M232 90 Q266 74 302 68 M200 114 Q220 84 284 64",1.7,.8)+shine("M206 84 Q238 64 286 64 Q298 64 304 68 Q288 68 262 72 Q232 76 210 90 Z",.5)+f'    <ellipse class="o" stroke-width="2.2" cx="302" cy="64" rx="6" ry="8.5" fill="{acc or "#E2574C"}"/>\n'
        else:
            bun=''
            for cx in (212,300):
                bun+=f'    <circle class="o" cx="{cx}" cy="60" r="23" fill="url(#hairG)"/>\n'+strands(f"M{cx-12} 52 Q{cx} 40 {cx+12} 54 Q{cx+8} 70 {cx-6} 66 Q{cx-12} 58 {cx-2} 54",1.6,.85)
                bun+=f'    <path class="o" stroke-width="2" fill="{acc or "#E2574C"}" d="M{cx-16} 76 Q{cx} 84 {cx+16} 76 L{cx+14} 70 Q{cx} 77 {cx-14} 70 Z"/>\n'
            h['front']=bun+f'    <path class="o" fill="url(#hairG)" d="{F}"/>\n'+strands("M256 64 L256 90 M240 90 Q226 78 232 66 M272 90 Q286 78 280 66",1.7,.85)+shine("M206 84 Q238 64 286 64 Q298 64 304 68 Q288 68 262 72 Q232 76 210 90 Z",.45)
        h['cast']=F
    elif name=='sidepart':
        F="M191 136 Q182 92 210 72 Q248 48 300 60 Q330 72 324 128 Q318 108 304 100 Q282 92 256 96 Q238 100 224 94 L216 90 Q204 102 201 132 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="{BACK_STD}"/>\n'
        h['front']=f'    <path class="o" fill="url(#hairG)" d="{F}"/>\n'+strands("M216 90 Q213 76 222 64 M232 92 Q246 70 292 64 M246 94 Q262 76 306 72 M260 94 Q284 82 316 92",1.8,.85)+shine("M226 70 Q256 54 296 60 Q310 64 316 72 Q296 66 268 66 Q244 68 228 78 Z",.55)
        h['cast']=F
    elif name=='mohawk':
        C="M233 106 Q229 70 236 42 L245 56 L249 26 L258 47 L266 20 L271 48 L280 32 Q286 70 279 106 Q256 99 233 106 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M188 158 Q178 96 220 70 Q256 54 292 70 Q334 96 324 158 Q318 136 312 122 L200 122 Q194 136 188 158 Z" opacity=".55"/>\n'
        h['front']=f'    <path fill="url(#browG)" opacity=".62" d="{BUZZ_F}"/>\n    <path fill="url(#stubble)" d="{BUZZ_F}"/>\n    <path class="o" fill="url(#hairG)" d="{C}"/>\n'+strands("M246 98 Q244 70 249 34 M257 98 Q258 68 264 28 M268 98 Q272 70 278 40",1.6,.85)+shine("M240 92 Q238 70 244 52 Q246 72 248 92 Z",.6)
        h['cast']=C
    elif name=='curlytop':
        B=scallop_ellipse(256,73,67,34,16,6.5,0.2)
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M188 158 Q178 96 220 70 Q256 54 292 70 Q334 96 324 158 Q318 136 312 122 L200 122 Q194 136 188 158 Z" opacity=".6"/>\n'
        h['front']=f'    <path fill="url(#browG)" opacity=".62" d="{BUZZ_F}"/>\n    <path fill="url(#stubble)" d="{BUZZ_F}"/>\n    <path fill="url(#hairB)" transform="translate(0 4)" d="{B}"/>\n    <path class="o" fill="url(#hairG)" d="{B}"/>\n'+curls([(204,76),(310,74),(226,100),(288,100),(256,96)])+curls([(214,66),(232,54),(254,48),(276,52),(296,62),(222,82),(244,72),(266,70),(288,80),(234,92),(262,88),(282,94)])+shine("M216 58 Q240 42 272 44 Q252 48 236 56 Q224 62 218 70 Z",.45)
        h['cast']=B
    elif name=='wavy':
        F="M184 216 Q172 190 180 160 Q168 130 184 104 Q196 66 256 60 Q322 64 332 110 Q344 136 332 162 Q340 190 328 216 Q316 220 310 208 Q318 186 310 164 Q316 140 304 118 Q290 100 262 102 Q244 104 230 98 Q214 112 210 128 Q200 146 206 166 Q198 188 204 210 Q196 222 184 216 Z"
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M178 214 Q160 80 256 58 Q352 80 334 214 Q318 226 304 212 L208 212 Q194 226 178 214 Z"/>\n'
        h['front']=f'    <path class="o" fill="url(#hairG)" d="{F}"/>\n'+strands("M190 120 Q182 150 192 170 Q186 192 194 210 M322 120 Q330 150 320 170 Q326 192 318 210 M232 96 Q252 78 296 82 M214 104 Q230 82 270 74",1.8,.85)+shine("M206 82 Q238 60 290 64 Q304 68 312 78 Q290 70 262 71 Q232 73 210 90 Z",.5)
        h['cast']=F
    elif name in ('beanie','cap'):
        H1,H2,H3=hat
        h['back']=f'    <path class="o" fill="url(#hairB)" d="M188 158 Q178 96 220 70 Q256 54 292 70 Q334 96 324 158 Q318 136 312 122 L200 122 Q194 136 188 158 Z"/>\n'
        side="M190 148 Q184 124 192 110 L208 112 Q201 128 203 148 Z"
        fringe=f'    <path class="o" fill="url(#hairG)" d="{side}"/>\n    <path class="o" fill="url(#hairG)" d="{mirror(side,256)}"/>\n'
        if name=='beanie':
            fringe+='    <path class="o" fill="url(#hairG)" d="M222 108 Q228 122 244 126 Q238 116 241 106 Q252 120 266 120 Q258 112 260 104 Z"/>\n'
            knit=' '.join(f'M{x} {104 if abs(x-256)<50 else 110} Q{x+(x-256)*0.05} 76 {256+(x-256)*0.55} 50' for x in range(198,318,10))
            h['front']=(fringe+f'    <path class="o" fill="{H1}" d="M186 116 Q184 44 256 40 Q328 44 326 116 Z"/>\n    <path d="{knit}" fill="none" stroke="{H2}" stroke-width="1.6" opacity=".8"/>\n'
                +f'    <path class="o" fill="{H2}" d="M181 126 Q256 104 331 126 L332 104 Q256 84 180 104 Z"/>\n'
                +'    <path d="'+' '.join(f'M{x} {104+abs(x-256)*0.04+4} v{14-abs(x-256)*0.02}' for x in range(186,330,6))+f'" stroke="{shade(H2,-.1)}" stroke-width="1.4"/>\n'
                +f'    <circle class="o" cx="256" cy="36" r="15" fill="{H3}"/>\n    <path d="M246 30 q4 -4 8 0 M256 40 q4 -4 8 0 M248 42 q3 -3 6 0 M260 28 q3 -3 6 0" fill="none" stroke="{shade(H3,-.15)}" stroke-width="1.5" stroke-linecap="round"/>\n')
            h['cast']="M181 126 Q256 104 331 126 L332 104 Q256 84 180 104 Z"
        else:
            h['front']=(fringe+f'    <path class="o" fill="{H1}" d="M188 118 Q186 52 256 46 Q326 52 324 118 Q256 104 188 118 Z"/>\n'
                +f'    <path d="M256 48 L256 106 M222 54 Q213 82 216 112 M290 54 Q299 82 296 112" fill="none" stroke="{H2}" stroke-width="1.8"/>\n'
                +f'    <path class="o" stroke-width="2.2" fill="url(#hairG)" d="M236 112 Q256 88 276 112 Z"/>\n'+strands("M244 108 Q250 100 256 99 M262 106 Q266 102 270 104",1.4)
                +f'    <rect class="o" stroke-width="2" x="232" y="108" width="48" height="6" rx="2" fill="{H2}"/>\n    <rect x="252" y="107" width="8" height="8" rx="1.5" fill="#C9C4BC" stroke="{OL}" stroke-width="1.3"/>\n'
                +f'    <circle class="o" stroke-width="2" cx="256" cy="47" r="4.5" fill="{H2}"/>\n    <path d="M200 78 Q226 56 262 54" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".25"/>\n')
            h['cast']="M188 118 Q256 104 324 118 Q256 112 188 126 Z"
    elif name=='hijab':
        S1,S2,S3=hat
        h['noears']=True
        BK="M176 236 Q156 150 178 92 Q204 42 256 40 Q308 42 334 92 Q356 150 336 236 Q334 272 300 284 Q256 292 212 284 Q178 272 176 236 Z"
        h['hijab_back']=(f'    <path class="o" fill="{S1}" d="{BK}"/>\n'
            +f'    <path d="M184 220 Q192 250 214 268 M328 220 Q320 250 298 268 M200 236 Q222 262 256 266 Q290 262 312 236" fill="none" stroke="{S2}" stroke-width="2.2" stroke-linecap="round"/>\n'
            +f'    <path d="M190 120 Q186 170 200 206" fill="none" stroke="{S3}" stroke-width="4" stroke-linecap="round" opacity=".7"/>\n')
        h['front']=(f'    <path class="o" fill="{S3}" d="M191 162 Q184 82 256 68 Q328 82 321 162 Q318 118 300 96 Q282 82 256 82 Q230 82 212 96 Q194 118 191 162 Z"/>\n'
            +f'    <path d="M214 92 Q256 72 298 92" fill="none" stroke="{S2}" stroke-width="1.8" opacity=".8"/>\n')
        h['cast']="M191 162 Q184 82 256 68 Q328 82 321 162 Q318 118 300 96 Q282 82 256 82 Q230 82 212 96 Q194 118 191 162 Z"
    return h
