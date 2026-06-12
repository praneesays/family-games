/** Platform-rendered game action bar (blueprint §7 ③).
 *  Games DECLARE up to two actions; the platform renders them in the fixed
 *  thumb zone with system styling, guaranteeing cross-game muscle memory. */

export interface GameAction {
  label: string;
  onClick: () => void;
  emphasis?: 'primary' | 'outline';
  pulsing?: boolean;
  disabled?: boolean;
}

export function ActionBar({ actions }: { actions: GameAction[] }) {
  if (!actions.length) return null;
  return (
    <div className="action-bar">
      {actions.map((a, i) => (
        <button
          key={i}
          className={[
            'action-bar__btn',
            a.emphasis === 'outline' ? 'action-bar__btn--outline' : 'action-bar__btn--primary',
            a.pulsing && !a.disabled ? 'btn--pulse' : '',
          ].join(' ')}
          onClick={a.onClick}
          disabled={a.disabled}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
