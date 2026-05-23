/**
 * Thin wrapper over bcrypt with sane defaults from config.
 *
 * Keeps the SALT_ROUNDS choice in one place and gives the rest of the app a
 * tiny, intention-revealing surface (`hashPassword`, `verifyPassword`).
 */
import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from '../config/constants';

/** Hash a plaintext password. Use only at registration / password change. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

/** Constant-time comparison of a plaintext candidate against a stored hash. */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
