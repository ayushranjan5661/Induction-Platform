/**
 * The built-in presenter: a 2D cartoon character in SVG, animated in the browser
 * (see `src/character`). No video, no external service. It is either one of the
 * ready-drawn characters (`appearance.character`, see `character/sprites`) or one
 * built from the appearance fields; both are driven by the same controller.
 *
 * This component adapts the app's presenter props (emotion, gesture cue,
 * speaking, current word, optional action cue) to the character controller,
 * which does the animation; `Character` draws each pose.
 */
import type { AvatarDto, Emotion, Gesture } from '@induction/shared';
import { useEffect, useMemo, useRef, type ReactElement } from 'react';
import { EMOTION_TO_EXPRESSION } from '../character/anim/clips/expressions';
import { GESTURE_TO_CLIP } from '../character/anim/clips/gestures';
import { CharacterController, type ClipName } from '../character/controller';
import { Character } from '../character/render/Character';
import { SpriteCharacter } from '../character/sprites/SpriteCharacter';
import { useCharacter } from '../character/useCharacter';

export interface GestureCue {
  name: Gesture;
  /** Change this to replay the same gesture. */
  nonce: number;
}

/** The word being spoken now. */
export interface WordCue {
  text: string;
  /** Changes on every word, even a repeated one. */
  nonce: number;
  /** How long the word should take, in milliseconds. */
  ms: number;
}

/** Body actions or extra gestures by clip name (walk in, jump, cheer, listen…), played together. */
export interface ActionCue {
  names: ClipName[];
  nonce: number;
}

interface AvatarProps {
  avatar: Pick<AvatarDto, 'appearance' | 'energy' | 'themeColor' | 'name'>;
  emotion?: Emotion;
  gesture?: GestureCue | null;
  /** Clips to play by name, such as `walkIn`, `jump` or `listen`. */
  action?: ActionCue | null;
  speaking?: boolean;
  /** Kept for compatibility; lip-sync now follows `word`. */
  mouthCue?: number;
  /** The current word, for lip-sync. Without it the mouth moves in a generic talking rhythm. */
  word?: WordCue | null;
  /** Draw a single frame with no animation (thumbnails, lists). */
  still?: boolean;
  /** Crop to the head and shoulders (small round thumbnails). */
  portrait?: boolean;
  className?: string;
}

/** Minimum time between scripted gestures, so the hands are not always moving. */
const GESTURE_GAP_MS = 4000;

/** A settled pose for still pictures: the expression applied, no blink, no motion. */
function stillPose(emotion: Emotion) {
  const c = new CharacterController({ reducedMotion: true, random: () => 0.5 });
  c.setExpression(EMOTION_TO_EXPRESSION[emotion], 0);
  let pose = c.update(0);
  for (let i = 0; i < 24; i += 1) pose = c.update(50);
  return pose;
}

export function Avatar({
  avatar,
  emotion = 'FRIENDLY',
  gesture = null,
  action = null,
  speaking = false,
  word = null,
  still = false,
  portrait = false,
  className,
}: AvatarProps): ReactElement {
  const { controller, pose } = useCharacter({ energy: avatar.energy, still });
  const frozen = useMemo(() => (still ? stillPose(emotion) : null), [still, emotion]);

  useEffect(() => {
    controller.setExpression(EMOTION_TO_EXPRESSION[emotion]);
  }, [controller, emotion]);

  const lastGesture = useRef<number | null>(null);
  const lastGestureAt = useRef(-Infinity);
  useEffect(() => {
    if (!gesture || gesture.nonce === lastGesture.current) return;
    lastGesture.current = gesture.nonce;
    if (gesture.name === 'NONE') return;
    // Rest the hands between gestures: skip one cued too soon after the last.
    const now = performance.now();
    if (now - lastGestureAt.current < GESTURE_GAP_MS) return;
    if (controller.play(GESTURE_TO_CLIP[gesture.name], { force: true }))
      lastGestureAt.current = now;
  }, [controller, gesture]);

  // A presenter that mounts mid-induction ignores actions cued for the one before.
  const lastAction = useRef<number | null>(action?.nonce ?? null);
  useEffect(() => {
    if (!action || action.nonce === lastAction.current) return;
    lastAction.current = action.nonce;
    for (const name of action.names) controller.play(name, { force: true });
  }, [controller, action]);

  useEffect(() => {
    controller.setSpeaking(speaking);
  }, [controller, speaking]);

  // Each word is mouthed once. Resuming after a pause flips `speaking` back on but must not
  // replay the last word with no sound.
  const mouthed = useRef<number | null>(null);
  useEffect(() => {
    if (!word || !speaking || mouthed.current === word.nonce) return;
    mouthed.current = word.nonce;
    controller.speakWord(word.text, word.ms);
  }, [controller, word, speaking]);

  // A ready-drawn character, driven by the same controller and poses.
  if (avatar.appearance.character) {
    return (
      <SpriteCharacter
        character={avatar.appearance.character}
        pose={frozen ?? pose}
        portrait={portrait}
        className={className}
        label={`${avatar.name}, presenter`}
      />
    );
  }

  return (
    <Character
      appearance={avatar.appearance}
      pose={frozen ?? pose}
      portrait={portrait}
      className={className}
      label={`${avatar.name}, presenter`}
    />
  );
}
