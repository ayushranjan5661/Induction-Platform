# Animation rig

Every avatar loops in exactly **6 seconds** (all cycles are 6 s or divide it), so GIFs, videos and sprite sheets loop seamlessly. Animation is pure CSS inside the SVG; no JavaScript.

## What moves

| Class | Element | Motion | Timing |
|---|---|---|---|
| `.upper` | everything above the legs | breathing rise 2.5 px | 3 s, alternate |
| `.head` | head group | tilt -2 deg to +2.5 deg around the neck | 3 s, alternate |
| `.eyes` | both eyes | blink (scaleY to 0.08) | at 40 % and 90 % of 6 s |
| `.look` | irises | glance toward the waving hand | 16-56 % |
| `.brows` | eyebrows | lift 2.5 px while waving | 16-56 % |
| `.smC` / `.smO` | closed mouth / open grin | cross-fade to grin while waving | 14-58 % |
| `.shrug` | right shoulder + arm | shoulder lifts 4 px while the arm is raised | 0-72 % |
| `.armU` | right upper arm | raise to -104 deg with overshoot, settle | 0-83 % |
| `.armF` | right forearm | wave: -44 deg to -74 deg twice, follow-through | 0-84 % |
| `.handR` / `.handO` | relaxed hand / open palm | swap at 10 % and 62 % | |
| `.tuft`, `.tail` | hair tuft, ponytail | sway +/-6 deg | 3 s, alternate |
| `.str1`, `.str2` | hoodie drawstrings | pendulum +/-3 deg | 3 s, alternate, offset |

Pivot points are in SVG user units (viewBox 0 0 512 512): neck 256,226; right shoulder 310,250; right elbow 322,294.

## Modes

- `full`: everything above.
- `idle`: wave, glance, brow lift and grin are frozen at rest; blink, breathe, tilt and hair sway remain.
- `none`: completely static (rest pose).
- Users with `prefers-reduced-motion: reduce` always get the static pose.

## Changing timing

Edit the `<style>` block of `assets/base-avatar.svg` (keyframes `breathe`, `tilt`, `blink`, `sway`, `shrug`, `raise`, `wave`, `showO`, `showR`, `look`, `brows`, `smO`, `smC`, `swing`). Keep every duration a divisor of the loop length and update `LOOP` in `scripts/render.py` if the loop length changes. Keyframe percentages for the wave, shrug, hand swap, glance, brows and grin are coordinated: shift them together.

## Freezing a pose for stills

`render.py --pose <seconds>` pauses all animations at that time: `0` rest, `1.5` mid-wave with grin, `2.0` hand at the far end of the wave.
