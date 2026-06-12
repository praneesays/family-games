import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { CodeInput } from '../components/Input';
import { Avatar } from '../components/Avatar';

const GAME_META = {
  tambola: { icon: '🎫', name: 'Tambola' },
  rummy: { icon: '🃏', name: 'Rummy' },
} as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Signed-in home: greeting, stats, quick actions, recent games. */
export function Dashboard() {
  const nav = useNavigate();
  const auth = useStore((s) => s.auth);
  const selfName = useStore((s) => s.selfName);
  const selfColor = useStore((s) => s.selfColor);
  const history = useStore((s) => s.history);
  const signOut = useStore((s) => s.signOut);
  const [code, setCode] = useState('');

  // dashboard is for signed-in users; guests go to login
  useEffect(() => {
    if (!auth.signedIn) nav('/login', { replace: true });
  }, [auth.signedIn, nav]);

  const lastRoom = (() => {
    try {
      return JSON.parse(localStorage.getItem('fg_lastRoom') ?? 'null') as { code: string; name: string } | null;
    } catch {
      return null;
    }
  })();

  const wins = history.filter((h) => h.won).length;
  const go = () => code && nav(`/r/${code}`);

  return (
    <div className="page page--wide dashboard">
      <header className="dash__head">
        <span className="brandmark">🎪 FamilyGames</span>
        <button className="dash__avatar" onClick={() => nav('/me')} aria-label="Profile">
          <Avatar name={selfName || 'You'} colorIndex={selfColor} size="md" />
        </button>
      </header>

      <div className="dash__greeting">
        <h1>Namaste, {selfName || 'friend'} 👋</h1>
        <p className="muted">
          {auth.method === 'phone' && auth.phone ? `Signed in · ${auth.phone}` : 'Signed in with Google'}
        </p>
      </div>

      {/* stats */}
      <div className="dash__stats" role="group" aria-label="Your stats">
        <div className="stat-card">
          <span className="stat-card__num">{history.length}</span>
          <span className="stat-card__label">games played</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__num">{wins}</span>
          <span className="stat-card__label">wins 🏆</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__num">{new Set(history.map((h) => h.roomCode)).size}</span>
          <span className="stat-card__label">game nights</span>
        </div>
      </div>

      {/* resume live room */}
      {lastRoom && (
        <button className="resume-card" onClick={() => nav(`/r/${lastRoom.code}`)}>
          <span>⚡ “{lastRoom.name}”</span>
          <strong>Rejoin room →</strong>
        </button>
      )}

      {/* quick actions */}
      <div className="dash__actions">
        <Button size="xl" full onClick={() => nav('/create')}>
          ➕ Create a Room
        </Button>
        <div className="join-row">
          <CodeInput value={code} onChange={setCode} onEnter={go} />
          <Button size="l" variant="secondary" onClick={go} disabled={!code} disabledReason="">
            Go
          </Button>
        </div>
      </div>

      {/* festival slot */}
      <div className="festival-banner">
        <div>
          <strong>🪔 Diwali Tambola Nights!</strong>
          <span className="muted"> Themed rooms for the season.</span>
        </div>
        <Button size="m" variant="secondary" onClick={() => nav('/create')}>
          Host →
        </Button>
      </div>

      {/* recent games */}
      <section className="dash__recent">
        <div className="field__label">Recent games</div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__art">🎲</div>
            Your game nights will show up here once you play.
            <Button size="m" onClick={() => nav('/create')}>
              Start your first game
            </Button>
          </div>
        ) : (
          <ul className="history-list">
            {history.slice(0, 10).map((h) => (
              <li key={h.id} className={`history-item ${h.won ? 'history-item--won' : ''}`}>
                <span className="history-item__icon" aria-hidden>
                  {GAME_META[h.gameId].icon}
                </span>
                <span className="history-item__main">
                  <strong>{h.roomName}</strong>
                  <span className="muted">
                    {GAME_META[h.gameId].name} · {formatDate(h.date)}
                  </span>
                </span>
                <span className={`history-item__outcome ${h.won ? 'won' : ''}`}>{h.outcome}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        className="linklike linklike--leave"
        onClick={() => {
          signOut();
          nav('/');
        }}
      >
        Sign out
      </button>
    </div>
  );
}
