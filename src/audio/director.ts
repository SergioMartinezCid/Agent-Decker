// Chooses the music's mood from the app state: calm in the menus and between missions,
// then cool, warm or hot in play depending on the alarm. Silent after a game over.
import { activeSaved, getApp, subscribe, type AppState } from '../state/store';
import { setMusic, type Mood } from './music';

export function moodOf(s: AppState): Mood {
  if (s.screen === 'start') return 'menu';
  const g = activeSaved(s)?.game;
  if (!g) return 'menu';
  if (g.phase === 'gameOver') return 'off';
  if (g.phase !== 'play') return 'menu';
  const alarm = s.anim ? s.anim.frames[s.anim.i].alarm : g.alarm;
  return alarm >= 40 ? 'hot' : alarm >= 25 ? 'warm' : 'cool';
}

export function startMusicDirector() {
  const update = () => {
    const s = getApp();
    setMusic({ enabled: s.settings.music, volume: s.settings.musicVolume, mood: moodOf(s) });
  };
  subscribe(update);
  update();
}

// Development hook for checking the music: `await agentMusic.renderMusic('hot', 20)` in the console.
if (import.meta.env.DEV) {
  void import('./music').then((m) => ((window as unknown as Record<string, unknown>).agentMusic = { renderMusic: m.renderMusic }));
}
