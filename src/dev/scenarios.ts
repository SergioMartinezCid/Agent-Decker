// Prepared situations for checking the interface on real devices (menu → Test scenarios,
// visible when the URL contains "dev", e.g. …/Agent-Decker/?dev).
import { scenario } from '../engine/scenario';
import type { GameState } from '../engine/types';

export interface DevScenario {
  name: string;
  build: () => GameState;
}

export const SCENARIOS: DevScenario[] = [
  {
    name: 'Mission 2 · Inspector, Siren and the Guard Uniform',
    build: () =>
      scenario({
        mission: 2,
        alarm: 14,
        scores: [21],
        turn: 4,
        line: ['inspector', 'guard-dog', 'locker-room', { c: 'guard', down: true }, 'security-camera', 'siren'],
        hand: ['guard', 'yard-door', 'hide', 'punch'],
        discard: ['punch', 'punch'],
        equip: ['mission-1'],
        pool: { s: 1, f: 0 },
      }),
  },
  {
    name: 'Mission 4 · crowded line (Watchtower, Sniper, gap, Keycard)',
    build: () =>
      scenario({
        mission: 4,
        alarm: 31,
        scores: [18, 24, 27],
        turn: 7,
        line: ['watchtower', 'sniper', { c: 'guard', down: true }, null, 'prison-door', 'security-camera'],
        hand: ['guard', 'patrolling-guard', 'guard-dog', 'guard-with-bazooka', 'hide'],
        play: ['punch', 'punch', 'security-camera', 'yard-door'],
        discard: ['motion-sensor-hall', 'punch'],
        equip: ['mission-1', 'mission-2', 'mission-3', 'locker-room', 'sleeping-guard'],
        pool: { s: 0, f: 2 },
        interactions: 1,
      }),
  },
  {
    name: 'Mission 5 · Hawk, Clumsy Guard and Flammable Barrel',
    build: () =>
      scenario({
        mission: 5,
        alarm: 22,
        scores: [18, 24, 27, 30],
        turn: 3,
        line: ['hawk', 'clumsy-guard', 'flammable-barrel', 'laser-hall', { c: 'armored-guard', down: true }, 'chain-link-fence'],
        hand: ['guard-with-bazooka', 'tech-container', 'sentry-gun', 'gym-door', 'hide'],
        discard: ['punch', 'punch', 'guard', 'guard', 'yard-door', 'waste-room', 'hide'],
        equip: ['mission-1', 'mission-2', 'mission-3', 'mission-4', 'locker-room', 'prison-door', 'engineering-bay'],
        pool: { s: 2, f: 1 },
      }),
  },
  {
    name: 'Mission 3 · eight cards in hand',
    build: () =>
      scenario({
        mission: 3,
        alarm: 9,
        scores: [18, 24],
        turn: 2,
        line: ['dormitory', 'guard', 'archive-door', 'yard-door', 'radio-tower', 'security-camera'],
        hand: ['guard', 'guard', 'patrolling-guard', 'guard-dog', 'hide', 'punch', 'yard-door', 'waste-room'],
        equip: ['mission-1', 'mission-2', 'locker-room'],
        pool: { s: 2, f: 0 },
      }),
  },
  {
    name: 'Choices · Plan Ahead, Foresight, Misdirect, Distraction',
    build: () =>
      scenario({
        mission: 4,
        alarm: 12,
        scores: [18, 24, 27],
        line: ['guard', 'sentry-gun', { c: 'yard-door', down: true }, 'cctv-room-door', 'engineering-bay', 'gym-door'],
        hand: ['archive-door', 'watchtower', 'radio-tower', 'dormitory', 'punch', 'hide'],
        deck: ['guard', 'sniper', 'security-camera', 'patrolling-guard', 'motion-sensor-hall', 'punch', 'punch'],
        discard: ['hide', 'waste-room'],
        equip: ['mission-1', 'mission-2', 'mission-3'],
        pool: { s: 1, f: 0 },
      }),
  },
  {
    name: 'Mission 1 · ready to complete',
    build: () =>
      scenario({
        mission: 1,
        alarm: 17,
        turn: 6,
        line: ['guard', 'yard-door', 'gym-door', 'waste-room', 'guard', 'security-camera'],
        hand: ['punch'],
        play: ['guard-dog', 'hide', 'hide', 'security-camera'],
        pool: { s: 6, f: 0 },
      }),
  },
  {
    name: 'One step from game over (alarm 44)',
    build: () =>
      scenario({
        mission: 1,
        alarm: 44,
        line: ['guard', 'yard-door', 'gym-door', 'waste-room', 'guard', 'security-camera'],
        hand: ['punch', 'punch', 'hide', 'hide'],
      }),
  },
];

export const devEnabled = () => /(^|[?#&])dev\b/.test(location.search + location.hash);
