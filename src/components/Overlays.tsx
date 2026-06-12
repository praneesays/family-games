import { useStore } from '../lib/store';
import { colorFor } from '../lib/mockData';
import { Avatar } from './Avatar';

/** Toasts — top-center, max 2 stacked, auto-dismiss. */
export function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Full-screen celebration "moment" — one platform template for every game. */
export function MomentLayer() {
  const moment = useStore((s) => s.moment);
  const dismiss = useStore((s) => s.dismissMoment);
  if (!moment) return null;
  return (
    <div className="moment" onClick={dismiss} role="status" aria-live="assertive">
      <Confetti />
      <div className="moment__card">
        {moment.avatarName && (
          <Avatar name={moment.avatarName} colorIndex={moment.colorIndex ?? 0} size="xl" />
        )}
        <div className="moment__title">{moment.title}</div>
        {moment.subtitle && <div className="moment__sub">{moment.subtitle}</div>}
      </div>
    </div>
  );
}

/** Lightweight CSS confetti (reduced-motion friendly via tokens.css). */
export function Confetti() {
  const pieces = Array.from({ length: 40 });
  const colors = [0, 1, 2, 4, 5, 7];
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((_, i) => (
        <span
          key={i}
          className="confetti__bit"
          style={{
            left: `${(i / pieces.length) * 100}%`,
            background: colorFor(colors[i % colors.length]),
            animationDelay: `${(i % 10) * 0.12}s`,
            animationDuration: `${1.8 + (i % 5) * 0.25}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Floating emoji reactions rising from senders. */
export function FloatLayer() {
  const floats = useStore((s) => s.floats);
  return (
    <div className="float-layer" aria-hidden>
      {floats.map((f, i) => (
        <span key={f.id} className="float" style={{ left: `${15 + ((i * 17) % 70)}%` }}>
          {f.emoji}
        </span>
      ))}
    </div>
  );
}
