/**
 * The built-in presenter: an SVG character drawn and animated in the browser.
 * No video and no external service. Emotion drives the face, gestures drive
 * the arms and head, and `speaking` drives the mouth.
 */
import type { AvatarAppearance, AvatarDto, Emotion, Gesture } from '@induction/shared';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { EMOTION_FACES, gestureTargetAt, REST_ARM, type HandShape } from './poses';

export interface GestureCue {
  name: Gesture;
  /** Change this to replay the same gesture. */
  nonce: number;
}

interface AvatarProps {
  avatar: Pick<AvatarDto, 'appearance' | 'energy' | 'themeColor' | 'name'>;
  emotion?: Emotion;
  gesture?: GestureCue | null;
  speaking?: boolean;
  /** Increment on each spoken word so the lips close between words. */
  mouthCue?: number;
  /** Draw a single frame with no animation (thumbnails, lists). */
  still?: boolean;
  /** Crop to the head and shoulders (small round thumbnails). */
  portrait?: boolean;
  className?: string;
}

/** Everything that is smoothed from frame to frame. */
interface Rig {
  rs: number;
  re: number;
  ru: number;
  ls: number;
  le: number;
  lu: number;
  browY: number;
  browTilt: number;
  eyeOpen: number;
  smile: number;
  mouthOpen: number;
  mouthWide: number;
  tilt: number;
  nod: number;
  bob: number;
  blush: number;
}

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

function restRig(emotion: Emotion): Rig {
  const face = EMOTION_FACES[emotion];
  return {
    rs: REST_ARM.s,
    re: REST_ARM.e,
    ru: 1,
    ls: REST_ARM.s,
    le: REST_ARM.e,
    lu: 1,
    browY: face.browY,
    browTilt: face.browTilt,
    eyeOpen: face.eyeOpen,
    smile: face.smile,
    mouthOpen: face.mouthOpen,
    mouthWide: 0,
    tilt: face.tilt,
    nod: 0,
    bob: 0,
    blush: face.blush,
  };
}

