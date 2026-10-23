import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'secondary', icon = false, className = '', children, type, ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : variant === 'danger' ? 'btn-danger' : '';
  return (
    <button type={type ?? 'button'} className={`btn ${icon ? 'icon-btn' : ''} ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
