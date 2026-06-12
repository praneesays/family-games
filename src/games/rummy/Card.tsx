import type { Card as CardType } from '../../lib/types';
import { SUIT_SYMBOL, rankLabel } from '../../lib/mockData';

interface Props {
  card: CardType;
  selected?: boolean;
  small?: boolean;
  onClick?: () => void;
  faceDown?: boolean;
}

export function Card({ card, selected, small, onClick, faceDown }: Props) {
  if (faceDown) {
    return <span className={`card card--back ${small ? 'card--sm' : ''}`} aria-hidden />;
  }
  if (card.joker) {
    return (
      <button
        className={`card card--joker ${small ? 'card--sm' : ''} ${selected ? 'card--selected' : ''}`}
        onClick={onClick}
        aria-label="Joker"
      >
        <span className="card__joker">★</span>
        <span className="card__jlabel">JOKER</span>
      </button>
    );
  }
  const red = card.suit === 'hearts' || card.suit === 'diamonds';
  const label = `${rankLabel(card.rank)} of ${card.suit}`;
  return (
    <button
      className={`card ${red ? 'card--red' : 'card--black'} ${small ? 'card--sm' : ''} ${selected ? 'card--selected' : ''}`}
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
    >
      <span className="card__rank">{rankLabel(card.rank)}</span>
      <span className="card__suit">{SUIT_SYMBOL[card.suit]}</span>
    </button>
  );
}
