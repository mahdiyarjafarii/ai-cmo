import { Router, Request, Response } from "express";
import { fetchPageSpeedData } from "../services/pagespeed.js";
import { config } from "../config.js";
import logger from "../logger.js";

export function createPageSpeedRouter(): Router {
  const router = Router();

  /**
   * GET /api/pagespeed?url=https://example.com
   *
   * Proxies to Google PageSpeed Insights API so the key stays server-side.
   * Returns both mobile and desktop scores in a single response.
   */
  router.get("/pagespeed", async (req: Request, res: Response) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "url query parameter is required" });
      return;
    }

    if (!config.google.pagespeedKey) {
      res.status(503).json({
        error: "GOOGLE_PAGESPEED_KEY is not configured on this server",
        code: "NO_API_KEY",
      });
      return;
    }

    try {
      const data = await fetchPageSpeedData(url);
      // Cache-hint: PageSpeed data is relatively stable; 10 min is fine
      res.setHeader("Cache-Control", "public, max-age=600");
      res.json(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error(`PageSpeed fetch failed for ${url}: ${message}`);

      const axiosErr = err as {
        response?: {
          status?: number;
          data?: unknown;
        };
      };

      // Surface Google's error message if available (quota exceeded, invalid key, blocked by restrictions, etc.)
      const googleErrorMessage =
        (axiosErr.response?.data as { error?: { message?: string } } | undefined)
          ?.error?.message;

      const status = axiosErr.response?.status;

      res.status(typeof status === "number" ? status : 500).json({
        error: googleErrorMessage || message,
        code: "PAGESPEED_ERROR",
        status: typeof status === "number" ? status : undefined,
      });
    }
  });

  return router;
}
