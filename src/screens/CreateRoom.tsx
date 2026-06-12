import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { TextInput } from '../components/Input';
import { Chip } from '../components/Badge';
import { ROOM_NAME_SUGGESTIONS, PRIZE_LABELS } from '../lib/mockData';
import type { GameId, TambolaOptions, TambolaPrizeId } from '../lib/types';

const GAMES: { id: GameId; icon: string; name: string; players: string; tag: string; featured?: boolean }[] = [
  { id: 'tambola', icon: '🎫', name: 'Tambola', players: '2–30 players', tag: 'Family favourite!', featured: true },
  { id: 'rummy', icon: '🃏', name: 'Rummy', players: '2–6 players', tag: '13-card' },
];

const ALL_PRIZES: TambolaPrizeId[] = ['early5', 'topLine', 'middleLine', 'bottomLine', 'fullHouse'];

export function CreateRoom() {
  const nav = useNavigate();
  const createRoom = useStore((s) => s.createRoom);
  const selfName = useStore((s) => s.selfName);
  const setName = useStore((s) => s.setName);

  const [roomName, setRoomName] = useState('');
  const [gameId, setGameId] = useState<GameId>('tambola');
  const [autoMark, setAutoMark] = useState(true);
  const [speed, setSpeed] = useState<TambolaOptions['speed']>('relaxed');
  const [prizes, setPrizes] = useState<TambolaPrizeId[]>(ALL_PRIZES);
  const [yourName, setYourName] = useState(selfName);
  const [loading, setLoading] = useState(false);

  const placeholder = ROOM_NAME_SUGGESTIONS[0];

  const togglePrize = (p: TambolaPrizeId) =>
    setPrizes((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  function create() {
    if (!yourName.trim()) return;
    setLoading(true);
    setName(yourName.trim());
    const finalName = roomName.trim() || placeholder;
    const options: TambolaOptions | { pointsLimit: number } =
      gameId === 'tambola' ? { autoMark, speed, prizes } : { pointsLimit: 101 };
    const code = createRoom(finalName, gameId, options);
    nav(`/r/${code}`);
  }

  return (
    <div className="page page--wide create">
      <header className="subhead">
        <button className="iconbtn" aria-label="Back" onClick={() => nav('/')}>
          ←
        </button>
        <h2>Create a Room</h2>
      </header>

      <TextInput
        label="Your name"
        value={yourName}
        onChange={(e) => setYourName(e.target.value)}
        placeholder="e.g. Priya"
        maxLength={20}
      />

      <TextInput
        label="Room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder={placeholder}
        maxLength={40}
      />

      <div className="field__label">Pick a game</div>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={`game-card ${gameId === g.id ? 'game-card--selected' : ''}`}
            onClick={() => setGameId(g.id)}
            aria-pressed={gameId === g.id}
          >
            {g.featured && <span className="game-card__star">★</span>}
            <span className="game-card__icon">{g.icon}</span>
            <span className="game-card__name">{g.name}</span>
            <span className="game-card__players muted">{g.players}</span>
            <span className="game-card__tag">{g.tag}</span>
            {gameId === g.id && <span className="game-card__check">✓</span>}
          </button>
        ))}
        <div className="game-card game-card--teaser">
          <span className="game-card__icon">🎲</span>
          <span className="muted">More games coming for Holi 👀</span>
        </div>
      </div>

      {gameId === 'tambola' ? (
        <div className="options">
          <div className="field__label">Tambola options</div>
          <div className="option-row">
            <span>Auto-mark for everyone</span>
            <Chip active={autoMark} onClick={() => setAutoMark((v) => !v)}>
              {autoMark ? 'ON ●' : 'OFF'}
            </Chip>
          </div>
          <div className="option-row">
            <span>Calling speed</span>
            <div className="segmented">
              {(['relaxed', 'normal', 'fast'] as const).map((s) => (
                <button key={s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>
                  {s[0].toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="option-row option-row--wrap">
            <span>Prizes</span>
            <div className="prize-chips">
              {ALL_PRIZES.map((p) => (
                <Chip key={p} active={prizes.includes(p)} onClick={() => togglePrize(p)}>
                  {prizes.includes(p) ? '☑' : '☐'} {PRIZE_LABELS[p]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="options">
          <div className="field__label">Rummy options</div>
          <div className="option-row">
            <span>Points limit</span>
            <Chip active>101 points</Chip>
          </div>
          <p className="muted">Single deal · 2–6 players · 30s turns</p>
        </div>
      )}

      <div className="sticky-cta">
        <Button size="xl" full loading={loading} onClick={create} disabled={!yourName.trim()} disabledReason="Enter your name first">
          Create Room
        </Button>
      </div>
    </div>
  );
}
