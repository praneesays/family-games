import { useState } from 'react';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { PlayerRow } from '../components/PlayerRow';
import { Sheet } from '../components/Sheet';
import { Dialog } from '../components/Dialog';

export function Lobby() {
  const room = useStore((s) => s.room)!;
  const players = useStore((s) => s.players);
  const startGame = useStore((s) => s.startGame);
  const kick = useStore((s) => s.kick);
  const transferHost = useStore((s) => s.transferHost);
  const toggleLock = useStore((s) => s.toggleLock);
  const endRoom = useStore((s) => s.endRoom);
  const leave = useStore((s) => s.leaveRoom);

  const self = players.find((p) => p.isSelf);
  const isHost = !!self?.isHost;
  const present = players.filter((p) => p.conn !== 'left');
  const minPlayers = room.gameId === 'rummy' ? 2 : 2;
  const canStart = present.length >= minPlayers;
  const reconnecting = present.filter((p) => p.conn === 'reconnecting').map((p) => p.name);

  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const link = `famgames.in/r/${room.code}`;
  const shareText = `🎉 Join my ${room.gameId === 'tambola' ? 'Tambola' : 'Rummy'} night "${room.name}": https://${link} — Room code: ${room.code}. Works in your browser, nothing to install.`;

  function copy() {
    navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }
  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }

  return (
    <div className="page lobby">
      <header className="lobby__head">
        <div>
          <h2>{room.name}</h2>
          <div className="lobby__sub muted">
            Code:{' '}
            <button className="code-chip" onClick={copy} aria-label="Copy room code">
              {room.code.replace(/(\d+)$/, ' $1')} {copied ? '✓' : '📋'}
            </button>{' '}
            · {room.gameId === 'tambola' ? '🎫 Tambola' : '🃏 Rummy'}
          </div>
        </div>
        {isHost && (
          <button className="iconbtn" aria-label="Room settings" onClick={() => setSettingsOpen(true)}>
            ⋮
          </button>
        )}
      </header>

      <section className="lobby__players">
        <div className="field__label">Players ({present.length})</div>
        <div className="player-list">
          {players.map((p) => (
            <PlayerRow key={p.id} player={p} canModerate={isHost} onKick={kick} onMakeHost={transferHost} />
          ))}
        </div>
      </section>

      {/* state-aware primary zone */}
      {present.length < minPlayers ? (
        <section className="share-module">
          <div className="share-module__title">Your room is ready — invite the family!</div>
          <div className="share-link">{link}</div>
          <Button size="xl" full variant="secondary" onClick={shareWhatsApp}>
            ⊕ Share on WhatsApp
          </Button>
          <button className="linklike" onClick={copy}>
            {copied ? 'Copied! ✓' : 'Copy link'}
          </button>
        </section>
      ) : (
        <section className="lobby__cta">
          {isHost ? (
            <>
              <Button size="xl" full pulsing={canStart} onClick={() => setStartOpen(true)} disabled={!canStart}>
                ▶ Start Game
              </Button>
              <button className="linklike" onClick={shareWhatsApp}>
                ⊕ Invite more
              </button>
            </>
          ) : (
            <div className="waiting-card">
              ⏳ Waiting for {players.find((p) => p.isHost)?.name ?? 'the host'} to start the game…
            </div>
          )}
        </section>
      )}

      {!isHost && (
        <button className="linklike linklike--leave" onClick={leave}>
          Leave room
        </button>
      )}

      {/* host settings */}
      <Sheet open={settingsOpen} title="Room settings" onClose={() => setSettingsOpen(false)}>
        <div className="menu-list">
          <button onClick={toggleLock}>{room.locked ? '🔓 Unlock room' : '🔒 Lock room'}</button>
          <button onClick={copy}>↻ Copy new invite link</button>
          <button className="danger" onClick={() => { setSettingsOpen(false); setEndOpen(true); }}>
            ⚠ End room for all
          </button>
        </div>
      </Sheet>

      <Dialog
        open={startOpen}
        title="Start the game?"
        body={`${present.length} players in.${reconnecting.length ? ` ${reconnecting.join(', ')} is reconnecting.` : ''} Latecomers can still join.`}
        confirmLabel="Start now"
        cancelLabel="Wait"
        onConfirm={() => {
          setStartOpen(false);
          startGame();
        }}
        onCancel={() => setStartOpen(false)}
      />
      <Dialog
        open={endOpen}
        title="End room for everyone?"
        body="This closes the room for all players."
        confirmLabel="End room"
        danger
        onConfirm={endRoom}
        onCancel={() => setEndOpen(false)}
      />
    </div>
  );
}
