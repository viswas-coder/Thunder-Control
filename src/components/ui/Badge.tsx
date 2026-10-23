import type { ReactNode } from 'react';

interface BadgeProps {
  tone?: 'live' | 'sim' | 'off' | 'err';
  children: ReactNode;
}

export function Badge({ tone = 'off', children }: BadgeProps) {
  return (
    <span className="badge" data-tone={tone}>
      <span className="dot" aria-hidden="true" />
      {children}
    </span>
  );
}
