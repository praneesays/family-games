import { Sheet } from '../../components/Sheet';
import { Button } from '../../components/Button';
import { Card } from './Card';
import { sortHand } from './rummyLogic';
import type { Card as CardType } from '../../lib/types';

interface Props {
  open: boolean;
  hand: CardType[];
  onClose: () => void;
  onConfirm: () => void;
}

/** Engineered-friction declare flow (blueprint §9.3): grouped slots with
 *  advisory ✓/⚠ hints; confirm stays enabled (server is the judge). */
export function DeclareSheet({ open, hand, onClose, onConfirm }: Props) {
  const sorted = sortHand(hand);
  // naive grouping for display: chunk into pseudo-groups of 3-4
  const groups: CardType[][] = [];
  for (let i = 0; i < sorted.length; i += 4) groups.push(sorted.slice(i, i + 4));

  return (
    <Sheet open={open} title="Declare your hand" onClose={onClose} full>
      <p className="muted">Arrange your 13 cards into valid groups. You need at least one pure sequence.</p>
      <div className="declare-groups">
        {groups.map((g, i) => {
          const valid = g.length >= 3;
          return (
            <div key={i} className={`declare-group ${valid ? 'ok' : 'warn'}`}>
              <div className="declare-group__head">
                {i === 0 ? 'Pure sequence' : 'Sequence / Set'}
                <span className={valid ? 'hint-ok' : 'hint-warn'}>{valid ? '✓' : '⚠ needs 3+'}</span>
              </div>
              <div className="declare-group__cards">
                {g.map((c) => (
                  <Card key={c.id} card={c} small />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="declare-actions">
        <Button variant="ghost" size="m" onClick={onClose}>
          ← Back to game
        </Button>
        <Button variant="danger" size="l" onClick={onConfirm}>
          Confirm Declare
        </Button>
      </div>
    </Sheet>
  );
}
