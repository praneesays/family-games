import { colorFor } from '../lib/mockData';
import type { ConnState } from '../lib/types';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const PX: Record<Size, number> = { xs: 28, sm: 36, md: 40, lg: 64, xl: 96 };

interface Props {
  name: string;
  colorIndex: number;
  size?: Size;
  host?: boolean;
  conn?: ConnState;
  turn?: boolean;
  /** 0..1 fraction of turn-ring to fill */
  turnProgress?: number;
}

export function Avatar({ name, colorIndex, size = 'md', host, conn, turn, turnProgress = 0 }: Props) {
  const px = PX[size];
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span className={`avatar avatar--${size} ${turn ? 'avatar--turn' : ''}`} style={{ width: px, height: px }}>
      {turn && (
        <span
          className="avatar__ring"
          style={{ background: `conic-gradient(var(--color-game-turn) ${turnProgress * 360}deg, rgba(0,0,0,0.12) 0deg)` }}
          aria-hidden
        />
      )}
      <span className="avatar__disc" style={{ background: colorFor(colorIndex), fontSize: px * 0.42 }}>
        {initial}
      </span>
      {host && (
        <span className="avatar__badge avatar__badge--host" title="Host" aria-label="Host">
          👑
        </span>
      )}
      {conn === 'reconnecting' && (
        <span className="avatar__badge avatar__badge--recon" title="Reconnecting" aria-label="Reconnecting">
          ⚡
        </span>
      )}
    </span>
  );
}
