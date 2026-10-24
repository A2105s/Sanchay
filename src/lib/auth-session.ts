import { createHmac, timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

import type { DemoRole } from '@/types/operations';

export const AUTH_COOKIE_NAME = 'nt_demo_session';

const roleSchema = z.enum(['ADMIN', 'MINISTRY', 'FIELD_OFFICER']);

const sessionCookieSchema = z.object({
  id: z.string().min(1),
  role: roleSchema,
  uid: z.string().min(1).optional(),
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  openSpaceId: z.string().min(1).optional(),
  openSpaceName: z.string().min(1).optional(),
});

export type SessionCookiePayload = z.infer<typeof sessionCookieSchema>;

// Sessions are signed so the cookie cannot be forged into a higher role.
// Production must set AUTH_SESSION_SECRET (>=32 random bytes); without it no
// session is accepted, which fails closed instead of trusting a default key.
const sessionSecret =
  process.env.AUTH_SESSION_SECRET ??
  (process.env.NODE_ENV === 'production' ? '' : 'dev-only-insecure-session-secret');

const sign = (payload: string) =>
  createHmac('sha256', sessionSecret).update(payload).digest('base64url');

export const createSessionCookieValue = (payload: SessionCookiePayload): string => {
  if (!sessionSecret) throw new Error('AUTH_SESSION_SECRET is not configured.');
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
};

const readSignedPayload = (cookieValue: string): unknown => {
  if (!sessionSecret) return null;

  const separator = cookieValue.lastIndexOf('.');
  if (separator <= 0) return null;

  const body = cookieValue.slice(0, separator);
  const provided = Buffer.from(cookieValue.slice(separator + 1), 'utf8');
  const expected = Buffer.from(sign(body), 'utf8');

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown;
  } catch {
    return null;
  }
};

export const parseSessionCookieValue = (cookieValue: string): SessionCookiePayload | null => {
  const result = sessionCookieSchema.safeParse(readSignedPayload(cookieValue));
  return result.success ? result.data : null;
};

export const roleLabel = (role: DemoRole) => {
  if (role === 'ADMIN') return 'Admin';
  if (role === 'MINISTRY') return 'Ministry';
  return 'Field Officer';
};
