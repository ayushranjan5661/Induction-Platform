---
name: toon-avatars
description: Generate polished, animated 2D cartoon characters (avatars, mascots, team portraits, user profile pictures, NPCs, placeholder people) in one consistent hand-drawn style, as animated SVG plus PNG, GIF, MP4, WebM and game sprite-sheet exports. A bundled rig draws every character with 16 hairstyles, 7 tops, 6 bottoms, any skin tone or colour, glasses, freckles, beards, hats or hijab, and a blink-breathe-wave loop. Use this skill whenever the user wants 2D characters, avatars, people illustrations, a cast or set of characters, team/user avatars, game sprites, or wants to add, edit, recolour, re-export or integrate such characters in their project, even if they never say "avatar" or "skill".
---

# Toon Avatars

This skill turns a short JSON description into a finished, animated 2D character in a fixed, high-quality cartoon style. Drawing is done by code, not by hand: you describe *who* the character is, the scripts draw it. Every character shares the same rig, so a whole cast looks like it belongs together.

What a character is:
- 512×512 SVG, transparent or with a soft spotlight background
- 6-second seamless loop: blinks twice, breathes, head tilts, hair sways, waves with a grin, eyes glance at the hand
- Works anywhere an SVG works; rasterised to PNG/GIF/MP4/WebM/sprite sheets on demand

## Folder map

```
toon-avatars/
├── SKILL.md                     this file: workflow
├── scripts/
│   ├── generate.py              spec JSON / presets / random  ->  SVG files
│   ├── validate.py              checks a spec before generating
│   ├── render.py                SVG -> png, gif, mp4, webm, sprites (+json), frames
│   ├── gallery.py               contact-sheet PNG + self-contained animated HTML gallery
│   ├── requirements.txt
│   └── avatar/                  the drawing engine (compose, face, hair, clothes, palettes, helpers)
├── assets/
│   ├── base-avatar.svg          master rigged character all parts are cut from (do not edit by hand)
│   └── presets/characters.json  20 ready-made characters (Maya, Arjun, Zoe, Kofi, ...)
├── references/
│   ├── spec-format.md           EVERY field, allowed value and named colour  <- read before writing a spec
│   ├── integration.md           using the output in web, React/Vue/Svelte, mobile, Unity/Godot/Phaser, email
│   ├── style-guide.md           how to design a good, diverse, unique set
│   ├── animation.md             the rig, timeline, animation modes, retiming
│   └── extending.md             adding new hairstyles, outfits, face parts; engine internals
└── examples/                    example spec files
```

## Setup (once per machine)

SVG generation needs only Python 3.8+ (standard library). Raster output needs Playwright's Chromium and, for GIF/MP4/WebM, ffmpeg:

```bash
pip install -r <skill>/scripts/requirements.txt
python -m playwright install chromium
# ffmpeg: brew install ffmpeg | sudo apt install ffmpeg | winget install ffmpeg
```

Check what is available before promising a format. If Playwright or ffmpeg cannot be installed, deliver SVGs (they animate on their own) and say which exports were skipped and why.

`<skill>` below means this skill's folder. Run scripts with its absolute path from the user's project root so outputs land in the project.

## Workflow

### 1. Pin down the brief

Work out from the request and the project, asking only about what you truly cannot infer:

- **Who / how many**: named people with descriptions, a number of varied characters, or presets.
- **Where they go**: look at the project to find the asset folder convention (`public/`, `src/assets/`, `static/`, `Assets/Sprites/`, `res/`...). Put outputs there, not in the skill folder.
- **Formats**: web → SVG (+ PNG fallback); chat/email/docs → GIF or PNG; video/social → MP4; transparent video overlays → WebM; games → sprite sheets + JSON; Flutter/React Native → GIF/WebM/sprites (their SVG libraries ignore CSS animation, see integration.md).
- **Background**: default spotlight background; use `--transparent` for UI that places avatars on its own surfaces, for games and for overlays.
- **Motion**: `full` (wave loop, default), `idle` (blink/breathe only, best for lists and small sizes), `none` (static).

Sensible defaults when unspecified: SVG + PNG, background on, full animation, varied and diverse characters.

### 2. Write the spec

Read `references/spec-format.md` first: it lists every field and value, and the colour names you can use instead of hex. Save the spec in the project (for example `assets/avatars/avatars.json`) so the user can tweak and regenerate later.

```json
{"characters": [
  {"name": "Priya", "skin_tone": "caramel", "hair_style": "wavy", "hair_color": "soft-black",
   "eye_color": "dark-brown", "eye_shape": "open", "lashes": "long", "brows": "bold", "glasses": ["round", "gold"],
   "top": "zip", "top_color": "mustard", "shirt_color": "white",
   "bottom": "skirt", "bottom_color": "denim", "bottom_options": {"tights": "#3A2E2E"},
   "shoe_color": "white", "background": "indigo"}
]}
```