/** Darkens (negative) or lightens (positive) a hex colour. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => {
    const v = (n >> shift) & 255;
    const out = amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
    return Math.max(0, Math.min(255, Math.round(out)));
  };
  return `rgb(${channel(16)},${channel(8)},${channel(0)})`;
}

export function Avatar({
  avatar,
  emotion = 'FRIENDLY',
  gesture = null,
  speaking = false,
  mouthCue = 0,
  still = false,
  portrait = false,
  className,
}: AvatarProps): ReactElement {
  const [rig, setRig] = useState<Rig>(() => restRig(emotion));
  const [hands, setHands] = useState<{ r: HandShape; l: HandShape }>({
    r: 'relaxed',
    l: 'relaxed',
  });

  // Latest props, read by the animation loop without restarting it.
  const live = useRef({ emotion, speaking, energy: avatar.energy });
  live.current = { emotion, speaking, energy: avatar.energy };
  const gestureStart = useRef<{ name: Gesture; at: number } | null>(null);
  const wordGapUntil = useRef(0);

  useEffect(() => {
    if (gesture && gesture.name !== 'NONE')
      gestureStart.current = { name: gesture.name, at: performance.now() };
  }, [gesture?.name, gesture?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mouthCue > 0) wordGapUntil.current = performance.now() + 70;
  }, [mouthCue]);

  useEffect(() => {
    if (still) {
      setRig(restRig(emotion));
      return;
    }
    const calm = prefersReducedMotion();
    const current = restRig(live.current.emotion);
    let frame = 0;
    let last = performance.now();
    let nextBlink = last + 1500 + Math.random() * 2500;
    let blinkUntil = 0;
    const phase = Math.random() * 10;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000 + phase;
      const { emotion: mood, speaking: talking, energy } = live.current;
      const face = EMOTION_FACES[mood];

      const started = gestureStart.current;
      const pose = gestureTargetAt(
        started && !calm ? started.name : 'NONE',
        started ? now - started.at : 0,
      );
      setHands((h) =>
        h.r === pose.r.hand && h.l === pose.l.hand ? h : { r: pose.r.hand, l: pose.l.hand },
      );

      if (now > nextBlink) {
        blinkUntil = now + 130;
        nextBlink = now + 2200 + Math.random() * 3600;
      }

      // Lips: syllable-like opening while talking, closing briefly between words.
      let mouthOpen = face.mouthOpen;
      let mouthWide = 0;
      if (talking) {
        const syllable = Math.abs(Math.sin(t * Math.PI * 5.2));
        const variety = 0.55 + 0.45 * Math.abs(Math.sin(t * 2.3 + 1));
        mouthOpen = now < wordGapUntil.current ? 0.04 : 0.14 + 0.62 * syllable * variety;
        mouthWide = Math.sin(t * 3.1);
      }

      const sway = calm ? 0 : energy;
      const talkBob = talking ? Math.sin(t * 6.5) * 1.1 * sway : 0;
      const target: Rig = {
        rs: pose.r.s,
        re: pose.r.e + (talking ? Math.sin(t * 2.2) * 3.5 * sway : 0),
        ru: pose.r.u,
        ls: pose.l.s,
        le: pose.l.e + (talking ? Math.sin(t * 1.9 + 2) * 3.5 * sway : 0),
        lu: pose.l.u,
        browY: face.browY + (talking ? Math.sin(t * 1.7) * 1.2 : 0),
        browTilt: face.browTilt,
        eyeOpen: now < blinkUntil ? 0.06 : face.eyeOpen,
        smile: face.smile,
        mouthOpen,
        mouthWide,
        tilt: face.tilt + pose.tilt + Math.sin(t * 0.8) * 1.4 * sway,
        nod: pose.nod + talkBob,
        bob: Math.sin(t * 1.6) * 2 * sway,
        blush: face.blush,
      };

      // Exponential smoothing: quick for lips and eyelids, slower for limbs.
      const ease = (key: keyof Rig, speed: number) => {
        current[key] += (target[key] - current[key]) * (1 - Math.exp(-dt * speed));
      };
      for (const key of ['rs', 're', 'ru', 'ls', 'le', 'lu'] as const) ease(key, 9);
      for (const key of ['browY', 'browTilt', 'smile', 'tilt', 'blush', 'bob'] as const)
        ease(key, 7);
      ease('nod', 14);
      ease('eyeOpen', 38);
      ease('mouthOpen', 30);
      ease('mouthWide', 14);

      setRig({ ...current });
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [still]); // eslint-disable-line react-hooks/exhaustive-deps

  const look = avatar.appearance;
  return (
    <svg
      viewBox={portrait ? '-105 40 210 230' : '-250 40 500 440'}
      className={className}
      role="img"
      aria-label={`${avatar.name}, presenter`}
      preserveAspectRatio="xMidYMax meet"
    >
      <g transform={`translate(0 ${rig.bob.toFixed(2)})`}>
        <HairBack look={look} />
        <Torso look={look} />
        <g
          transform={`translate(0 228) rotate(${rig.tilt.toFixed(2)}) translate(0 ${(-228 + rig.nod).toFixed(2)})`}
        >
          <Head look={look} rig={rig} />
        </g>
        <Arm side={1} look={look} shoulder={rig.rs} elbow={rig.re} upper={rig.ru} hand={hands.r} />
        <Arm side={-1} look={look} shoulder={rig.ls} elbow={rig.le} upper={rig.lu} hand={hands.l} />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Body parts                                                          */
/* ------------------------------------------------------------------ */

function Torso({ look }: { look: AvatarAppearance }): ReactElement {
  const jacketDark = shade(look.outfit, -0.22);
  return (
    <g>
      <rect x={-24} y={198} width={48} height={62} rx={18} fill={shade(look.skin, -0.1)} />
      <path
        d="M -34 244 Q -92 250 -104 292 L -112 500 L 112 500 L 104 292 Q 92 250 34 244 Q 0 262 -34 244 Z"
        fill={look.outfit}
      />
      <path d="M -30 244 L 0 318 L 30 244 Q 0 258 -30 244 Z" fill={look.shirt} />
      <path d="M -34 244 L -8 330 L 0 318 L -30 244 Z" fill={jacketDark} />
      <path d="M 34 244 L 8 330 L 0 318 L 30 244 Z" fill={jacketDark} />
      <path d="M 0 318 L 0 500" stroke={jacketDark} strokeWidth={3} />
      <circle cx={0} cy={372} r={4} fill={jacketDark} />
      <circle cx={0} cy={420} r={4} fill={jacketDark} />
    </g>
  );
}

