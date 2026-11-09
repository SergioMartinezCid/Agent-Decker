// Hints drawn on line cards: what other obstacles will do to them.
import { abilityInLine, abilityOf, isFaceUp, rightmost, scrollPreview, sniperProtected } from '../engine/engine';
import { LINE_SIZE, type GameState } from '../engine/types';

/**
 * - burn: knocked out too if you interact with the Flammable Barrel next to it.
 * - clumsy: the Clumsy Guard next to it can knock it out instead.
 * - pinned: face down, and the Dormitory keeps it in place at the scroll.
 * - flip: the Inspector turns it face up at the next scroll.
 * - swept: leaves the line with the Siren at the end of this turn.
 */
export type Mark = 'burn' | 'clumsy' | 'pinned' | 'flip' | 'swept';

export function lineMarks(s: GameState): Mark[][] {
  const { line } = s;
  const out: Mark[][] = line.map(() => []);
  const near = (i: number) => [i - 1, i + 1].filter((j) => j >= 0 && j < LINE_SIZE && isFaceUp(line[j]) && !sniperProtected(line, j));
  line.forEach((lc, i) => {
    const ab = abilityOf(lc);
    if (ab === 'barrel') near(i).forEach((j) => out[j].push('burn'));
    if (ab === 'clumsy') near(i).forEach((j) => out[j].push('clumsy'));
  });
  // The rest comes from playing the scroll ahead, so it follows the engine exactly.
  const exit = rightmost(line);
  const dorm = abilityInLine(line, 'dormitory');
  const after = scrollPreview(s);
  line.forEach((lc, i) => {
    if (!lc || i === exit) return;
    if (dorm && lc.down) out[i].push('pinned');
    const next = after.find((x) => x?.id === lc.id);
    if (!next) out[i].push('swept');
    else if (lc.down && !next.down) out[i].push('flip');
  });
  return out;
}
