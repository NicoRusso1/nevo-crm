/**
 * File-upload middleware.
 *
 * Dev-friendly defaults: local disk storage, 2MB per file, only common image
 * MIME types. For production, swap `diskStorage` for `memoryStorage` and push
 * the buffer to S3 / Cloudinary / Cloudflare R2 — the call site (controller)
 * just needs `req.file.path` (or `req.file.buffer`) and stays the same.
 */
import multer, { type FileFilterCallback } from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import type { Request, RequestHandler } from 'express';

import { ApiError } from '../utils/ApiError';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');

// Ensure the destination exists at boot. `recursive: true` is idempotent.
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    // `req.user` is guaranteed because `authenticate` runs before this MW.
    const userId = req.user?.id ?? 'anon';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

function avatarFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Only JPEG, PNG or WebP images are allowed'));
    return;
  }
  cb(null, true);
}

const avatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_SIZE },
  fileFilter: avatarFileFilter,
}).single('avatar');

/**
 * Wraps multer so file-size errors and other MulterErrors come out of the
 * pipeline as ApiError instances — keeps the global error handler clean.
 */
export const uploadAvatar: RequestHandler = (req, res, next): void => {
  avatarMulter(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(ApiError.badRequest('Avatar must be 2MB or smaller'));
        return;
      }
      next(ApiError.badRequest(err.message));
      return;
    }
    if (err) {
      next(err);
      return;
    }
    if (!req.file) {
      next(ApiError.badRequest('No file uploaded (expected field: "avatar")'));
      return;
    }
    next();
  });
};

/** Convert an on-disk path produced by multer to a public URL. */
export function publicAvatarUrl(filename: string): string {
  return `/uploads/avatars/${path.basename(filename)}`;
}