function HairBack({ look }: { look: AvatarAppearance }): ReactElement | null {
  if (look.hairStyle === 'long') {
    return (
      <path
        d="M -80 150 Q -86 58 0 56 Q 86 58 80 150 L 88 300 Q 62 318 44 296 L -44 296 Q -62 318 -88 300 Z"
        fill={look.hair}
      />
    );
  }
  if (look.hairStyle === 'bob') {
    return (
      <path
        d="M -78 150 Q -84 58 0 56 Q 84 58 78 150 L 80 214 Q 60 236 40 222 L -40 222 Q -60 236 -80 214 Z"
        fill={look.hair}
      />
    );
  }
  if (look.hairStyle === 'bun') {
    return <circle cx={0} cy={62} r={27} fill={look.hair} />;
  }
  return null;
}

function HairFront({ look }: { look: AvatarAppearance }): ReactElement | null {
  const fill = look.hair;
  switch (look.hairStyle) {
    case 'bald':
      return (
        <path
          d="M -63 150 Q -66 128 -58 112 Q -58 138 -63 150 Z M 63 150 Q 66 128 58 112 Q 58 138 63 150 Z"
          fill={fill}
        />
      );
    case 'sidePart':
      return (
        <path
          d="M -66 148 Q -74 64 6 64 Q 76 68 66 148 Q 62 108 22 100 Q -28 114 -52 104 Q -62 122 -66 148 Z"
          fill={fill}
        />
      );
    case 'curly':
      return (
        <g fill={fill}>
          <path d="M -66 146 Q -72 70 0 68 Q 72 70 66 146 Q 56 104 0 100 Q -56 104 -66 146 Z" />
          {[
            [-60, 112],
            [-48, 86],
            [-24, 70],
            [4, 64],
            [30, 72],
            [52, 90],
            [62, 116],
            [-66, 138],
            [67, 140],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={21} />
          ))}
        </g>
      );
    case 'long':
    case 'bob':
      return (
        <path
          d="M -67 152 Q -76 64 0 62 Q 76 64 67 152 Q 58 106 0 90 Q -58 106 -67 152 Z"
          fill={fill}
        />
      );
    case 'bun':
    case 'short':
    default:
      return (
        <path
          d="M -65 142 Q -72 68 0 66 Q 72 68 65 142 Q 56 102 0 98 Q -56 102 -65 142 Z"
          fill={fill}
        />
      );
  }
}

function Head({ look, rig }: { look: AvatarAppearance; rig: Rig }): ReactElement {
  const skinDark = shade(look.skin, -0.14);
  const browColour = shade(look.hair, -0.25);
  const eyeH = Math.max(0.8, 8.5 * rig.eyeOpen);

  // Mouth: corners rise with a smile; the lower lip drops as the mouth opens.
  const halfWidth = 19 + rig.mouthWide * 3 + rig.smile * 4;
  const corner = -6 * rig.smile;
  const upper = 5 * rig.smile - rig.mouthOpen * 3;
  const lower = 5 * rig.smile + 3 + rig.mouthOpen * 30;
  const mouth = `M ${-halfWidth} ${corner} Q 0 ${upper * 2 - corner} ${halfWidth} ${corner} Q 0 ${lower * 2 - corner} ${-halfWidth} ${corner} Z`;

  return (
    <g>
      <ellipse cx={-62} cy={152} rx={10} ry={14} fill={skinDark} />
      <ellipse cx={62} cy={152} rx={10} ry={14} fill={skinDark} />
      {look.earrings && (
        <g fill="#F5C542">
          <circle cx={-64} cy={170} r={4.5} />
          <circle cx={64} cy={170} r={4.5} />
        </g>
      )}
      <ellipse cx={0} cy={150} rx={62} ry={76} fill={look.skin} />

      {look.beard && (
        <path
          d="M -59 160 Q -58 232 0 238 Q 58 232 59 160 Q 44 196 22 178 Q 0 170 -22 178 Q -44 196 -59 160 Z"
          fill={look.hair}
          opacity={0.92}
        />
      )}

      <g opacity={rig.blush}>
        <circle cx={-38} cy={172} r={13} fill="#F2707A" opacity={0.45} />
        <circle cx={38} cy={172} r={13} fill="#F2707A" opacity={0.45} />
      </g>

      {[-1, 1].map((side) => (
        <g key={side}>
          <ellipse cx={side * 24} cy={142} rx={11.5} ry={eyeH} fill="#FFFFFF" />
          {rig.eyeOpen > 0.3 && (
            <>
              <circle cx={side * 24} cy={142} r={Math.min(5.8, eyeH - 0.5)} fill="#2A1A12" />
              <circle cx={side * 24 + 2} cy={140} r={1.7} fill="#FFFFFF" />
            </>
          )}
          <path
            d="M -12 0 Q 0 -5 12 0"
            transform={`translate(${side * 24} ${(123 + rig.browY).toFixed(2)}) rotate(${(side * rig.browTilt).toFixed(2)})`}
            stroke={browColour}
            strokeWidth={4.5}
            strokeLinecap="round"
            fill="none"
          />
        </g>
      ))}

      <path
        d="M -5 164 Q 0 170 5 164"
        stroke={skinDark}
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
      />

      <g transform="translate(0 192)">
        <path d={mouth} fill="#5A1F24" stroke="#8C3B3F" strokeWidth={2.5} strokeLinejoin="round" />
        {rig.mouthOpen > 0.22 && (
          <rect
            x={-halfWidth * 0.55}
            y={Math.min(upper, 1) + 1}
            width={halfWidth * 1.1}
            height={4.5}
            rx={2}
            fill="#FFFFFF"
          />
        )}
      </g>

      {look.glasses && (
        <g fill="none" stroke="#1F2937" strokeWidth={3.2}>
          <rect x={-42} y={128} width={34} height={28} rx={9} fill="rgba(255,255,255,0.14)" />
          <rect x={8} y={128} width={34} height={28} rx={9} fill="rgba(255,255,255,0.14)" />
          <path d="M -8 140 Q 0 135 8 140 M -42 138 L -60 134 M 42 138 L 60 134" />
        </g>
      )}

      <HairFront look={look} />
    </g>
  );
}

