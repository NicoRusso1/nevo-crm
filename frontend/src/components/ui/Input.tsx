import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, leadingIcon, trailingIcon, ...rest },
  ref,
) {
  return (
    <div
      className={cn(
        'group relative flex items-center',
        'rounded-lg bg-surface-elevated',
        'ring-1 ring-line transition-colors',
        'focus-within:ring-1 focus-within:ring-accent',
      )}
    >
      {leadingIcon ? (
        <span className="pointer-events-none pl-3 text-muted-foreground">
          {leadingIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        className={cn(
          'h-9 w-full bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground',
          'focus:outline-none',
          leadingIcon && 'pl-2',
          trailingIcon && 'pr-2',
          className,
        )}
        {...rest}
      />
      {trailingIcon ? (
        <span className="pr-3 text-muted-foreground">{trailingIcon}</span>
      ) : null}
    </div>
  );
});
