// Procedural background music: a small spy-jazz combo played live with Web Audio.
// Nothing is recorded. Every eight bars a new section is composed from a chord progression,
// a bass pattern and a short melodic motif picked at random, so the music never loops exactly.
// The mood follows the game: calm in the menus, busier and brighter as the alarm rises.

import { audioContext, noise } from './sfx';

export type Mood = 'off' | 'menu' | 'cool' | 'warm' | 'hot';
type Playing = Exclude<Mood, 'off'>;

// ---------------------------------------------------------------- material

/** Chord shapes, in semitones above the chord root. */
const QUALITY = {
  m: [0, 3, 7, 12],
  mM7: [0, 3, 7, 11],
  m7: [0, 3, 7, 10],
  m6: [0, 3, 7, 9],
  m9: [0, 3, 10, 14],
  M: [0, 4, 7, 12],
  M7: [0, 4, 7, 11],
  dom7: [0, 4, 7, 10],
  dom7b9: [0, 4, 10, 13],
  dim7: [0, 3, 6, 9],
} as const;
type Quality = keyof typeof QUALITY;
/** Root in semitones above the key's tonic, and shape. */
type Chord = readonly [number, Quality];

const PROGS: Chord[][] = [
  [[0, 'm'], [0, 'mM7'], [0, 'm7'], [0, 'm6']], // minor line cliché
  [[0, 'mM7'], [8, 'M7'], [5, 'm7'], [7, 'dom7b9']], // i bVI iv V
  [[0, 'm9'], [10, 'M'], [8, 'M7'], [7, 'dom7']], // descending
  [[0, 'm7'], [5, 'm7'], [0, 'm6'], [7, 'dom7b9']], // i iv i V
  [[0, 'm'], [1, 'M'], [0, 'm'], [1, 'M7']], // Phrygian, tense
  [[0, 'm'], [6, 'dim7'], [5, 'm7'], [7, 'dom7b9']], // i #iv° iv V
];

/** [sixteenth, interval above the chord root ('T' = its third, 'A' = approach to the next root), length]. */
type BassNote = readonly [number, number | 'T' | 'A', number];
type BassStyle = 'long' | 'walk' | 'riff' | 'gallop';
const BASS: Record<BassStyle, BassNote[][]> = {
  long: [
    [[0, 0, 12], [12, 7, 4]],
    [[0, 0, 8], [8, 7, 6], [14, 'A', 2]],
  ],
  walk: [
    [[0, 0, 4], [4, 'T', 4], [8, 7, 4], [12, 'A', 4]],
    [[0, 0, 4], [4, 7, 4], [8, 12, 4], [12, 'A', 4]],
    [[0, 0, 6], [6, 0, 2], [8, 7, 4], [12, 'A', 4]],
  ],
  riff: [
    [[0, 0, 2], [3, 0, 1], [4, 7, 2], [6, 0, 2], [8, 12, 2], [10, 0, 2], [12, 7, 2], [14, 'A', 2]],
    [[0, 0, 3], [3, 0, 1], [4, 12, 2], [6, 7, 2], [8, 'T', 4], [12, 7, 2], [14, 'A', 2]],
  ],
  gallop: [
    [[0, 0, 1], [2, 0, 1], [3, 0, 1], [4, 0, 1], [6, 0, 1], [7, 0, 1], [8, 7, 1], [10, 7, 1], [11, 7, 1], [12, 0, 1], [14, 12, 1], [15, 'A', 1]],
    [[0, 0, 1], [2, 0, 1], [3, 0, 1], [4, 12, 1], [6, 0, 1], [7, 0, 1], [8, 0, 1], [10, 0, 1], [11, 0, 1], [12, 7, 1], [14, 'T', 1], [15, 'A', 1]],
  ],
};

