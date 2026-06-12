import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'neutral' | 'host' | 'success' | 'warning' | 'info';
  children: ReactNode;
}
export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}
export function Chip({ active, onClick, children }: ChipProps) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`chip ${active ? 'chip--active' : ''}`} onClick={onClick}>
      {children}
    </Tag>
  );
}
