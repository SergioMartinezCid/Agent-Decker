// App store: game state + undo + persistence + end-of-turn animation playback.
import { useSyncExternalStore } from 'react';
import { applyAction, newCampaign, RuleError } from '../engine/engine';
import { randomSeed } from '../engine/rng';
import type { Action, Frame, GameEvent, GameState } from '../engine/types';
import { setSoundEnabled, sfx } from '../audio/sfx';
import type { Lang } from '../i18n';
import { FREE, nextTip, stepAfter, stepAllows, tutorialStart } from '../tutorial/script';

export interface Saved {
  game: GameState;
  /** Snapshot at the start of the current mission, for "Retry mission". */
  missionStart: GameState;
  undo: GameState[];
  retries: number;
}

export interface Settings {
  lang: Lang;
  sound: boolean;
  anim: boolean;
  /** The player has started the tutorial at least once (the start screen stops pushing it). */
  tutorialSeen: boolean;
}

/** The tutorial game, kept apart from the campaign. */
export interface TutorialSave {
  saved: Saved;
  /** Index into the coach's steps; `FREE` once the scripted turns are over. */
  step: number;
  /** Tips already shown, and the one on screen. */
  tips: string[];
  tip: string | null;
}

export interface HighScore {
  date: string;
  scores: number[];
  total: number;
  retries: number;
}

export type Overlay = null | 'menu' | 'rules' | 'settings' | 'about' | 'scores' | 'scenarios';

export interface AppState {
  /** The campaign. */
  saved: Saved | null;
  tutorial: TutorialSave | null;
  settings: Settings;
  highScores: HighScore[];
  screen: 'start' | 'game' | 'tutorial';
  overlay: Overlay;
  anim: { frames: Frame[]; i: number } | null;
  toast: string | null;
  /** Counts actions the tutorial refused, so the coach can draw attention to itself. */
  nudge: number;
}

const KEY_SAVE = 'agent-decker/save/v1';
const KEY_SETTINGS = 'agent-decker/settings/v1';
const KEY_SCORES = 'agent-decker/scores/v1';
const KEY_TUTORIAL = 'agent-decker/tutorial/v1';
const UNDO_LIMIT = 60;
const FRAME_MS = 340;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: the game keeps working in memory */
  }
}

export function isValidSaved(x: unknown): x is Saved {
  const s = x as Saved;
  return !!s && typeof s === 'object' && !!s.game && s.game.v === 1 && Array.isArray(s.game.line) && !!s.missionStart && Array.isArray(s.undo);
}

function isValidTutorial(x: unknown): x is TutorialSave {
  const t = x as TutorialSave;
  return !!t && typeof t === 'object' && isValidSaved(t.saved) && typeof t.step === 'number' && Array.isArray(t.tips);
}

const prefersReduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function initialState(): AppState {
  const saved = read<Saved>(KEY_SAVE);
  const tutorial = read<TutorialSave>(KEY_TUTORIAL);
  const settings: Settings = {
    lang: 'en',
    sound: true,
    anim: !prefersReduced(),
    tutorialSeen: false,
    ...(read<Partial<Settings>>(KEY_SETTINGS) ?? {}),
  };
  setSoundEnabled(settings.sound);
  return {
    saved: isValidSaved(saved) ? saved : null,
    tutorial: isValidTutorial(tutorial) ? tutorial : null,
    settings,
    highScores: read<HighScore[]>(KEY_SCORES) ?? [],
    screen: 'start',
    overlay: null,
    anim: null,
    toast: null,
    nudge: 0,
  };
}

let state: AppState = initialState();
const listeners = new Set<() => void>();
let animTimer: ReturnType<typeof setInterval> | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  if ('saved' in patch) write(KEY_SAVE, state.saved);
  if ('settings' in patch) write(KEY_SETTINGS, state.settings);
  if ('highScores' in patch) write(KEY_SCORES, state.highScores);
  if ('tutorial' in patch) write(KEY_TUTORIAL, state.tutorial);
  listeners.forEach((l) => l());
}

export function useApp<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => select(state),
  );
}

export const getApp = () => state;

/** The game on screen: the tutorial's while in the tutorial, otherwise the campaign. */
export const activeSaved = (s: AppState): Saved | null => (s.screen === 'tutorial' ? (s.tutorial?.saved ?? null) : s.saved);

/** True during the scripted tutorial turns, when only the coach's action is allowed and undo is off. */
export const isGuided = (s: AppState) => s.screen === 'tutorial' && !!s.tutorial && s.tutorial.step < FREE;

