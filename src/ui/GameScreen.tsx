import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { defOf } from '../engine/cards';
import { missionStatus } from '../engine/engine';
import type { Action } from '../engine/types';
import { useI18n } from '../i18n';
import { activeSaved, dispatch, isGuided, setOverlay, undo, useApp } from '../state/store';
import { Coach } from './Coach';
import { DesktopLayout } from './Desktop';
import { CardPeek, CardZoom, ChoiceDialog, PendingDialog, PhaseModal } from './Dialogs';
import { GameProvider, sameTarget, type ChoiceSpec, type GameUI, type Target } from './game';
import { useLayoutMode } from './hooks';
import { PhoneLayout } from './Phone';

export function GameScreen() {
  const saved = useApp(activeSaved)!;
  const tutorial = useApp((s) => s.screen === 'tutorial');
  const guided = useApp(isGuided);
  const anim = useApp((s) => s.anim);
  const mode = useLayoutMode();
  const { t } = useI18n();
  const game = saved.game;
  const [target, setTarget] = useState<Target | null>(null);
  const [hovered, setHovered] = useState<Target | null>(null);
  const [choice, setChoice] = useState<ChoiceSpec | null>(null);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const [peeked, setPeeked] = useState<string | null>(null);
  const unpeek = useCallback(() => setPeeked(null), []);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const frame = anim ? anim.frames[anim.i] : null;
  const view = useMemo(
    () => frame ?? { line: game.line, alarm: game.alarm, obsDeck: game.obsDeck.length, obsDiscard: game.obsDiscard.length },
    [frame, game],
  );

  // Drop selections that no longer point at anything.
  useEffect(() => {
    const valid = (x: Target | null) => {
      if (!x) return true;
      if (x.kind === 'hand') return game.hand.includes(x.id);
      if (x.kind === 'equip') return game.equip.includes(x.id);
      if (x.kind === 'play') return game.play.includes(x.id);
      return true;
    };
    if (!valid(target)) setTarget(null);
    if (!valid(hovered)) setHovered(null);
  }, [game, target, hovered]);

  const hover = useCallback((x: Target | null) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHovered((h) => (sameTarget(h, x) ? h : x)), x ? 110 : 200);
  }, []);
  const holdHover = useCallback(() => clearTimeout(timer.current), []);

  const select = useCallback((x: Target | null) => {
    clearTimeout(timer.current);
    setTarget((cur) => (x && sameTarget(cur, x) && mode !== 'phone' ? null : x));
    setHovered(null);
  }, [mode]);

  const act = useCallback((a: Action) => dispatch(a), []);

  const playCard = useCallback(
    (id: string, opts?: { choice?: 'fight' | 'draw' }) => {
      const eff = defOf(id)?.top.effect;
      const done = () => setTarget(null);
      const play = (extra: Partial<Extract<Action, { t: 'play' }>>) => {
        if (dispatch({ t: 'play', card: id, ...extra })) done();
      };
      const others = game.hand.filter((h) => h !== id);
      switch (eff) {
        case 'misdirect':
        case 'bin':
          setChoice({
            title: t(`dlg.${eff}.title`),
            text: t(`dlg.${eff}.text`),
            cards: others,
            mode: 'multi',
            cancellable: true,
            onConfirm: (cards) => play({ cards }),
          });
          return;
        case 'burn':
          setChoice({
            title: t('dlg.burn.title'),
            text: t('dlg.burn.text'),
            cards: [...game.discard].reverse(),
            mode: 'multi',
            max: 2,
            cancellable: true,
            onConfirm: (cards) => play({ cards }),
          });
          return;
        case 'recall':
          if (!game.discard.length) break;
          setChoice({
            title: t('dlg.recall.title'),
            text: t('dlg.recall.text'),
            cards: [...game.discard].reverse(),
            mode: 'single',
            cancellable: true,
            onConfirm: (cards) => play({ cards }),
          });
          return;
        case 'distraction': {
          const ids = game.line.filter(Boolean).map((lc) => lc!.id);
          setChoice({
            title: t('dlg.distraction.title'),
            text: t('dlg.distraction.text'),
            cards: ids,
            down: game.line.filter((lc) => lc?.down).map((lc) => lc!.id),
            obstacleNames: true,
            mode: 'single',
            cancellable: true,
            onConfirm: ([lid]) => play({ slot: game.line.findIndex((lc) => lc?.id === lid) }),
          });
          return;
        }
      }
      play({ choice: opts?.choice });
    },
    [game, t],
  );

  const endTurn = useCallback(() => {
    const finish = (save?: string) => {
      dispatch({ t: 'endTurn', save });
      setTarget(null);
      setHovered(null);
    };
    if (game.saveBullets && game.hand.length && !missionStatus(game).ok) {
      setChoice({
        title: t('dlg.saveBullets.title'),
        text: t('dlg.saveBullets.text'),
        cards: game.hand,
        mode: 'single',
        skip: t('dlg.saveBullets.skip'),
        cancellable: true,
        onConfirm: ([save]) => finish(save),
      });
      return;
    }
    finish();
  }, [game, t]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const ui: GameUI = {
    game,
    view,
    animating: !!anim,
    target,
    inspect: hovered ?? target,
    select,
    hover,
    holdHover,
    act,
    playCard,
    endTurn,
    undo,
    canUndo: saved.undo.length > 0 && !anim && !guided,
    tutorial,
    openMenu: () => setOverlay('menu'),
    openRules: () => setOverlay('rules'),
    zoom: setZoomed,
    peek: setPeeked,
  };

  return (
    <GameProvider value={ui}>
      {mode === 'phone' ? <PhoneLayout /> : <DesktopLayout compact={mode === 'compact'} />}
      {choice && <ChoiceDialog spec={choice} onDone={() => setChoice(null)} />}
      {!anim && <PendingDialog />}
      <PhaseModal />
      {zoomed && <CardZoom id={zoomed} onClose={() => setZoomed(null)} />}
      {peeked && <CardPeek id={peeked} onClose={unpeek} />}
      {tutorial && <Coach />}
    </GameProvider>
  );
}
