import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Sheet } from '../components/Sheet';
import { TextInput } from '../components/Input';

export function Profile() {
  const nav = useNavigate();
  const selfName = useStore((s) => s.selfName);
  const selfColor = useStore((s) => s.selfColor);
  const [signInOpen, setSignInOpen] = useState(false);
  const [phone, setPhone] = useState('');

  return (
    <div className="page profile">
      <header className="subhead">
        <button className="iconbtn" aria-label="Back" onClick={() => nav('/')}>
          ←
        </button>
        <h2>Profile</h2>
      </header>

      <div className="profile__id">
        <Avatar name={selfName || 'You'} colorIndex={selfColor} size="xl" />
        <div className="profile__name">{selfName || 'Guest'}</div>
        <div className="muted">Guest account</div>
      </div>

      <div className="signin-card">
        <strong>Keep your game history</strong>
        <p className="muted">Sign in so your rooms and wins are saved for next time.</p>
        <Button full size="l" variant="secondary" onClick={() => setSignInOpen(true)}>
          Sign in
        </Button>
      </div>

      <section>
        <div className="field__label">Recent games</div>
        <div className="empty-state">
          <div className="empty-state__art">🎲</div>
          Your game nights will show up here.
          <Button size="m" onClick={() => nav('/create')}>
            Create a Room
          </Button>
        </div>
      </section>

      <Sheet open={signInOpen} title="Sign in" onClose={() => setSignInOpen(false)}>
        <p className="muted">Keep your game history across devices.</p>
        <Button full size="l" variant="outline" onClick={() => setSignInOpen(false)}>
          G&nbsp;&nbsp;Continue with Google
        </Button>
        <div className="divider">or</div>
        <div className="row">
          <span className="phone-prefix">+91</span>
          <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="numeric" />
        </div>
        <Button full size="l" onClick={() => setSignInOpen(false)} disabled={phone.length < 10} disabledReason="Enter a 10-digit number">
          Get OTP
        </Button>
        <button className="linklike" onClick={() => setSignInOpen(false)}>
          Skip for now
        </button>
      </Sheet>
    </div>
  );
}
