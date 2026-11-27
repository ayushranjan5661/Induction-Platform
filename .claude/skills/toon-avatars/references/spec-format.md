# Character spec format

A spec file is JSON: one character object, a list of them, or `{"characters": [...]}` (preferred). Only `name` is required. Anything left out falls back to the original character (light skin, chestnut swept hair, tomato zip hoodie, mid-blue jeans, orange sneakers, slate background).

Colours accept `#RRGGBB` or a **name** from the tables at the end. Field names below are the friendly names; the engine also accepts its short internal names (`skin`, `hair`, `jacket`, `pants`, ...), which you may see in older files.

## Contents
1. Identity and face
2. Hair, hats and head coverings
3. Accessories
4. Tops
5. Bottoms
6. Shoes and socks
7. Scene and animation
8. Named colours
9. Complete examples

## 1. Identity and face

| Field | Values | Notes |
|---|---|---|
| `name` | text | Used in the file name (slugified), the SVG title/alt text and the varsity letter default |
| `skin_tone` | colour or skin name | Shading is derived automatically for any tone |
| `eye_color` | colour or eye name | Iris gradient derived |
| `eye_shape` | `calm` (relaxed lids, default), `open` (big round), `sleepy` (heavy lids) | |
| `lashes` | `flick` (default), `long`, `none` | |
| `brows` | `thick` (default), `thin`, `straight`, `arched`, `bold` | |
| `brow_color` | colour or hair name | Defaults to `hair_color`. Set it for dyed hair (pink, teal...) so brows stay natural; beards use it too |
| `nose` | `round` (default), `small`, `wide`, `line` | |
| `mouth` | `smile` (default), `small`, `smirk`, `grin` (teeth showing), `lips` (coloured lips) | During the wave every mouth opens into a grin |
| `lip_color` | colour | Only for `mouth: "lips"`; names `lip-rose`, `lip-berry`, `lip-coral` |
| `freckles` | `true` | Cheeks and nose |
| `mole` | `true` | Small beauty mark by the mouth |
| `beard` | `true` | Short full beard + moustache, coloured with `brow_color` |

## 2. Hair, hats and head coverings

| `hair_style` | Look | Related fields |
|---|---|---|
| `swoosh` | swept spiky fringe with a tuft (original) | |
| `buzz` | close crop | |
| `afro` | big rounded curly afro | |
| `curls` | shoulder-length curly hair with a curly fringe | |
| `long` | long straight hair, centre part, falls over the shoulders | |
| `braids` | two long braids with ties, centre part | `accent` = tie colour |
| `bob` | chin-length bob with blunt fringe | |
| `ponytail` | high ponytail that sways | `accent` = hair tie colour |
| `buns` | two space buns | `accent` = band colour |
| `sidepart` | neat side part with volume | |
| `mohawk` | spiky crest, shaved sides (sides use `brow_color`) | |
| `curlytop` | curly top with faded sides | |
| `wavy` | wavy jaw-length hair | |
| `beanie` | knit beanie with pom-pom, hair peeking out | `hat_color` |
| `cap` | backwards cap with snapback strap | `hat_color` |
| `hijab` | head scarf framing the face, draped over the shoulders; ears hidden | `hijab_color`; pair with a non-hooded top (`sweater`, `denim`, `flannel`, `bomber`, `varsity`) |

`hair_color`: colour or hair name. Shine and strand colours are derived.

## 3. Accessories

| Field | Value | Example |
|---|---|---|
| `glasses` | `[kind, colour]`, kind `round` or `rect` | `["round", "gold"]`, `["rect", "#1E1E22"]` |
| `earrings` | `[kind, colour]`, kind `stud` or `hoop` (hidden by `long` hair and `hijab`) | `["hoop", "silver"]` |
| `headphones` | colour; worn around the neck | `"sky"` |

## 4. Tops

| `top` | Look | Uses |
|---|---|---|
| `zip` | open zip hoodie over a tee, hood, white cords, zipper (original) | `top_color`, `shirt_color` |
| `pullover` | pullover hoodie, kangaroo pocket, swinging drawstrings | `top_color` |
| `sweater` | crew-neck knit sweater | `top_color`; options `stripes`, `graphic` |
| `denim` | denim trucker jacket, collar, flap pockets, buttons, contrast stitching | `top_color`, `shirt_color`; option `stitch` |
| `flannel` | open plaid flannel shirt over a tee | `top_color` (plaid is overlaid), `shirt_color` |
| `bomber` | bomber jacket, ribbed collar/cuffs/hem, zipper | `top_color`, `shirt_color`; options `rib`, `stripe`, `patch` |
| `varsity` | varsity jacket, contrasting sleeves, striped ribbing, snaps, chest letter | `top_color`, `sleeve_color`, `shirt_color`; options `rib`, `stripe`, `letter`, `letter_fill`, `letter_edge` |

`top_color` is the main garment colour; all its shading is derived. `shirt_color` is the tee visible under open tops.

`top_options` (object):

| Key | For | Meaning |
|---|---|---|
| `graphic` | `sweater`, `zip`, `denim`, `flannel`, `bomber`, `varsity` (on the tee) | `star`, `heart` or `bolt` on the chest |
| `graphic_color` | with `graphic` | colour |
| `stripes` | `sweater` | colour of horizontal stripes |
| `rib` | `bomber`, `varsity` | ribbing colour (collar, cuffs, hem); defaults to `top_color` |
| `stripe` | `bomber`, `varsity` | two thin stripes on the ribbing |
| `patch` | `bomber` | round star patch colour on the chest |
| `letter` | `varsity` | one character; defaults to the first letter of `name` |
| `letter_fill`, `letter_edge` | `varsity` | letter colours; default sleeve colour and stripe colour |
| `stitch` | `denim`, `flannel` | stitching thread colour (default orange-gold for denim) |

