import { v4 as uuidv4 } from "uuid";
import { LLMService } from "../llm.js";
import { AnalysisResult, TwitterPost, TwitterFeed, TwitterAngle } from "../../types/index.js";
import logger from "../../logger.js";

const llm = new LLMService();

// Hook memory to prevent repetition across runs
const usedHooks: string[] = [];
const MAX_MEMORY = 40;

function buildCompanyContext(result: AnalysisResult): string {
  const { company, competitors, analysis } = result;
  return `
COMPANY: ${company.name}
VALUE PROP: ${company.valueProposition}
ICP: ${company.icp}
FEATURES: ${company.features.slice(0, 5).join(", ")}
INDUSTRY: ${company.industry ?? "SaaS"}
TOP COMPETITOR: ${competitors[0]?.name ?? ""}
KEY STRENGTH: ${analysis.strengths.targetCompany[0] ?? ""}
KEY WEAKNESS: ${analysis.weaknesses.targetCompany[0] ?? ""}
TOP REC: ${analysis.recommendations[0] ?? ""}
MARKET DIFF: ${analysis.marketDifferentiation}
`.trim();
}

function buildAnglePrompt(angle: TwitterAngle, ctx: string, avoidHooks: string[]): string {
  const avoidSection =
    avoidHooks.length > 0
      ? `\nAVOID THESE HOOKS (already used):\n${avoidHooks.slice(-12).join("\n")}\n`
      : "";

  const angleGuides: Record<TwitterAngle, string> = {
    "pain-point": `Write from the POV of someone who lived the pain. Lead with the problem, not the solution.
      Tone: empathetic but sharp. Make the reader think "that's exactly me."
      Structure: pain → amplify → pivot to possibility`,

    opinion: `Write a spiky, contrarian take on a common belief in this space.
      Must start with "Nobody talks about", "Hot take:", "Unpopular opinion:", or a provocative statement.
      Tone: founder who has seen too much. Confident, direct.
      Structure: claim → 2-3 supporting arguments → mic drop`,

    competitor: `Position ${ctx.split("\n")[0].replace("COMPANY: ", "")} relative to competitors WITHOUT being arrogant.
      Focus on what the market gets wrong, not on bashing.
      Tone: data-driven, founder-confident.
      Structure: market observation → why existing solutions fail → what we do differently`,

    value: `Showcase a real transformation. Before/after format.
      Write like a founder sharing a customer win.
      Tone: excited but grounded. Specific numbers or outcomes if possible.
      Structure: before state → transformation moment → after state → bigger insight`,

    insight: `Share a non-obvious insight from operating in this space.
      Must feel like insider knowledge.
      Tone: expert who distills complexity into clarity.
      Structure: counterintuitive opener → data/reasoning → actionable takeaway`,

    "thread-opener": `Write a thread opener (first tweet only) that makes people NEED to click "show thread".
      Use numbered format hint: "Here's what I learned (🧵):" or "The truth about X:".
      Tone: storyteller, genuine.
      Structure: promise → intrigue → "thread" signal`,

    lesson: `Write a "I learned this the hard way" style tweet.
      Personal, specific, humble but wise.
      Tone: founder sharing genuine war story.
      Structure: what I thought → what actually happened → real lesson`,

    "hot-take": `Write something that will generate replies — agrees OR disagrees.
      Must feel risky to post. Should make some people uncomfortable.
      Tone: direct, conviction, zero hedging.
      Structure: bold claim → brief support → let it land`,
  };

  return `You are a top-tier startup Twitter ghostwriter. You write for viral founders.

PLATFORM RULES (non-negotiable):
- Max 280 characters total (hook + body + cta)
- Use line breaks — NOT paragraphs
- Max 1 emoji (if any)
- Max 1 hashtag (preferably none)
- No corporate language, no buzzwords
- Must feel written by a human founder, not a marketing team

ANGLE: ${angle.toUpperCase()}
${angleGuides[angle]}

COMPANY CONTEXT:
${ctx}
${avoidSection}

Generate exactly 1 tweet as a JSON object with these fields:
- hook: (opening line — must stop the scroll, max 12 words)
- body: (2-4 short lines, each line break = new insight)
- cta: (1 short line — question or soft directive, NOT "check us out")
- fullText: (hook + "\n\n" + body + "\n\n" + cta — fully assembled tweet)
- charCount: (integer — length of fullText)
- whyThisWorks: (2-3 sentences explaining the psychological angle, why it will perform on X)
- estimatedEngagement: ("high" | "medium" | "low")

Return ONLY valid JSON. No markdown fences.`;
}

export async function generateTwitterFeed(result: AnalysisResult): Promise<TwitterFeed> {
  logger.info("Generating Twitter feed...");
  const ctx = buildCompanyContext(result);

  const angles: TwitterAngle[] = [
    "pain-point",
    "opinion",
    "competitor",
    "insight",
    "hot-take",
    "lesson",
  ];

  // Pick 4 varied angles avoiding repeats
  const selectedAngles = angles.sort(() => Math.random() - 0.5).slice(0, 4);

  const posts = await Promise.all(
    selectedAngles.map(async (angle): Promise<TwitterPost | null> => {
      try {
        const prompt = buildAnglePrompt(angle, ctx, usedHooks);
        const response = await llm.analyzeText(prompt);
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const raw = JSON.parse(jsonMatch[0]);
        const post: TwitterPost = {
          id: uuidv4(),
          hook: raw.hook ?? "",
          body: raw.body ?? "",
          cta: raw.cta ?? "",
          fullText: raw.fullText ?? `${raw.hook}\n\n${raw.body}\n\n${raw.cta}`,
          charCount: raw.charCount ?? (raw.fullText ?? "").length,
          angle,
          whyThisWorks: raw.whyThisWorks ?? "",
          estimatedEngagement: raw.estimatedEngagement ?? "medium",
          createdAt: new Date().toISOString(),
        };

        usedHooks.push(raw.hook ?? "");
        if (usedHooks.length > MAX_MEMORY) usedHooks.splice(0, usedHooks.length - MAX_MEMORY);

        return post;
      } catch (e) {
        logger.error(`Twitter post generation failed for angle ${angle}: ${e}`);
        return null;
      }
    })
  );

  const validPosts = posts.filter((p): p is TwitterPost => p !== null);

  return {
    generatedAt: new Date().toISOString(),
    companyName: result.company.name,
    posts: validPosts,
  };
}

export async function rewriteTwitterPost(
  post: TwitterPost,
  result: AnalysisResult
): Promise<TwitterPost> {
  const ctx = buildCompanyContext(result);
  const prompt = buildAnglePrompt(post.angle, ctx, [post.hook]);
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
    charCount: raw.charCount ?? post.charCount,
    whyThisWorks: raw.whyThisWorks ?? post.whyThisWorks,
    estimatedEngagement: raw.estimatedEngagement ?? post.estimatedEngagement,
    createdAt: new Date().toISOString(),
  };
}
