#!/usr/bin/env python3
"""Render avatar SVGs to PNG / GIF / MP4 / WebM / sprite sheets / frame sequences.

Needs:  pip install playwright pillow  &&  python -m playwright install chromium
        ffmpeg on PATH for gif/mp4/webm (png, sprites and frames work without it)

Examples
  python render.py assets/avatars/*.svg --formats png,gif --out assets/avatars/render
  python render.py avatars/*.svg --formats png --size 1024 --pose 1.5
  python render.py avatars/*.svg --formats sprites --fps 12 --frame-size 256      # game sprite sheets + JSON
  python render.py avatars/*.svg --formats webm   # keeps transparency if the SVG was generated with --transparent
"""
import argparse, asyncio, glob, json, math, os, shutil, subprocess, sys, tempfile
LOOP = 6.0   # every avatar loops in exactly 6 s

def need_ffmpeg():
    if not shutil.which('ffmpeg'):
        print('ffmpeg not found: skipping gif/mp4/webm (install ffmpeg to enable)'); return False
    return True

async def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('svgs', nargs='+', help='SVG files or globs')
    ap.add_argument('--out', required=True)
    ap.add_argument('--formats', default='png,gif', help='comma list: png,gif,mp4,webm,sprites,frames')
    ap.add_argument('--size', type=int, default=1080, help='PNG still size in px (default 1080)')
    ap.add_argument('--pose', type=float, default=1.5, help='time in seconds for the PNG still (1.5 = mid-wave, 0 = rest)')
    ap.add_argument('--gif-size', type=int, default=512)
    ap.add_argument('--video-size', type=int, default=1080)
    ap.add_argument('--fps', type=int, default=0, help='frames per second (default: gif 15, video 30, sprites 12)')
    ap.add_argument('--frame-size', type=int, default=256, help='sprite/frame cell size in px')
    ap.add_argument('--matte', default='#FFFFFF', help='background colour for MP4 when the SVG is transparent')
    a = ap.parse_args()
    files = []
    for g in a.svgs: files += sorted(glob.glob(g)) or ([g] if os.path.exists(g) else [])
    if not files: sys.exit('no SVG files found')
    fmts = {f.strip() for f in a.formats.split(',') if f.strip()}
    ff = need_ffmpeg() if fmts & {'gif', 'mp4', 'webm'} else False
    os.makedirs(a.out, exist_ok=True)
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        sys.exit('playwright missing: pip install playwright pillow && python -m playwright install chromium')
    async with async_playwright() as p:
        br = await p.chromium.launch()
        async def page(px):
            return await br.new_page(viewport={'width': 512, 'height': 512}, device_scale_factor=px / 512)
        async def frames(path, px, fps, folder):
            pg = await page(px); await pg.goto('file://' + os.path.abspath(path)); await pg.wait_for_timeout(150)
            n = int(round(LOOP * fps))
            for i in range(n):
                await pg.evaluate(f'document.getAnimations().forEach(x=>{{x.pause();x.currentTime={i * 1000 / fps};}})')
                await pg.screenshot(path=os.path.join(folder, f'{i:04d}.png'), omit_background=True)
            await pg.close(); return n
        for f in files:
            name = os.path.splitext(os.path.basename(f))[0]
            transparent = 'url(#bg)' not in open(f, encoding='utf-8').read()
            if 'png' in fmts:
                pg = await page(a.size); await pg.goto('file://' + os.path.abspath(f)); await pg.wait_for_timeout(150)
                await pg.evaluate(f'document.getAnimations().forEach(x=>{{x.pause();x.currentTime={a.pose * 1000};}})')
                await pg.screenshot(path=os.path.join(a.out, name + '.png'), omit_background=True); await pg.close()
            if ff and 'gif' in fmts:
                fps = a.fps or 15; tmp = tempfile.mkdtemp(); await frames(f, a.gif_size, fps, tmp)
                pal = 'palettegen=max_colors=200:stats_mode=diff' + (':reserve_transparent=1' if transparent else '')
                use = 'paletteuse=dither=sierra2_4a:diff_mode=rectangle' + (':alpha_threshold=128' if transparent else '')
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/%04d.png', '-vf', f'split[x][y];[x]{pal}[p];[y][p]{use}', '-loop', '0', os.path.join(a.out, name + '.gif')], check=True)
                shutil.rmtree(tmp)
            if ff and fmts & {'mp4', 'webm'}:
                fps = a.fps or 30; tmp = tempfile.mkdtemp(); n = await frames(f, a.video_size, fps, tmp)
                if 'mp4' in fmts:
                    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'color=c={a.matte}:s={a.video_size}x{a.video_size}:r={fps}', '-framerate', str(fps), '-i', f'{tmp}/%04d.png',
                                    '-filter_complex', f'[0][1]overlay=shortest=1,loop=1:{n}:0', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(a.out, name + '.mp4')], check=True)
                if 'webm' in fmts:
                    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-framerate', str(fps), '-i', f'{tmp}/%04d.png', '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p' if transparent else 'yuv420p',
                                    '-b:v', '0', '-crf', '30', '-auto-alt-ref', '0', os.path.join(a.out, name + '.webm')], check=True)
                shutil.rmtree(tmp)
            if fmts & {'sprites', 'frames'}:
                fps = a.fps or 12; tmp = tempfile.mkdtemp(); n = await frames(f, a.frame_size, fps, tmp)
                if 'frames' in fmts:
                    dst = os.path.join(a.out, name + '_frames'); shutil.rmtree(dst, ignore_errors=True); shutil.copytree(tmp, dst)
                if 'sprites' in fmts:
                    from PIL import Image
                    cols = math.ceil(math.sqrt(n)); rows = math.ceil(n / cols); s = a.frame_size
                    sheet = Image.new('RGBA', (cols * s, rows * s), (0, 0, 0, 0))
                    for i in range(n):
                        sheet.paste(Image.open(os.path.join(tmp, f'{i:04d}.png')).convert('RGBA'), ((i % cols) * s, (i // cols) * s))
                    sheet.save(os.path.join(a.out, name + '_sheet.png'))
                    meta = {'image': name + '_sheet.png', 'frame_width': s, 'frame_height': s, 'columns': cols, 'rows': rows, 'frame_count': n,
                            'fps': fps, 'loop_seconds': LOOP, 'loop': True,
                            'frames': [{'index': i, 'x': (i % cols) * s, 'y': (i // cols) * s, 'w': s, 'h': s, 'duration_ms': round(1000 / fps)} for i in range(n)]}
                    json.dump(meta, open(os.path.join(a.out, name + '_sheet.json'), 'w'), indent=1)
                shutil.rmtree(tmp)
            print('rendered', name)
        await br.close()

if __name__ == '__main__':
    asyncio.run(main())
