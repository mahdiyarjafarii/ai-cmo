import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import cron from "node-cron";
import { validateConfig } from "./config.js";
import logger from "./logger.js";
import apiRouter, { analysisResults } from "./routes/index.js";
import { generateDailyContent } from "./services/content-generator.js";

const app = express();
const PORT = process.env.PORT || 3000;

try {
  validateConfig();
} catch {
  logger.error("Configuration validation failed");
  process.exit(1);
}

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

app.use("/api", apiRouter);

app.use(express.static("frontend/dist"));

app.get("*", (_req, res) => {
  res.sendFile(process.cwd() + "/frontend/dist/index.html", (err) => {
    if (err) res.status(404).json({ error: "Not found" });
  });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
    });
  }
);

app.listen(PORT, () => {
  logger.info(`🚀  http://localhost:${PORT}`);
  logger.info(`💬  Chat: POST /api/chat`);
  logger.info(`📡  SSE:  GET  /api/events/:id`);
  logger.info(`📣  Content: GET /api/content`);
});

// Daily content generation — runs every morning at 7:00 AM
cron.schedule("0 7 * * *", async () => {
  logger.info("Cron: running daily content generation...");
  const entries = Array.from(analysisResults.entries());
  if (entries.length === 0) {
    logger.info("Cron: no analysis available, skipping content generation");
    return;
  }
  const [analysisId, result] = entries[entries.length - 1];
  try {
    await generateDailyContent(result, analysisId);
    logger.info("Cron: daily content generation complete");
  } catch (err) {
    logger.error(`Cron: content generation failed — ${err instanceof Error ? err.message : String(err)}`);
  }
});
