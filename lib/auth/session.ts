import crypto from 'crypto';
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  CLEAR_SESSION_COOKIE_OPTIONS,
  UserRole,
  UserStatus,
  ImpersonationInfo,
  UserSessionPayload,
  normalizeRole,
  normalizeStatus,
} from './session-constants';

export {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  CLEAR_SESSION_COOKIE_OPTIONS,
  normalizeRole,
  normalizeStatus,
};
export type { UserRole, UserStatus, ImpersonationInfo, UserSessionPayload };

/**
 * Applies expiration headers to remove session cookie across all environments
 */
export function applyClearSessionCookie(response: { cookies: { set: (name: string, val: string, options: any) => void; delete: (name: string) => void } }) {
  response.cookies.set(SESSION_COOKIE_NAME, '', CLEAR_SESSION_COOKIE_OPTIONS);
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.delete(SESSION_COOKIE_NAME);
}

const SECRET_KEY =
  process.env.SESSION_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  '5w2h_local_postgres_session_secret_key_2026_secure';

/**
 * Creates a signed JWT-like session token
 */
export function createSessionToken(
  payload: Omit<UserSessionPayload, 'exp'>,
  expiresInSeconds: number = 60 * 60 * 24 * 7
): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload: UserSessionPayload = {
    ...payload,
    role: normalizeRole(payload.role),
    status: normalizeStatus(payload.status),
    exp,
  };
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies and decodes a signed session token
 */
export function verifySessionToken(token: string): UserSessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${header}.${body}`)
      .digest('base64url');
      
    if (signature !== expectedSignature) {
      return null;
    }
    
    const payload: UserSessionPayload = JSON.parse(
      Buffer.from(body, 'base64url').toString('utf8')
    );
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    // Normalize role & status on read
    payload.role = normalizeRole(payload.role);
    payload.status = normalizeStatus(payload.status);
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Hashes a plaintext password with a random salt using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  try {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  } catch {
    return false;
  }
}
