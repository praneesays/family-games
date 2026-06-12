import { useState } from 'react';
import type { Ticket as TicketType } from '../../lib/types';

interface Props {
  ticket: TicketType;
  marked: Set<number>;
  called: Set<number>;
  autoMark: boolean;
  onMark: (n: number) => void;
}

export function Ticket({ ticket, marked, called, autoMark, onMark }: Props) {
  const [shake, setShake] = useState<number | null>(null);

  function handleTap(n: number) {
    if (marked.has(n)) return;
    if (called.has(n)) {
      onMark(n);
    } else {
      // tapped a not-yet-called number — gentle shake, no penalty
      setShake(n);
      setTimeout(() => setShake(null), 360);
    }
  }

  return (
    <div className="ticket">
      <div className="ticket__grid">
        {ticket.map((row, ri) =>
          row.map((cell, ci) => {
            if (cell === null) {
              return <div key={`${ri}-${ci}`} className="cell cell--blank" aria-hidden />;
            }
            const isMarked = marked.has(cell);
            const isGlowing = !isMarked && called.has(cell);
            return (
              <button
                key={`${ri}-${ci}`}
                className={[
                  'cell',
                  isMarked ? 'cell--marked' : '',
                  isGlowing ? 'cell--glow' : '',
                  shake === cell ? 'anim-shake' : '',
                ].join(' ')}
                onClick={() => handleTap(cell)}
                aria-label={`Number ${cell}${isMarked ? ', marked' : ''}`}
                aria-pressed={isMarked}
              >
                {cell}
                {isMarked && <span className="cell__tick" aria-hidden>✓</span>}
              </button>
            );
          }),
        )}
      </div>
      <div className="ticket__foot">
        <span className={`automark ${autoMark ? 'automark--on' : ''}`}>
          Auto-mark {autoMark ? 'ON ●' : 'OFF'}
        </span>
      </div>
    </div>
  );
}
