/** React glue: owns a controller, runs it once per animation frame, and returns the pose to draw. */
import { useEffect, useRef, useState } from 'react';
import { CharacterController } from './controller';
import { REST_POSE, type Pose } from './pose';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export function useCharacter(options: { energy: number; still?: boolean }): {
  controller: CharacterController;
  pose: Pose;
} {
  const ref = useRef<CharacterController | null>(null);
  if (!ref.current) {
    ref.current = new CharacterController({
      energy: options.energy,
      reducedMotion: prefersReducedMotion(),
    });
  }
  const controller = ref.current;
  const [pose, setPose] = useState<Pose>(() => (options.still ? REST_POSE : controller.update(0)));

  useEffect(() => {
    controller.configure({ energy: options.energy });
  }, [controller, options.energy]);

  useEffect(() => {
    if (options.still) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // The browser pauses frames in hidden tabs; the controller caps large steps.
      setPose(controller.update(now - last));
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [controller, options.still]);

  return { controller, pose };
}
