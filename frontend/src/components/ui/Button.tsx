import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover shadow-card focus-visible:ring-accent',
  secondary:
    'bg-surface-elevated text-foreground hover:bg-surface-hover',
  ghost: 'bg-transparent text-muted hover:bg-surface-elevated hover:text-foreground',
  outline:
    'border border-line-strong bg-transparent text-foreground hover:bg-surface-elevated',
};

const SIZE_STYLES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 text-sm',
  lg: 'h-11 px-6 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = 'primary',
      size = 'md',
      leadingIcon,
      trailingIcon,
      children,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex select-none items-center justify-center gap-2 rounded-lg font-medium',
          'transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:opacity-50',
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          className,
        )}
        {...rest}
      >
        {leadingIcon ? <span className="-ml-0.5">{leadingIcon}</span> : null}
        {children}
        {trailingIcon ? <span className="-mr-0.5">{trailingIcon}</span> : null}
      </button>
    );
  },
);
