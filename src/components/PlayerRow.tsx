import { useState } from 'react';
import type { Player } from '../lib/types';
import { Avatar } from './Avatar';

interface Props {
  player: Player;
  canModerate?: boolean;
  onMakeHost?: (id: string) => void;
  onKick?: (id: string) => void;
}

export function PlayerRow({ player, canModerate, onMakeHost, onKick }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`player-row ${player.conn === 'left' ? 'player-row--left' : ''}`}>
      <Avatar name={player.name} colorIndex={player.colorIndex} size="md" host={player.isHost} conn={player.conn} />
      <span className="player-row__name">
        {player.name}
        {player.isSelf && <span className="player-row__you"> — you</span>}
      </span>
      <span className="spacer" />
      {player.isHost && <span className="player-row__tag">host</span>}
      {player.conn === 'reconnecting' && <span className="player-row__tag player-row__tag--warn">reconnecting…</span>}
      {canModerate && !player.isSelf && (
        <div className="overflow">
          <button className="iconbtn" aria-label={`Options for ${player.name}`} onClick={() => setOpen((o) => !o)}>
            ⋮
          </button>
          {open && (
            <div className="overflow__menu" onMouseLeave={() => setOpen(false)}>
              {!player.isHost && (
                <button onClick={() => { onMakeHost?.(player.id); setOpen(false); }}>Make host</button>
              )}
              <button className="danger" onClick={() => { onKick?.(player.id); setOpen(false); }}>
                Remove…
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
