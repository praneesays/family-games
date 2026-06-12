import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

/** 6-cell OTP input — auto-advance, backspace to previous, paste-tolerant. */
export function OtpInput({ value, onChange, length = 6 }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(i: number, raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    // paste of full code into any cell
    if (digits.length > 1) {
      onChange(digits.slice(0, length));
      refs.current[Math.min(digits.length, length) - 1]?.focus();
      return;
    }
    const next = (value.slice(0, i) + digits + value.slice(i + 1)).slice(0, length);
    onChange(next);
    if (i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) {
        onChange(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        onChange(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    }
  }

  return (
    <div className="otp" role="group" aria-label="One-time password">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className="otp__cell"
          inputMode="numeric"
          maxLength={length} /* allow paste */
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          aria-label={`Digit ${i + 1}`}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
        />
      ))}
    </div>
  );
}
