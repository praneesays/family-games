import { useState } from 'react';
import type { ReactNode } from 'react';
import { useStore } from '../lib/store';
import { Avatar } from './Avatar';
import { ConnectionPill } from './ConnectionPill';
import { ReactionBar } from './ReactionBar';
import { ActionBar } from './ActionBar';
import type { GameAction } from './ActionBar';
import { Sheet } from './Sheet';
import { Dialog } from './Dialog';
import { PlayerRow } from './PlayerRow';

interface Props {
  actions?: GameAction[];
  /** Optional secondary info pane (tablet/desktop) — e.g. Tambola board, Rummy activity. */
  sidePane?: ReactNode;
  children: ReactNode;
}

/** The universal game-room frame. Platform owns everything except the slot. */
export function GameFrame({ actions = [], sidePane, children }: Props) {
  const room = useStore((s) => s.room)!;
  const players = useStore((s) => s.players);
  const activity = useStore((s) => s.activity);
  const leave = useStore((s) => s.leaveRoom);
  const kick = useStore((s) => s.kick);
  const transferHost = useStore((s) => s.transferHost);
  const self = players.find((p) => p.isSelf);
  const isHost = self?.isHost;

  const [menuOpen, setMenuOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const live = players.filter((p) => p.conn !== 'left');

  return (
    <div className="gameframe">
      {/* ① platform top bar */}
      <header className="topbar">
        <button className="topbar__room" onClick={() => setMenuOpen(true)} aria-label="Room menu">
          <span className="topbar__code">{room.code}</span>
          <span aria-hidden>▾</span>
        </button>
        <div className="topbar__strip" aria-label="Players">
          {live.slice(0, 6).map((p) => (
            <Avatar key={p.id} name={p.name} colorIndex={p.colorIndex} size="xs" host={p.isHost} conn={p.conn} />
          ))}
          {live.length > 6 && <span className="topbar__more">+{live.length - 6}</span>}
        </div>
        <ConnectionPill state={self?.conn ?? 'online'} />
      </header>

      {/* ② game slot (+ optional side pane on wide screens) */}
      <div className="gameframe__body">
        <main className="gameslot">{children}</main>
        {sidePane && <aside className="sidepane">{sidePane}</aside>}
      </div>

      {/* ③ game action bar */}
      <ActionBar actions={actions} />

      {/* ④ reaction bar */}
      <ReactionBar onOpenPlayers={() => setPlayersOpen(true)} />

      {/* room menu */}
      <Sheet open={menuOpen} title={room.name} onClose={() => setMenuOpen(false)}>
        <div className="menu-list">
          <button onClick={() => { setMenuOpen(false); setPlayersOpen(true); }}>👥 Players ({live.length})</button>
          {isHost && <button onClick={() => useStore.getState().toggleLock()}>{room.locked ? '🔓 Unlock room' : '🔒 Lock room'}</button>}
          <button>📋 Copy invite link</button>
          <button className="danger" onClick={() => { setMenuOpen(false); setLeaveOpen(true); }}>🚪 Leave room</button>
        </div>
      </Sheet>

      {/* players sheet */}
      <Sheet open={playersOpen} title={`Players (${live.length})`} onClose={() => setPlayersOpen(false)}>
        <div className="player-list">
          {players.map((p) => (
            <PlayerRow key={p.id} player={p} canModerate={isHost} onKick={kick} onMakeHost={transferHost} />
          ))}
        </div>
        <div className="activity">
          <div className="activity__title">Activity</div>
          {activity.slice(0, 8).map((a) => (
            <div key={a.id} className={`activity__item ${a.emphasis ? 'activity__item--emph' : ''}`}>
              {a.text}
            </div>
          ))}
        </div>
      </Sheet>

      <Dialog
        open={leaveOpen}
        title="Leave room?"
        body="You can re-join anytime with the same link."
        confirmLabel="Leave"
        danger
        onConfirm={leave}
        onCancel={() => setLeaveOpen(false)}
      />
    </div>
  );
}