function Arm({
  side,
  look,
  shoulder,
  elbow,
  upper,
  hand,
}: {
  side: 1 | -1;
  look: AvatarAppearance;
  shoulder: number;
  elbow: number;
  upper: number;
  hand: HandShape;
}): ReactElement {
  const sleeve = shade(look.outfit, -0.1);
  const upperLength = 92 * upper;
  return (
    <g transform={`scale(${side} 1) translate(90 276) rotate(${(-shoulder).toFixed(2)})`}>
      <rect x={-18} y={-14} width={36} height={upperLength + 28} rx={18} fill={sleeve} />
      <g transform={`translate(0 ${upperLength.toFixed(2)}) rotate(${(-elbow).toFixed(2)})`}>
        <rect x={-15} y={-12} width={30} height={92} rx={15} fill={sleeve} />
        <rect x={-15} y={66} width={30} height={10} fill={look.shirt} />
        <g transform="translate(0 88)">
          <Hand shape={hand} skin={look.skin} />
        </g>
      </g>
    </g>
  );
}

/** Fingers extend along +y, which is "away from the elbow". */
function Hand({ shape, skin }: { shape: HandShape; skin: string }): ReactElement {
  const dark = shade(skin, -0.14);
  const finger = (x: number, length: number, width = 7.5, angle = 0) => (
    <rect
      key={`${x}-${length}-${angle}`}
      x={x - width / 2}
      y={6}
      width={width}
      height={length}
      rx={width / 2}
      fill={skin}
      stroke={dark}
      strokeWidth={0.8}
      transform={`rotate(${angle})`}
    />
  );

  let fingers: ReactElement[] = [];
  switch (shape) {
    case 'open':
      fingers = [
        finger(-10, 20, 7, 14),
        finger(-3.5, 25, 7, 4),
        finger(3.5, 26, 7, -4),
        finger(10, 22, 7, -14),
        finger(-15, 13, 7.5, 62),
      ];
      break;
    case 'thumb':
      fingers = [finger(0, 24, 11)];
      break;
    case 'point':
    case 'one':
      fingers = [finger(0, 27, 8)];
      break;
    case 'two':
      fingers = [finger(-4, 27, 8, 9), finger(4, 27, 8, -9)];
      break;
    case 'three':
      fingers = [finger(-7, 25, 7.5, 15), finger(0, 28, 7.5), finger(7, 25, 7.5, -15)];
      break;
    case 'relaxed':
      fingers = [finger(-6, 13, 7, 6), finger(0, 15, 7), finger(6, 13, 7, -6)];
      break;
    case 'fist':
    default:
      fingers = [];
  }
  return (
    <g>
      {fingers}
      <circle cx={0} cy={2} r={15.5} fill={skin} stroke={dark} strokeWidth={0.8} />
    </g>
  );
}
