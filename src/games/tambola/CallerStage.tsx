import { phraseFor } from '../../lib/mockData';

export function CallerStage({ current, recent }: { current: number | null; recent: number[] }) {
  return (
    <div className="caller">
      <div className="caller__stage">
        <div className="caller__label muted">called so far</div>
        <div key={current ?? 'none'} className="caller__number">
          {current ?? '—'}
        </div>
        {current !== null && <div className="caller__phrase">{phraseFor(current)}</div>}
      </div>
      <div className="caller__recent" aria-label="Recent numbers">
        {recent.length === 0 && <span className="muted">Waiting for the first call…</span>}
        {recent.map((n) => (
          <span key={n} className="caller__chip">
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
