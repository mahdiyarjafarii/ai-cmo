import { v4 as uuidv4 } from "uuid";
import { LLMService } from "../llm.js";
import { AnalysisResult, SeoRecommendation, SeoReport, SeoImpact, SeoCategory, SeoEffort } from "../../types/index.js";
import logger from "../../logger.js";

const llm = new LLMService();

function buildSeoContext(result: AnalysisResult): string {
  const { company, competitors, analysis } = result;

  const competitorNames = competitors.map((c: { name: string }) => c.name).join(", ");
  const compWeaknesses = analysis.featureGaps.targetCompany.join("; ");
  const compAdvantages = analysis.featureGaps.competitiveAdvantages.join("; ");

  return `
COMPANY: ${company.name}
URL: ${company.url}
DESCRIPTION: ${company.description}
VALUE PROP: ${company.valueProposition}
ICP: ${company.icp}
FEATURES: ${company.features.join(", ")}
INDUSTRY: ${company.industry ?? "SaaS"}
TARGET MARKET: ${company.targetMarket ?? ""}

COMPETITORS: ${competitorNames}
TOP COMPETITOR: ${competitors[0]?.name ?? ""}
COMPETITOR URL: ${competitors[0]?.url ?? ""}

FEATURE GAPS (areas where we lag): ${compWeaknesses}
OUR COMPETITIVE ADVANTAGES: ${compAdvantages}
MARKET DIFFERENTIATION: ${analysis.marketDifferentiation}
POSITIONING: ${analysis.positioningComparison}
`.trim();
}

interface RawSeoRec {
  priority: string;
  category: string;
  issue: string;
  impact: string;
  fix: string;
  reasoning: string;
  effort: string;
  estimatedTrafficGain?: string;
}

export async function generateSeoReport(result: AnalysisResult): Promise<SeoReport> {
  logger.info("Generating SEO report...");
  const ctx = buildSeoContext(result);
  const { company } = result;

  const prompt = `You are an elite SEO strategist specializing in B2B SaaS companies.
Your job is to produce a high-signal, actionable SEO audit for a startup.

COMPANY CONTEXT:
${ctx}

Generate a comprehensive SEO audit with exactly 8 recommendations.

Categorize across these areas:
- technical: site speed, Core Web Vitals, structured data, crawlability
- content: missing pages, thin content, content gaps vs competitors
- keywords: keyword opportunities, search intent alignment, long-tail gaps
- competitive: comparison pages, alternative pages, SERP positioning
- performance: page speed, LCP, CLS, mobile optimization

Priority distribution: 2 critical, 3 high, 2 medium, 1 low

Each recommendation must be ruthlessly specific — not generic SEO advice.
Reference the actual company, competitors, and features by name.

Return a JSON object with:
- overallScore: (integer 0-100 — realistic estimate of their current SEO health)
- keywordOpportunities: (array of 5 specific keyword phrases they should target)
- topCompetitorGap: (1-2 sentences describing the biggest SEO gap vs their top competitor)
- recommendations: (array of 8 objects, each with):
  - priority: ("critical" | "high" | "medium" | "low")
  - category: ("technical" | "content" | "keywords" | "competitive" | "performance")
  - issue: (specific issue name, max 10 words)
  - impact: (what improving this will do — be specific, e.g. "+1,800 est. monthly visits")
  - fix: (exact actionable fix — what to do, step-by-step if short, be concrete)
  - reasoning: (why this matters for THIS specific company — reference their context)
  - effort: ("quick-win" | "medium" | "project")
  - estimatedTrafficGain: (optional — e.g. "+400 visits/mo")

Return ONLY valid JSON. No markdown fences.`;

  const response = await llm.analyzeText(prompt);
  const jsonMatch = response.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in SEO response");

  const raw = JSON.parse(jsonMatch[0]);

  const recommendations: SeoRecommendation[] = (raw.recommendations ?? []).map(
    (r: RawSeoRec) => ({
      id: uuidv4(),
      priority: (r.priority ?? "medium") as SeoImpact,
      category: (r.category ?? "content") as SeoCategory,
      issue: r.issue ?? "",
      impact: r.impact ?? "",
      fix: r.fix ?? "",
      reasoning: r.reasoning ?? "",
      effort: (r.effort ?? "medium") as SeoEffort,
      estimatedTrafficGain: r.estimatedTrafficGain,
    })
  );

  // Sort: critical → high → medium → low
  const priorityOrder: Record<SeoImpact, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  logger.info(`SEO report generated: ${recommendations.length} recommendations`);

  return {
    generatedAt: new Date().toISOString(),
    companyName: company.name,
    overallScore: raw.overallScore ?? 45,
    recommendations,
    keywordOpportunities: raw.keywordOpportunities ?? [],
    topCompetitorGap: raw.topCompetitorGap ?? "",
  };
}