type DrumVoice = 'kick' | 'snare' | 'brush' | 'rim' | 'hat' | 'open' | 'ride';
type DrumStyle = 'brush' | 'jazz' | 'beat' | 'drive';
const hits = (...pairs: [number, number][]) => {
  const a: number[] = Array(16).fill(0);
  for (const [i, v] of pairs) a[i] = v;
  return a;
};
const DRUMS: Record<DrumStyle, Partial<Record<DrumVoice, number[]>>> = {
  brush: { ride: hits([0, 0.5], [4, 0.8], [6, 0.4], [8, 0.5], [12, 0.8], [14, 0.4]), brush: hits([4, 0.6], [12, 0.6]) },
  jazz: { ride: hits([0, 0.6], [4, 0.9], [6, 0.5], [8, 0.6], [12, 0.9], [14, 0.5]), kick: hits([0, 0.6]), rim: hits([12, 0.7]) },
  beat: {
    hat: hits([0, 0.5], [2, 0.8], [4, 0.5], [6, 0.8], [8, 0.5], [10, 0.8], [12, 0.5], [14, 0.8]),
    kick: hits([0, 0.9], [8, 0.8], [11, 0.4]),
    snare: hits([4, 0.8], [12, 0.8]),
  },
  drive: {
    hat: hits(...Array.from({ length: 16 }, (_, i): [number, number] => [i, i % 2 ? 0.45 : 0.75])),
    open: hits([14, 0.6]),
    kick: hits([0, 1], [4, 0.8], [8, 1], [12, 0.8]),
    snare: hits([4, 0.9], [7, 0.25], [12, 0.9], [15, 0.3]),
  },
};

interface MoodDef {
  bpm: number;
  /** Delay of the off-beat eighths, in sixteenths. */
  swing: number;
  level: number;
  /** Cutoff of the music's low-pass filter, Hz: brighter as things heat up. */
  bright: number;
  progs: number[];
  /** Chords last two bars (true) or one. */
  slow: boolean;
  bass: BassStyle;
  drums: DrumStyle;
  lead: 'vibes' | 'twang';
  /** Chance that each melodic phrase is played. */
  melody: number;
  stabs: boolean;
  pulse: boolean;
}

const MOODS: Record<Playing, MoodDef> = {
  menu: { bpm: 80, swing: 0.6, level: 0.8, bright: 5000, progs: [0, 1, 3], slow: true, bass: 'long', drums: 'brush', lead: 'vibes', melody: 0.6, stabs: false, pulse: false },
  cool: { bpm: 94, swing: 0.55, level: 0.8, bright: 7000, progs: [0, 1, 3], slow: true, bass: 'walk', drums: 'jazz', lead: 'vibes', melody: 0.7, stabs: false, pulse: false },
  warm: { bpm: 104, swing: 0.25, level: 0.85, bright: 10000, progs: [1, 2, 3, 5], slow: false, bass: 'riff', drums: 'beat', lead: 'twang', melody: 0.7, stabs: true, pulse: false },
  hot: { bpm: 118, swing: 0, level: 0.9, bright: 16000, progs: [4, 5, 2], slow: false, bass: 'gallop', drums: 'drive', lead: 'twang', melody: 0.8, stabs: true, pulse: true },
};

/** Melodic rhythms over two bars: [sixteenth, length]. */
const RHYTHMS: [number, number][][] = [
  [[0, 3], [3, 3], [6, 2], [8, 6], [16, 2], [18, 2], [20, 4], [26, 6]],
  [[2, 2], [4, 2], [6, 4], [12, 4], [18, 2], [20, 2], [22, 6]],
  [[0, 6], [6, 2], [8, 8], [20, 2], [22, 2], [24, 8]],
  [[0, 2], [2, 2], [4, 2], [6, 2], [8, 4], [14, 2], [16, 8], [28, 4]],
  [[4, 2], [6, 2], [8, 2], [10, 6], [20, 4], [24, 2], [26, 6]],
];
const MINOR = [0, 2, 3, 5, 7, 8, 10];

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// ---------------------------------------------------------------- composing

interface Motif {
  step: number;
  len: number;
  deg: number;
}
interface Note {
  step: number;
  len: number;
  midi: number;
}
interface Section {
  mood: Playing;
  tonic: number;
  chords: Chord[];
  bass: BassNote[][];
  melody: (Note[] | null)[];
}

function makeMotif(): Motif[] {
  let deg = pick([0, 2, 4, 7]);
  return pick(RHYTHMS).map(([step, len], i) => {
    if (i) deg = clamp(deg + pick([-3, -2, -1, -1, 0, 1, 1, 2, 3]), -2, 9);
    return { step, len, deg };
  });
}

const vary = (m: Motif[]): Motif[] => m.map((n, i) => (i >= m.length - 2 ? { ...n, deg: clamp(n.deg + pick([-2, -1, 1, 2]), -2, 9) } : n));

