import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { AnalysisResult, TwitterFeed, LinkedInFeed, RedditFeed, SeoReport } from "../types/index.js";
import {
  generateDailyContent,
  regeneratePost,
  getLatestFeed,
  getAllFeeds,
} from "../services/content-generator.js";
import { generateTwitterFeed, rewriteTwitterPost } from "../services/content/twitter-generator.js";
import { generateLinkedInFeed, rewriteLinkedInPost } from "../services/content/linkedin-generator.js";
import { findRedditOpportunities } from "../services/content/reddit-service.js";
import { generateSeoReport } from "../services/content/seo-analyzer.js";
import db from "../lib/db.js";
import logger from "../logger.js";

function getLatestResult(analysisResults: Map<string, AnalysisResult>): [string, AnalysisResult] | null {
  const entries = Array.from(analysisResults.entries());
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
}

function getResultForProject(
  projectId: string | undefined,
  analysisResults: Map<string, AnalysisResult>
): AnalysisResult | null {
  if (projectId) {
    const project = db.prepare("SELECT url FROM projects WHERE id = ?").get(projectId) as { url: string } | undefined;
    if (project) {
      const cache = db.prepare("SELECT data FROM crawl_cache WHERE url = ?").get(project.url) as { data: string } | undefined;
      if (cache) return JSON.parse(cache.data) as AnalysisResult;
    }
  }
  return getLatestResult(analysisResults)?.[1] ?? null;
}

function saveProjectContent(projectId: string, type: string, data: unknown): void {
  db.prepare(`
    INSERT INTO project_content (id, project_id, type, data)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(project_id, type) DO UPDATE SET data = excluded.data, updated_at = datetime('now')
  `).run(uuidv4(), projectId, type, JSON.stringify(data));
}

function loadProjectContent<T>(projectId: string, type: string): T | null {
  const row = db.prepare("SELECT data FROM project_content WHERE project_id = ? AND type = ?").get(projectId, type) as { data: string } | undefined;
  return row ? JSON.parse(row.data) as T : null;
}

