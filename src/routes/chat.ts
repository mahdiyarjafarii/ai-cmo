import { Router, Request, Response } from "express";
import { LLMService, LLMMessage } from "../services/llm";
import { PROMPTS } from "../prompts";
import { AnalysisResult } from "../types";
import logger from "../logger";

/**
 * Builds a chat router that uses the same in-memory results store
 * the analyze route writes to. We accept it as a parameter so it stays
 * a single source of truth.
 */
export function createChatRouter(
  analysisResults: Map<string, AnalysisResult>
): Router {
  const router = Router();
  const llm = new LLMService();

  // Per-analysis chat history (in-memory, ephemeral)
  const chatHistories = new Map<string, LLMMessage[]>();

  router.post("/chat", async (req: Request, res: Response) => {
    try {
      const { analysisId, message, history } = req.body as {
        analysisId?: string;
        message?: string;
        history?: LLMMessage[];
      };

      if (!analysisId) {
        res.status(400).json({ error: "analysisId is required" });
        return;
      }
      if (!message || typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "message is required" });
        return;
      }

      const analysis = analysisResults.get(analysisId);
      if (!analysis) {
        res.status(404).json({ error: "Analysis not found" });
        return;
      }

      // Build the grounding context — strip raw HTML/markdown to keep tokens down
      const contextPayload = {
        company: analysis.company,
        competitors: analysis.competitors.map((c) => ({
          name: c.name,
          url: c.url,
          description: c.description,
          profile: c.profile
            ? {
                description: c.profile.description,
                icp: c.profile.icp,
                features: c.profile.features,
                pricing: c.profile.pricing,
                valueProposition: c.profile.valueProposition,
                industry: c.profile.industry,
              }
            : undefined,
        })),
        analysis: analysis.analysis,
      };

      const systemPrompt = PROMPTS.chatSystem.replace(
        "{analysisContext}",
        JSON.stringify(contextPayload, null, 2)
      );

      // Use server-side history if client didn't send any
      const conversationHistory =
        history && history.length > 0
          ? history
          : chatHistories.get(analysisId) || [];

      logger.info(
        `Chat for analysis ${analysisId.slice(0, 8)}... (history: ${conversationHistory.length}, msg: "${message.slice(0, 60)}...")`
      );

      const response = await llm.chat(
        systemPrompt,
        conversationHistory,
        message
      );

      // Persist on server side too
      const updatedHistory: LLMMessage[] = [
        ...conversationHistory,
        { role: "user" as const, content: message },
        { role: "assistant" as const, content: response.content },
      ].slice(-20);
      chatHistories.set(analysisId, updatedHistory);

      res.json({
        message: response.content,
        usage: response.usage,
      });
    } catch (error) {
      logger.error(
        `Chat failed: ${error instanceof Error ? error.message : String(error)}`
      );
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Chat request failed",
      });
    }
  });

  router.get("/chat/:analysisId/history", (req: Request, res: Response) => {
    const { analysisId } = req.params;
    const history = chatHistories.get(analysisId) || [];
    res.json({ history });
  });

  router.delete("/chat/:analysisId/history", (req: Request, res: Response) => {
    const { analysisId } = req.params;
    chatHistories.delete(analysisId);
    res.json({ success: true });
  });

  return router;
}
