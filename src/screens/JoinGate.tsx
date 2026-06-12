import { useState } from 'react';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { TextInput } from '../components/Input';
import { Avatar } from '../components/Avatar';

export function JoinGate() {
  const room = useStore((s) => s.room)!;
  const players = useStore((s) => s.players);
  const selfName = useStore((s) => s.selfName);
  const setName = useStore((s) => s.setName);
  const joinRoom = useStore((s) => s.joinRoom);
  const [name, setName_] = useState(selfName);

  const host = players.find((p) => p.isHost);
  const present = players.filter((p) => p.conn !== 'left');
  const inGame = room.status !== 'lobby';
  const lateJoinable = room.gameId === 'tambola';

  function join() {
    if (!name.trim()) return;
    setName(name.trim());
    joinRoom();
  }

  return (
    <div className="page join" data-on-dark>
      <div className="join__brand brandmark">🎪 FamilyGames</div>

      <div className="join__card">
        <div className="join__invited">You're invited to</div>
        <div className="join__roomname">{room.name}</div>
        <div className="join__meta">
          {host && <>Hosted by {host.name} · </>}
          {room.gameId === 'tambola' ? '🎫 Tambola' : '🃏 Rummy'}
        </div>

        <div className="join__avatars">
          {present.slice(0, 5).map((p) => (
            <Avatar key={p.id} name={p.name} colorIndex={p.colorIndex} size="md" host={p.isHost} />
          ))}
          {present.length > 5 && <span className="join__avatars-more">+{present.length - 5}</span>}
        </div>
        <div className="join__who muted">
          {present
            .slice(0, 3)
            .map((p) => p.name)
            .join(', ')}
          {present.length > 3 ? ` & ${present.length - 3} more are here` : ' are here'}
        </div>
      </div>

      <div className="join__form">
        <TextInput
          label="Your name"
          value={name}
          onChange={(e) => setName_(e.target.value)}
          placeholder="Type your name"
          autoFocus
          maxLength={20}
          onKeyDown={(e) => e.key === 'Enter' && join()}
        />
        <Button size="xl" full onClick={join} disabled={!name.trim()} disabledReason="Type your name to join">
          {inGame && lateJoinable ? 'Join the game' : inGame ? 'Join — next round soon' : 'Join Room'}
        </Button>
        <p className="join__reassure">No sign-up needed · free</p>
      </div>
    </div>
  );
}
