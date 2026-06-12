import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
}

/** Bottom sheet on mobile, centered modal ≥768px. Three exits: ✕, scrim, Esc. */
export function Sheet({ open, title, onClose, children, full }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose} role="presentation">
      <div
        className={`sheet ${full ? 'sheet--full' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden />
        <div className="sheet__head">
          <h3>{title}</h3>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  );
}
