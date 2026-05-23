import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Card — the base surface used for almost every content block.
 *
 * Borrows from Stripe: very subtle border (an inset highlight rather than a
 * solid stroke) with a flat dark surface. Padding and divider behavior is
 * handled by `<Card.Header>` / `<Card.Body>` / `<Card.Footer>` subcomponents.
 */
const Root = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardRoot({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-surface shadow-card',
          'ring-1 ring-line',
          className,
        )}
        {...rest}
      />
    );
  },
);

const Header = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardHeader({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between gap-4 px-6 pt-6', className)}
        {...rest}
      />
    );
  },
);

const Title = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...rest }, ref) {
    return (
      <h3
        ref={ref}
        className={cn('text-base font-semibold text-foreground', className)}
        {...rest}
      />
    );
  },
);

const Description = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  function CardDescription({ className, ...rest }, ref) {
    return (
      <p ref={ref} className={cn('mt-1 text-sm text-muted', className)} {...rest} />
    );
  },
);

const Body = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardBody({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('px-6 py-6', className)} {...rest} />;
  },
);

const Footer = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardFooter({ className, ...rest }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3 border-t border-line px-6 py-4',
          className,
        )}
        {...rest}
      />
    );
  },
);

export const Card = Object.assign(Root, {
  Header,
  Title,
  Description,
  Body,
  Footer,
});
