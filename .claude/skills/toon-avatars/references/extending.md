# Extending the engine

Use this when a request needs something the options cannot express (a new hairstyle, garment, accessory or face part). Read the relevant module first; the existing parts are the best templates.

## Contents
- How a character is built
- Coordinate map
- Colour families (why parts recolour themselves)
- Adding a hairstyle
- Adding a top or bottom
- Adding a face part or accessory
- Testing a change

## How a character is built

1. `avatar/base.py` loads `assets/base-avatar.svg` (the master rigged character) and slices it into named parts: background, shoes, legs, hood, neck, panels, arms, ears, face, open-mouth grin, original hair.
2. `avatar/compose.py: build(spec)` normalises the spec (aliases, named colours, defaults), then assembles the document in this order: defs + CSS, background, shoes, bottoms, jacket hem shadow, then the breathing upper group: torso (`clothes.top`), arms (`clothes.arms`), headphones, and the tilting head group: ponytail, back hair, braids, hijab drape, ears, earrings, face, blush, freckles, beard, hair shadow, eyes, brows, glasses, moustache, nose, mouth, front hair/hat.
3. Each segment is recoloured from the master palette to the spec's colours (see colour families) and concatenated.

Later items draw on top. Things that must sit behind the face go before `P['face']`; anything in the head group tilts with the head; anything in `upper` breathes.

## Coordinate map (viewBox 0 0 512 512)

| Feature | Coordinates |
|---|---|
| Face outline | `M192 122 Q190 202 256 214 Q322 202 320 122 Q318 78 256 76 Q194 78 192 122 Z` (top y 76, chin y 214) |
| Ears | ellipses at (191,152) rx14 ry18 and (321,152) rx13 ry17 |
| Eyes | centres (230,142) and (284,142), rx17 ry15; brows y 102-123 |
| Nose / mouth | nose (257,168); mouth y 183-205 |
| Usual hairline | y 92-110 |
| Neck | x 244-268, y 204-247 |
| Torso | shoulders y ~226-250, hem band y 342-358, sides x 190-322 |
| Arms | shoulders (202,251)/(310,251); hands around y 333-370 |
| Legs | waist hidden at y 328; hems ~y 426-433; shoe centres x 216 and 296, ground y 494 |

The figure is symmetric about x=256 (eyes and brows about x=257). `helpers.mirror(d, x0)` mirrors a path; write the left half and mirror it.

## Colour families

Parts are drawn in the master palette and recoloured by family with `helpers.remap`, which keeps each shade's lightness and saturation relationship to the family's base colour. To make a new part follow a spec colour, draw it in that family's master colours:

| Family | Base colour | Other shades you can use | Spec field |
|---|---|---|---|
| skin | `#F7CBA6` | `#C98361` shadow, `#D99472` line, gradients `url(#skinF)`, `url(#skinH)` | `skin_tone` |
| hair | `#A65B2E` | `#6E3519` strands, `#D99459` shine, `url(#hairG)`, `url(#hairB)` | `hair_color` |
| brow | (same list as hair) | `url(#browG)` | `brow_color` |
| jacket | `#D9532C` | `#B5401F` dark, `#8E2F14` darker, `#EF7A4E` light, `url(#jacketW)` | `top_color` |
| shirt | `#776C66` | `#5E5550`, `url(#innerG)` | `shirt_color` |
| pants | `#6E7B90` | `#56616F`, `#47526A`, `#97A4B6`, `url(#jeansG)` | `bottom_color` |
| shoe / lace / sole / sock | `#D9562F` / `#F3E7DA` / `#F4EEE6` / `#E9E5E0` | see `compose.py` lists | `shoe_color` ... |

The full lists are at the top of `compose.py`. A colour that is in no family list stays fixed: use that for outlines (`#2E1E16`), metal and white details, or for colours that come straight from the spec (insert those as Python f-string values, as hats and glasses do).

Each segment is recoloured only with its own families (torso: jacket+shirt+skin, legs: pants+skin, head: skin+hair+eyes...), so put a new part in the right segment.

## Adding a hairstyle

1. In `avatar/hair.py`, add a branch to `style()` returning the dict keys: `back` (behind ears and face), `front` (on top of face; drawn last), optionally `tail` (behind everything in the head, can animate), `braids`, `hijab_back`, `noears`, and `cast`: a path whose blurred offset copy shades the forehead.
2. Draw with `class="o"` for the standard outline, fills `url(#hairG)` (front) and `url(#hairB)` (back), strands with `strands()`, shine with `shine()`, curls with `curls()`; curly outlines with `scallop_ellipse()` / `scallop_line()`.
3. Keep the hairline above the brows (y < 104 at the centre) unless it is a fringe meant to cover them, and keep shapes inside x 150-362, y > 8.
4. Add the name to `OPTIONS['hair_style']` in `palettes.py`, to `references/spec-format.md`, and to the random generator if it suits random sets.
5. To animate a new part, give it a class with `transform-box:view-box; transform-origin:<x>px <y>px` and an existing keyframe (`sway`, `swing`), added to the CSS string in `compose.build`. Keep cycles at 3 s or 6 s.

## Adding a top or bottom

- Tops live in `clothes.top(kind, c)`; return the torso block. Reuse `P['neck']`, `P['shoulders']` (shoulder outlines, must stay under the panels), `PANEL_L/PANEL_R` (open front), `TORSO` (closed front), `SHADE`, `ribband()`, `TEE_NECK` and `P['inner']` (tee under open tops). Sleeves come from `clothes.arms()`: return the stock arms, swap their fills (`url(#sleeveW)` pattern) or overlay patterns like the flannel branch does.
- Bottoms live in `clothes.bottoms(kind, c)`; draw the left leg inside `<g id="legL">` and mirror it with the `<use>` line, then add centre details (fly, skirt) after.
- Add the name to `OPTIONS`, `validate.py` option keys if it has options, `spec-format.md`, and the random generator.

## Adding a face part or accessory

Face variants live in `avatar/face.py` (`eye()`, `BROWS`, `nose()`, `mouth()`, `extras()`). Eye parts must stay inside the eye groups (they blink by scaling the `.eyes` group; the clip paths `eyeL`/`eyeR` keep irises inside). Accessories that should not blink (glasses) go in `extras()` and are placed after the brows. Expose new fields in `compose.normalize` (colour resolution), `validate.KNOWN`, and the docs.

## Testing a change

```bash
python scripts/generate.py --preset all --numbered --out /tmp/check/svg
python scripts/gallery.py "/tmp/check/svg/*.svg" --out /tmp/check --pose 0
python scripts/gallery.py "/tmp/check/svg/*.svg" --out /tmp/check/wave --pose 1.5
```
Look at both contact sheets (rest and mid-wave) and a close-up PNG (`render.py --formats png --size 1080`) of a character using the new part. Also generate `--random 20 --seed 1` to see it in unplanned combinations, and check `--transparent` if the part touches the background.
