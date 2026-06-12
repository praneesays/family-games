import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { CodeInput } from '../components/Input';

export function Landing() {
  const nav = useNavigate();
  const signedIn = useStore((s) => s.auth.signedIn);
  const [code, setCode] = useState('');
  const lastRoom = (() => {
    try {
      return JSON.parse(localStorage.getItem('fg_lastRoom') ?? 'null') as { code: string; name: string } | null;
    } catch {
      return null;
    }
  })();

  const go = () => code && nav(`/r/${code}`);

  return (
    <div className="page landing">
      <header className="landing__top">
        <span className="brandmark">🎪 FamilyGames</span>
        <button className="iconbtn" aria-label="Profile" onClick={() => nav(signedIn ? '/dashboard' : '/login')}>
          👤
        </button>
      </header>

      {/* Festival banner slot (seasonal) */}
      <div className="festival-banner" role="region" aria-label="Festival promotion">
        <div>
          <strong>🪔 Diwali Tambola Nights are here!</strong>
          <span className="muted"> Host one for the whole family.</span>
        </div>
        <Button size="m" variant="secondary" onClick={() => nav('/create')}>
          Host →
        </Button>
      </div>

      {/* Resume card (conditional) */}
      {lastRoom && (
        <button className="resume-card" onClick={() => nav(`/r/${lastRoom.code}`)}>
          <span>⚡ “{lastRoom.name}” is on!</span>
          <strong>Rejoin room →</strong>
        </button>
      )}

      <div className="landing__hero">
        <h1>
          Game night with the
          <br />
          whole family.
        </h1>
        <p className="landing__sub">One link. No installs.</p>
      </div>

      <Button size="xl" full onClick={() => nav('/create')}>
        ➕ Create a Room
      </Button>

      <div className="divider">or join with a code</div>

      <div className="join-row">
        <CodeInput value={code} onChange={setCode} onEnter={go} />
        <Button size="l" variant="secondary" onClick={go} disabled={!code} disabledReason="">
          Go
        </Button>
      </div>

      <section className="how">
        <h3>How it works</h3>
        <ol className="how__steps">
          <li>
            <span className="how__num">1</span> Create a room
          </li>
          <li>
            <span className="how__num">2</span> Share on WhatsApp
          </li>
          <li>
            <span className="how__num">3</span> Play together
          </li>
        </ol>
      </section>

      <footer className="landing__footer muted">
        <a href="#privacy">Privacy</a> · <a href="#terms">Terms</a> · <span>English ▾</span>
      </footer>
    </div>
  );
}
