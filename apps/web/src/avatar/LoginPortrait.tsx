/**
 * Hand-drawn portrait for the sign-in page: a bob with a side fringe, blue-grey glasses,
 * a red mandarin collar and an orange floral jacket. She blinks, breathes and tilts her
 * head gently (see the .portrait-* rules in index.css).
 */
import type { ReactElement } from 'react';

const C = {
  skin: '#EDB998',
  skinShade: '#DA9978',
  hairBack: '#4A2C1D',
  hair: '#6B4330',
  hairLight: '#80533B',
  brow: '#4A2C1D',
  iris: '#7A3B22',
  pupil: '#2A140C',
  lash: '#2A1A12',
  frame: '#4F6B7B',
  blush: '#F2998A',
  lips: '#E27B74',
  jacket: '#F1A250',
  jacketShade: '#E08E3C',
  collar: '#D2412B',
  collarShade: '#B23422',
  button: '#F3E3B5',
  petal: '#F08A8A',
  petalLight: '#F6A9A3',
  flowerCentre: '#F7E27A',
  leaf: '#3E7C86',
  leafDark: '#2F6570',
};

const FLOWERS: [number, number, number][] = [
  [92, 398, 17],
  [150, 372, 11],
  [268, 378, 14],
  [326, 420, 17],
  [112, 470, 14],
  [172, 448, 11],
  [246, 468, 15],
  [336, 492, 12],
  [62, 506, 11],
  [160, 512, 13],
  [290, 520, 13],
];

const LEAVES: [number, number, number][] = [
  [122, 388, -35],
  [62, 432, 30],
  [300, 396, 40],
  [232, 420, -30],
  [140, 430, 20],
  [356, 456, -25],
  [82, 488, -40],
  [210, 496, 35],
  [286, 470, -20],
  [130, 508, 50],
];

function Flower({ x, y, r }: { x: number; y: number; r: number }): ReactElement {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g transform={`translate(${x} ${y})`}>
      {petals.map((angle, i) => (
        <circle
          key={angle}
          cx={Math.cos(((angle - 90) * Math.PI) / 180) * r * 0.62}
          cy={Math.sin(((angle - 90) * Math.PI) / 180) * r * 0.62}
          r={r * 0.5}
          fill={i % 2 ? C.petalLight : C.petal}
        />
      ))}
      <circle r={r * 0.36} fill={C.flowerCentre} stroke={C.petal} strokeWidth={r * 0.1} />
    </g>
  );
}

function Leaf({ x, y, angle }: { x: number; y: number; angle: number }): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M0 -15 C9 -8 9 8 0 15 C-9 8 -9 -8 0 -15 Z" fill={C.leaf} />
      <path d="M0 -12 L0 12" stroke={C.leafDark} strokeWidth="1.5" />
    </g>
  );
}

/** An almond eye: white, a large brown iris clipped to the lids, a heavy upper lash line. */
function Eye({ cx, flip }: { cx: number; flip?: boolean }): ReactElement {
  const cy = 194;
  const id = `portrait-eye-${cx}`;
  const s = flip ? -1 : 1; // outer corner is on the left for the left eye
  const lid = `M${cx - 17} ${cy} C${cx - 13} ${cy - 18} ${cx + 13} ${cy - 18} ${cx + 17} ${cy} C${cx + 12} ${cy + 13} ${cx - 12} ${cy + 13} ${cx - 17} ${cy} Z`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <path d={lid} />
        </clipPath>
      </defs>
      <path d={lid} fill="#fff" />
      <g clipPath={`url(#${id})`}>
        <circle cx={cx} cy={cy} r="12" fill={C.iris} />
        <circle cx={cx} cy={cy} r="8" fill="#5A2A16" />
        <circle cx={cx} cy={cy} r="5" fill={C.pupil} />
        <circle cx={cx + 4.5} cy={cy - 4.5} r="3.4" fill="#fff" />
        <circle cx={cx - 4} cy={cy + 4} r="1.6" fill="#fff" opacity="0.85" />
      </g>
      {/* Upper lash line with a small flick at the outer corner */}
      <path
        d={`M${cx - 18} ${cy} C${cx - 13} ${cy - 18} ${cx + 13} ${cy - 18} ${cx + 18} ${cy}`}
        fill="none"
        stroke={C.lash}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d={`M${cx + s * 16} ${cy - 4} l${s * 6} -5`}
        stroke={C.lash}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Soft lower lid */}
      <path
        d={`M${cx - 11} ${cy + 11} Q${cx} ${cy + 15} ${cx + 11} ${cy + 11}`}
        fill="none"
        stroke={C.skinShade}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

