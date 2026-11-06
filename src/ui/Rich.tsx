import { Fragment, type ReactNode } from 'react';
import type { CostKind, ObstacleType } from '../engine/cards';
import { useI18n } from '../i18n';
import { Badge, TypeIcon } from './icons';

const TOKEN = /(\*\*[^*]+\*\*|\{(?:[sfa]\d*|person|location|animal|electronic|door)\})/g;
const TYPES = new Set(['person', 'location', 'animal', 'electronic', 'door']);

/** Renders **bold** and icon tokens ({s2}, {f1}, {a18}, {person}, …) inside a string. */
export function Rich({ text, size = 18 }: { text: string; size?: number }) {
  const { t } = useI18n();
  const parts = text.split(TOKEN);
  const out: ReactNode[] = [];
  parts.forEach((part, i) => {
    if (!part) return;
    if (part.startsWith('**') && part.endsWith('**')) {
      out.push(<strong key={i}>{part.slice(2, -2)}</strong>);
      return;
    }
    const m = /^\{(.+)\}$/.exec(part);
    if (m) {
      const tok = m[1];
      if (TYPES.has(tok)) {
        out.push(<TypeIcon key={i} type={tok as ObstacleType} label={t(`types.${tok}`)} />);
        return;
      }
      const kind = tok[0] as CostKind;
      const n = tok.slice(1);
      out.push(<Badge key={i} kind={kind} n={n || undefined} size={size} label={`${n} ${t(`res.${kind}`)}`.trim()} />);
      return;
    }
    out.push(<Fragment key={i}>{part}</Fragment>);
  });
  return <>{out}</>;
}
