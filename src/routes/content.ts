import { Router, Request, Response } from "express";
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
import logger from "../logger.js";

// ─── In-memory caches per-channel ────────────────────────────────────────────

const twitterCache = new Map<string, TwitterFeed>();
const linkedinCache = new Map<string, LinkedInFeed>();
const redditCache = new Map<string, RedditFeed>();
const seoCache = new Map<string, SeoReport>();

function getLatestResult(analysisResults: Map<string, AnalysisResult>): [string, AnalysisResult] | null {
  const entries = Array.from(analysisResults.entries());
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
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

  router.get("/content/twitter", (_req: Request, res: Response) => {
    const sorted = Array.from(twitterCache.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    res.json({ feed: sorted[0] ?? null });
  });

  router.post("/content/twitter/generate", async (_req: Request, res: Response) => {
    const entry = getLatestResult(analysisResults);
    if (!entry) {
      res.status(400).json({ error: "No analysis found." });
      return;
    }
    try {
      const feed = await generateTwitterFeed(entry[1]);
      twitterCache.set(feed.generatedAt, feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`Twitter generation failed: ${err}`);
      res.status(500).json({ error: "Twitter generation failed" });
    }
  });

  router.post("/content/twitter/rewrite/:postId", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const entry = getLatestResult(analysisResults);
    if (!entry) { res.status(400).json({ error: "No analysis found." }); return; }

    let found: { feedKey: string; postIndex: number } | null = null;
    for (const [key, feed] of twitterCache.entries()) {
      const idx = feed.posts.findIndex((p) => p.id === postId);
      if (idx !== -1) { found = { feedKey: key, postIndex: idx }; break; }
    }
    if (!found) { res.status(404).json({ error: "Post not found" }); return; }

    try {
      const feed = twitterCache.get(found.feedKey)!;
      const post = feed.posts[found.postIndex];
      const newPost = await rewriteTwitterPost(post, entry[1]);
      feed.posts[found.postIndex] = newPost;
      res.json({ post: newPost });
    } catch (err) {
      res.status(500).json({ error: "Rewrite failed" });
    }
  });

  // ─── LinkedIn ─────────────────────────────────────────────────────────────

  router.get("/content/linkedin", (_req: Request, res: Response) => {
    const feeds = Array.from(linkedinCache.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    res.json({ feed: feeds[0] ?? null });
  });

  router.post("/content/linkedin/generate", async (_req: Request, res: Response) => {
    const entry = getLatestResult(analysisResults);
    if (!entry) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const feed = await generateLinkedInFeed(entry[1]);
      linkedinCache.set(feed.generatedAt, feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`LinkedIn generation failed: ${err}`);
      res.status(500).json({ error: "LinkedIn generation failed" });
    }
  });

  router.post("/content/linkedin/rewrite/:postId", async (req: Request, res: Response) => {
    const { postId } = req.params;
    const entry = getLatestResult(analysisResults);
    if (!entry) { res.status(400).json({ error: "No analysis found." }); return; }

    let found: { feedKey: string; postIndex: number } | null = null;
    for (const [key, feed] of linkedinCache.entries()) {
      const idx = feed.posts.findIndex((p) => p.id === postId);
      if (idx !== -1) { found = { feedKey: key, postIndex: idx }; break; }
    }
    if (!found) { res.status(404).json({ error: "Post not found" }); return; }

    try {
      const feed = linkedinCache.get(found.feedKey)!;
      const post = feed.posts[found.postIndex];
      const newPost = await rewriteLinkedInPost(post, entry[1]);
      feed.posts[found.postIndex] = newPost;
      res.json({ post: newPost });
    } catch (err) {
      res.status(500).json({ error: "Rewrite failed" });
    }
  });

  // ─── Reddit ───────────────────────────────────────────────────────────────

  router.get("/content/reddit", (_req: Request, res: Response) => {
    const feeds = Array.from(redditCache.values()).sort(
      (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
    );
    res.json({ feed: feeds[0] ?? null });
  });

  router.post("/content/reddit/find", async (_req: Request, res: Response) => {
    const entry = getLatestResult(analysisResults);
    if (!entry) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const feed = await findRedditOpportunities(entry[1]);
      redditCache.set(feed.fetchedAt, feed);
      res.json({ feed });
    } catch (err) {
      logger.error(`Reddit search failed: ${err}`);
      res.status(500).json({ error: "Reddit search failed" });
    }
  });

  // ─── SEO ──────────────────────────────────────────────────────────────────

  router.get("/content/seo", (_req: Request, res: Response) => {
    const reports = Array.from(seoCache.values()).sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
    res.json({ report: reports[0] ?? null });
  });

  router.post("/content/seo/generate", async (_req: Request, res: Response) => {
    const entry = getLatestResult(analysisResults);
    if (!entry) { res.status(400).json({ error: "No analysis found." }); return; }
    try {
      const report = await generateSeoReport(entry[1]);
      seoCache.set(report.generatedAt, report);
      res.json({ report });
    } catch (err) {
      logger.error(`SEO analysis failed: ${err}`);
      res.status(500).json({ error: "SEO analysis failed" });
    }
  });

  return router;
}
