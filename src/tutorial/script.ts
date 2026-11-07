// The tutorial: a guided practice game of Mission 1 on a prepared deal.
// The first two turns are scripted (only the action the coach asks for is allowed),
// then the player finishes the mission alone and the coach shows tips as situations come up.
// Texts live in the i18n dictionaries under `tut`; the scripted ones name the cards of this deal.

import { defOf, keyOf } from '../engine/cards';
import { abilityOf, missionStatus, rightmost } from '../engine/engine';
import { scenario } from '../engine/scenario';
import type { Action, GameState } from '../engine/types';

/** With this seed the deck reshuffled after the scripted turns deals Out of Sight and two Hides. */
export const TUTORIAL_SEED = 22;

/**
 * Obstacles still to come, in order. The first two enter during the scripted turns and have no
 * abilities, so those turns always look the same. The order and the seed were picked by playing
 * the rest of the mission many times with simple strategies: most games end in about eight turns.
 */
export const TUTORIAL_OBSTACLES = [
  'security-camera',
  'security-camera',
  'sentry-gun',
  'gym-door',
  'radio-tower',
  'security-camera',
  'guard-dog',
  'security-camera',
  'patrolling-guard',
  'guard-dog',
  'waste-room',
  'guard',
  'yard-door',
  'guard',
  'patrolling-guard',
  'infirmary',
];

export function tutorialStart(seed = TUTORIAL_SEED, obstacles = TUTORIAL_OBSTACLES): GameState {
  const s = scenario({
    seed,
    mission: 1,
    turn: 1,
    // Entry side first. Turn 1 disarms the Security Camera; on turn 2 the Guard leaves next,
    // with the Motion Sensor Hall right behind it.
    line: ['sleeping-guard', 'yard-door', 'motion-sensor-hall', 'guard', 'security-camera', 'waste-room'],
    hand: ['punch', 'hide', 'punch', 'hide'],
    deck: ['punch', 'punch', 'hide', 'punch'],
    obsDeck: obstacles,
  });
  s.log = [
    { turn: 1, k: 'missionStart', p: { n: 1 } },
    { turn: 1, k: 'turn', p: { n: 1 } },
  ];
  return s;
}

// ---------------------------------------------------------------- selectors

/** CSS selectors for the elements the coach points at (`data-tut` attributes in the UI). */
export const at = {
  line: '[data-tut="line"]',
  lineCard: (id: string) => `[data-tut="line-card"][data-id="${id}"]`,
  hand: '[data-tut="hand"]',
  handCard: (key: string) => `[data-tut="hand-card"][data-card="${key}"]`,
  /** An action button in the card panel of a given card. */
  act: (id: string, act: string) => `[data-insp="${id}"] [data-tut="act-${act}"]`,
  actByKey: (key: string, act: string) => `[data-insp^="${key}#"] [data-tut="act-${act}"]`,
  alarm: '[data-tut="alarm"]',
  goal: '[data-tut="goal"]',
  mission: '[data-tut="mission"]',
  pool: '[data-tut="pool"]',
  endTurn: '[data-tut="end-turn"]',
  undo: '[data-tut="undo"]',
  pile: (p: string) => `[data-tut="pile-${p}"]`,
};

const exitId = (g: GameState) => {
  const i = rightmost(g.line);
  return i >= 0 ? g.line[i]!.id : '';
};
const lineIds = (g: GameState, key: string) => g.line.filter((lc) => lc && keyOf(lc.id) === key).map((lc) => lc!.id);
const countKey = (ids: string[], key: string) => ids.filter((id) => keyOf(id) === key).length;
const playKey = (a: Action, key: string) => a.t === 'play' && keyOf(a.card) === key;

// ---------------------------------------------------------------- steps

export type Params = Record<string, string | number>;

export interface Step {
  id: string;
  /** Text variants: by layout (`phone` / `desk`) or by input (`click` on desktop, `tap` elsewhere). */
  variant?: 'layout' | 'input';
  /** Elements to point at; the coach keeps clear of them. */
  spots?: (g: GameState) => string[];
  /** Action steps list the game actions allowed. Steps without it are read and dismissed with Next. */
  allow?: (a: Action, g: GameState) => boolean;
  /** An action step is finished when this holds after an action. */
  done?: (g: GameState) => boolean;
  /** Parameters for the text. Values under keys starting with `card` or `top` are card keys, shown as obstacle or top-half names. */
  params?: (g: GameState) => Params;
}

