import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';

type RequestPart = 'body' | 'query' | 'params';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Validates one or more parts of the incoming request against Zod schemas.
 * On success, the parsed (and possibly coerced) value REPLACES the original
 * `req.body`/`req.query`/`req.params`, so downstream handlers get typed data.
 *
 * Usage:
 *   router.post('/users', validate({ body: createUserSchema }), controller);
 */
export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parts: RequestPart[] = ['body', 'query', 'params'];
    const issues: Array<{ part: RequestPart; path: string; message: string }> = [];

    for (const part of parts) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = schema.safeParse(req[part]);
      if (result.success) {
        // Reassign so downstream handlers receive parsed/coerced data.
        (req as unknown as Record<RequestPart, unknown>)[part] = result.data;
        continue;
      }

      if (result.error instanceof ZodError) {
        for (const issue of result.error.issues) {
          issues.push({
            part,
            path: issue.path.join('.'),
            message: issue.message,
          });
        }
      }
    }

    if (issues.length > 0) {
      next(ApiError.unprocessable('Validation failed', issues));
      return;
    }

    next();
  };
}
