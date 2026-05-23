import { z } from 'zod';
import { Role } from '@prisma/client';

/**
 * Reused password policy (kept in sync with auth.validator).
 *   - 8–72 chars (72 = bcrypt's silent truncation point)
 *   - upper + lower + digit
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ── Self-service (any authenticated user) ───────────────────────────────────

/** PATCH /users/me — name and/or email. At least one field is required. */
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is too short').max(120).optional(),
    email: z.string().trim().toLowerCase().email('Invalid email').max(191).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** PATCH /users/me/password — must know current to set a new one. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentPassword is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

// ── Admin endpoints ─────────────────────────────────────────────────────────

/** POST /users — admin creates user with explicit role. */
export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(191),
  password: passwordSchema,
  role: z.nativeEnum(Role).default('SALES_REP'),
});

/** PATCH /users/:id — admin updates any field on any user. */
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().toLowerCase().email().max(191).optional(),
    role: z.nativeEnum(Role).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/** GET /users — pagination, role filter, free-text search. */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().max(120).optional(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