const chordPcs = (tonic: number, [root, q]: Chord) => QUALITY[q].map((iv) => (tonic + root + iv) % 12);

/** Scale degrees to notes over a chord: the leading tone over the dominant, chord tones on long notes. */
function realize(notes: Motif[], tonic: number, chord: Chord): Note[] {
  const base = 60 + tonic + (tonic < 4 ? 12 : 0);
  const pcs = chordPcs(tonic, chord);
  const dominant = chord[0] === 7;
  return notes.map((n) => {
    const d = ((n.deg % 7) + 7) % 7;
    let semi = MINOR[d] + 12 * Math.floor(n.deg / 7);
    if (dominant && d === 6) semi += 1;
    let midi = base + semi;
    if (n.len >= 4 && !pcs.includes(midi % 12)) {
      midi = [1, -1, 2, -2].map((x) => midi + x).find((m) => pcs.includes(m % 12)) ?? midi;
    }
    return { step: n.step % 16, len: n.len, midi };
  });
}

let tonic = 9; // A minor to begin with

function compose(mood: Playing): Section {
  const def = MOODS[mood];
  if (Math.random() < 0.35) tonic = (tonic + pick([5, 7, 10, 3])) % 12;
  const prog = PROGS[pick(def.progs)];
  const chords = Array.from({ length: 8 }, (_, b) => prog[def.slow ? Math.floor(b / 2) : b % 4]);
  const pats = BASS[def.bass];
  const [a, b] = [pick(pats), pick(pats)];
  const bass = chords.map((_, i) => (i % 4 === 3 ? b : a));
  const motif = makeMotif();
  const answer = makeMotif();
  const form = pick([
    [motif, answer, vary(motif), null],
    [motif, null, vary(motif), answer],
    [motif, vary(motif), answer, null],
  ]);
  const melody: (Note[] | null)[] = [];
  form.forEach((phrase, i) => {
    const on = !!phrase && Math.random() < def.melody;
    for (const half of [0, 1]) {
      const bar = i * 2 + half;
      melody[bar] = on ? realize(phrase!.filter((n) => Math.floor(n.step / 16) === half), tonic, chords[bar]) : null;
    }
  });
  return { mood, tonic, chords, bass, melody };
}

// ---------------------------------------------------------------- instruments

interface Rig {
  c: BaseAudioContext;
  bus: GainNode;
  tone: BiquadFilterNode;
  verb: GainNode;
  echo: GainNode;
  delay: DelayNode;
}

function makeRig(c: BaseAudioContext): Rig {
  const bus = c.createGain();
  bus.gain.value = 0.0001;
  const tone = c.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3000;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 3;
  bus.connect(tone).connect(comp).connect(c.destination);

  // A small room: noise with an exponential tail.
  const len = Math.floor(c.sampleRate * 2.2);
  const ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  const verb = c.createGain();
  const verbOut = c.createGain();
  verbOut.gain.value = 0.32;
  verb.connect(conv).connect(verbOut).connect(bus);

  // Tape-style echo for the guitar.
  const echo = c.createGain();
  const delay = c.createDelay(2);
  const fb = c.createGain();
  fb.gain.value = 0.3;
  const echoOut = c.createGain();
  echoOut.gain.value = 0.45;
  echo.connect(delay);
  delay.connect(fb).connect(delay);
  delay.connect(echoOut).connect(bus);
  return { c, bus, tone, verb, echo, delay };
}

