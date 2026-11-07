import { describe, expect, it } from 'vitest';
import { instancesOf, keyOf } from '../engine/cards';
import { applyAction, rightmost } from '../engine/engine';
import type { Action, GameState } from '../engine/types';
import { FREE, STEPS, nextTip, stepAfter, stepAllows, tutorialStart } from './script';

/** Plays the scripted turns the way the coach asks, checking every action against the step. */
function walk(variant = 0) {
  let g = tutorialStart();
  let step = 0;
  const seen: Record<string, GameState> = {};
  const act = (a: Action) => {
    expect(stepAllows(step, a, g), `${STEPS[step].id} allows ${JSON.stringify(a)}`).toBe(true);
    g = applyAction(g, a).state;
    step = stepAfter(step, g);
  };
  while (step < FREE) {
    const st = STEPS[step];
    seen[st.id] = g;
    if (!st.allow) {
      step++;
      continue;
    }
    switch (st.id) {
      case 'play':
        act({ t: 'play', card: g.hand.find((id) => keyOf(id) === 'hide')! });
        break;
      case 'disarm':
        act({ t: 'interact', slot: g.line.findIndex((lc) => lc && keyOf(lc.id) === 'security-camera'), pay: { s: 2, f: 0 }, outcome: 'disarm' });
        break;
      case 'knockout':
        if (g.pool.f < 2) act({ t: 'play', card: g.hand.filter((id) => keyOf(id) === 'punch')[g.pool.f === 0 ? variant % 2 : 1] });
        else act({ t: 'interact', slot: rightmost(g.line), pay: { s: 0, f: 2 }, outcome: 'knockout' });
        break;
      default:
        act({ t: 'endTurn' });
    }
  }
  return { g, seen };
}

describe('tutorial deal', () => {
  it('uses exactly the base obstacles and the starting deck', () => {
    const g = tutorialStart();
    const obstacles = [...g.line.map((lc) => lc!.id), ...g.obsDeck].sort();
    expect(obstacles).toEqual(instancesOf('base').sort());
    expect([...g.hand, ...g.deck].sort()).toEqual(instancesOf('start').sort());
  });
});

describe('tutorial script', () => {
  it('refuses actions other than the one the coach asks for', () => {
    const g = tutorialStart();
    const play = STEPS.findIndex((s) => s.id === 'play');
    expect(stepAllows(0, { t: 'endTurn' }, g)).toBe(false);
    expect(stepAllows(play, { t: 'play', card: 'punch#1' }, g)).toBe(false);
    expect(stepAllows(play, { t: 'play', card: 'hide#1' }, g)).toBe(true);
    const disarm = STEPS.findIndex((s) => s.id === 'disarm');
    expect(stepAllows(disarm, { t: 'interact', slot: 4, pay: { s: 2, f: 0 }, outcome: 'knockout' }, g)).toBe(false);
    expect(stepAllows(disarm, { t: 'interact', slot: 3, pay: { s: 0, f: 2 }, outcome: 'disarm' }, g)).toBe(false);
  });

  // The coach's texts for these steps name these cards.
  it('sets up each lesson as the texts describe', () => {
    const { seen } = walk();
    // Turn 1: the Waste Room is about to leave; the camera is the card to disarm.
    expect(keyOf(seen.exit.line[5]!.id)).toBe('waste-room');
    // Turn 2: a Guard leaves next with the Motion Sensor Hall behind it.
    const t2 = seen.knockout.line;
    expect(keyOf(t2[5]!.id)).toBe('guard');
    expect(keyOf(t2[4]!.id)).toBe('motion-sensor-hall');
    expect(seen.scrolled.alarm).toBe(3);
  });

  it('ends the scripted turns the same way whichever Punches are played', () => {
    for (const variant of [0, 1]) {
      const { g } = walk(variant);
      expect(g.turn).toBe(3);
      expect(g.alarm).toBe(3);
      expect(g.hand.map(keyOf).sort()).toEqual(['hide', 'hide', 'punch', 'security-camera']);
      expect(keyOf(g.line[5]!.id)).toBe('motion-sensor-hall');
    }
  });
});

describe('tutorial tips', () => {
  it('points out a finished goal first', () => {
    const { g } = walk();
    const ready = { ...g, pool: { s: 6, f: 0 } };
    expect(nextTip(ready, [])).toBe('ready');
    expect(nextTip(ready, ['ready'])).not.toBe('ready');
  });

  it('shows nothing while a choice is pending', () => {
    const { g } = walk();
    expect(nextTip({ ...g, pool: { s: 6, f: 0 }, pending: { kind: 'foresight', cards: [] } }, [])).toBeNull();
  });
});
