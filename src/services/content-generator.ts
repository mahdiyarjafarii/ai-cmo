import { v4 as uuidv4 } from "uuid";
import { LLMService } from "./llm.js";
import { AnalysisResult, GeneratedPost, ContentFeed } from "../types/index.js";
import logger from "../logger.js";

const llm = new LLMService();

// In-memory store for generated content feeds (keyed by date string YYYY-MM-DD)
const contentStore = new Map<string, ContentFeed>();

// Track used hooks/angles to prevent repetition
const usedHooks: string[] = [];
const MAX_HOOK_MEMORY = 50;

export function getLatestFeed(): ContentFeed | null {
  if (contentStore.size === 0) return null;
  const keys = Array.from(contentStore.keys()).sort().reverse();
  return contentStore.get(keys[0]) ?? null;
}

export function getAllFeeds(): ContentFeed[] {
  return Array.from(contentStore.values()).sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

export function storeFeed(feed: ContentFeed): void {
  const dateKey = new Date(feed.generatedAt).toISOString().slice(0, 10);
  contentStore.set(dateKey, feed);
}

function buildContext(result: AnalysisResult): string {
  const { company, competitors, analysis } = result;
  const competitorNames = competitors.map((c) => c.name).join(", ");
  const topWeakness = analysis.weaknesses.targetCompany[0] ?? "";
  const topStrength = analysis.strengths.targetCompany[0] ?? "";
  const topRec = analysis.recommendations[0] ?? "";

  const previousHooks =
    usedHooks.length > 0
      ? `\n\nPREVIOUSLY USED HOOKS/ANGLES (avoid repeating these):\n${usedHooks.slice(-15).join("\n")}`
      : "";

  return `
COMPANY: ${company.name}
URL: ${company.url}
DESCRIPTION: ${company.description}
VALUE PROPOSITION: ${company.valueProposition}
ICP (Ideal Customer Profile): ${company.icp}
FEATURES: ${company.features.join(", ")}
INDUSTRY: ${company.industry ?? "SaaS"}
TARGET MARKET: ${company.targetMarket ?? ""}
PRICING: ${company.pricing?.model ?? ""}

COMPETITORS: ${competitorNames}
TOP COMPETITOR: ${competitors[0]?.name ?? ""}

ANALYSIS INSIGHTS:
- Key strength: ${topStrength}
- Key weakness: ${topWeakness}
- Top recommendation: ${topRec}
- Market differentiation: ${analysis.marketDifferentiation}
- Positioning: ${analysis.positioningComparison}
${previousHooks}
`.trim();
}

interface RawPostJSON {
  hook: string;
  content: string;
  cta: string;
  whyThisWorks: string;
  angle: string;
}

async function generateTwitterPosts(context: string): Promise<GeneratedPost[]> {
  const prompt = `You are an elite startup content strategist. Generate 4 Twitter/X posts for this company.

${context}

Generate exactly 4 posts as a JSON array. Each should be a distinct angle:
1. Pain-point / problem awareness
2. Founder insight / controversial opinion
3. Competitor positioning / comparison
4. Product value / transformation story

Each post object MUST have these exact fields:
- hook: (the opening line, punchy, max 15 words)
- content: (full tweet text, 200-280 chars, includes emojis, founder tone, no hashtag overload)
- cta: (single call to action line)
- whyThisWorks: (2-3 sentence explanation of the psychological/marketing angle)
- angle: (one-word label: pain-point | opinion | competitor | value)

Return ONLY a valid JSON array. No markdown, no explanation.`;

  const response = await llm.analyzeText(prompt);
  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in Twitter response");

  const raw: RawPostJSON[] = JSON.parse(jsonMatch[0]);
  const posts: GeneratedPost[] = [];

  raw.forEach((item, i) => {
    const type: "idea" | "full" = i < 2 ? "idea" : "full";
    const post: GeneratedPost = {
      id: uuidv4(),
      platform: "twitter",
      type,
      hook: item.hook,
      content: item.content,
      cta: item.cta,
      whyThisWorks: item.whyThisWorks,
      angle: item.angle,
      createdAt: new Date().toISOString(),
    };
    posts.push(post);
    usedHooks.push(item.hook);
  });

  if (usedHooks.length > MAX_HOOK_MEMORY) {
    usedHooks.splice(0, usedHooks.length - MAX_HOOK_MEMORY);
  }

  return posts;
}

async function generateLinkedInPosts(context: string): Promise<GeneratedPost[]> {
  const prompt = `You are an elite B2B content strategist. Generate 4 LinkedIn posts for this company.

${context}

Generate exactly 4 posts as a JSON array. Each should use a distinct storytelling format:
1. Founder journey / origin story insight
2. Data-driven growth observation
3. Industry misconception / thought leadership
4. Product case study / transformation

Each post object MUST have these exact fields:
- hook: (opening hook line, max 20 words, must stop the scroll)
- content: (full LinkedIn post, 400-600 chars, professional but human, use line breaks for readability, 1-2 emojis max)
- cta: (engagement CTA — ask a question or invite comment)
- whyThisWorks: (2-3 sentences on the psychological/marketing angle and why it resonates on LinkedIn)
- angle: (one-word label: founder | data | thought-leadership | case-study)

Return ONLY a valid JSON array. No markdown, no explanation.`;

  const response = await llm.analyzeText(prompt);
  const jsonMatch = response.content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON array in LinkedIn response");

  const raw: RawPostJSON[] = JSON.parse(jsonMatch[0]);
  const posts: GeneratedPost[] = [];

  raw.forEach((item, i) => {
    const type: "idea" | "full" = i < 2 ? "idea" : "full";
    const post: GeneratedPost = {
      id: uuidv4(),
      platform: "linkedin",
      type,
      hook: item.hook,
      content: item.content,
      cta: item.cta,
      whyThisWorks: item.whyThisWorks,
      angle: item.angle,
      createdAt: new Date().toISOString(),
    };
    posts.push(post);
    usedHooks.push(item.hook);
  });

  if (usedHooks.length > MAX_HOOK_MEMORY) {
    usedHooks.splice(0, usedHooks.length - MAX_HOOK_MEMORY);
  }

  return posts;
}

export async function generateDailyContent(
  result: AnalysisResult,
  analysisId?: string
): Promise<ContentFeed> {
  logger.info("Generating daily social content...");
  const context = buildContext(result);

  const [twitterPosts, linkedinPosts] = await Promise.all([
    generateTwitterPosts(context),
    generateLinkedInPosts(context),
  ]);

  const feed: ContentFeed = {
    generatedAt: new Date().toISOString(),
    analysisId,
    companyName: result.company.name,
    posts: [...twitterPosts, ...linkedinPosts],
  };

  storeFeed(feed);
  logger.info(
    `Daily content generated: ${twitterPosts.length} Twitter + ${linkedinPosts.length} LinkedIn posts`
  );
  return feed;
}

export async function regeneratePost(
  postId: string,
  result: AnalysisResult
): Promise<GeneratedPost | null> {
  const feed = getLatestFeed();
  if (!feed) return null;

  const existing = feed.posts.find((p) => p.id === postId);
  if (!existing) return null;

  const context = buildContext(result);

  const prompt =
    existing.platform === "twitter"
      ? `You are an elite startup content strategist. Rewrite this Twitter/X post with a fresh angle.

${context}

ORIGINAL HOOK TO AVOID REPEATING: "${existing.hook}"
ORIGINAL ANGLE: ${existing.angle}

Generate 1 post as a JSON object (not array) with these fields:
- hook, content (200-280 chars), cta, whyThisWorks, angle

Return ONLY valid JSON.`
      : `You are an elite B2B content strategist. Rewrite this LinkedIn post with a fresh angle.

${context}

ORIGINAL HOOK TO AVOID REPEATING: "${existing.hook}"
ORIGINAL ANGLE: ${existing.angle}

Generate 1 post as a JSON object (not array) with these fields:
- hook, content (400-600 chars), cta, whyThisWorks, angle

Return ONLY valid JSON.`;

  const response = await llm.analyzeText(prompt);
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  const raw: RawPostJSON = JSON.parse(jsonMatch[0]);
  const newPost: GeneratedPost = {
    id: uuidv4(),
    platform: existing.platform,
    type: existing.type,
    hook: raw.hook,
    content: raw.content,
    cta: raw.cta,
    whyThisWorks: raw.whyThisWorks,
    angle: raw.angle,
    createdAt: new Date().toISOString(),
  };

  // Replace in store
  const idx = feed.posts.findIndex((p) => p.id === postId);
  if (idx !== -1) {
    feed.posts[idx] = newPost;
  }

  usedHooks.push(raw.hook);

  return newPost;
}
