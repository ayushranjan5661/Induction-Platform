# Designing a good set of characters

A set works when every character is recognisable at thumbnail size and the group still looks like one family. The rig guarantees the family look; your job is the variety.

## Make each character distinct

Read a cast like a lineup: if two characters could be swapped without anyone noticing, change one.

- **Silhouette first.** Hairstyle and headwear change the outline most. In a set of up to 15, avoid repeating a `hair_style`; beyond that, repeat only with very different colour and accessories.
- **One strong signal each.** Give each character something memorable: glasses, dyed hair, a varsity letter, headphones, freckles, a hijab colour, plaid.
- **Vary the outfit combination.** Do not repeat the same `top` + `bottom` pair; spread the 7 tops and 6 bottoms evenly.
- **Vary faces quietly.** Mix `eye_shape`, `brows`, `nose` and `mouth`; these differences are subtle, so they support identity rather than carry it.

## Colour

- **Top vs background**: keep them clearly apart in hue or lightness (a navy jacket on a navy background disappears). The random generator enforces this; do it by eye for hand-written specs.
- **Spread backgrounds** around the colour wheel across the set, and avoid placing two similar backgrounds side by side in a grid.
- **One accent per character**: a saturated top with neutral bottoms, or the reverse, reads better than everything saturated.
- **Shoes** can echo the top or the accent colour; white sneakers fit almost any outfit.
- **Dyed hair** (pink, teal, blue, purple, green) looks most natural with `brow_color` set to a natural brown.

## Diversity and respect

- Spread skin tones across the full range, and pair them with hair textures naturally and without formula: any skin tone can have any hair.
- Hijab, braids, afro, buzz cuts, beards, glasses and freckles are ordinary options; use them when they suit the person or the set, not as tokens.
- Do not build characters from stereotypes (costumes, exaggerated features, "national" outfits) or from real public figures' likenesses.
- When drawing real team members from descriptions, describe hair, skin, glasses and clothing; let each person confirm or tweak their own avatar.
- Random names in the generator are gender-neutral; rename freely.

## Context

- **Product UI** (comment threads, user lists): `animation: idle` and transparent backgrounds look calm and sit on any surface.
- **Marketing / team pages**: full animation with backgrounds; a grid of 3-5 per row.
- **Games**: transparent, sprite sheets, idle for ambient NPCs, full for greetings.
- **Profile pictures**: render PNG at `--pose 1.5` (mid-wave, grinning) or `--pose 0` (calm).
