import { useEffect, useState } from 'react';
import { useStore, selfPlayerId } from '../../lib/store';
import { GameFrame } from '../../components/GameFrame';
import type { GameAction } from '../../components/ActionBar';
import type { RummyState } from '../../lib/types';
import { Table } from './Table';
import { Hand } from './Hand';
import { DeclareSheet } from './DeclareSheet';
import { sortHand } from './rummyLogic';
import { SUIT_SYMBOL, rankLabel } from '../../lib/mockData';

export function RummyGame() {
  const game = useStore((s) => s.game) as RummyState;
  const players = useStore((s) => s.players);
  const drawFrom = useStore((s) => s.drawFrom);
  const discardCard = useStore((s) => s.discardCard);
  const declareRummy = useStore((s) => s.declareRummy);
  const dropHand = useStore((s) => s.dropHand);
  const reorderHand = useStore((s) => s.reorderHand);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [declareOpen, setDeclareOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // tick the turn timer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (!game || game.kind !== 'rummy') return null;
  const pid = selfPlayerId();
  const hand = game.hands[pid] ?? [];
  const currentId = game.turnOrder[game.turnIndex];
  const myTurn = currentId === pid;
  const canDraw = myTurn && !game.hasDrawn;
  const remainingMs = Math.max(0, game.turnEndsAt - now);
  const turnProgress = myTurn ? Math.min(1, 1 - remainingMs / 30000) : 0;
  const secs = Math.ceil(remainingMs / 1000);

  const selectedCard = hand.find((c) => c.id === selectedId);
  const actions: GameAction[] = [];
  if (myTurn && game.hasDrawn) {
    actions.push({
      label: selectedCard ? `Discard ${rankLabel(selectedCard.rank)}${selectedCard.joker ? '' : SUIT_SYMBOL[selectedCard.suit]}` : 'Discard',
      onClick: () => {
        if (selectedId) {
          discardCard(selectedId);
          setSelectedId(null);
        }
      },
      emphasis: 'primary',
      disabled: !selectedId,
    });
    actions.push({
      label: 'Declare',
      onClick: () => setDeclareOpen(true),
      emphasis: 'outline',
    });
  }

  const activity = useStore.getState().activity.slice(0, 8);
  const sidePane = (
    <div className="activity activity--pane">
      <div className="activity__title">Activity</div>
      {activity.map((a) => (
        <div key={a.id} className={`activity__item ${a.emphasis ? 'activity__item--emph' : ''}`}>
          {a.text}
        </div>
      ))}
    </div>
  );

  return (
    <GameFrame actions={actions} sidePane={sidePane}>
      <div className="rummy">
        <div className="rummy__turnbar">
          {myTurn ? (
            <span className="rummy__turn rummy__turn--me">
              ⏱ {secs}s · {game.hasDrawn ? 'Your move — discard or declare' : 'Your turn — draw a card'}
            </span>
          ) : (
            <span className="rummy__turn muted">
              {players.find((p) => p.id === currentId)?.name ?? 'Someone'}’s turn…
            </span>
          )}
        </div>

        <Table
          game={game}
          players={players}
          myTurn={myTurn}
          canDraw={canDraw}
          turnProgress={turnProgress}
          currentId={currentId}
          onDraw={drawFrom}
        />

        <Hand
          hand={hand}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          onSort={() => reorderHand(sortHand(hand))}
        />

        <button className="drop-link" onClick={dropHand} disabled={!myTurn}>
          Drop this hand · 20 pts
        </button>
      </div>

      <DeclareSheet
        open={declareOpen}
        hand={hand}
        onClose={() => setDeclareOpen(false)}
        onConfirm={() => {
          setDeclareOpen(false);
          declareRummy();
        }}
      />
    </GameFrame>
  );
}
