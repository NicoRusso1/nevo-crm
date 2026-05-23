import { useMemo, useState, type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string | null;
  size?: Size;
}

const SIZE_STYLES: Record<Size, string> = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
};

/**
 * Derives a deterministic accent tint from the name so two avatars in a list
 * are visually distinct without hand-picking colors.
 */
function tintFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 22%)`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('').toUpperCase();
}

export function Avatar({ name, src, size = 'md', className, ...rest }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;
  const tint = useMemo(() => tintFromName(name), [name]);

  return (
    <div
      {...rest}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        'font-semibold text-foreground ring-1 ring-line',
        SIZE_STYLES[size],
        className,
      )}
      style={!showImage ? { backgroundColor: tint } : undefined}
      aria-label={name}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
