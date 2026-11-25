import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SoundSettings {
  volume: number;
  muted: boolean;
  captions: boolean;
  music: boolean;
  set: (patch: Partial<Omit<SoundSettings, 'set'>>) => void;
}

/** Player sound preferences, remembered in this browser. */
export const useSound = create<SoundSettings>()(
  persist(
    (set) => ({
      volume: 0.9,
      muted: false,
      captions: true,
      music: false,
      set: (patch) => set(patch),
    }),
    { name: 'induction-sound' },
  ),
);

/** Volume to actually play at, 0 when muted. */
export const effectiveVolume = (): number => {
  const { volume, muted } = useSound.getState();
  return muted ? 0 : volume;
};
