import { z } from 'zod';

/**
 * Password policy (enforced at the boundary):
 *   - 8–72 chars (72 = bcrypt's silent truncation point)
 *   - at least one uppercase, one lowercase, one digit
 *
 * Tighten to require symbols if the product calls for it.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().toLowerCase().email('Invalid email').max(191),
  password: passwordSchema,
  // NOTE: `role` is intentionally NOT accepted here — registration always
  // creates a SALES_REP. Only admins can promote (separate endpoint).
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  // Don't enforce policy on login — users may have legacy passwords.
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