/** Replaces the game on screen, in whichever slot it lives. */
function putSaved(saved: Saved) {
  if (state.screen === 'tutorial' && state.tutorial) set({ tutorial: { ...state.tutorial, saved } });
  else set({ saved });
}

// ---------------------------------------------------------------- feedback

const EVENT_SFX: Partial<Record<GameEvent['t'], Parameters<typeof sfx>[0]>> = {
  play: 'play',
  draw: 'draw',
  equip: 'equip',
  disarm: 'disarm',
  knockout: 'knockout',
  shuffle: 'shuffle',
  mission: 'mission',
  won: 'won',
  gameOver: 'gameOver',
  slide: 'slide',
};

function playEvents(events: GameEvent[]) {
  const seen = new Set<string>();
  for (const e of events) {
    const name = EVENT_SFX[e.t];
    if (name && !seen.has(name)) {
      seen.add(name);
      sfx(name);
    }
  }
}

function frameSound(prev: Frame, cur: Frame) {
  if (cur.alarm > prev.alarm) sfx('alarm', cur.alarm);
  else {
    const before = prev.line.filter(Boolean).length;
    const after = cur.line.filter(Boolean).length;
    if (after > before) sfx('enter');
    else if (after < before) sfx('slide');
    else if (cur.line.some((lc, i) => lc && prev.line[i] && lc.down !== prev.line[i]!.down)) sfx('flip');
    else sfx('slide');
  }
}

export function showToast(msg: string) {
  if (toastTimer) clearTimeout(toastTimer);
  set({ toast: msg });
  toastTimer = setTimeout(() => set({ toast: null }), 3200);
}

function startAnim(frames: Frame[], after?: GameEvent[]) {
  stopAnim();
  if (!state.settings.anim || frames.length < 2) {
    if (after) playEvents(after);
    return;
  }
  set({ anim: { frames, i: 0 } });
  animTimer = setInterval(() => {
    const a = state.anim;
    if (!a) return stopAnim();
    const i = a.i + 1;
    if (i >= a.frames.length) {
      stopAnim();
      if (after) playEvents(after);
      return;
    }
    frameSound(a.frames[i - 1], a.frames[i]);
    set({ anim: { frames: a.frames, i } });
  }, FRAME_MS);
}

export function stopAnim() {
  if (animTimer) clearInterval(animTimer);
  animTimer = null;
  if (state.anim) set({ anim: null });
}

// ---------------------------------------------------------------- game actions

export function newGame(seed = randomSeed()) {
  const res = newCampaign(seed);
  set({ saved: { game: res.state, missionStart: res.state, undo: [], retries: 0 }, screen: 'game', overlay: null });
  sfx('shuffle');
  startAnim(res.frames);
}

/** Apply a game action. Returns false (and buzzes) if the rules forbid it. */
export function dispatch(action: Action): boolean {
  const saved = activeSaved(state);
  if (!saved) return false;
  const tutorial = state.screen === 'tutorial' ? state.tutorial : null;
  if (tutorial && !stepAllows(tutorial.step, action, saved.game)) {
    sfx('error');
    set({ nudge: state.nudge + 1 });
    return false;
  }
  if (state.anim) stopAnim();
  let res;
  try {
    res = applyAction(saved.game, action);
  } catch (e) {
    if (e instanceof RuleError) {
      sfx('error');
      console.warn(e.message);
      return false;
    }
    throw e;
  }
  const undo = res.barrier ? [] : [...saved.undo, saved.game].slice(-UNDO_LIMIT);
  const next: Saved = { ...saved, game: res.state, undo };
  if (action.t === 'nextMission') next.missionStart = res.state;
  if (tutorial) {
    set({ tutorial: withTip({ ...tutorial, saved: next, step: stepAfter(tutorial.step, res.state) }) });
  } else {
    let highScores = state.highScores;
    if (res.state.phase === 'won' && saved.game.phase !== 'won') {
      const scores = res.state.scores;
      highScores = [
        ...highScores,
        { date: new Date().toISOString(), scores, total: scores.reduce((a, b) => a + b, 0), retries: saved.retries },
      ]
        .sort((a, b) => a.total - b.total || a.retries - b.retries)
        .slice(0, 20);
    }
    set({ saved: next, highScores });
  }
  const animated = action.t === 'endTurn' || action.t === 'nextMission';
  if (animated) {
    const immediate = res.events.filter((e) => e.t === 'draw' || e.t === 'shuffle');
    const late = res.events.filter((e) => e.t === 'mission' || e.t === 'won' || e.t === 'gameOver');
    if (action.t === 'endTurn' && !late.length) sfx('slide');
    playEvents(immediate);
    startAnim(res.frames, late);
  } else {
    playEvents(res.events);
  }
  return true;
}

