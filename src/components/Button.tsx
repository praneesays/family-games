import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'xl' | 'l' | 'm';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  pulsing?: boolean;
  loading?: boolean;
  /** Shown beneath a disabled button — never silently disable (blueprint §11.5). */
  disabledReason?: string;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'l',
  full,
  pulsing,
  loading,
  disabledReason,
  disabled,
  children,
  className = '',
  ...rest
}: Props) {
  const isDisabled = disabled || loading;
  return (
    <div className={full ? 'btn-wrap btn-wrap--full' : 'btn-wrap'}>
      <button
        className={[
          'btn',
          `btn--${variant}`,
          `btn--${size}`,
          full ? 'btn--full' : '',
          pulsing && !isDisabled ? 'btn--pulse' : '',
          className,
        ].join(' ')}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {loading && <span className="btn__spinner" aria-hidden />}
        <span>{children}</span>
      </button>
      {isDisabled && disabledReason && <span className="btn__reason">{disabledReason}</span>}
    </div>
  );
}
