import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose Tailwind classes safely.
 *
 *   cn('p-2', condition && 'bg-red-500', 'p-4')
 *   → 'bg-red-500 p-4'   (later padding wins; tailwind-merge dedupes)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