export function undo() {
  const saved = activeSaved(state);
  if (!saved || !saved.undo.length || isGuided(state)) return;
  stopAnim();
  const prev = saved.undo[saved.undo.length - 1];
  putSaved({ ...saved, game: prev, undo: saved.undo.slice(0, -1) });
  sfx('click');
}

export function retryMission() {
  const saved = activeSaved(state);
  if (!saved) return;
  stopAnim();
  putSaved({ ...saved, game: saved.missionStart, undo: [], retries: saved.retries + 1 });
  sfx('shuffle');
}

export function loadState(game: GameState) {
  stopAnim();
  set({ saved: { game, missionStart: game, undo: [], retries: 0 }, screen: 'game', overlay: null });
}

// ---------------------------------------------------------------- tutorial

/** Shows the next tip that applies, once the scripted part is over and no tip is on screen. */
function withTip(t: TutorialSave): TutorialSave {
  if (t.step < FREE || t.tip) return t;
  const tip = nextTip(t.saved.game, t.tips);
  return tip ? { ...t, tip, tips: [...t.tips, tip] } : t;
}

export function startTutorial() {
  stopAnim();
  const game = tutorialStart();
  set({
    tutorial: { saved: { game, missionStart: game, undo: [], retries: 0 }, step: 0, tips: [], tip: null },
    settings: { ...state.settings, tutorialSeen: true },
    screen: 'tutorial',
    overlay: null,
  });
  sfx('shuffle');
}

/** Resumes the tutorial in progress, or starts it. */
export function openTutorial() {
  if (state.tutorial) set({ tutorial: withTip(state.tutorial), screen: 'tutorial', overlay: null });
  else startTutorial();
}

/** Dismisses the coach's message: the next step, or the tip on screen. */
export function tutorialNext() {
  const t = state.tutorial;
  if (!t) return;
  if (t.tip) {
    set({ tutorial: { ...t, tip: null } });
    return;
  }
  if (t.step >= FREE) return;
  const step = t.step + 1;
  // From the end of the scripted turns, "Try again" restarts here instead of from the beginning.
  const saved = step === FREE ? { ...t.saved, missionStart: t.saved.game } : t.saved;
  set({ tutorial: withTip({ ...t, saved, step }) });
}

/** Ends the tutorial and drops its game. */
export function finishTutorial(next: 'start' | 'campaign') {
  stopAnim();
  set({ tutorial: null, screen: 'start', overlay: null });
  if (next !== 'campaign') return;
  const g = state.saved?.game;
  if (g && (g.phase === 'play' || g.phase === 'missionComplete')) setScreen('game');
  else newGame();
}

/** "Try again" after losing the tutorial: back to the start of free play, tips already seen stay seen. */
export function retryTutorial() {
  const t = state.tutorial;
  if (!t) return;
  stopAnim();
  const start = t.saved.missionStart;
  set({ tutorial: { ...t, saved: { ...t.saved, game: start, undo: [] }, step: start.turn > 1 ? FREE : 0, tip: null } });
  sfx('shuffle');
}

// ---------------------------------------------------------------- app actions

export const setScreen = (screen: AppState['screen']) => {
  stopAnim();
  set({ screen, overlay: null });
};
export const setOverlay = (overlay: Overlay) => set({ overlay });

export function setSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  setSoundEnabled(settings.sound);
  set({ settings });
  if (patch.anim === false) stopAnim();
}

export function exportSave() {
  const data = {
    app: 'agent-decker',
    v: 1,
    exported: new Date().toISOString(),
    saved: state.saved,
    highScores: state.highScores,
    settings: state.settings,
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agent-decker-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file: File): Promise<boolean> {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== 'agent-decker' || data.v !== 1) return false;
    if (data.saved !== null && !isValidSaved(data.saved)) return false;
    stopAnim();
    set({
      saved: data.saved,
      highScores: Array.isArray(data.highScores) ? data.highScores : state.highScores,
      screen: data.saved ? 'game' : 'start',
      overlay: null,
    });
    return true;
  } catch {
    return false;
  }
}
