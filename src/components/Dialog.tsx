import type { ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  open: boolean;
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function Dialog({ open, title, body, confirmLabel, cancelLabel = 'Cancel', danger, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="scrim scrim--center" onClick={onCancel} role="presentation">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {body && <div className="dialog__body muted">{body}</div>}
        <div className="dialog__actions">
          <Button variant="ghost" size="m" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} size="m" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