export function createContentRouter(analysisResults: Map<string, AnalysisResult>) {
  const router = Router();

  // ─── Legacy feed endpoints (backward compat) ─────────────────────────────

  router.get("/content", (_req: Request, res: Response) => {
    const feed = getLatestFeed();
    res.json({ feed: feed ?? null, history: getAllFeeds().slice(0, 7) });
  });

  router.post("/content/generate", async (req: Request, res: Response) => {
    const { analysisId } = req.body as { analysisId?: string };
    let result: AnalysisResult | undefined = analysisId
      ? analysisResults.get(analysisId)
      : getLatestResult(analysisResults)?.[1];

    if (!result) {
      res.status(400).json({ error: "No analysis found. Run an analysis first." });
      return;
    }

    try {
      const feed = await generateDailyContent(result, analysisId);
      res.json({ feed });
    } catch (err) {
      logger.error(`Legacy content generation failed: ${err}`);
      res.status(500).json({ error: "Content generation failed" });
    }
  });

  router.post("/content/regenerate/:postId", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const result = getLatestResult(analysisResults)?.[1];
    if (!result) {
      res.status(400).json({ error: "No analysis found." });
      return;
    }
    try {
      const post = await regeneratePost(postId, result);
      if (!post) { res.status(404).json({ error: "Post not found" }); return; }
      res.json({ post });
    } catch (err) {
      res.status(500).json({ error: "Regeneration failed" });
    }
  });

  // ─── Twitter ──────────────────────────────────────────────────────────────

  router.get("/content/twitter", (req: Request, res: Response) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) {
      const feed = loadProjectContent<TwitterFeed>(projectId, "twitter");
      res.json({ feed });
      return;
    }
    res.json({ feed: null });
  });

  router.post("/content/twitter/generate", async (req: Request, res: Response) => {
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) {
      res.status(400).json({ error: "No analysis found." });
      return;
    }
    try {
      const feed = await generateTwitterFeed(result);
      if (projectId) saveProjectContent(projectId, "twitter", feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`Twitter generation failed: ${err}`);
      res.status(500).json({ error: "Twitter generation failed" });
    }
  });

  router.post("/content/twitter/rewrite/:postId", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) { res.status(400).json({ error: "No analysis found." }); return; }

    let currentFeed: TwitterFeed | null = null;
    if (projectId) {
      currentFeed = loadProjectContent<TwitterFeed>(projectId, "twitter");
    }
    if (!currentFeed) {
      res.status(404).json({ error: "Feed not found. Generate first." });
      return;
    }

    const postIndex = currentFeed.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) { res.status(404).json({ error: "Post not found" }); return; }

    try {
      const newPost = await rewriteTwitterPost(currentFeed.posts[postIndex], result);
      currentFeed.posts[postIndex] = newPost;
      if (projectId) saveProjectContent(projectId, "twitter", currentFeed);
      res.json({ post: newPost });
    } catch (err) {
      res.status(500).json({ error: "Rewrite failed" });
    }
  });

  // ─── LinkedIn ─────────────────────────────────────────────────────────────

  router.get("/content/linkedin", (req: Request, res: Response) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) {
      const feed = loadProjectContent<LinkedInFeed>(projectId, "linkedin");
      res.json({ feed });
      return;
    }
    res.json({ feed: null });
  });

  router.post("/content/linkedin/generate", async (req: Request, res: Response) => {
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const feed = await generateLinkedInFeed(result);
      if (projectId) saveProjectContent(projectId, "linkedin", feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`LinkedIn generation failed: ${err}`);
      res.status(500).json({ error: "LinkedIn generation failed" });
    }
  });

  router.post("/content/linkedin/rewrite/:postId", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) { res.status(400).json({ error: "No analysis found." }); return; }

    let currentFeed: LinkedInFeed | null = null;
    if (projectId) {
      currentFeed = loadProjectContent<LinkedInFeed>(projectId, "linkedin");
    }
    if (!currentFeed) {
      res.status(404).json({ error: "Feed not found. Generate first." });
      return;
    }

    const postIndex = currentFeed.posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) { res.status(404).json({ error: "Post not found" }); return; }

    try {
      const newPost = await rewriteLinkedInPost(currentFeed.posts[postIndex], result);
      currentFeed.posts[postIndex] = newPost;
      if (projectId) saveProjectContent(projectId, "linkedin", currentFeed);
      res.json({ post: newPost });
    } catch (err) {
      res.status(500).json({ error: "Rewrite failed" });
    }
  });

  // ─── Reddit ───────────────────────────────────────────────────────────────

  router.get("/content/reddit", (req: Request, res: Response) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) {
      const feed = loadProjectContent<RedditFeed>(projectId, "reddit");
      res.json({ feed });
      return;
    }
    res.json({ feed: null });
  });

  router.post("/content/reddit/find", async (req: Request, res: Response) => {
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const feed = await findRedditOpportunities(result);
      if (projectId) saveProjectContent(projectId, "reddit", feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`Reddit search failed: ${err}`);
      res.status(500).json({ error: "Reddit search failed" });
    }
  });

  // ─── SEO ──────────────────────────────────────────────────────────────────

  router.get("/content/seo", (req: Request, res: Response) => {
    const { projectId } = req.query as { projectId?: string };
    if (projectId) {
      const report = loadProjectContent<SeoReport>(projectId, "seo");
      res.json({ report });
      return;
    }
    res.json({ report: null });
  });

  router.post("/content/seo/generate", async (req: Request, res: Response) => {
    const { projectId } = req.body as { projectId?: string };
    const result = getResultForProject(projectId, analysisResults);
    if (!result) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const report = await generateSeoReport(result);
      if (projectId) saveProjectContent(projectId, "seo", report);
      res.json({ report });
    } catch (err) {
      logger.error(`SEO analysis failed: ${err}`);
      res.status(500).json({ error: "SEO analysis failed" });
    }
  });

  return router;
}
