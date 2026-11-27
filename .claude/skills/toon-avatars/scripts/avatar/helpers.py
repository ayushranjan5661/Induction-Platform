import re, math, colorsys
def fmt(v):
    s=f"{v:.2f}".rstrip('0').rstrip('.'); return s if s not in ('-0','') else '0'
def mirror(d, x0):
    toks=re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?', d); out=[]; cmd=None; i=0
    for t in toks:
        if t.isalpha(): cmd=t; out.append(t); i=0; continue
        v=float(t)
        if cmd in 'MLQCTS' and i%2==0: v=2*x0-v
        elif cmd=='H': v=2*x0-v
        elif cmd=='A':
            k=i%7
            if k==4: v=1-v
            if k==5: v=2*x0-v
        out.append(fmt(v)); i+=1
    return ' '.join(out)
def both(d, x0=256): return d+' '+mirror(d,x0)
# ---- colour remapping (keeps shading relationships) ----
def h2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16)/255 for i in (0,2,4))
def rgb2h(r,g,b): return '#%02X%02X%02X'%tuple(max(0,min(255,round(c*255))) for c in (r,g,b))
def remap(c, base, target):
    h,l,s=colorsys.rgb_to_hls(*h2rgb(c)); hb,lb,sb=colorsys.rgb_to_hls(*h2rgb(base)); ht,lt,st=colorsys.rgb_to_hls(*h2rgb(target))
    h2=(ht+(h-hb))%1
    l2 = lt+(l-lb)*(1-lt)/(1-lb) if l>=lb else lt-(lb-l)*(lt/lb)
    s2 = st*(s/sb) if sb>0.02 else st
    return rgb2h(*colorsys.hls_to_rgb(h2,max(0,min(1,l2)),max(0,min(1,s2))))
def recolor(seg, colors, base, target):
    if target is None: return seg
    mp={c.upper():remap(c,base,target) for c in colors}
    return re.sub(r'#[0-9A-Fa-f]{6}', lambda m: mp.get(m.group(0).upper(), m.group(0)), seg)
def shade(c, dl):  # lighten(+)/darken(-) in HLS lightness
    h,l,s=colorsys.rgb_to_hls(*h2rgb(c)); return rgb2h(*colorsys.hls_to_rgb(h,max(0,min(1,l+dl)),s))
def grad_recolor(top, gid, colors, base, target):
    m=re.search(r'<(linear|radial)Gradient id="%s".*?</\1Gradient>'%gid, top, flags=re.S)
    if not m: return top
    return top[:m.start()]+recolor(m.group(0),colors,base,target)+top[m.end():]
# ---- scalloped shapes for curly hair ----
def scallop_ellipse(cx,cy,rx,ry,n,amp,phase=0.0):
    pts=[(cx+rx*math.cos(2*math.pi*k/n+phase), cy+ry*math.sin(2*math.pi*k/n+phase)) for k in range(n)]
    d=f"M{fmt(pts[0][0])} {fmt(pts[0][1])}"
    for k in range(n):
        p0=pts[k]; p1=pts[(k+1)%n]; mx=(p0[0]+p1[0])/2; my=(p0[1]+p1[1])/2
        vx,vy=mx-cx,my-cy; L=math.hypot(vx,vy) or 1
        d+=f" Q{fmt(mx+vx/L*amp*2)} {fmt(my+vy/L*amp*2)} {fmt(p1[0])} {fmt(p1[1])}"
    return d+" Z"
def scallop_line(pts, amp, ref):
    d=""
    for k in range(len(pts)-1):
        p0=pts[k]; p1=pts[k+1]; mx=(p0[0]+p1[0])/2; my=(p0[1]+p1[1])/2
        nx,ny=-(p1[1]-p0[1]),(p1[0]-p0[0]); L=math.hypot(nx,ny) or 1; nx/=L; ny/=L
        if (ref[0]-mx)*nx+(ref[1]-my)*ny<0: nx,ny=-nx,-ny
        d+=f" Q{fmt(mx+nx*amp*2)} {fmt(my+ny*amp*2)} {fmt(p1[0])} {fmt(p1[1])}"
    return d
def arc_pts(cx,cy,rx,ry,a0,a1,n):
    return [(cx+rx*math.cos(math.radians(a0+(a1-a0)*k/(n-1))), cy+ry*math.sin(math.radians(a0+(a1-a0)*k/(n-1)))) for k in range(n)]
