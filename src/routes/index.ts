import { Router } from "express";
import { AnalysisResult } from "../types/index.js";
import { buildAnalyzeRouter } from "./analyze.js";
import { createChatRouter } from "./chat.js";
import { createPageSpeedRouter } from "./pagespeed.js";
import { createContentRouter } from "./content.js";
import authRouter from "./auth/index.js";
import projectsRouter from "./projects.js";

export const analysisResults = new Map<string, AnalysisResult>();

const router = Router();
router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use(buildAnalyzeRouter(analysisResults));
router.use(createChatRouter(analysisResults));
router.use(createPageSpeedRouter());
router.use(createContentRouter(analysisResults));

export default router;
