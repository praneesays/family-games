import { useStore, selfPlayerId } from '../../lib/store';
import { GameFrame } from '../../components/GameFrame';
import type { GameAction } from '../../components/ActionBar';
import type { TambolaOptions, TambolaState } from '../../lib/types';
import { CallerStage } from './CallerStage';
import { Ticket } from './Ticket';
import { PrizeTracker } from './PrizeTracker';
import { prizeSatisfied } from './tambolaLogic';
import { PRIZE_LABELS } from '../../lib/mockData';

export function TambolaGame() {
  const game = useStore((s) => s.game) as TambolaState;
  const room = useStore((s) => s.room)!;
  const markNumber = useStore((s) => s.markNumber);
  const claimPrize = useStore((s) => s.claimPrize);
  const toggleAutoMark = useStore((s) => s.toggleAutoMark);

  if (!game || game.kind !== 'tambola') return null;
  const pid = selfPlayerId();
  const ticket = game.tickets[pid];
  const marked = game.marked[pid] ?? new Set<number>();
  const called = new Set(game.called);
  const opts = room.options as TambolaOptions;

  // Claim bar appears only when a claim is plausible (server would verify).
  const claimable = game.prizes.filter((p) => !p.wonBy && ticket && prizeSatisfied(p.id, ticket, called));
  const actions: GameAction[] = claimable.slice(0, 2).map((p) => ({
    label: `🙋 Claim ${PRIZE_LABELS[p.id]}!`,
    onClick: () => claimPrize(p.id),
    emphasis: 'primary',
    pulsing: true,
  }));

  const recent = game.called.slice(-6).reverse();

  const board = (
    <div className="called-board">
      <div className="called-board__title">Called so far</div>
      <div className="called-board__grid">
        {Array.from({ length: 90 }, (_, i) => i + 1).map((n) => (
          <span key={n} className={`called-board__n ${called.has(n) ? 'on' : ''} ${game.current === n ? 'now' : ''}`}>
            {n}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <GameFrame actions={actions} sidePane={board}>
      <div className="tambola">
        <CallerStage current={game.current} recent={recent} />
        <button className="automark-toggle" onClick={toggleAutoMark} aria-pressed={opts.autoMark}>
          Auto-mark {opts.autoMark ? 'ON ●' : 'OFF ○'} · tap to change
        </button>
        {ticket && (
          <Ticket ticket={ticket} marked={marked} called={called} autoMark={opts.autoMark} onMark={markNumber} />
        )}
        <PrizeTracker prizes={game.prizes} />
        <div className="tambola__board-mobile">{board}</div>
      </div>
    </GameFrame>
  );
}
