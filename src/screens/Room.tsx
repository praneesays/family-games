import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useStore } from '../lib/store';
import { JoinGate } from './JoinGate';
import { Lobby } from './Lobby';
import { Results } from './Results';
import { Terminal } from './Terminal';
import { TambolaGame } from '../games/tambola/TambolaGame';
import { RummyGame } from '../games/rummy/RummyGame';

/** One URL per room (/r/:code). Join gate → lobby → game → results are
 *  STATES of this route, not separate pages (blueprint §1.2). */
export function Room() {
  const { code = '' } = useParams();
  const room = useStore((s) => s.room);
  const players = useStore((s) => s.players);
  const terminal = useStore((s) => s.terminal);
  const ensureJoinableRoom = useStore((s) => s.ensureJoinableRoom);

  useEffect(() => {
    if (!terminal && (!room || room.code !== code.toUpperCase())) {
      ensureJoinableRoom(code.toUpperCase());
    }
  }, [code, room, terminal, ensureJoinableRoom]);

  if (terminal) return <Terminal kind={terminal} />;
  if (!room) return <div className="page center muted">Loading room…</div>;

  const self = players.find((p) => p.isSelf);
  if (!self) return <JoinGate />;

  if (room.status === 'results') return <Results />;
  if (room.status === 'in-game') {
    return room.gameId === 'tambola' ? <TambolaGame /> : <RummyGame />;
  }
  return <Lobby />;
}
