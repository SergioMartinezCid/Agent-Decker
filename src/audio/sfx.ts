// Small synthesized sound effects (Web Audio). No audio files, nothing to license.

export type Sfx =
  | 'click'
  | 'play'
  | 'draw'
  | 'equip'
  | 'disarm'
  | 'knockout'
  | 'alarm'
  | 'slide'
  | 'enter'
  | 'flip'
  | 'shuffle'
  | 'mission'
  | 'gameOver'
  | 'won'
  | 'error';

let ctx: AudioContext | null = null;
let enabled = true;
let noiseBuf: AudioBuffer | null = null;

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.6);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function tone(c: AudioContext, at: number, freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, endFreq?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

function hiss(c: AudioContext, at: number, dur: number, from: number, to: number, vol = 0.12, type: BiquadFilterType = 'bandpass') {
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = type;
  f.Q.value = 1.2;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(at);
  src.stop(at + dur + 0.02);
}

export function sfx(name: Sfx, level = 0) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + 0.005;
  switch (name) {
    case 'click':
      tone(c, t, 900, 0.04, 'triangle', 0.06);
      break;
    case 'play':
      hiss(c, t, 0.09, 2500, 900, 0.1);
      tone(c, t, 520, 0.06, 'triangle', 0.06);
      break;
    case 'draw':
      hiss(c, t, 0.12, 1200, 3800, 0.08);
      break;
    case 'equip':
      tone(c, t, 440, 0.08, 'triangle', 0.1);
      tone(c, t + 0.07, 660, 0.12, 'triangle', 0.1);
      break;
    case 'disarm':
      tone(c, t, 587, 0.09, 'square', 0.05);
      tone(c, t + 0.08, 880, 0.14, 'square', 0.05);
      break;
    case 'knockout':
      tone(c, t, 160, 0.18, 'sine', 0.3, 50);
      hiss(c, t, 0.08, 800, 200, 0.12, 'lowpass');
      break;
    case 'alarm': {
      const base = 620 + Math.min(level, 50) * 9;
      tone(c, t, base, 0.12, 'sawtooth', 0.07);
      tone(c, t + 0.15, base * 1.06, 0.14, 'sawtooth', 0.07);
      break;
    }
    case 'slide':
      hiss(c, t, 0.22, 300, 1400, 0.07, 'bandpass');
      break;
    case 'enter':
      tone(c, t, 1200, 0.03, 'triangle', 0.05);
      hiss(c, t, 0.06, 3000, 1500, 0.05);
      break;
    case 'flip':
      hiss(c, t, 0.07, 4000, 1800, 0.08);
      tone(c, t + 0.03, 700, 0.05, 'triangle', 0.05);
      break;
    case 'shuffle':
      for (let i = 0; i < 5; i++) hiss(c, t + i * 0.045, 0.04, 2500, 1600, 0.06);
      break;
    case 'mission':
      [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.1, f, 0.22, 'triangle', 0.12));
      break;
    case 'won':
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(c, t + i * 0.12, f, 0.3, 'triangle', 0.12));
      break;
    case 'gameOver':
      [392, 330, 262, 196].forEach((f, i) => tone(c, t + i * 0.16, f, 0.3, 'sawtooth', 0.07));
      break;
    case 'error':
      tone(c, t, 150, 0.14, 'square', 0.05);
      break;
  }
}
