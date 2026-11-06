import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { keyOf } from '../engine/cards';
import { rulesEn } from '../content/rules-en';
import { rulesEs } from '../content/rules-es';
import type { RulesContent } from '../content/types';
import { en, type CardText, type Dict } from './en';
import { es } from './es';

export type Lang = 'en' | 'es';
export const LANGS: Lang[] = ['en', 'es'];
const DICTS: Record<Lang, Dict> = { en, es };
const RULES: Record<Lang, RulesContent> = { en: rulesEn, es: rulesEs };

export type Params = Record<string, string | number>;

export function interpolate(str: string, params?: Params): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

function lookup(d: Dict, path: string): string {
  let cur: unknown = d;
  for (const part of path.split('.')) {
    if (cur && typeof cur === 'object' && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof cur === 'string' ? cur : path;
}

export interface I18n {
  lang: Lang;
  d: Dict;
  rules: RulesContent;
  t: (path: string, params?: Params) => string;
  card: (idOrKey: string) => CardText;
  /** Obstacle name, or the card's own name for starting cards. */
  name: (idOrKey: string) => string;
  /** Top-half name: what the card is once it's yours. */
  top: (idOrKey: string) => string;
  logLine: (k: string, p?: Params) => string;
}

export function makeI18n(lang: Lang): I18n {
  const d = DICTS[lang] ?? en;
  const card = (idOrKey: string): CardText => d.cards[keyOf(idOrKey)] ?? en.cards[keyOf(idOrKey)] ?? { name: idOrKey, top: idOrKey };
  const t = (path: string, params?: Params) => interpolate(lookup(d, path), params);
  return {
    lang,
    d,
    rules: RULES[lang] ?? rulesEn,
    t,
    card,
    name: (id) => card(id).name,
    top: (id) => card(id).top,
    logLine: (k, p) => {
      const tpl = d.log[k] ?? en.log[k] ?? k;
      if (!p) return tpl;
      const named: Params = {};
      for (const [key, v] of Object.entries(p)) {
        if (key === 'card' || key === 'target') named[key] = card(String(v)).name;
        else if (key === 'top' || key === 'item') named[key] = card(String(v)).top;
        else named[key] = v;
      }
      return interpolate(tpl, named);
    },
  };
}

const Ctx = createContext<I18n>(makeI18n('en'));

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo(() => makeI18n(lang), [lang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
