import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { CompanyAnalysisAgent } from "../agent/analyzer.js";
import {
  streamManager,
  emitError,
  emitComplete,
  createStepEmitter,
} from "../services/streaming.js";
import { AnalysisResult } from "../types/index.js";
import logger from "../logger.js";
import db from "../lib/db.js";

export function buildAnalyzeRouter(
  analysisResults: Map<string, AnalysisResult>
): Router {
  const router = Router();

  function normalizeUrl(url: string): string {
    try {
      const u = new URL(url.startsWith("http") ? url : `https://${url}`);
      return u.origin + u.pathname.replace(/\/$/, "");
    } catch {
      return url;
    }
  }

  router.post("/analyze", async (req: Request, res: Response) => {
    try {
      const { url, projectId } = req.body as { url?: string; projectId?: string };

      if (!url) {
        res.status(400).json({ error: "URL is required" });
        return;
      }

      const analysisId = uuidv4();
      streamManager.createAnalysis(analysisId);
      const normalizedUrl = normalizeUrl(url);

      if (projectId) {
        db.prepare(
          "UPDATE projects SET status = 'crawling', analysis_id = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(analysisId, projectId);
      }

      logger.info(`Starting analysis ${analysisId} for ${url}`);

      (async () => {
        const emit = createStepEmitter(analysisId);
        try {
          emit("init", `Starting analysis for ${url}`, "running");

          const agent = new CompanyAnalysisAgent(emit);
          const result = await agent.analyze(url);

          analysisResults.set(analysisId, result);

          // Persist to global crawl cache
          const existing = db.prepare("SELECT id FROM crawl_cache WHERE url = ?").get(normalizedUrl);
          if (!existing) {
            db.prepare(
              "INSERT INTO crawl_cache (id, url, data) VALUES (?, ?, ?)"
            ).run(uuidv4(), normalizedUrl, JSON.stringify(result));
          }
          // Update any pending projects for this URL
          db.prepare(
            "UPDATE projects SET status = 'done', analysis_id = ?, updated_at = datetime('now') WHERE url = ? AND status IN ('pending', 'crawling')"
          ).run(analysisId, normalizedUrl);

          emit("init", `Analysis complete for ${url}`, "done");
          emitComplete(analysisId, { result });
          streamManager.complete(analysisId);

          logger.info(`Analysis ${analysisId} completed`);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          logger.error(`Analysis ${analysisId} failed: ${msg}`);
          emit("init", msg, "error");
          emitError(analysisId, msg);
          streamManager.complete(analysisId, msg);
        }
      })();

      res.json({ analysisId });
    } catch (error) {
      logger.error(`Failed to start analysis: ${error}`);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Failed to start analysis",
      });
    }
  });

  router.get("/events/:analysisId", (req: Request, res: Response) => {
    const { analysisId } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders?.();

    const analysis = streamManager.getAnalysis(analysisId);
    if (!analysis) {
      res.write("event: error\n");
      res.write(
        "data: " +
          JSON.stringify({ message: "Analysis not found" }) +
          "\n\n"
      );
      res.end();
      return;
    }

    const unsubscribe = streamManager.subscribe(analysisId, (message) => {
      res.write(`event: ${message.type}\n`);
      res.write("data: " + JSON.stringify(message) + "\n\n");
      if (message.type === "complete" || message.type === "error") {
        res.end();
      }
    });

    req.on("close", () => unsubscribe());
  });

  router.get("/result/:analysisId", (req: Request, res: Response) => {
    const result = analysisResults.get(req.params.analysisId);
    if (!result) {
      res.status(404).json({ error: "Analysis not found" });
      return;
    }
    res.json(result);
  });

  router.get("/history", (_req: Request, res: Response) => {
    res.json(Array.from(analysisResults.values()).slice(-10));
  });

  router.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  return router;
}

export default buildAnalyzeRouter;
