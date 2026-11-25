/** Drives an avatar through a list of script segments: voice, face, gestures and captions. */
import type { AvatarDto, Clip, Emotion, Gesture } from '@induction/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GestureCue } from '../avatar/Avatar';
import { narrator } from './narrator';

export interface Caption {
  text: string;
  /** Current sentence within `text`. */
  from: number;
  to: number;
  /** Current word within `text` (equal when unknown). */
  wordFrom: number;
  wordTo: number;
}

export interface PresenterView {
  emotion: Emotion;
  gesture: GestureCue | null;
  speaking: boolean;
  mouthCue: number;
  caption: Caption | null;
}

export interface Presenter {
  view: PresenterView;
  /** Speaks the segments in order. Resolves true if it reached the end. */
  present: (segments: readonly Clip[], avatar: AvatarDto) => Promise<boolean>;
  /** Plays a gesture without speaking. */
  gesture: (name: Gesture) => void;
  setEmotion: (emotion: Emotion) => void;
  stop: () => void;
}

export function usePresenter(initialEmotion: Emotion = 'FRIENDLY'): Presenter {
  const [view, setView] = useState<PresenterView>({
    emotion: initialEmotion,
    gesture: null,
    speaking: false,
    mouthCue: 0,
    caption: null,
  });
  const run = useRef(0);
  const nonce = useRef(0);

  const stop = useCallback(() => {
    run.current += 1;
    narrator.cancel();
    setView((v) => ({ ...v, speaking: false, caption: null }));
  }, []);

  const gesture = useCallback((name: Gesture) => {
    if (name === 'NONE') return;
    nonce.current += 1;
    setView((v) => ({ ...v, gesture: { name, nonce: nonce.current } }));
  }, []);

  const setEmotion = useCallback((emotion: Emotion) => setView((v) => ({ ...v, emotion })), []);

  const present = useCallback(
    async (segments: readonly Clip[], avatar: AvatarDto): Promise<boolean> => {
      run.current += 1;
      const id = run.current;
      for (const segment of segments) {
        if (run.current !== id) return false;
        nonce.current += 1;
        const cue =
          segment.gesture === 'NONE' ? null : { name: segment.gesture, nonce: nonce.current };
        setView((v) => ({
          ...v,
          emotion: segment.emotion,
          gesture: cue ?? v.gesture,
          speaking: true,
          caption: { text: segment.text, from: 0, to: segment.text.length, wordFrom: 0, wordTo: 0 },
        }));
        const finished = await narrator.speak(segment.text, avatar.voice, segment.emotion, {
          onSentence: (from, to) => {
            if (run.current !== id) return;
            setView((v) =>
              v.caption
                ? { ...v, caption: { ...v.caption, from, to, wordFrom: from, wordTo: from } }
                : v,
            );
          },
          onWord: (wordFrom, wordTo) => {
            if (run.current !== id) return;
            setView((v) => ({
              ...v,
              mouthCue: v.mouthCue + 1,
              caption: v.caption ? { ...v.caption, wordFrom, wordTo } : v.caption,
            }));
          },
        });
        if (!finished || run.current !== id) return false;
        setView((v) => ({ ...v, speaking: false }));
        if (!(await narrator.wait(280)) || run.current !== id) return false;
      }
      if (run.current !== id) return false;
      setView((v) => ({ ...v, speaking: false, emotion: avatar.defaultEmotion }));
      return true;
    },
    [],
  );

  useEffect(() => () => narrator.cancel(), []);

  return useMemo(
    () => ({ view, present, gesture, setEmotion, stop }),
    [view, present, gesture, setEmotion, stop],
  );
}
