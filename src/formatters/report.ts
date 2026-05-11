import { AnalysisResult } from "../types";

export class ReportFormatter {
  static generateMarkdown(result: AnalysisResult): string {
    const { company, competitors, analysis, timestamp } = result;

    return `# Competitive Analysis Report

**Generated:** ${new Date(timestamp).toLocaleDateString()} at ${new Date(timestamp).toLocaleTimeString()}

---

## Executive Summary

${analysis.summary}

---

## Company Overview

### ${company.name}

**URL:** ${company.url}

**Description:** ${company.description}

**Target Market:** ${company.targetMarket || "N/A"}

**Industry:** ${company.industry || "N/A"}

**ICP:** ${company.icp || "N/A"}

#### Value Proposition
${company.valueProposition}

#### Key Features
${company.features?.map((f) => `- ${f}`).join("\n") || "- Not specified"}

#### Pricing
${this.formatPricing(company)}

---

## Competitive Landscape

### Competitors Identified

${competitors
  .slice(0, 5)
  .map(
    (c, i) => `
#### ${i + 1}. ${c.name}
- **URL:** ${c.url}
- **Relevance Score:** ${(c.relevanceScore * 100).toFixed(0)}%
${
  c.profile
    ? `- **Description:** ${c.profile.description}
- **ICP:** ${c.profile.icp || "N/A"}
- **Industry:** ${c.profile.industry || "N/A"}`
    : "- **Details:** Limited information available"
}
`
  )
  .join("\n")}

---

## Positioning Analysis

${analysis.positioningComparison}

---

## Strengths & Weaknesses

### ${company.name} Strengths
${analysis.strengths.targetCompany?.map((s) => `- ${s}`).join("\n") || "- Not specified"}

### ${company.name} Weaknesses
${analysis.weaknesses.targetCompany?.map((w) => `- ${w}`).join("\n") || "- Not specified"}

### Competitor Strengths
${Object.entries(analysis.strengths.competitors || {})
  .slice(0, 3)
  .map(
    ([competitor, strengths]) => `
#### ${competitor}
${(strengths as string[]).map((s) => `- ${s}`).join("\n")}
`
  )
  .join("\n")}

### Competitor Weaknesses
${Object.entries(analysis.weaknesses.competitors || {})
  .slice(0, 3)
  .map(
    ([competitor, weaknesses]) => `
#### ${competitor}
${(weaknesses as string[]).map((w) => `- ${w}`).join("\n")}
`
  )
  .join("\n")}

---

## Feature Gaps & Differentiators

### Missing Features in ${company.name}
${analysis.featureGaps.targetCompany?.map((f) => `- ${f}`).join("\n") || "- None identified"}

### Competitive Advantages
${analysis.featureGaps.competitiveAdvantages?.map((a) => `- ${a}`).join("\n") || "- Not specified"}

---

## Market Differentiation

${analysis.marketDifferentiation}

---

## Strategic Recommendations

${analysis.recommendations
  ?.map((r, i) => `${i + 1}. ${r}`)
  .join("\n") || "1. Conduct deeper market research\n2. Monitor competitor movements"}

---

## Methodology

This report was generated using:
- **Website Crawling:** Firecrawl API
- **Competitor Search:** Tavily API
- **Analysis Engine:** AI-powered (${process.env.LLM_PROVIDER || "OpenAI"})

---

*End of Report*
`;
  }

  static generateJSON(result: AnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }

  private static formatPricing(company: {
    pricing?: {
      model?: string;
      tiers?: string[];
      range?: string;
    };
  }): string {
    if (!company.pricing) {
      return "- Not publicly available";
    }

    const { model, tiers, range } = company.pricing;
    return `
- **Model:** ${model || "N/A"}
- **Range:** ${range || "N/A"}
${tiers ? `- **Tiers:** ${tiers.join(", ")}` : ""}
    `.trim();
  }
}
