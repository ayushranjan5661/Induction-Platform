/** Sound effects and soft background music, synthesised with the Web Audio API (no audio files). */
import { effectiveVolume } from './settings';

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  return ctx;
}

function tone(
  freq: number,
  startIn: number,
  length: number,
  type: OscillatorType,
  peak: number,
): void {
  const ac = audio();
  const volume = effectiveVolume();
  if (!ac || volume === 0) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const t0 = ac.currentTime + startIn;
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak * volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

export const sfx = {
  correct(): void {
    tone(660, 0, 0.22, 'sine', 0.22);
    tone(880, 0.11, 0.25, 'sine', 0.22);
    tone(1320, 0.22, 0.45, 'sine', 0.18);
  },
  wrong(): void {
    tone(220, 0, 0.3, 'triangle', 0.22);
    tone(174, 0.14, 0.4, 'triangle', 0.2);
  },
  click(): void {
    tone(520, 0, 0.08, 'sine', 0.12);
  },
  /** A soft sweep for scene changes. */
  whoosh(): void {
    const ac = audio();
    const volume = effectiveVolume();
    if (!ac || volume === 0) return;
    const length = 0.7;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * length), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    const filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(300, ac.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2600, ac.currentTime + length);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.16 * volume, ac.currentTime + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + length);
    source.connect(filter).connect(gain).connect(ac.destination);
    source.start();
  },
  fanfare(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.5, 'triangle', 0.2));
  },
};

/* Background music: a slow, quiet chord pad. */
let pad: { gain: GainNode; stop: () => void } | null = null;

export function setMusic(on: boolean): void {
  const ac = audio();
  if (!ac) return;
  if (!on) {
    if (pad) {
      const old = pad;
      pad = null;
      old.gain.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.6);
      window.setTimeout(old.stop, 800);
    }
    return;
  }
  const level = 0.035 * effectiveVolume();
  if (pad) {
    pad.gain.gain.linearRampToValueAtTime(Math.max(level, 0.0001), ac.currentTime + 0.3);
    return;
  }
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.linearRampToValueAtTime(Math.max(level, 0.0001), ac.currentTime + 1.5);
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(gain).connect(ac.destination);
  const oscillators = [130.81, 196, 261.63, 329.63].map((freq, i) => {
    const osc = ac.createOscillator();
    osc.type = i % 2 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    osc.detune.value = (i - 1.5) * 6;
    // A slow wobble keeps the pad from sounding static.
    const lfo = ac.createOscillator();
    const depth = ac.createGain();
    lfo.frequency.value = 0.07 + i * 0.03;
    depth.gain.value = 4;
    lfo.connect(depth).connect(osc.detune);
    lfo.start();
    osc.connect(filter);
    osc.start();
    return [osc, lfo];
  });
  pad = { gain, stop: () => oscillators.flat().forEach((o) => o.stop()) };
}