function envelope(g: AudioParam, t: number, peak: number, attack: number, decay: number) {
  g.setValueAtTime(0.0001, t);
  g.exponentialRampToValueAtTime(peak, t + attack);
  g.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function osc(r: Rig, type: OscillatorType, freq: number, t: number, stop: number) {
  const o = r.c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.start(t);
  o.stop(stop);
  return o;
}

function noiseSrc(r: Rig, t: number, stop: number) {
  const s = r.c.createBufferSource();
  s.buffer = noise(r.c);
  s.start(t);
  s.stop(stop);
  return s;
}

function filter(r: Rig, type: BiquadFilterType, freq: number, q = 0.7) {
  const f = r.c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function gain(r: Rig, to: AudioNode, sends: [AudioNode, number][] = []) {
  const g = r.c.createGain();
  g.connect(to);
  for (const [node, amount] of sends) {
    const s = r.c.createGain();
    s.gain.value = amount;
    g.connect(s).connect(node);
  }
  return g;
}

function bassNote(r: Rig, t: number, midi: number, dur: number) {
  const end = t + dur + 0.1;
  const f = filter(r, 'lowpass', 2000, 1);
  f.frequency.setValueAtTime(2000, t);
  f.frequency.exponentialRampToValueAtTime(700, t + 0.25);
  const g = gain(r, r.bus);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.06, t + Math.max(0.05, dur * 0.7));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  f.connect(g);
  osc(r, 'triangle', mtof(midi), t, end).connect(f);
  const saw = r.c.createGain();
  saw.gain.value = 0.5;
  saw.connect(f);
  osc(r, 'sawtooth', mtof(midi), t, end).connect(saw);
}

function drum(r: Rig, voice: DrumVoice, t: number, vel: number) {
  switch (voice) {
    case 'kick': {
      const g = gain(r, r.bus);
      envelope(g.gain, t, 0.32 * vel, 0.004, 0.22);
      const o = osc(r, 'sine', 160, t, t + 0.3);
      o.frequency.exponentialRampToValueAtTime(58, t + 0.12);
      o.connect(g);
      break;
    }
    case 'snare': {
      const g = gain(r, r.bus, [[r.verb, 0.25]]);
      envelope(g.gain, t, 0.16 * vel, 0.002, 0.14);
      noiseSrc(r, t, t + 0.2).connect(filter(r, 'highpass', 900)).connect(g);
      const body = gain(r, r.bus);
      envelope(body.gain, t, 0.1 * vel, 0.002, 0.07);
      osc(r, 'triangle', 185, t, t + 0.1).connect(body);
      break;
    }
    case 'brush': {
      const g = gain(r, r.bus);
      envelope(g.gain, t, 0.07 * vel, 0.03, 0.2);
      noiseSrc(r, t, t + 0.3).connect(filter(r, 'bandpass', 3000, 0.5)).connect(g);
      break;
    }
    case 'rim': {
      const g = gain(r, r.bus, [[r.verb, 0.3]]);
      envelope(g.gain, t, 0.09 * vel, 0.001, 0.03);
      noiseSrc(r, t, t + 0.06).connect(filter(r, 'bandpass', 3800, 3)).connect(g);
      osc(r, 'triangle', 1150, t, t + 0.04).connect(g);
      break;
    }
    case 'hat':
    case 'open': {
      const g = gain(r, r.bus);
      envelope(g.gain, t, 0.08 * vel, 0.002, voice === 'open' ? 0.22 : 0.035);
      noiseSrc(r, t, t + 0.3).connect(filter(r, 'highpass', 7500)).connect(g);
      break;
    }
    case 'ride': {
      const g = gain(r, r.bus, [[r.verb, 0.2]]);
      envelope(g.gain, t, 0.07 * vel, 0.002, 0.32);
      noiseSrc(r, t, t + 0.4).connect(filter(r, 'bandpass', 6500, 1.4)).connect(g);
      break;
    }
  }
}

/** Vibraphone-like bell: two-operator FM with a fast-fading modulator. */
function vibes(r: Rig, t: number, midi: number, dur: number) {
  const f = mtof(midi);
  const tail = Math.max(0.9, dur * 1.6);
  const g = gain(r, r.bus, [[r.verb, 0.55]]);
  envelope(g.gain, t, 0.11, 0.004, tail);
  const car = osc(r, 'sine', f, t, t + tail + 0.05);
  const mod = osc(r, 'sine', f * 4, t, t + tail + 0.05);
  const depth = r.c.createGain();
  depth.gain.setValueAtTime(f * 2.4, t);
  depth.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.3);
  mod.connect(depth).connect(car.frequency);
  car.connect(g);
}

/** Twangy guitar through the echo, for the tenser moods. */
function twang(r: Rig, t: number, midi: number, dur: number) {
  const f = mtof(midi);
  const end = t + dur + 0.15;
  const lp = filter(r, 'lowpass', 2800, 2);
  lp.frequency.setValueAtTime(2800, t);
  lp.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
  const g = gain(r, r.bus, [[r.echo, 0.55], [r.verb, 0.25]]);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.075, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.03, t + Math.max(0.06, dur));
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  const o = osc(r, 'sawtooth', f * 0.985, t, end);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.04);
  o.connect(lp).connect(g);
}

