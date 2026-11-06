import { describe, expect, it } from 'vitest';
import { instancesOf, keyOf, MISSIONS } from './cards';
import {
  applyAction,
  defaultPayment,
  effectiveCost,
  interactInfo,
  missionStatus,
  newCampaign,
  playInfo,
  slideLine,
} from './engine';
import { nextRandom } from './rng';
import { scenario } from './scenario';
import type { Action, GameState } from './types';

const keys = (s: GameState) => s.line.map((lc) => (lc ? keyOf(lc.id) + (lc.down ? '*' : '') : '_'));
const act = (s: GameState, a: Action) => applyAction(s, a).state;
const end = (s: GameState) => act(s, { t: 'endTurn' });

describe('setup', () => {
  it('deals six obstacles and four cards', () => {
    const { state: s } = newCampaign(42);
    expect(s.line.every(Boolean)).toBe(true);
    expect(s.hand).toHaveLength(4);
    expect(s.deck).toHaveLength(4);
    expect(s.obsDeck.length + 6).toBe(22);
    expect(s.alarm).toBe(0);
    expect(s.turn).toBe(1);
  });
  it('is reproducible from the seed', () => {
    expect(newCampaign(7).state).toEqual(newCampaign(7).state);
    expect(newCampaign(7).state.line).not.toEqual(newCampaign(8).state.line);
  });
});

describe('line scroll (§4.3)', () => {
  it('discards the rightmost remaining card even after a disarm gap', () => {
    // a/18944164: disarm the 6th card, the 5th is discarded.
    let s = scenario({ line: ['guard', 'guard', 'yard-door', 'guard-dog', 'sentry-gun', 'security-camera'], pool: { s: 2, f: 0 } });
    s = act(s, { t: 'interact', slot: 5, pay: { s: 2, f: 0 }, outcome: 'disarm' });
    expect(s.alarm).toBe(0); // disarming never raises the alarm
    s = end(s);
    expect(s.alarm).toBe(6); // sentry gun left
    expect(s.obsDiscard.map(keyOf)).toContain('sentry-gun');
  });

  it('knocked-out cards leave without raising the alarm', () => {
    let s = scenario({ line: ['guard', 'guard', 'guard', 'guard', 'guard', 'security-camera'], pool: { s: 2, f: 0 } });
    s = act(s, { t: 'interact', slot: 5, pay: { s: 2, f: 0 }, outcome: 'knockout' });
    s = end(s);
    expect(s.alarm).toBe(0);
  });

  it('slides cards right and refills from the left', () => {
    let s = scenario({ line: ['guard', null, 'guard', null, 'guard', 'yard-door'], obsDeck: ['sentry-gun', 'gym-door', 'waste-room', 'security-camera'] });
    s = end(s);
    // yard door leaves, guards slide right, new cards fill positions 3, 2, 1 in draw order.
    expect(keys(s)).toEqual(['waste-room', 'gym-door', 'sentry-gun', 'guard', 'guard', 'guard']);
    expect(s.alarm).toBe(4);
  });

  it('Dormitory pins face-down cards: DUUXXX -> _DUXXU (a/25945933)', () => {
    const line = slideLine([
      { id: 'dormitory#1', down: false },
      { id: 'guard#1', down: false },
      { id: 'guard#2', down: false },
      { id: 'guard#3', down: true },
      { id: 'yard-door#1', down: true },
      null,
    ]);
    expect(line.map((lc) => (lc ? keyOf(lc.id) + (lc.down ? '*' : '') : '_'))).toEqual([
      '_',
      'dormitory',
      'guard',
      'guard*',
      'yard-door*',
      'guard',
    ]);
  });

  it('Siren clears the line but only raises the alarm for itself', () => {
    let s = scenario({ line: ['guard', 'guard', 'guard', 'guard', 'security-camera', 'siren'], mission: 2 });
    s = end(s);
    expect(s.alarm).toBe(5);
    expect(s.line.every(Boolean)).toBe(true);
    expect(s.line.map((lc) => lc!.id)).not.toContain('guard#1');
  });

  it('game over at 50 alarm', () => {
    const s = end(scenario({ alarm: 42, line: ['guard', 'guard', 'guard', 'guard', 'guard', 'security-camera'] }));
    expect(s.phase).toBe('gameOver');
    expect(s.gameOver).toBe('alarm');
    expect(s.alarm).toBe(50);
  });

  it('game over when the obstacles run out', () => {
    const s = end(scenario({ line: ['guard', 'guard', 'guard', 'guard', 'guard', 'guard'], obsDeck: [], obsDiscard: [] }));
    // One card left the line, so only one obstacle is available to refill one slot: that is enough.
    expect(s.phase).toBe('play');
    const t = end(scenario({ line: ['guard', null, null, 'guard', 'guard', 'guard'], obsDeck: [], obsDiscard: [] }));
    expect(t.phase).toBe('gameOver');
    expect(t.gameOver).toBe('time');
  });
});

