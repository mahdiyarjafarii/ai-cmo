import { Router, Response } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import db from "../lib/db.js";
import logger from "../logger.js";

const router = Router();

const FREE_PROJECT_LIMIT = 1;

const createProjectSchema = z.object({
  url: z.string().url("Invalid URL"),
  name: z.string().min(1).max(100).optional(),
});

// GET /api/projects
router.get("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const projects = db.prepare(
    `SELECT p.*, c.crawled_at
     FROM projects p
     LEFT JOIN crawl_cache c ON c.url = p.url
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`
  ).all(req.userId);

  res.json({ projects });
});

// POST /api/projects
router.post("/", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { url, name } = parsed.data;
  const userId = req.userId!;

  // Enforce free plan limit
  const user = db.prepare("SELECT plan FROM users WHERE id = ?").get(userId) as { plan: string } | undefined;
  if (user?.plan === "free") {
    const count = (db.prepare("SELECT COUNT(*) as cnt FROM projects WHERE user_id = ?").get(userId) as { cnt: number }).cnt;
    if (count >= FREE_PROJECT_LIMIT) {
      res.status(403).json({
        error: "Free plan limit reached",
        code: "UPGRADE_REQUIRED",
        message: `Your free plan allows ${FREE_PROJECT_LIMIT} project. Upgrade to Pro for unlimited projects.`,
      });
      return;
    }
  }

  const normalizedUrl = normalizeUrl(url);

  const existing = db.prepare("SELECT id FROM projects WHERE user_id = ? AND url = ?").get(userId, normalizedUrl);
  if (existing) {
    res.status(409).json({
      error: "You already have a project for this URL",
      projectId: (existing as { id: string }).id,
    });
    return;
  }

  const cached = db.prepare("SELECT url FROM crawl_cache WHERE url = ?").get(normalizedUrl);

  const id = uuidv4();
  db.prepare(
    "INSERT INTO projects (id, user_id, name, url, status) VALUES (?, ?, ?, ?, ?)"
  ).run(id, userId, name ?? extractDomainName(normalizedUrl), normalizedUrl, cached ? "done" : "pending");

  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);

  logger.info(`Project created: ${id} url=${normalizedUrl} cached=${!!cached}`);

  res.status(201).json({
    project,
    cached: !!cached,
    message: cached ? "Data loaded from cache" : "Crawl will start shortly",
  });
});

// GET /api/projects/:id
router.get("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = db.prepare(
    "SELECT * FROM projects WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.userId) as Record<string, unknown> | undefined;

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const cache = db.prepare("SELECT data FROM crawl_cache WHERE url = ?").get(project.url as string) as { data: string } | undefined;

  const contentRows = db.prepare(
    "SELECT type, data FROM project_content WHERE project_id = ?"
  ).all(req.params.id) as { type: string; data: string }[];

  const content = Object.fromEntries(
    contentRows.map((r) => [r.type, JSON.parse(r.data)])
  );

  res.json({
    project,
    analysisResult: cache ? JSON.parse(cache.data) : null,
    content,
  });
});

// DELETE /api/projects/:id
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const project = db.prepare(
    "SELECT id FROM projects WHERE id = ? AND user_id = ?"
  ).get(req.params.id, req.userId);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  res.json({ message: "Project deleted" });
});

// ── helpers ────────────────────────────────────────────────────────────────

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.origin + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function extractDomainName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default router;