Only `name` is required; everything else falls back to the original character's look, so always fill in enough fields to make each character distinct. When the user describes real people, translate the description into options (hair, skin, glasses, clothing colours) without trying to reproduce anyone's exact likeness, and let them correct it.

For a set, follow `references/style-guide.md`: vary hairstyle, top and bottom combinations, skin tones and backgrounds, and keep top colour distinct from background. For quick varied casts, `--random N --seed S --save-spec file.json` produces a unique, valid set you can then edit.

### 3. Validate, generate

```bash
python <skill>/scripts/validate.py assets/avatars/avatars.json
python <skill>/scripts/generate.py --spec assets/avatars/avatars.json --out assets/avatars/svg
```

`generate.py` validates too and stops with readable messages (unknown keys, typos with suggestions, bad colours). Useful flags: `--transparent`, `--no-shadow`, `--animation idle|none`, `--inline-safe` (prefix ids/classes so many SVGs can be pasted inline in one HTML page), `--numbered`, `--preset all|maya,kofi`, `--random N --seed S --save-spec out.json`.

### 4. Render the formats the project needs

```bash
python <skill>/scripts/render.py "assets/avatars/svg/*.svg" --out assets/avatars/png --formats png --size 512
python <skill>/scripts/render.py "assets/avatars/svg/*.svg" --out assets/avatars/gif --formats gif
python <skill>/scripts/render.py "assets/avatars/svg/*.svg" --out assets/avatars/sprites --formats sprites --fps 12 --frame-size 256
```

Formats: `png` (still; `--pose 0` rest pose, `1.5` mid-wave), `gif`, `mp4` (`--matte` colour when transparent), `webm` (keeps alpha when transparent), `sprites` (grid PNG + JSON with frame rects, fps, loop), `frames` (PNG sequence). Rendering takes roughly 10 s per character per animated format; tell the user before long batches.

### 5. Look at the result before handing it over

```bash
python <skill>/scripts/gallery.py "assets/avatars/svg/*.svg" --out assets/avatars --title "Team avatars"
```

Open `contact-sheet.png` with your image viewer tool and actually look at it. Check that characters read as different people, colours do not clash with the background, accessories sit right, and nothing looks broken. Fix the spec and regenerate rather than editing SVGs by hand. `gallery.html` is a self-contained page showing every avatar animating; it is handy for the user to review too.

### 6. Integrate into the project

Follow `references/integration.md` for the project's stack: put assets in the right folder, reference them the idiomatic way (an `<Avatar>` component, an asset catalogue, a sprite animation resource), and keep the spec file next to the assets with a one-line note on how to regenerate. Prefer `<img src="avatar.svg">` on the web: it animates, isolates styles and needs no namespacing. Only inline SVGs when the user needs to style or script them, and then generate with `--inline-safe`.

### 7. Report

Tell the user briefly what was created and where, which formats, how to regenerate (the exact command), and anything skipped (for example "no ffmpeg, so no GIFs").

## Editing existing characters

Change the character's entry in the spec file and regenerate it alone (`--spec` with a one-character file, or regenerate all; output is deterministic). To restyle a whole cast at once, edit the spec programmatically (for example set every `background`) and regenerate. Never hand-edit generated SVGs: changes are lost on the next run.

## When the options are not enough

Requests like "add a cowboy hat", "a dress", "short sleeves" or "a different pose" need a new part in the engine. Read `references/extending.md`: it explains the coordinate system, layering order, colour-family recolouring and the exact place to add a hairstyle, top, bottom or face part, plus how to test it. Keep the drawing style consistent with the existing parts (dark warm outline `#2E1E16`, soft shading, same proportions).

## Ground rules

- Do not draw copyrighted characters, brand mascots or logos, or caricatures of real public figures; offer an original character in the same spirit instead.
- Represent people respectfully: no stereotype-based costumes or features. Hijab, braids, afro, beards and all skin tones are first-class options; use them naturally when they fit the person or the set.
- Keep the user's data in the user's project. The skill needs no network access beyond installing its dependencies.

## Troubleshooting

| Problem | Fix |
|---|---|
| `playwright missing` / browser not found | `pip install playwright pillow` then `python -m playwright install chromium` |
| `ffmpeg not found` | install ffmpeg; png, sprites and frames still work without it |
| Avatar animates in a browser but not in an app | that renderer ignores CSS animation (React Native SVG, Flutter, Figma). Use GIF/WebM/sprite sheets |
| Several inline SVGs show wrong colours | ids collide; regenerate with `--inline-safe` or use `<img>` |
| Unknown colour error | use `#RRGGBB` or a name from `references/spec-format.md` |
| Text letter on varsity jacket looks different | it uses system serif fonts; output differs slightly across machines |