describe('scroll and arrival abilities', () => {
  it('Patrolling Guard moves after the discard, and does not leave early (a/25174595)', () => {
    let s = scenario({ line: ['guard', 'guard', 'guard', 'guard', 'patrolling-guard', 'yard-door'], obsDeck: ['guard'] });
    s = end(s);
    expect(s.alarm).toBe(4); // yard door left, not the patrolling guard
    expect(keyOf(s.line[5]!.id)).toBe('patrolling-guard');
  });

  it('Patrolling Guard swaps forward during the scroll', () => {
    let s = scenario({ line: ['patrolling-guard', 'guard', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun'], obsDeck: ['security-camera'] });
    s = end(s);
    expect(keys(s)).toEqual(['security-camera', 'guard', 'patrolling-guard', 'yard-door', 'gym-door', 'waste-room']);
  });

  it('Patrolling Guard moves one extra position when it arrives (a/21849675)', () => {
    let s = scenario({ line: ['guard', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun', 'security-camera'], obsDeck: ['patrolling-guard'] });
    s = end(s);
    // camera leaves; the guard enters at 1 and immediately swaps past the guard on its right.
    expect(keys(s)).toEqual(['guard', 'patrolling-guard', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun']);
  });

  it('Guard Dog slides next to the nearest person, never past it', () => {
    let s = scenario({ line: ['yard-door', 'gym-door', 'guard', 'waste-room', 'guard', 'security-camera'], obsDeck: ['guard-dog'] });
    s = end(s);
    // after exit+slide: [_, yard, gym, guard, waste, guard]; dog enters at 0 and slides to sit left of the guard.
    expect(keys(s)).toEqual(['yard-door', 'gym-door', 'guard-dog', 'guard', 'waste-room', 'guard']);
  });

  it('Guard Dog stays put without a face-up person', () => {
    let s = scenario({ line: ['yard-door', 'gym-door', { c: 'guard', down: true }, 'waste-room', 'sentry-gun', 'security-camera'], obsDeck: ['guard-dog'] });
    s = end(s);
    expect(keyOf(s.line[0]!.id)).toBe('guard-dog');
  });

  it('Radio Tower pulls every person next to it: RT a b c P P -> RT P P a b c', () => {
    let s = scenario({ line: ['yard-door', 'gym-door', 'waste-room', 'guard', 'guard', 'security-camera'], obsDeck: ['radio-tower'] });
    s = end(s);
    expect(keys(s)).toEqual(['radio-tower', 'guard', 'guard', 'yard-door', 'gym-door', 'waste-room']);
  });

  it('Inspector flips the new last card after the discard (a/27041620, a/39417290)', () => {
    let s = scenario({
      mission: 2,
      line: ['inspector', 'guard', 'guard', 'yard-door', { c: 'gym-door', down: true }, { c: 'waste-room', down: true }],
      obsDeck: ['sentry-gun'],
    });
    s = end(s);
    expect(s.alarm).toBe(0); // the knocked-out waste room left silently
    expect(keys(s)[5]).toBe('gym-door'); // flipped face up
  });

  it('Inspector-flipped Guard Dog slides toward a person', () => {
    let s = scenario({
      mission: 2,
      line: ['inspector', 'yard-door', 'guard', 'gym-door', { c: 'guard-dog', down: true }, { c: 'waste-room', down: true }],
      obsDeck: ['sentry-gun'],
    });
    s = end(s);
    // slide: [_, inspector, yard, guard, gym, dog*] -> flip dog -> dog slides left next to guard.
    expect(keys(s)).toEqual(['sentry-gun', 'inspector', 'yard-door', 'guard', 'guard-dog', 'gym-door']);
  });
});

describe('interactions (§3, §9)', () => {
  it('pools resources and splits them across interactions', () => {
    let s = scenario({ mission: 2, equip: ['mission-2'], line: ['guard', 'guard', 'guard', 'guard', 'security-camera', 'security-camera'], hand: ['security-camera', 'hide', 'hide'] });
    s = act(s, { t: 'play', card: s.hand[0] });
    s = act(s, { t: 'play', card: s.hand[0] });
    s = act(s, { t: 'play', card: s.hand[0] });
    expect(s.pool).toEqual({ s: 4, f: 0 });
    s = act(s, { t: 'interact', slot: 4, pay: { s: 2, f: 0 }, outcome: 'knockout' });
    s = act(s, { t: 'interact', slot: 5, pay: { s: 2, f: 0 }, outcome: 'knockout' });
    expect(s.interactions).toBe(2);
    expect(interactInfo(s, 0)!.blocked).toBe('limit');
  });

  it('Watchtower adds 2 to adjacent costs; a gap breaks adjacency (a/27041620)', () => {
    let s = scenario({ mission: 4, line: ['guard', 'watchtower', 'sniper', null, 'guard', 'guard'] });
    expect(effectiveCost(s, 0)).toEqual(['f', 4]);
    expect(effectiveCost(s, 2)).toEqual(['f', 12]);
    expect(effectiveCost(s, 4)).toEqual(['f', 2]);
    s = scenario({ mission: 4, line: ['guard', 'watchtower', null, 'guard', 'guard', 'guard'] });
    expect(effectiveCost(s, 3)).toEqual(['f', 2]);
  });

  it('Sniper is only reachable when it is the only face-up person', () => {
    const s = scenario({ mission: 4, line: ['sniper', 'guard', 'yard-door', 'yard-door', 'yard-door', 'yard-door'], pool: { s: 0, f: 20 } });
    expect(interactInfo(s, 0)!.blocked).toBe('sniper');
    const t = scenario({ mission: 4, line: ['sniper', { c: 'guard', down: true }, 'yard-door', 'yard-door', 'yard-door', 'yard-door'], pool: { s: 0, f: 20 } });
    expect(interactInfo(t, 0)!.blocked).toBeUndefined();
  });

  it('Hawk blocks Stealth-only costs, including items (a/19717268)', () => {
    const s = scenario({ mission: 5, line: ['hawk', 'yard-door', 'gym-door', 'guard', 'guard', 'guard'], hand: ['sleeping-guard'], pool: { s: 10, f: 0 } });
    expect(interactInfo(s, 1)!.blocked).toBe('hawk');
    expect(interactInfo(s, 2)!.blocked).toBeUndefined(); // "any" cost is fine
  });

  it('Keycard interacts for free, counts as an interaction, goes straight to the discard', () => {
    let s = scenario({ line: ['guard', 'guard', 'guard', 'guard', 'guard', 'yard-door'], hand: ['sleeping-guard'] });
    const info = interactInfo(s, 5)!;
    expect(info.items).toEqual(['sleeping-guard#1']);
    s = act(s, { t: 'interact', slot: 5, pay: { item: 'sleeping-guard#1' }, outcome: 'disarm' });
    expect(s.discard).toEqual(['sleeping-guard#1']);
    expect(s.play).toEqual(['yard-door#1']);
    expect(s.interactions).toBe(1);
  });

  it('Flammable Barrel knocks out its neighbours, but not a protected Sniper', () => {
    let s = scenario({ mission: 4, line: ['guard', 'sniper', 'flammable-barrel', 'yard-door', 'guard', 'guard'], pool: { s: 14, f: 0 } });
    s = act(s, { t: 'interact', slot: 2, pay: { s: 14, f: 0 }, outcome: 'disarm' });
    expect(keys(s)).toEqual(['guard', 'sniper', '_', 'yard-door*', 'guard', 'guard']);
  });

  it('Barrel can knock out a Stealth-only card while Hawk is face up (a/27041620)', () => {
    let s = scenario({ mission: 5, line: ['hawk', 'yard-door', 'flammable-barrel', 'guard', 'guard', 'guard'], pool: { s: 0, f: 14 } });
    s = act(s, { t: 'interact', slot: 2, pay: { s: 0, f: 14 }, outcome: 'knockout' });
    expect(keys(s).slice(0, 4)).toEqual(['hawk', 'yard-door*', 'flammable-barrel*', 'guard*']);
  });

  it('Clumsy Guard can knock out a neighbour instead; via the Barrel that chains (a/25688990)', () => {
    let s = scenario({ mission: 5, line: ['guard', 'clumsy-guard', 'flammable-barrel', 'yard-door', 'guard', 'guard'], pool: { s: 0, f: 8 } });
    const info = interactInfo(s, 1)!;
    expect(info.clumsyTargets).toEqual([0, 2]);
    s = act(s, { t: 'interact', slot: 1, pay: { s: 0, f: 8 }, outcome: 'clumsy', target: 2 });
    expect(keys(s).slice(0, 4)).toEqual(['guard', 'clumsy-guard*', 'flammable-barrel*', 'yard-door*']);
  });

  it('equipping a KEEP item grants its bonus the same turn', () => {
    let s = scenario({ mission: 2, line: ['guard', 'guard', 'guard', 'guard', 'guard', 'locker-room'], pool: { s: 8, f: 0 } });
    s = act(s, { t: 'interact', slot: 5, pay: { s: 8, f: 0 }, outcome: 'equip' });
    expect(s.equip).toEqual(['locker-room#1']);
    expect(s.pool).toEqual({ s: 1, f: 0 });
  });

  it('payment must match the cost exactly', () => {
    const s = scenario({ line: ['guard', 'guard', 'guard', 'guard', 'guard', 'patrolling-guard'], pool: { s: 3, f: 4 } });
    expect(() => act(s, { t: 'interact', slot: 5, pay: { s: 3, f: 3 }, outcome: 'knockout' })).toThrow();
    expect(defaultPayment(s.pool, ['a', 5])).toEqual({ s: 3, f: 2 });
    expect(act(s, { t: 'interact', slot: 5, pay: { s: 1, f: 4 }, outcome: 'knockout' }).pool).toEqual({ s: 2, f: 0 });
  });
});

describe('player cards (§8)', () => {
  it('Flashy Move counts only the discard pile', () => {
    let s = scenario({ hand: ['gym-door', 'punch'], discard: ['hide', 'hide', 'punch', 'punch', 'punch'] });
    s = act(s, { t: 'play', card: 'punch#1' });
    s = act(s, { t: 'play', card: 'gym-door#1' });
    expect(s.pool.f).toBe(1 + 2);
  });

  it('Misdirect gives 2 Stealth per card fed to it', () => {
    let s = scenario({ hand: ['radio-tower', 'punch', 'punch', 'hide'] });
    s = act(s, { t: 'play', card: 'radio-tower#1', cards: ['punch#1', 'hide#1'] });
    expect(s.pool).toEqual({ s: 4, f: 0 });
    expect(s.hand).toEqual(['punch#2']);
  });

  it('Bin removes cards from the campaign', () => {
    let s = scenario({ hand: ['waste-room', 'punch', 'hide'] });
    s = act(s, { t: 'play', card: 'waste-room#1', cards: ['punch#1', 'hide#1'] });
    expect(s.removed).toEqual(['punch#1', 'hide#1']);
  });

  it('Plan Ahead keeps one of the top three and reorders the rest', () => {
    let s = scenario({ mission: 3, hand: ['archive-door'], deck: ['punch', 'hide', 'guard', 'gym-door'] });
    s = act(s, { t: 'play', card: 'archive-door#1' });
    expect(s.pending).toEqual({ kind: 'planAhead', cards: ['punch#1', 'hide#1', 'guard#1'] });
    s = act(s, { t: 'resolve', keep: 'guard#1', order: ['hide#1', 'punch#1'] });
    expect(s.hand).toEqual(['guard#1']);
    expect(s.deck).toEqual(['hide#1', 'punch#1', 'gym-door#1']);
  });

  it('Just the Thing puts the chosen card on top', () => {
    let s = scenario({ mission: 4, hand: ['sniper'], deck: ['punch', 'hide', 'guard', 'gym-door'] });
    s = act(s, { t: 'play', card: 'sniper#1' });
    s = act(s, { t: 'resolve', card: 'gym-door#1' });
    expect(s.deck[0]).toBe('gym-door#1');
    expect(s.deck).toHaveLength(4);
  });

  it('Bazooka goes to the obstacles discard when used', () => {
    let s = scenario({ mission: 4, hand: ['guard-with-bazooka'] });
    s = act(s, { t: 'play', card: 'guard-with-bazooka#1' });
    expect(s.pool.f).toBe(5);
    expect(s.obsDiscard).toEqual(['guard-with-bazooka#1']);
  });

  it('Distraction pulls a card to the start of the line', () => {
    let s = scenario({ mission: 3, hand: ['dormitory'], line: ['guard', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun', 'security-camera'] });
    s = act(s, { t: 'play', card: 'dormitory#1', slot: 5 });
    expect(keys(s)).toEqual(['security-camera', 'guard', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun']);
  });

  it('Save Bullets: the saved card counts toward the next hand (a/39348602)', () => {
    let s = scenario({ mission: 5, equip: ['mission-3'], hand: ['chain-link-fence', 'guard'], deck: ['punch', 'punch', 'punch', 'punch', 'punch', 'hide'], line: ['yard-door', 'yard-door', 'gym-door', 'waste-room', 'sentry-gun', 'security-camera'] });
    s = act(s, { t: 'play', card: 'chain-link-fence#1' });
    s = act(s, { t: 'endTurn', save: 'guard#1' });
    expect(s.hand).toHaveLength(5);
    expect(s.hand[0]).toBe('guard#1');
  });

  it('Gear Up counts KEEP cards, Map and the Mission 2 rule included', () => {
    let s = scenario({ mission: 3, equip: ['mission-1', 'mission-2', 'locker-room'], hand: ['siren'] });
    expect(playInfo(s, 'siren#1').canPlay).toBe(true);
    s = act(s, { t: 'play', card: 'siren#1' });
    expect(s.hand).toHaveLength(3);
  });
});

describe('missions (§6)', () => {
  it('Mission 1: pay 6 Stealth, record the alarm, then move on', () => {
    let s = scenario({ alarm: 17, pool: { s: 6, f: 0 }, line: ['guard', 'guard', 'guard', 'guard', 'guard', 'guard'] });
    expect(missionStatus(s).ok).toBe(true);
    s = end(s);
    expect(s.phase).toBe('missionComplete');
    expect(s.scores).toEqual([17]);
    expect(s.equip).toEqual(['mission-1']);
    s = act(s, { t: 'nextMission' });
    expect(s.mission).toBe(2);
    expect(s.alarm).toBe(0);
    expect(s.pool.s).toBe(1); // Map bonus
    const pool = [...s.obsDeck, ...s.line.map((lc) => lc!.id)];
    for (const id of instancesOf('B')) expect(pool).toContain(id);
  });

  it('Mission 2 needs the Guard Uniform equipped', () => {
    const s = scenario({ mission: 2, pool: { s: 0, f: 6 }, hand: ['locker-room'] });
    expect(missionStatus(s).ok).toBe(false);
    const t = act(s, { t: 'equip', card: 'locker-room#1' });
    expect(missionStatus(t).ok).toBe(true);
  });

  it('Mission 5 needs six face-down cards', () => {
    const s = scenario({ mission: 5, line: Array.from({ length: 6 }, () => ({ c: 'guard', down: true })) as never });
    expect(missionStatus(s).ok).toBe(true);
    expect(end(s).phase).toBe('won');
  });
});

describe('random playthroughs keep every card accounted for', () => {
  function allCards(s: GameState): string[] {
    return [
      ...s.line.filter(Boolean).map((lc) => lc!.id),
      ...s.obsDeck,
      ...s.obsDiscard,
      ...s.deck,
      ...s.hand,
      ...s.discard,
      ...s.play,
      ...s.equip.filter((id) => !id.startsWith('mission-')),
      ...s.removed,
    ].sort();
  }
  function expected(s: GameState): string[] {
    const sets = ['start', 'base', ...MISSIONS.slice(0, s.mission - 1).map((m) => m.nextSet!)] as const;
    return sets.flatMap((set) => instancesOf(set)).sort();
  }

  it('plays 40 seeded games without breaking invariants', () => {
    for (let seed = 1; seed <= 40; seed++) {
      let s = newCampaign(seed).state;
      const r = { rng: seed * 7919 };
      for (let step = 0; step < 400 && s.phase !== 'gameOver' && s.phase !== 'won'; step++) {
        if (s.phase === 'missionComplete') {
          s = act(s, { t: 'nextMission' });
          continue;
        }
        if (s.pending) {
          const p = s.pending;
          s = act(s, p.kind === 'planAhead' ? { t: 'resolve', keep: p.cards[0] } : p.kind === 'foresight' ? { t: 'resolve' } : { t: 'resolve', card: p.cards[0] });
          continue;
        }
        const roll = nextRandom(r);
        const playable = s.hand.filter((id) => playInfo(s, id).canPlay);
        if (roll < 0.55 && playable.length) {
          const id = playable[Math.floor(nextRandom(r) * playable.length)];
          const a: Action = { t: 'play', card: id };
          const eff = keyOf(id);
          if (eff === 'radio-tower' || eff === 'waste-room') a.cards = s.hand.filter((h) => h !== id).slice(0, 1);
          if (eff === 'flammable-barrel') a.cards = s.discard.slice(0, 2);
          if (eff === 'inspector') a.cards = s.discard.slice(0, 1);
          if (eff === 'dormitory') a.slot = s.line.findIndex(Boolean);
          s = act(s, a);
          continue;
        }
        const targets = s.line
          .map((_, i) => interactInfo(s, i))
          .filter((x) => x && !x.blocked && (x.affordable || x.items.length));
        if (roll < 0.85 && targets.length) {
          const t = targets[Math.floor(nextRandom(r) * targets.length)]!;
          const pay = t.affordable ? defaultPayment(s.pool, t.cost)! : { item: t.items[0] };
          const outcome = nextRandom(r) < 0.5 ? 'knockout' : t.canEquip ? 'equip' : 'disarm';
          s = act(s, { t: 'interact', slot: t.slot, pay, outcome });
          continue;
        }
        s = end(s);
        expect(allCards(s)).toEqual(expected(s));
        expect(s.line).toHaveLength(6);
      }
      expect(allCards(s)).toEqual(expected(s));
    }
  });
});
