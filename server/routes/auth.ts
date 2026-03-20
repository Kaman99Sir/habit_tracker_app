import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index';
import { users, notificationSettings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateId, generateToken } from '../utils';
import { signToken, setTokenCookie, requireAuth, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const regSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

// --- Register ---
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = regSchema.parse(req.body);
    const existing = db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = generateId();

    const verToken = generateToken();

    // Insert user
    db.insert(users).values({
      id: userId, name, email, passwordHash,
      emailVerifyToken: verToken,
    }).run();

    // Init notification settings
    db.insert(notificationSettings).values({
      id: generateId(), userId,
    }).run();

    // Mock send verification email (would use email service here normally)
    console.log(`[EMAIL] Verification link: http://localhost:5173/verify-email?token=${verToken}`);

    // Log the user in
    setTokenCookie(res, signToken(userId));
    return res.status(201).json({ user: { id: userId, name, email } });
  } catch (err: any) {
    return res.status(400).json({ error: err.issues || 'Invalid request' });
  }
});

// --- Login ---
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(400).json({ error: 'Invalid email or password' });
  }

  setTokenCookie(res, signToken(user.id));
  return res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

// --- Email Verification ---
router.post('/verify-email', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const user = db.select().from(users).where(eq(users.emailVerifyToken, token)).get();
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

  db.update(users)
    .set({ emailVerifiedAt: new Date().toISOString(), emailVerifyToken: null })
    .where(eq(users.id, user.id))
    .run();

  return res.json({ ok: true });
});

// --- Forgot Password ---
router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    // Return ok anyway to prevent email enumeration
    return res.json({ ok: true });
  }

  const resetToken = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hr

  db.update(users)
    .set({ resetToken, resetTokenExpiresAt: expiresAt })
    .where(eq(users.id, user.id))
    .run();

  console.log(`[EMAIL] Password reset link: http://localhost:5173/reset-password?token=${resetToken}`);

  return res.json({ ok: true });
});

// --- Reset Password ---
router.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 6) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const user = db.select().from(users).where(eq(users.resetToken, token)).get();
  if (!user || !user.resetTokenExpiresAt || new Date(user.resetTokenExpiresAt) < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  
  db.update(users)
    .set({ passwordHash, resetToken: null, resetTokenExpiresAt: null })
    .where(eq(users.id, user.id))
    .run();

  return res.json({ ok: true });
});

// --- Current User (Me) ---
router.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.select().from(users).where(eq(users.id, req.userId!)).get();
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

// --- Logout ---
router.post('/logout', (req: Request, res: Response) => {
  res.cookie('token', '', { maxAge: 0, httpOnly: true, sameSite: 'lax' });
  return res.json({ ok: true });
});

export { router as authRouter };
