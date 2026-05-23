import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import db from "../../lib/db.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../lib/jwt.js";
import { requireAuth, AuthRequest } from "../../middleware/auth.js";
import logger from "../../logger.js";

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, email, password } = parsed.data;

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  const id = uuidv4();
  db.prepare(
    "INSERT INTO users (id, email, password, name, plan) VALUES (?, ?, ?, ?, 'free')"
  ).run(id, email, hashed, name);

  const user = db.prepare("SELECT id, email, name, plan, created_at FROM users WHERE id = ?").get(id) as DbUser;
  const { accessToken, refreshToken } = createTokens(user.id, user.email);

  setTokenCookies(res, accessToken, refreshToken);
  logger.info(`New user registered: ${email}`);
  res.status(201).json({ user: safeUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response): Promise<void> => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid email or password" });
    return;
  }

  const { email, password } = parsed.data;

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as DbUserFull | undefined;
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const { accessToken, refreshToken } = createTokens(user.id, user.email);
  setTokenCookies(res, accessToken, refreshToken);
  logger.info(`User logged in: ${email}`);
  res.json({ user: safeUser(user) });
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const token =
    req.cookies?.access_token ||
    req.headers.authorization?.replace("Bearer ", "");

  if (token) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }

  res.clearCookie("access_token", COOKIE_OPTS);
  res.clearCookie("refresh_token", COOKIE_OPTS);
  res.json({ message: "Logged out" });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const { accessToken, refreshToken: newRefresh } = createTokens(
      payload.userId,
      payload.email
    );
    setTokenCookies(res, accessToken, newRefresh);
    res.json({ ok: true });
  } catch {
    res.clearCookie("access_token", COOKIE_OPTS);
    res.clearCookie("refresh_token", COOKIE_OPTS);
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /api/auth/login-by-token
router.post("/login-by-token", async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body as { token?: string };

  if (!token) {
    res.status(400).json({ error: "Token is required" });
    return;
  }

  const secret = process.env.NILY_JWT_SECRET;
  if (!secret) {
    logger.error("[login-by-token] NILY_JWT_SECRET is not configured");
    res.status(500).json({ error: "Server configuration error" });
    return;
  }

  let payload: { email: string; name?: string };
  try {
    payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { email: string; name?: string };
  } catch (err) {
    logger.warn(`[login-by-token] Invalid token: ${(err as Error).message}`);
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  const { email, name } = payload;
  if (!email) {
    res.status(400).json({ error: "Token must contain email" });
    return;
  }

  let user = db.prepare("SELECT id, email, name, plan, created_at FROM users WHERE email = ?").get(email) as DbUser | undefined;

  if (!user) {
    const id = uuidv4();
    db.prepare(
      "INSERT INTO users (id, email, password, name, plan) VALUES (?, ?, ?, ?, 'free')"
    ).run(id, email, "", name || email.split("@")[0]);
    user = db.prepare("SELECT id, email, name, plan, created_at FROM users WHERE id = ?").get(id) as DbUser;
    logger.info(`[login-by-token] Auto-created user: ${email}`);
  }

  const { accessToken, refreshToken } = createTokens(user.id, user.email);
  setTokenCookies(res, accessToken, refreshToken);
  logger.info(`[login-by-token] Logged in: ${email}`);
  res.json({ user: safeUser(user) });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = db.prepare("SELECT id, email, name, plan, created_at FROM users WHERE id = ?").get(req.userId) as DbUser | undefined;
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: safeUser(user) });
});

// ── helpers ──────────────────────────────────────────────────────────────────

function createTokens(userId: string, email: string) {
  const accessToken = signAccessToken({ userId, email });
  const refreshToken = signRefreshToken({ userId, email });

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  db.prepare(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)"
  ).run(uuidv4(), userId, accessToken, expiresAt);

  // Clean up expired sessions
  db.prepare(
    "DELETE FROM sessions WHERE user_id = ? AND expires_at < datetime('now')"
  ).run(userId);

  return { accessToken, refreshToken };
}

function setTokenCookies(res: Response, access: string, refresh: string) {
  res.cookie("access_token", access, {
    ...COOKIE_OPTS,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refresh_token", refresh, {
    ...COOKIE_OPTS,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

interface DbUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  created_at: string;
}

interface DbUserFull extends DbUser {
  password: string;
}

function safeUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    createdAt: user.created_at,
  };
}

export default router;
