import { Card } from './Card';
import type { Card as CardType } from '../../lib/types';

interface Props {
  hand: CardType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSort: () => void;
}

export function Hand({ hand, selectedId, onSort, onSelect }: Props) {
  return (
    <div className="hand">
      <div className="hand__head">
        <span className="field__label">Your hand</span>
        <button className="sort-btn" onClick={onSort}>
          ⇅ Sort
        </button>
      </div>
      <div className="hand__cards" role="list">
        {hand.map((c) => (
          <div role="listitem" key={c.id} className="hand__slot">
            <Card card={c} selected={selectedId === c.id} onClick={() => onSelect(c.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
