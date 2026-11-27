# Using the avatars in a project

Pick the section for the project's stack. In every case: keep the spec JSON next to the generated assets, and add a short note (README line or comment) with the exact regenerate command.

## Contents
- Choosing a format
- Plain HTML / CSS
- React, Next.js, Vue, Svelte, Angular
- Inline SVG (styling or scripting the avatar)
- Mobile: React Native, Flutter, iOS, Android
- Games: Phaser, PixiJS, Godot, Unity
- Email, docs, chat, social
- Performance and accessibility

## Choosing a format

| Target | Best format | Why |
|---|---|---|
| Websites and web apps | SVG via `<img>` (PNG fallback for OG images) | tiny (~35 KB), sharp, animates, no JS |
| Many avatars on one page | SVG with `animation: idle`, or PNG | fewer moving parts, calmer UI |
| React Native, Flutter, Figma | GIF, WebM, or sprite sheet | their SVG renderers ignore CSS animation; a static SVG still works |
| Games | sprite sheet PNG + JSON (`--formats sprites --transparent`) | every engine imports grids |
| Email, Slack, docs, slides | GIF or PNG | universally supported |
| Video, social posts | MP4 (`--video-size 1080`) | |
| Overlays on video or 3D | WebM with alpha (`--transparent --formats webm`) | |

## Plain HTML / CSS

```html
<img src="/avatars/maya.svg" width="160" height="160" alt="Maya waving">
```

An SVG loaded through `<img>`, CSS `background-image` or `<object>` plays its own animation and keeps its styles private, so any number can share a page. Circular crop: `border-radius: 50%; object-fit: cover; object-position: 50% 20%;` (the face sits in the upper third; use a head-and-shoulders crop with `object-position` and a slight scale on a wrapper if needed). Respect reduced motion: the SVGs already disable their animation under `prefers-reduced-motion`.

## React, Next.js, Vue, Svelte, Angular

Treat the SVGs as static assets.

React / Next.js (files in `public/avatars/`):
```tsx
type AvatarProps = { name: string; size?: number; className?: string };
export function Avatar({ name, size = 96, className }: AvatarProps) {
  const file = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return <img src={`/avatars/${file}.svg`} width={size} height={size} alt={`${name} avatar`} className={className} />;
}
```
In Next.js, `next/image` works with `unoptimized` for SVG (or set `dangerouslyAllowSVG` with a CSP as Next documents); a plain `<img>` is simplest. With bundlers (Vite, webpack) you can also `import mayaUrl from "./avatars/maya.svg?url"`; avoid SVG-to-component loaders (SVGR) unless you generated with `--inline-safe`, because they inline the markup.

Vue: `<img :src="`/avatars/${slug}.svg`" :alt="`${name} avatar`" />`. Svelte: `<img src={`/avatars/${slug}.svg`} alt="{name} avatar" />`. Angular: put files under `src/assets/avatars/` and bind `[src]`.

A typed manifest is handy for larger casts: generate it from the spec (`name`, `file`, optional role) and import it instead of hard-coding names.

## Inline SVG (styling or scripting the avatar)

Inline only when you need to touch the markup (for example pausing animation on hover). Generate with `--inline-safe`: ids, classes and keyframes get a unique `av-<name>-` prefix so several avatars and the host page cannot clash. Then inline the file contents (server-side include, `?raw` import, or `dangerouslySetInnerHTML` with trusted, generated content only). Pause all motion on one avatar with `svg * { animation-play-state: paused; }` scoped to its container.

## Mobile

- **React Native**: `react-native-svg` draws the static pose only. For motion, ship the GIF (with `expo-image` or FastImage) or the WebM/MP4 (`expo-video`, `react-native-video`), or the sprite sheet with a small frame-stepping component. Use `@2x/@3x` PNG stills (`--size 256/512/768`) for lists.
- **Flutter**: `flutter_svg` is static; use the GIF via `Image.asset`, or the sprite sheet with a `CustomPainter`/`flame` sprite animation using the JSON metadata.
- **iOS / Android native**: PNG stills in the asset catalogue / `res/drawable-*` at 1x/2x/3x; for motion, the MP4 in `AVPlayerLayer`/ExoPlayer, or the GIF via an image library. Android Vector Drawables cannot express these gradients and animations; do not convert.

## Games

Render transparent sprite sheets:
```bash
python <skill>/scripts/generate.py --spec npcs.json --transparent --out game/art/avatars/svg
python <skill>/scripts/render.py "game/art/avatars/svg/*.svg" --formats sprites --fps 12 --frame-size 256 --out game/art/avatars/sprites
```
Each `<name>_sheet.json` has `frame_width`, `frame_height`, `columns`, `rows`, `frame_count`, `fps`, `loop_seconds` (always 6) and per-frame `x, y, w, h, duration_ms`.

- **Phaser**: `this.load.spritesheet(key, png, { frameWidth, frameHeight })`, then `this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: frame_count - 1 }), frameRate: fps, repeat: -1 })`.
- **PixiJS**: slice frames into textures from the JSON and use `AnimatedSprite` with `animationSpeed = fps / 60`.
- **Godot 4**: `AnimatedSprite2D` + `SpriteFrames` built from an `AtlasTexture` per frame (H/V frames = columns/rows), or a `Sprite2D` with `hframes`/`vframes` and an `AnimationPlayer` stepping `frame` at `fps`.
- **Unity**: import the PNG as Sprite (2D), Sprite Mode Multiple, slice Grid By Cell Size with the frame size, then drag the frames into an Animation clip at the given fps (looping).

Use `--animation idle` for NPCs that should not keep waving; render a second sheet with `full` for a greeting state.

## Email, docs, chat, social

GIF (512 px, ~2 MB) works in email clients and chat. Use PNG stills where file size matters. MP4 at 1080 px for social posts. In slide decks, insert the GIF or the MP4.

## Performance and accessibility

- Each SVG runs ~17 lightweight CSS animations; dozens per page are fine, hundreds visible at once is better served by `idle`/`none` or PNG.
- Always give `alt` text (the SVG also carries a `<title>`).
- The animation stops automatically for users who request reduced motion.
- Sizes: SVG ~30-40 KB, PNG 1080 px ~0.9 MB (downsize for the web), GIF 512 px ~1.5-3 MB, MP4 1080 px ~2.5 MB, WebM ~0.4 MB.
