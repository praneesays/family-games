import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface TextProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextInput({ label, error, hint, id, className = '', ...rest }: TextProps) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className="field">
      {label && (
        <label className="field__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'input--error' : ''} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined}
        {...rest}
      />
      {hint && !error && (
        <span className="field__hint" id={`${inputId}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={`${inputId}-err`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

interface CodeProps {
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholder?: string;
  ariaLabel?: string;
}
/** Big, speakable room-code input: uppercases, strips spaces & ambiguous chars,
 *  and accepts a full pasted URL. */
export function CodeInput({ value, onChange, onEnter, placeholder = 'MANGO42', ariaLabel = 'Room code' }: CodeProps) {
  function clean(raw: string): string {
    let v = raw.trim();
    const m = v.match(/\/r\/([A-Za-z0-9]+)/);
    if (m) v = m[1];
    return v.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  return (
    <input
      className="input input--code"
      value={value}
      onChange={(e) => onChange(clean(e.target.value))}
      onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
      placeholder={placeholder}
      aria-label={ariaLabel}
      autoCapitalize="characters"
      autoComplete="off"
      spellCheck={false}
    />
  );
}