function pad(r: Rig, t: number, tonicPc: number, chord: Chord, dur: number) {
  const g = gain(r, r.bus, [[r.verb, 0.4]]);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.022, t + 0.5);
  g.gain.setValueAtTime(0.022, t + Math.max(0.5, dur - 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  const lp = filter(r, 'lowpass', 900);
  lp.connect(g);
  const root = 57 + ((tonicPc + chord[0]) % 12);
  for (const iv of QUALITY[chord[1]]) {
    for (const cents of [-7, 7]) {
      const o = osc(r, 'sawtooth', mtof(root + iv), t, t + dur + 0.6);
      o.detune.value = cents;
      o.connect(lp);
    }
  }
}

function stab(r: Rig, t: number, tonicPc: number, chord: Chord) {
  const g = gain(r, r.bus, [[r.verb, 0.2]]);
  envelope(g.gain, t, 0.03, 0.003, 0.09);
  const root = 60 + ((tonicPc + chord[0]) % 12);
  for (const iv of QUALITY[chord[1]].slice(1)) osc(r, 'square', mtof(root + iv), t, t + 0.12).connect(g);
}

function pulse(r: Rig, t: number, midi: number) {
  const g = gain(r, r.bus);
  envelope(g.gain, t, 0.05, 0.002, 0.07);
  osc(r, 'sawtooth', mtof(midi), t, t + 0.1).connect(filter(r, 'lowpass', 480, 5)).connect(g);
}

// ---------------------------------------------------------------- playback

/** A band playing into a rig: where it is in the music. */
interface Player {
  r: Rig;
  section: Section | null;
  bar: number;
  step: number;
  /** Context time of the next sixteenth. */
  at: number;
}

const want = { enabled: false, volume: 0.6, mood: 'off' as Mood };
let unlocked = false;
let listening = false;
let rig: Rig | null = null;
let live: Player | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;

function level(mood: Playing, volume = want.volume) {
  return Math.max(0.0001, volume * 0.8 * MOODS[mood].level);
}

function bassMidi(s: Section, chord: Chord, next: Chord, iv: BassNote[1]) {
  const root = 40 + ((s.tonic + chord[0] + 3) % 12) - 3; // C#2 … C3: low, but still heard on phone speakers
  if (iv === 'T') return root + QUALITY[chord[1]][1];
  if (iv === 'A') {
    const target = 40 + ((s.tonic + next[0] + 3) % 12) - 3;
    return target + (target > root ? -1 : 1);
  }
  return root + iv;
}

/** Schedules the next sixteenth. A new section starts every eight bars, or at the next bar after a mood change. */
function playStep(p: Player, mood: Playing, volume = want.volume) {
  const { r } = p;
  const t = p.at;
  if (p.step === 0 && (!p.section || p.bar >= 8 || p.section.mood !== mood)) {
    p.section = compose(mood);
    p.bar = 0;
    const def = MOODS[mood];
    r.tone.frequency.setTargetAtTime(def.bright, t, 0.8);
    r.bus.gain.setTargetAtTime(level(mood, volume), t, 0.5);
    r.delay.delayTime.setTargetAtTime((60 / def.bpm / 4) * 3, t, 0.05);
  }
  const s = p.section!;
  const { bar, step } = p;
  const def = MOODS[s.mood];
  const six = 60 / def.bpm / 4;
  const at = t + (step % 4 === 2 ? def.swing * six : 0);
  const chord = s.chords[bar];
  const next = s.chords[(bar + 1) % 8];

  if (step === 0 && (bar === 0 || s.chords[bar - 1] !== chord)) {
    pad(r, t, s.tonic, chord, (next === chord && bar < 7 ? 32 : 16) * six);
  }
  for (const [st, iv, len] of s.bass[bar]) if (st === step) bassNote(r, at, bassMidi(s, chord, next, iv), len * six * 0.92);
  const kit = DRUMS[def.drums];
  for (const voice of Object.keys(kit) as DrumVoice[]) {
    const vel = kit[voice]![step];
    if (vel) drum(r, voice, at, vel * (0.85 + Math.random() * 0.3));
  }
  // A small fill at the end of every fourth bar in the busier moods.
  if ((def.drums === 'beat' || def.drums === 'drive') && bar % 4 === 3 && step >= 13 && Math.random() < 0.6) drum(r, 'snare', at, 0.3 + (step - 12) * 0.12);
  const mel = s.melody[bar];
  if (mel) for (const n of mel) if (n.step === step) (def.lead === 'vibes' ? vibes : twang)(r, at, n.midi, n.len * six);
  if (def.stabs && (step === 6 || step === 14) && Math.random() < 0.7) stab(r, at, s.tonic, chord);
  if (def.pulse && step % 2 === 0) pulse(r, t, bassMidi(s, chord, next, 0) + 12);

  p.at += six;
  p.step = (step + 1) % 16;
  if (p.step === 0) p.bar++;
}

function tick() {
  const p = live;
  if (!p || p.r.c.state !== 'running') return;
  const now = p.r.c.currentTime;
  // Fell behind (tab throttled, device asleep): skip ahead instead of playing a burst of notes.
  if (p.at < now - 0.2) p.at = now + 0.05;
  // While fading out after 'off', keep playing what was playing.
  const mood = want.mood === 'off' ? (p.section?.mood ?? 'menu') : want.mood;
  while (p.at < now + 0.15) playStep(p, mood);
}

function start(c: AudioContext) {
  if (stopTimer) clearTimeout(stopTimer);
  stopTimer = null;
  rig ??= makeRig(c);
  if (timer) return;
  live = { r: rig, section: null, bar: 0, step: 0, at: c.currentTime + 0.08 };
  rig.bus.gain.cancelScheduledValues(c.currentTime);
  rig.bus.gain.setValueAtTime(0.0001, c.currentTime);
  timer = setInterval(tick, 25);
  tick();
}

function stop(fade: number) {
  if (!timer || !rig || stopTimer) return;
  const now = rig.c.currentTime;
  rig.bus.gain.cancelScheduledValues(now);
  rig.bus.gain.setTargetAtTime(0.0001, now, fade / 4);
  stopTimer = setTimeout(() => {
    if (timer) clearInterval(timer);
    timer = null;
    stopTimer = null;
    live = null;
  }, fade * 1000 + 100);
}

/** Renders a few seconds of a mood offline, to check levels and listen to it in development. */
export function renderMusic(mood: Playing, seconds: number, sampleRate = 44100): Promise<AudioBuffer> {
  const c = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  const p: Player = { r: makeRig(c), section: null, bar: 0, step: 0, at: 0.02 };
  while (p.at < seconds) playStep(p, mood, 0.6);
  return c.startRendering();
}

/** Browsers only start audio after the player interacts with the page. */
function waitForGesture() {
  if (listening) return;
  listening = true;
  const events = ['pointerdown', 'pointerup', 'keydown', 'touchend'];
  const on = () => {
    const c = audioContext();
    if (!c) return;
    const ready = () => {
      if (c.state !== 'running' || unlocked) return;
      unlocked = true;
      listening = false;
      events.forEach((e) => window.removeEventListener(e, on, true));
      update();
    };
    if (c.state === 'running') ready();
    else c.resume().then(ready, () => {});
  };
  events.forEach((e) => window.addEventListener(e, on, true));
}

function update() {
  const active = want.enabled && want.mood !== 'off' && document.visibilityState === 'visible';
  if (!active) {
    stop(document.visibilityState === 'visible' ? 1.2 : 0.2);
    return;
  }
  if (!unlocked) {
    waitForGesture();
    return;
  }
  const c = audioContext();
  if (!c) return;
  start(c);
  if (live?.section?.mood === want.mood) rig!.bus.gain.setTargetAtTime(level(want.mood), c.currentTime, 0.1);
}

/** Tells the music what to play. Safe to call often: only changes are acted on. */
export function setMusic(next: { enabled: boolean; volume: number; mood: Mood }) {
  if (next.enabled === want.enabled && next.volume === want.volume && next.mood === want.mood) return;
  Object.assign(want, next);
  update();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    // Coming back from the background, some browsers (iOS) need a new tap to resume audio.
    if (document.visibilityState === 'visible' && unlocked && audioContext()?.state !== 'running') {
      unlocked = false;
    }
    update();
  });
}