export function LoginPortrait({ className }: { className?: string }): ReactElement {
  return (
    <svg
      viewBox="0 0 400 530"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      role="img"
      aria-label="Presenter"
    >
      <defs>
        <clipPath id="portrait-jacket">
          <path d="M28 530 C32 412 80 352 160 336 L240 336 C320 352 368 412 372 530 Z" />
        </clipPath>
      </defs>

      <g className="portrait-breathe">
        {/* Bob behind the head: rounded crown, straight sides, ends resting on the shoulders */}
        <path
          d="M104 172 C96 86 146 40 202 40 C260 40 310 88 300 172 C298 226 304 284 308 318 C310 334 296 342 280 338 L262 334 L138 334 L120 338 C104 342 90 334 92 318 C96 284 104 226 104 172 Z"
          fill={C.hair}
        />
        {/* Shadow inside the bob, behind the neck */}
        <path
          d="M128 210 C126 260 132 304 140 334 L260 334 C268 304 274 260 272 210 Z"
          fill={C.hairBack}
        />
        {/* Strand lines on the sides */}
        <path
          d="M110 220 C108 260 110 296 116 330 M290 220 C292 260 290 296 284 330"
          fill="none"
          stroke={C.hairBack}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Neck, with a soft shadow under the chin */}
        <path d="M176 250 L176 320 Q200 332 224 320 L224 250 Z" fill={C.skin} />
        <path d="M176 262 Q200 290 224 262 L224 250 L176 250 Z" fill={C.skinShade} />

        {/* Jacket with its floral print */}
        <path
          d="M28 530 C32 412 80 352 160 336 L240 336 C320 352 368 412 372 530 Z"
          fill={C.jacket}
        />
        <g clipPath="url(#portrait-jacket)">
          <path d="M28 530 C40 440 70 380 120 352 L108 530 Z" fill={C.jacketShade} opacity="0.5" />
          <path
            d="M372 530 C360 440 330 380 280 352 L292 530 Z"
            fill={C.jacketShade}
            opacity="0.5"
          />
          {LEAVES.map(([x, y, a]) => (
            <Leaf key={`${x}-${y}`} x={x} y={y} angle={a} />
          ))}
          {FLOWERS.map(([x, y, r]) => (
            <Flower key={`${x}-${y}`} x={x} y={y} r={r} />
          ))}
          {/* Front opening */}
          <path d="M200 344 L200 530" stroke="#5B3A2A" strokeWidth="3" />
        </g>

        {/* Mandarin collar */}
        <path
          d="M158 340 C160 320 165 308 172 300 Q200 318 228 300 C235 308 240 320 242 340 Q200 356 158 340 Z"
          fill={C.collar}
        />
        <path d="M158 340 Q200 356 242 340 L240 332 Q200 346 160 332 Z" fill={C.collarShade} />
        <path d="M200 316 L200 348" stroke={C.collarShade} strokeWidth="2.5" />

        {/* Frog buttons */}
        {[372, 414, 456, 498].map((y) => (
          <g key={y}>
            <rect x="183" y={y - 3.5} width="34" height="7" rx="3.5" fill={C.button} />
            <circle cx="200" cy={y} r="5.5" fill="#E7D29A" />
          </g>
        ))}

        {/* Head: tilts gently around the neck */}
        <g className="portrait-head">
          {/* Ears, in front of the hair that falls behind them */}
          <ellipse cx="124" cy="204" rx="11" ry="16" fill={C.skin} />
          <ellipse cx="276" cy="204" rx="11" ry="16" fill={C.skin} />
          <path
            d="M126 196 Q120 204 126 212 M274 196 Q280 204 274 212"
            fill="none"
            stroke={C.skinShade}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Face: wide, rounded cheeks and a soft chin */}
          <path
            d="M124 180 C124 116 158 92 200 92 C242 92 276 116 276 180 C276 228 256 262 222 272 Q200 278 178 272 C144 262 124 228 124 180 Z"
            fill={C.skin}
          />

          {/* Crown and a full side-swept fringe: parted on the left, sweeping across the
              forehead and down to the right temple */}
          <path
            d="M110 196 C100 116 142 62 204 60 C266 58 306 112 292 200 C288 180 282 166 272 160 C242 162 206 154 180 142 C164 134 154 124 148 114 C138 136 130 162 128 196 Z"
            fill={C.hair}
          />
          {/* Lighter sweep through the fringe */}
          <path
            d="M154 106 C178 130 214 148 254 152 C264 153 270 155 274 158 C268 130 250 104 224 90 C200 80 172 84 154 106 Z"
            fill={C.hairLight}
          />
          {/* Strand lines following the sweep */}
          <path
            d="M158 112 C184 136 222 150 262 155 M182 80 C208 106 244 122 282 136 M150 86 C138 110 130 140 128 170"
            fill="none"
            stroke={C.hairBack}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Brows: soft arches above the frames */}
          <path
            d="M146 160 Q166 148 190 156"
            fill="none"
            stroke={C.brow}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M210 156 Q234 148 254 160"
            fill="none"
            stroke={C.brow}
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Blush, under the lenses */}
          <ellipse cx="156" cy="230" rx="16" ry="8" fill={C.blush} opacity="0.5" />
          <ellipse cx="244" cy="230" rx="16" ry="8" fill={C.blush} opacity="0.5" />

          {/* Eyes blink together */}
          <g className="portrait-blink">
            <Eye cx={168} flip />
            <Eye cx={232} />
          </g>

          {/* Glasses: wide rounded-square lenses, slim blue-grey frames */}
          <g fill="#CFE3EE" fillOpacity="0.14" stroke={C.frame} strokeWidth="5">
            <rect x="138" y="170" width="60" height="48" rx="17" />
            <rect x="202" y="170" width="60" height="48" rx="17" />
          </g>
          {/* Lens glints */}
          <path
            d="M148 182 Q150 176 158 175 M212 182 Q214 176 222 175"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path d="M198 188 Q200 183 202 188" fill="none" stroke={C.frame} strokeWidth="4.5" />
          <path
            d="M138 186 L124 182 M262 186 L276 182"
            stroke={C.frame}
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Nose and mouth */}
          <path
            d="M197 222 Q200 227 205 224"
            fill="none"
            stroke="#C98468"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path d="M186 246 Q193 241 200 244 Q207 241 214 246 Q200 256 186 246 Z" fill={C.lips} />
          <path
            d="M187 246.5 Q200 249 213 246.5"
            fill="none"
            stroke="#C45E58"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      </g>
    </svg>
  );
}
