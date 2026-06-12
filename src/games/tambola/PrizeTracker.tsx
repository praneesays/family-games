import type { TambolaPrize } from '../../lib/types';

export function PrizeTracker({ prizes }: { prizes: TambolaPrize[] }) {
  const remaining = prizes.filter((p) => !p.wonBy);
  const onlyFullHouseLeft = remaining.length === 1 && remaining[0].id === 'fullHouse';
  return (
    <div className="prize-tracker">
      <div className="prize-tracker__title">Prizes</div>
      <ul>
        {prizes.map((p) => (
          <li key={p.id} className={p.wonBy ? 'won' : ''}>
            <span className="prize-tracker__icon">{p.wonBy ? '🏆' : '⭕'}</span>
            <span className="prize-tracker__label">{p.label}</span>
            <span className="prize-tracker__winner">{p.wonBy ?? ''}</span>
          </li>
        ))}
      </ul>
      {onlyFullHouseLeft && <div className="prize-tracker__spotlight">All eyes on FULL HOUSE 👀</div>}
    </div>
  );
}
