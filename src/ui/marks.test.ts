import { describe, expect, it } from 'vitest';
import { scenario } from '../engine/scenario';
import { lineMarks } from './marks';

const marksOf = (line: Parameters<typeof scenario>[0]['line']) => lineMarks(scenario({ mission: 5, line }));

describe('line marks', () => {
  it('marks the face-up neighbours of the Flammable Barrel and the Clumsy Guard', () => {
    const m = marksOf(['guard', 'flammable-barrel', 'yard-door', 'clumsy-guard', { c: 'guard', down: true }, 'security-camera']);
    expect(m[0]).toEqual(['burn']);
    expect(m[2]).toEqual(['burn', 'clumsy']);
    expect(m[4]).toEqual([]); // already knocked out
    expect(m[1]).toEqual([]);
  });

  it('leaves out a Sniper that other people protect', () => {
    const m = marksOf(['guard', 'sniper', 'flammable-barrel', null, null, 'security-camera']);
    expect(m[1]).toEqual([]);
  });

  it('marks face-down cards the Dormitory keeps in place, but not the one leaving', () => {
    const m = marksOf(['dormitory', { c: 'guard', down: true }, null, 'yard-door', null, { c: 'guard', down: true }]);
    expect(m[1]).toEqual(['pinned']);
    expect(m[5]).toEqual([]);
  });

  it('marks the face-down card the Inspector will turn face up', () => {
    const m = marksOf(['inspector', 'yard-door', { c: 'guard', down: true }, null, null, 'security-camera']);
    expect(m[2]).toEqual(['flip']);
  });

  it('marks every card that leaves with the Siren', () => {
    const m = marksOf(['guard', null, 'yard-door', { c: 'guard', down: true }, null, 'siren']);
    expect(m[0]).toEqual(['swept']);
    expect(m[2]).toEqual(['swept']);
    expect(m[3]).toEqual(['swept']);
    expect(m[5]).toEqual([]);
  });

  it('marks nothing on a plain line', () => {
    expect(marksOf(['guard', 'yard-door', null, 'security-camera']).flat()).toEqual([]);
  });
});
