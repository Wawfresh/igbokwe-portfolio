import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, logActivity } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'hon-nnanna-igbokwe-super-secure-key-2026';
const TOKEN_EXPIRY = '7d';

// Rate limiting state for login attempts: IP/username -> { count: number, lockedUntil: number }
interface RateLimitRecord {
  count: number;
  lockedUntil: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitMinutes?: number } {
  const record = loginAttempts.get(identifier);
  const now = Date.now();

  if (!record) {
    return { allowed: true };
  }

  if (record.lockedUntil > now) {
    const remaining = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, waitMinutes: remaining };
  }

  if (record.lockedUntil <= now && record.count >= MAX_ATTEMPTS) {
    // Reset after lockout expired
    loginAttempts.delete(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const record = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION;
  }
  loginAttempts.set(identifier, record);
}

export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

export interface AuthPayload {
  userId: string;
  username: string;
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Check authorization header or cookie
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    res.status(401).json({ error: 'Unauthorized. Please sign in.' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }

  req.user = payload;
  next();
}
