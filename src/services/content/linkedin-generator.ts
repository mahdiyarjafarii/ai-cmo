import { v4 as uuidv4 } from "uuid";
import { LLMService } from "../llm.js";
import { AnalysisResult, LinkedInPost, LinkedInFeed, LinkedInFormat } from "../../types/index.js";
import logger from "../../logger.js";

const llm = new LLMService();

const usedHooks: string[] = [];
const MAX_MEMORY = 30;

function buildCompanyContext(result: AnalysisResult): string {
  const { company, competitors, analysis } = result;
  return `
COMPANY: ${company.name}
DESCRIPTION: ${company.description}
VALUE PROP: ${company.valueProposition}
ICP: ${company.icp}
FEATURES: ${company.features.slice(0, 5).join(", ")}
INDUSTRY: ${company.industry ?? "SaaS"}
TARGET MARKET: ${company.targetMarket ?? ""}
TOP COMPETITOR: ${competitors[0]?.name ?? ""}
KEY STRENGTH: ${analysis.strengths.targetCompany[0] ?? ""}
KEY WEAKNESS: ${analysis.weaknesses.targetCompany[0] ?? ""}
TOP REC: ${analysis.recommendations[0] ?? ""}
POSITIONING: ${analysis.positioningComparison}
`.trim();
}

function buildFormatPrompt(format: LinkedInFormat, ctx: string, avoidHooks: string[]): string {
  const avoidSection =
    avoidHooks.length > 0
      ? `\nAVOID THESE HOOK LINES (already used):\n${avoidHooks.slice(-10).join("\n")}\n`
      : "";

  const formatGuides: Record<LinkedInFormat, string> = {
    story: `Write a founder narrative — a moment of realization or turning point.
      Must feel personal, specific, and real. Not a press release.
      Structure: vivid scene-setter → conflict → insight/turn → lesson → wider implication
      First line must be a single punchy sentence that makes people stop scrolling.
      Use white space generously — 1-2 sentences per paragraph max.`,

    list: `Write a "here are N things nobody tells you about X" style post.
      Use numbered list format with line breaks between each point.
      Each point: bold claim (1 line) → brief explanation (1-2 lines).
      Open with a hook that promises a specific, valuable list.
      End with a reflective insight, not just "what do you think?"`,

    insight: `Share a non-obvious market or product insight.
      Must feel like proprietary knowledge from someone deeply embedded in the space.
      Structure: counterintuitive opener → supporting evidence → reframe → actionable conclusion
      Tone: calm authority. Not preachy. Let the insight do the heavy lifting.`,

    "case-study": `Write about a customer transformation or product outcome (anonymized if needed).
      Make it concrete — before state, intervention, after state.
      Structure: context (who/what) → problem → solution → outcome → lesson
      Avoid making it sound like an ad. The story should be the star.`,

    "founder-update": `Write a genuine founder update — progress, learnings, honest reflection.
      Balance vulnerability with competence. Readers should root for you.
      Structure: where we are → what we learned → what's next → invitation to connect
      Tone: transparent, direct, human. Not a fundraising pitch.`,
  };

  return `You are an elite LinkedIn ghostwriter for B2B startup founders.
You write posts that generate thousands of engagements — not generic corporate content.

PLATFORM RULES (non-negotiable):
- LinkedIn "see more" kicks in after ~210 characters — the first 1-2 lines MUST be magnetic
- Use generous line breaks — single sentences per line where possible
- Max 2 emojis in the entire post (preferably just 1, or none)
- No hashtag spam — max 2, placed at the end if used
- No buzzwords: "excited to share", "thrilled to announce", "synergy", "leverage"
- Write like a thoughtful human, not a content marketing tool
- Professional but warm — expertise + genuine humanity

FORMAT: ${format.toUpperCase()}
${formatGuides[format]}

COMPANY CONTEXT:
${ctx}
${avoidSection}

Generate exactly 1 LinkedIn post as a JSON object with these fields:
- hook: (the first 1-2 lines — must work as a standalone teaser before "see more")
- body: (the main post content — properly formatted with line breaks)
- cta: (closing engagement prompt — must be a genuine question, not "what do you think?")
- fullText: (hook + "\\n\\n" + body + "\\n\\n" + cta — fully assembled post)
- whyThisWorks: (2-3 sentences on why this will perform on LinkedIn — psychological/algorithmic angle)
- estimatedReach: (realistic range string like "4K–15K" based on format quality)
- readTime: (e.g. "45 sec read")

Return ONLY valid JSON. No markdown fences.`;
}

export async function generateLinkedInFeed(result: AnalysisResult): Promise<LinkedInFeed> {
  logger.info("Generating LinkedIn feed...");
  const ctx = buildCompanyContext(result);

  const formats: LinkedInFormat[] = ["story", "insight", "list", "founder-update", "case-study"];
  const selectedFormats = formats.sort(() => Math.random() - 0.5).slice(0, 4);

  const posts = await Promise.all(
    selectedFormats.map(async (format): Promise<LinkedInPost | null> => {
      try {
        const prompt = buildFormatPrompt(format, ctx, usedHooks);
        const response = await llm.analyzeText(prompt);
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const raw = JSON.parse(jsonMatch[0]);
        const post: LinkedInPost = {
          id: uuidv4(),
          hook: raw.hook ?? "",
          body: raw.body ?? "",
          cta: raw.cta ?? "",
          fullText: raw.fullText ?? `${raw.hook}\n\n${raw.body}\n\n${raw.cta}`,
          format,
          whyThisWorks: raw.whyThisWorks ?? "",
          estimatedReach: raw.estimatedReach ?? "3K–10K",
          readTime: raw.readTime ?? "1 min read",
          createdAt: new Date().toISOString(),
        };

        usedHooks.push(raw.hook ?? "");
        if (usedHooks.length > MAX_MEMORY) usedHooks.splice(0, usedHooks.length - MAX_MEMORY);

        return post;
      } catch (e) {
        logger.error(`LinkedIn post generation failed for format ${format}: ${e}`);
        return null;
      }
    })
  );

  return {
    generatedAt: new Date().toISOString(),
    companyName: result.company.name,
    posts: posts.filter((p): p is LinkedInPost => p !== null),
  };
}

export async function rewriteLinkedInPost(
  post: LinkedInPost,
  result: AnalysisResult
): Promise<LinkedInPost> {
  const ctx = buildCompanyContext(result);
  const prompt = buildFormatPrompt(post.format, ctx, [post.hook]);
  const response = await llm.analyzeText(prompt);
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in rewrite response");

  const raw = JSON.parse(jsonMatch[0]);
  return {
    ...post,
    id: uuidv4(),
    hook: raw.hook ?? post.hook,
    body: raw.body ?? post.body,
    cta: raw.cta ?? post.cta,
    fullText: raw.fullText ?? post.fullText,
    whyThisWorks: raw.whyThisWorks ?? post.whyThisWorks,
    estimatedReach: raw.estimatedReach ?? post.estimatedReach,
    readTime: raw.readTime ?? post.readTime,
    createdAt: new Date().toISOString(),
  };
}
