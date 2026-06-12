import { Avatar } from '../../components/Avatar';
import { Card } from './Card';
import type { Card as CardType, Player, RummyState } from '../../lib/types';

interface Props {
  game: RummyState;
  players: Player[];
  myTurn: boolean;
  canDraw: boolean;
  turnProgress: number;
  currentId: string;
  onDraw: (src: 'closed' | 'discard') => void;
}

export function Table({ game, players, myTurn, canDraw, turnProgress, currentId, onDraw }: Props) {
  const opponents = players.filter((p) => !p.isSelf && p.conn !== 'left');
  const topDiscard: CardType | undefined = game.discard[game.discard.length - 1];

  return (
    <div className="rummy-table">
      <div className="rummy-table__opponents">
        {opponents.map((p) => (
          <div key={p.id} className="opp">
            <Avatar
              name={p.name}
              colorIndex={p.colorIndex}
              size="md"
              host={p.isHost}
              conn={p.conn}
              turn={p.id === currentId}
              turnProgress={p.id === currentId ? turnProgress : 0}
            />
            <span className="opp__name">{p.name}</span>
            <span className="opp__count muted">{game.handCounts[p.id] ?? 13} cards</span>
          </div>
        ))}
      </div>

      <div className="rummy-table__piles">
        <button
          className={`pile ${myTurn && canDraw ? 'pile--live' : ''}`}
          onClick={() => myTurn && canDraw && onDraw('closed')}
          disabled={!myTurn || !canDraw}
          aria-label="Draw from closed pile"
        >
          <Card card={{ id: 'back', rank: 0, suit: 'spades' }} faceDown />
          <span className="pile__label">DRAW</span>
          <span className="pile__count muted">{game.drawPileCount}</span>
        </button>

        <button
          className={`pile ${myTurn && canDraw && topDiscard ? 'pile--live' : ''}`}
          onClick={() => myTurn && canDraw && topDiscard && onDraw('discard')}
          disabled={!myTurn || !canDraw || !topDiscard}
          aria-label="Take from discard pile"
        >
          {topDiscard ? <Card card={topDiscard} /> : <span className="pile__empty">empty</span>}
          <span className="pile__label">TAKE</span>
        </button>

        <div className="joker-slot">
          <Card card={game.wildJoker} />
          <span className="pile__label">JOKER</span>
        </div>
      </div>
    </div>
  );
}