## 5. Bottoms

| `bottom` | Look | `bottom_options` |
|---|---|---|
| `jeans` | full-length straight jeans, fly, gold stitching, fades, hem resting on the shoe (original) | `stitch` (thread colour) |
| `chinos` | smooth trousers with a front crease | |
| `cargo` | chinos with flap side pockets | |
| `joggers` | tapered joggers, ribbed ankle cuffs, side stripes | `stripe` |
| `skirt` | pleated A-line skirt with tights | `tights` (colour, default near-black), `plaid` (`true` for tartan) |
| `shorts` | shorts with bare legs and striped crew socks | `sock_accent` (sock stripe colour) |

`bottom_color` colours the jeans, trousers, skirt or shorts.

## 6. Shoes and socks

| Field | Default | Notes |
|---|---|---|
| `shoe_color` | orange | canvas upper; tongue, stitching and stripe derived |
| `sole_color` | white | sole and toe cap (`gum` gives a tan rubber sole) |
| `lace_color` | cream | |
| `sock_color` | white | visible with `shorts` (and a sliver otherwise) |

## 7. Scene and animation

| Field | Values | Default |
|---|---|---|
| `background` | colour or background name; the spotlight, vignette and floor are derived | `slate` |
| `transparent` | `true` removes the background (CLI: `--transparent`) | `false` |
| `shadow` | `false` also removes the ground shadow when transparent (CLI: `--no-shadow`) | `true` |
| `animation` | `full` (wave loop), `idle` (blink, breathe, tilt, sway only), `none` (static) | `full` |

## 8. Named colours

**Skin** (`skin_tone`): porcelain #FBE3D0, fair #F9D9C0, light #F7CBA6, peach #EDC09B, golden #E0A57C, tan #D9A47A, olive #C99366, caramel #C68B5E, bronze #B07A52, brown #9C6A48, deep #8C5A3C, espresso #6B4128, ebony #5A3522

**Hair** (`hair_color`, `brow_color`): black #1F1613, soft-black #2B1E1A, blue-black #1E2233, dark-brown #3B2418, brown #6B4A2E, chestnut #A65B2E, auburn #8E3A22, ginger #C8622A, strawberry #D9875A, blonde #D9B25F, platinum #EAD9B0, grey #9A9A9E, white #E8E6E2, pink #E58FB4, teal #2E9E95, blue #4D7FD1, purple #8A5BC7, green #4FA36A

**Eyes** (`eye_color`): brown #9B5427, dark-brown #4A2A14, hazel #8E7A3A, amber #C07A2A, green #4E8A4A, blue #3F78B5, grey #6E87A6

**Clothing and accessories** (any other colour field): red #D23F3F, tomato #D9532C, orange #E8792F, mustard #D9A23A, yellow #F2C14E, olive #6B7A3A, green #3E8E5A, forest #3E6E4A, mint #7CC4A4, teal #2E8C8C, sky #4FA3C7, denim #4F6E9E, navy #2C3550, royal #2C3E7A, lavender #B49AD9, purple #7A5AA8, pink #E58FB4, rose #C46A8A, burgundy #8C2A3A, brown #7A4A2A, tan #C29560, khaki #B59A6A, cream #EDE3CF, white #F2F0EB, light-grey #C9CBD0, grey #8D9096, charcoal #3A3A40, black #2B2B30, light-wash #8FA8C8, mid-wash #5D7BA8, dark-wash #3D4A66, gum #C98B4E, gold #E3B23C, silver #C9CDD4, lip-rose #C2555A, lip-berry #A84A4F, lip-coral #D9705F

**Backgrounds** (`background`): teal, purple, blue, mustard, sea, terracotta, ocean, green, rose, sky, indigo, sun, ice, jade, clay, brick, cornflower, coral, violet, apricot, slate (exact values in `scripts/avatar/palettes.py`)

Very light colours (white tops, cream sleeves) and very dark ones (black jackets) both work; their shading is derived from the colour.

## 9. Complete examples

Minimal:
```json
{"name": "Sam", "skin_tone": "tan", "hair_style": "buzz", "hair_color": "black", "top": "pullover", "top_color": "green"}
```

Detailed:
```json
{
  "name": "Kofi",
  "skin_tone": "espresso", "hair_style": "afro", "hair_color": "black",
  "eye_color": "dark-brown", "eye_shape": "calm", "brows": "straight", "nose": "wide", "mouth": "grin",
  "top": "varsity", "top_color": "royal", "sleeve_color": "#EDE6D6", "shirt_color": "white",
  "top_options": {"rib": "royal", "stripe": "gold", "letter": "K"},
  "bottom": "joggers", "bottom_color": "charcoal", "bottom_options": {"stripe": "white"},
  "shoe_color": "red", "background": "mustard"
}
```

Dyed hair with natural brows, accessories:
```json
{"name": "Hana", "skin_tone": "fair", "hair_style": "buns", "hair_color": "pink", "brow_color": "#6B4A3A",
 "eye_shape": "open", "lashes": "long", "brows": "thin", "nose": "line", "mouth": "small", "accent": "lavender",
 "earrings": ["stud", "gold"], "top": "pullover", "top_color": "lavender",
 "bottom": "shorts", "bottom_color": "mid-wash", "bottom_options": {"sock_accent": "lavender"},
 "shoe_color": "white", "lace_color": "lavender", "background": "sea"}
```

All 20 presets in `assets/presets/characters.json` are further examples of valid specs.
