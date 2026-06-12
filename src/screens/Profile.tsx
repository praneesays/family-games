import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';

const GAME_ICON = { tambola: '🎫', rummy: '🃏' } as const;

export function Profile() {
  const nav = useNavigate();
  const selfName = useStore((s) => s.selfName);
  const selfColor = useStore((s) => s.selfColor);
  const auth = useStore((s) => s.auth);
  const history = useStore((s) => s.history);
  const signOut = useStore((s) => s.signOut);

  return (
    <div className="page profile">
      <header className="subhead">
        <button className="iconbtn" aria-label="Back" onClick={() => nav(-1)}>
          ←
        </button>
        <h2>Profile</h2>
      </header>

      <div className="profile__id">
        <Avatar name={selfName || 'You'} colorIndex={selfColor} size="xl" />
        <div className="profile__name">{selfName || 'Guest'}</div>
        <div className="muted">
          {auth.signedIn
            ? auth.method === 'phone' && auth.phone
              ? auth.phone
              : 'Signed in with Google'
            : 'Guest account'}
        </div>
      </div>

      {auth.signedIn ? (
        <Button full size="l" variant="secondary" onClick={() => nav('/dashboard')}>
          Go to your dashboard →
        </Button>
      ) : (
        <div className="signin-card">
          <strong>Keep your game history</strong>
          <p className="muted">Sign in so your rooms and wins are saved for next time.</p>
          <Button full size="l" variant="secondary" onClick={() => nav('/login')}>
            Sign in
          </Button>
        </div>
      )}

      <section>
        <div className="field__label">Recent games</div>
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__art">🎲</div>
            Your game nights will show up here.
            <Button size="m" onClick={() => nav('/create')}>
              Create a Room
            </Button>
          </div>
        ) : (
          <ul className="history-list">
            {history.slice(0, 5).map((h) => (
              <li key={h.id} className={`history-item ${h.won ? 'history-item--won' : ''}`}>
                <span className="history-item__icon" aria-hidden>
                  {GAME_ICON[h.gameId]}
                </span>
                <span className="history-item__main">
                  <strong>{h.roomName}</strong>
                  <span className="muted">{new Date(h.date).toLocaleDateString()}</span>
                </span>
                <span className={`history-item__outcome ${h.won ? 'won' : ''}`}>{h.outcome}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {auth.signedIn && (
        <button
          className="linklike linklike--leave"
          onClick={() => {
            signOut();
            nav('/');
          }}
        >
          Sign out
        </button>
      )}
    </div>
  );
}
