import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export type LayoutMode = 'phone' | 'compact' | 'desktop';

function computeMode(): LayoutMode {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (h >= w && w <= 820) return 'phone';
  if (w < 1000 || h < 560) return 'compact';
  return 'desktop';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(computeMode);
  useEffect(() => {
    const on = () => setMode(computeMode());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => {
      window.removeEventListener('resize', on);
      window.removeEventListener('orientationchange', on);
    };
  }, []);
  return mode;
}

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * FLIP animation for children marked with `data-flip` (a stable id).
 * Cards that move between renders glide to their new place; new cards fade in.
 */
export function useFlip(ref: RefObject<HTMLElement | null>, enabled: boolean, dep: unknown) {
  const rects = useRef(new Map<string, DOMRect>());
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-flip]'));
    const next = new Map<string, DOMRect>();
    for (const el of els) next.set(el.dataset.flip!, el.getBoundingClientRect());
    if (enabled && !reduced() && rects.current.size) {
      for (const el of els) {
        const id = el.dataset.flip!;
        const now = next.get(id)!;
        const before = rects.current.get(id);
        if (!before) {
          el.animate([{ opacity: 0, transform: 'translateY(-10px) scale(.96)' }, { opacity: 1, transform: 'none' }], {
            duration: 260,
            easing: 'ease-out',
          });
          continue;
        }
        const dx = before.left - now.left;
        const dy = before.top - now.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
            duration: 300,
            easing: 'cubic-bezier(.2,.7,.2,1)',
          });
        }
      }
    }
    rects.current = next;
  }, [ref, enabled, dep]);
}
