// The tutorial coach: a message box that sits next to what it talks about, and rings
// around the elements to use. Elements are found by their `data-tut` attributes and
// followed every frame, so the coach keeps up with animations, scrolling and resizing.
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useI18n, type Params } from '../i18n';
import { setScreen, tutorialNext, useApp } from '../state/store';
import { FREE, STEPS, TIPS } from '../tutorial/script';
import { useLayoutMode } from './hooks';
import { Icon } from './icons';
import { Rich } from './Rich';

export function Coach() {
  const tut = useApp((s) => s.tutorial);
  const animating = useApp((s) => !!s.anim);
  const nudge = useApp((s) => s.nudge);
  const mode = useLayoutMode();
  const { t, name, top } = useI18n();
  const box = useRef<HTMLElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  const g = tut?.saved.game;
  const step = tut && tut.step < FREE ? STEPS[tut.step] : null;
  const tip = !step && tut?.tip ? (TIPS.find((x) => x.id === tut.tip) ?? null) : null;
  const cur = step ?? tip;
  const visible = !!g && !!cur && !animating && g.phase === 'play' && !g.pending;
  const spots = visible && cur.spots ? cur.spots(g) : [];
  const spotKey = spots.join('|');

  // Follow the spots: draw the rings and keep the box clear of them.
  useLayoutEffect(() => {
    if (!visible) return;
    const el = box.current!;
    const rings: HTMLElement[] = [];
    const sels = spotKey ? spotKey.split('|') : [];
    let raf = 0;
    const tick = () => {
      // Dialogs other than the card sheet (menu, rules, choices, full-screen card) hide the coach.
      const blocking = document.querySelector('.modal-bg .modal:not(.sheet)');
      const sheet = document.querySelector('.modal-bg');
      el.style.visibility = blocking ? 'hidden' : '';
      const rects: DOMRect[] = [];
      // A button in the card panel or sheet: keep the rest of the card's details readable too.
      const panels = new Set<Element>();
      if (!blocking) {
        for (const sel of sels) {
          document.querySelectorAll(sel).forEach((n) => {
            if (sheet && !sheet.contains(n)) return; // behind the card sheet
            const r = n.getBoundingClientRect();
            if (r.width && r.height) rects.push(r);
            const panel = n.closest('.insp-panel, .modal.sheet');
            if (panel) panels.add(panel);
          });
        }
      }
      while (rings.length < rects.length) {
        const d = document.createElement('div');
        d.className = 'tut-ring';
        layer.current?.appendChild(d);
        rings.push(d);
      }
      rings.forEach((d, i) => {
        const r = rects[i];
        d.style.display = r ? '' : 'none';
        if (r) {
          d.style.left = `${r.left - 5}px`;
          d.style.top = `${r.top - 5}px`;
          d.style.width = `${r.width + 10}px`;
          d.style.height = `${r.height + 10}px`;
        }
      });
      // Never hide End turn; on desktop, prefer the free space below the hand to covering cards.
      const keep = [...panels, ...document.querySelectorAll('[data-tut="end-turn"], .desk .lrow, .desk .hrow')].map((n) => n.getBoundingClientRect());
      place(el, rects, keep);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      rings.forEach((d) => d.remove());
    };
  }, [visible, spotKey]);

  // A refused action shakes the box, to point at what to do instead.
  const lastNudge = useRef(nudge);
  useEffect(() => {
    if (nudge === lastNudge.current) return;
    lastNudge.current = nudge;
    box.current?.animate([{ translate: '0' }, { translate: '-8px' }, { translate: '8px' }, { translate: '-4px' }, { translate: '0' }], {
      duration: 360,
      easing: 'ease-out',
    });
  }, [nudge]);

  if (!visible) return null;

  const variant = step?.variant;
  const suffix = variant === 'layout' ? (mode === 'phone' ? '.phone' : '.desk') : variant === 'input' ? (mode === 'desktop' ? '.click' : '.tap') : '';
  const params: Params = {};
  for (const [k, v] of Object.entries(cur.params?.(g) ?? {})) {
    params[k] = k.startsWith('card') ? name(String(v)) : k.startsWith('top') ? top(String(v)) : v;
  }
  const text = t(step ? `tut.steps.${cur.id}${suffix}` : `tut.tips.${cur.id}`, params);
  const isAction = !!step?.allow;
  const last = tut!.step === FREE - 1;

  return (
    <>
      {!spots.length && <div className="coach-dim" aria-hidden="true" />}
      <div className="tut-rings" ref={layer} aria-hidden="true" />
      <section ref={box} className={`coach ${isAction ? 'coach-act' : ''}`} aria-label={t('tut.title')} aria-live="polite">
        <div className="coach-head">
          <span className="lbl">{step ? t('tut.progress', { n: tut!.step + 1, total: FREE }) : t('tut.tip')}</span>
          <button className="coach-leave" onClick={() => setScreen('start')} title={t('tut.leaveHint')}>
            {t('tut.leave')}
          </button>
        </div>
        <div className="coach-text" key={`${tut!.step}-${tut!.tip}`}>
          {text.split('\n').map((p, i) => (
            <p key={i}>
              <Rich text={p} size={24} />
            </p>
          ))}
        </div>
        <div className="coach-acts">
          {isAction ? (
            <span className="coach-do">
              <Icon name="play" size={14} />
              {t('tut.yourMove')}
            </span>
          ) : (
            <button className="primary" onClick={tutorialNext} autoFocus={!spots.length}>
              {tip ? t('tut.gotIt') : last ? t('tut.letsGo') : t('tut.next')}
            </button>
          )}
        </div>
      </section>
    </>
  );
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function overlap(x: number, y: number, w: number, h: number, r: DOMRect): number {
  const ox = Math.min(x + w, r.right) - Math.max(x, r.left);
  const oy = Math.min(y + h, r.bottom) - Math.max(y, r.top);
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

/**
 * Puts the box next to the spots: below, above, right or left of the last one (the most
 * specific, such as a button in the card panel), then of the others, then in a screen
 * corner. The first place that covers none of them (nor the `keep` areas) wins; failing
 * that, the one covering least, spots counting most.
 */
function place(el: HTMLElement, rects: DOMRect[], keep: DOMRect[]) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const m = 10;
  const gap = 16;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!rects.length) {
    el.style.transform = `translate(${Math.round((vw - w) / 2)}px, ${Math.round(Math.max(m, (vh - h) / 2))}px)`;
    return;
  }
  const cands: [number, number][] = [];
  for (const r of [...rects].reverse()) {
    const cx = clamp(r.left + r.width / 2 - w / 2, m, vw - w - m);
    const cy = clamp(r.top + r.height / 2 - h / 2, m, vh - h - m);
    cands.push([cx, r.bottom + gap], [cx, r.top - gap - h], [r.right + gap, cy], [r.left - gap - w, cy]);
  }
  cands.push([(vw - w) / 2, vh - h - m], [(vw - w) / 2, m], [m, vh - h - m], [vw - w - m, vh - h - m], [m, m], [vw - w - m, m]);
  let best: [number, number] = [(vw - w) / 2, vh - h - m];
  let least = Infinity;
  for (const [x, y] of cands) {
    if (x < m - 0.5 || y < m - 0.5 || x + w > vw - m + 0.5 || y + h > vh - m + 0.5) continue;
    const hit = rects.reduce((sum, r) => sum + 10 * overlap(x, y, w, h, r), 0) + keep.reduce((sum, r) => sum + overlap(x, y, w, h, r), 0);
    if (hit < least) {
      best = [x, y];
      least = hit;
      if (!hit) break;
    }
  }
  el.style.transform = `translate(${Math.round(best[0])}px, ${Math.round(best[1])}px)`;
}
