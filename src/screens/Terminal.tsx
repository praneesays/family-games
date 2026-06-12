import { useNavigate } from 'react-router-dom';
import { useStore } from '../lib/store';
import { Button } from '../components/Button';

const COPY = {
  full: { art: '🎪', title: "Room's packed!", body: 'This room is full right now. The host has been notified.', cta: 'Create your own', leadBack: true },
  ended: { art: '🌙', title: 'This game night has ended', body: 'Thanks for playing! Start a new room anytime.', cta: 'Create a Room', leadBack: false },
  invalid: { art: '🤔', title: "Hmm, that code doesn't look right", body: 'Check the code and try again, or head home.', cta: 'Go home', leadBack: false },
  kicked: { art: '🚪', title: 'The host removed you from this room', body: 'No worries — you can host your own game night.', cta: 'Create a Room', leadBack: false },
  goodbye: { art: '👋', title: 'See you next time!', body: 'Thanks for playing. The room is still going if you want to rejoin.', cta: 'Back home', leadBack: false },
} as const;

export function Terminal({ kind }: { kind: keyof typeof COPY }) {
  const nav = useNavigate();
  const setTerminal = useStore((s) => s.setTerminal);
  const c = COPY[kind];
  return (
    <div className="page terminal center">
      <div className="terminal__art">{c.art}</div>
      <h2>{c.title}</h2>
      <p className="muted">{c.body}</p>
      <Button
        size="xl"
        full
        onClick={() => {
          setTerminal(null);
          nav(kind === 'invalid' || kind === 'goodbye' ? '/' : '/create');
        }}
      >
        {c.cta}
      </Button>
    </div>
  );
}
