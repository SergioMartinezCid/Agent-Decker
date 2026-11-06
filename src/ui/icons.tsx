import type { ReactNode } from 'react';
import type { CostKind, ObstacleType } from '../engine/cards';

const FONT = 'Saira Extra Condensed, Arial Narrow, sans-serif';

/** Resource badge drawn like the cards: Stealth triangle, Fight circle, Any = triangle in circle. */
export function Badge({ kind, n, size = 28, label }: { kind: CostKind; n?: number | string; size?: number; label?: string }) {
  const v = n === undefined ? '' : String(n);
  const fs = v.length > 1 ? 17 : 19;
  const text = v ? (
    <text x="20" y={kind === 's' ? 31 : 27} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={fs} fill="#151a33">
      {v}
    </text>
  ) : null;
  return (
    <svg className="bd" width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={label ?? `${v} ${kind}`}>
      {kind === 's' && <path d="M20 4 37 35H3Z" fill="#9aa5e8" stroke="#283593" strokeWidth={3.5} strokeLinejoin="round" />}
      {kind === 'f' && <circle cx={20} cy={20} r={16.5} fill="#f4898d" stroke="#e3262f" strokeWidth={3.5} />}
      {kind === 'a' && (
        <>
          <circle cx={20} cy={20} r={17} fill="#9aa5e8" stroke="#283593" strokeWidth={3} />
          <path d="M20 8 32 29H8Z" fill="none" stroke="#e3262f" strokeWidth={2.6} strokeLinejoin="round" />
        </>
      )}
      {text}
    </svg>
  );
}

export function AlarmBadge({ n, size = 28, label }: { n: number; size?: number; label?: string }) {
  const v = String(n);
  return (
    <svg className="bd" width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={label ?? `alarm ${v}`}>
      <circle cx={20} cy={20} r={17.5} fill="#fff" />
      <circle cx={20} cy={20} r={14} fill="#0b0b0b" />
      <path d="M20 1v6M20 33v6M1 20h6M33 20h6" stroke="#0b0b0b" strokeWidth={3} />
      <text x="20" y="27" textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={v.length > 1 ? 16 : 19} fill="#fff">
        {v}
      </text>
    </svg>
  );
}

const TYPE_PATHS: Record<ObstacleType, ReactNode> = {
  person: <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-8 9c0-4.4 3.6-7 8-7s8 2.6 8 7z" />,
  location: <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />,
  animal: (
    <>
      <circle cx="6" cy="9" r="2.2" />
      <circle cx="10" cy="5" r="2.2" />
      <circle cx="14" cy="5" r="2.2" />
      <circle cx="18" cy="9" r="2.2" />
      <path d="M12 10c-3 0-6 4.5-6 7.5 0 2 1.6 3 3 3 1.2 0 2-.6 3-.6s1.8.6 3 .6c1.4 0 3-1 3-3 0-3-3-7.5-6-7.5z" />
    </>
  ),
  electronic: <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 20.5z" />,
  door: <path d="M6 2h12v20H6zm8 9.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z" fillRule="evenodd" />,
};

export function TypeIcon({ type, label }: { type: ObstacleType; label?: string }) {
  return (
    <svg className="ti" viewBox="0 0 24 24" role="img" aria-label={label ?? type}>
      {TYPE_PATHS[type]}
    </svg>
  );
}

type IconName = 'menu' | 'undo' | 'rules' | 'close' | 'lock' | 'sound' | 'mute' | 'info' | 'check' | 'cross';

const UI_PATHS: Record<IconName, string> = {
  menu: 'M4 6h16M4 12h16M4 18h16',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  rules: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
  close: 'M6 6l12 12M18 6 6 18',
  lock: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  sound: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
  mute: 'M11 5 6 9H3v6h3l5 4zM22 9l-6 6M16 9l6 6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  check: 'M20 6 9 17l-5-5',
  cross: 'M6 6l12 12M18 6 6 18',
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={UI_PATHS[name]} />
    </svg>
  );
}
