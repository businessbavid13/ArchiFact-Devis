import crypto from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import { adminSupabase } from './credits';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimiters = new Map<string, Map<string, RateLimitEntry>>();

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const supplied = req.header('x-request-id') || '';
  const requestId = /^[A-Za-z0-9._:-]{8,120}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
  res.setHeader('x-request-id', requestId);
  (req as Request & { requestId: string }).requestId = requestId;
  next();
}

export function createRateLimiter(name: string, options: RateLimitOptions) {
  const bucket = rateLimiters.get(name) || new Map<string, RateLimitEntry>();
  rateLimiters.set(name, bucket);

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const key = options.key(req);
    const current = bucket.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 0, resetAt: now + options.windowMs }
      : current;

    entry.count += 1;
    bucket.set(key, entry);

    if (bucket.size > 10000) {
      for (const [storedKey, storedEntry] of bucket) {
        if (storedEntry.resetAt <= now) bucket.delete(storedKey);
      }
    }

    res.setHeader('X-RateLimit-Limit', options.max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      void writeSecurityAudit({
        req,
        eventType: 'security.rate_limited',
        success: false,
        metadata: { limiter: name },
      });
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
}

export function clientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function userOrClientKey(req: Request): string {
  const userId = (req as Request & { user?: { id?: string } }).user?.id;
  return userId ? `user:${userId}` : `ip:${clientKey(req)}`;
}

type AuditInput = {
  req: Request;
  eventType: string;
  success?: boolean;
  userId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export async function writeSecurityAudit({
  req,
  eventType,
  success = true,
  userId,
  metadata = {},
}: AuditInput): Promise<void> {
  if (!adminSupabase) return;
  const requestId = (req as Request & { requestId?: string }).requestId || crypto.randomUUID();
  const authenticatedUserId = (req as Request & { user?: { id?: string } }).user?.id;

  const { error } = await adminSupabase.rpc('write_security_audit_event', {
    p_user_id: userId || authenticatedUserId || null,
    p_event_type: eventType,
    p_route: req.path.slice(0, 200),
    p_method: req.method,
    p_request_id: requestId,
    p_success: success,
    p_metadata: metadata,
  });
  if (error) {
    console.error('Security audit write failed', error.message);
  }
}