export const STEPS: Step[] = [
  { id: 'welcome' },
  { id: 'line', variant: 'layout', spots: () => [at.line] },
  {
    id: 'exit',
    spots: (g) => [at.lineCard(exitId(g)), at.alarm],
    params: (g) => ({ n: defOf(exitId(g))?.obstacle?.alarm ?? 0 }),
  },
  { id: 'goal', spots: () => [at.mission, at.goal] },
  {
    id: 'play',
    variant: 'input',
    spots: () => [at.handCard('hide'), at.actByKey('hide', 'play'), at.pool],
    allow: (a) => playKey(a, 'hide'),
    done: (g) => countKey(g.play, 'hide') >= 2,
  },
  {
    id: 'disarm',
    spots: (g) => lineIds(g, 'security-camera').flatMap((id) => [at.lineCard(id), at.act(id, 'disarm')]),
    allow: (a, g) => a.t === 'interact' && a.outcome === 'disarm' && keyOf(g.line[a.slot]?.id ?? '') === 'security-camera',
    done: (g) => countKey(g.play, 'security-camera') > 0,
  },
  { id: 'played', spots: () => [at.pile('play'), at.pile('discard'), at.pile('deck')] },
  {
    id: 'endTurn',
    spots: () => [at.endTurn],
    allow: (a) => a.t === 'endTurn',
    done: (g) => g.turn >= 2,
  },
  { id: 'scrolled', spots: () => [at.alarm, at.line], params: (g) => ({ n: g.alarm }) },
  {
    id: 'knockout',
    spots: (g) =>
      g.pool.f < 2 ? [at.handCard('punch'), at.actByKey('punch', 'play')] : [at.lineCard(exitId(g)), at.act(exitId(g), 'knockout')],
    allow: (a, g) =>
      (playKey(a, 'punch') && g.pool.f < 2) ||
      (a.t === 'interact' && a.outcome === 'knockout' && a.slot === rightmost(g.line)),
    done: (g) => !!g.line[rightmost(g.line)]?.down,
    params: (g) => {
      const line = g.line.filter(Boolean);
      const behind = line[line.length - 2]?.id ?? '';
      return { n: defOf(exitId(g))?.obstacle?.alarm ?? 0, m: defOf(behind)?.obstacle?.alarm ?? 0 };
    },
  },
  {
    id: 'endTurn2',
    spots: (g) => [at.lineCard(exitId(g)), at.endTurn],
    allow: (a) => a.t === 'endTurn',
    done: (g) => g.turn >= 3,
  },
  { id: 'onYourOwn', spots: () => [at.goal, at.undo] },
];

/** Step index at which the guided part is over and the player plays freely. */
export const FREE = STEPS.length;

export function stepAllows(step: number, a: Action, g: GameState): boolean {
  if (step >= FREE) return true;
  return !!STEPS[step].allow?.(a, g);
}

/** The step after an action: action steps finish when their goal is met. */
export function stepAfter(step: number, g: GameState): number {
  if (step >= FREE) return step;
  const st = STEPS[step];
  return st.allow && st.done?.(g) ? step + 1 : step;
}

// ---------------------------------------------------------------- tips (free play)

export interface Tip {
  id: string;
  when: (g: GameState) => boolean;
  spots?: (g: GameState) => string[];
  params?: (g: GameState) => Params;
}

const keepInHand = (g: GameState) => g.hand.find((id) => defOf(id)?.top.keep);
const abilityCard = (g: GameState) => g.line.find((lc) => abilityOf(lc))?.id;

export const TIPS: Tip[] = [
  {
    id: 'ready',
    when: (g) => missionStatus(g).ok,
    spots: () => [at.goal, at.endTurn],
  },
  {
    id: 'keep',
    when: (g) => !!keepInHand(g),
    spots: (g) => [at.handCard(keyOf(keepInHand(g)!)), at.actByKey(keyOf(keepInHand(g)!), 'equip')],
    params: (g) => ({ top: keyOf(keepInHand(g)!) }),
  },
  {
    id: 'ability',
    when: (g) => !!abilityCard(g),
    spots: (g) => [at.lineCard(abilityCard(g)!)],
    params: (g) => ({ card: keyOf(abilityCard(g)!) }),
  },
  {
    id: 'alarm',
    when: (g) => g.alarm >= 25 && !g.line[rightmost(g.line)]?.down,
    spots: (g) => [at.alarm, at.lineCard(exitId(g))],
    params: (g) => ({ n: g.alarm }),
  },
];

/** The first tip not yet shown whose situation has come up. */
export function nextTip(g: GameState, shown: string[]): string | null {
  if (g.phase !== 'play' || g.pending) return null;
  return TIPS.find((tip) => !shown.includes(tip.id) && tip.when(g))?.id ?? null;
}
