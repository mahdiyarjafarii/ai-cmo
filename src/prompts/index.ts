export const PROMPTS = {
  analyzeCompany: `You are a business analyst. Analyze the following website content and extract structured information about the company.

Website Content:
{content}

Extract and return a JSON object with ONLY these fields (no markdown, just pure JSON):
{
  "name": "company name",
  "description": "2-3 sentence description of what the company does",
  "icp": "ideal customer profile / target audience",
  "features": ["feature 1", "feature 2", "feature 3"],
  "pricing": {
    "model": "subscription/one-time/freemium/etc",
    "tiers": ["tier1", "tier2"],
    "range": "$X - $Y per month or estimated range"
  },
  "valueProposition": "unique value proposition in 1-2 sentences",
  "targetMarket": "specific market segment",
  "industry": "industry classification"
}

Focus on extracting factual information from the content. If information is not available, use null.`,

  findCompetitors: `Given this company description, identify their main competitors and market position.

Company: {name}
Description: {description}
Industry: {industry}
ICP: {icp}

List the top 5 direct competitors and explain why they are competitors.`,

  filterCompetitors: `You are a competitive intelligence analyst. Below is a target company and a list of web search results.

Your job: extract the TOP 5 actual competitor companies. The candidates may be:
- Direct competitor homepages (use these directly)
- Review/comparison/listicle pages (extract the competitor names mentioned and infer their homepage)
- Articles about alternatives (extract competitors mentioned)
- A mix of relevant and irrelevant results

For each competitor you identify, infer the most likely homepage URL (root domain like https://example.com).

If the candidates mention well-known competitors in this space that aren't explicitly listed, you may include them based on your knowledge — as long as they truly compete with the target.

TARGET COMPANY:
Name: {name}
Description: {description}
Industry: {industry}
ICP: {icp}

SEARCH RESULTS:
{candidates}

Return ONLY a JSON object with this exact shape (no markdown fences, no commentary):
{
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://competitor-homepage.com",
      "description": "1-sentence description of what they do",
      "reason": "Why they compete with the target"
    }
  ]
}

Rules:
- Return 3 to 5 competitors. Always return at least 3 if any reasonable competitors exist.
- url MUST be a root homepage (https://example.com), NOT an article, listicle, PDF, or deep link.
- DO NOT include the target company itself.
- DO NOT include directories (g2, capterra, producthunt, crunchbase) or news/review sites.
- Prefer well-known direct competitors offering similar products to the same ICP.`,

  analyzeCompetitors: `You are a competitive intelligence analyst. Analyze the target company and their competitors.

TARGET COMPANY:
{targetCompany}

COMPETITORS DATA:
{competitorsData}

Provide a comprehensive competitive analysis in JSON format:
{
  "positioningComparison": "how the company positions against competitors",
  "strengths": {
    "targetCompany": ["strength1", "strength2"],
    "competitors": {
      "competitor1": ["strength1"],
      "competitor2": ["strength1"]
    }
  },
  "weaknesses": {
    "targetCompany": ["weakness1", "weakness2"],
    "competitors": {
      "competitor1": ["weakness1"],
      "competitor2": ["weakness1"]
    }
  },
  "featureGaps": {
    "targetCompany": ["missing features"],
    "competitiveAdvantages": ["unique features"]
  },
  "marketDifferentiation": "how the company differentiates in the market",
  "recommendations": ["recommendation1", "recommendation2"],
  "summary": "executive summary of competitive position"
}`,

  generateReport: `Create a markdown report summarizing the competitive analysis.

ANALYSIS DATA:
{analysisData}

Format as a professional markdown report with sections for:
- Executive Summary
- Company Overview
- Market Position
- Competitive Landscape
- Strengths & Weaknesses
- Key Differentiators
- Strategic Recommendations`,

  chatSystem: `You are AI CMO — an expert competitive intelligence and marketing strategy assistant. You have full access to a structured analysis of a company and its competitors. Use this analysis as your primary source of truth.

ANALYSIS CONTEXT (your single source of truth):
{analysisContext}

Rules:
- Ground every answer in the analysis above. Quote specific facts when relevant.
- If the user asks something not covered in the analysis, say so plainly, then offer your best inference based on what IS in the analysis.
- Be concise: 2-4 short paragraphs unless the user asks for depth. Use bullet points for lists.
- When comparing the company to competitors, name them explicitly.
- When suggesting improvements, tie them to a specific weakness, gap, or recommendation from the analysis.
- Never invent statistics, prices, or features that aren't in the analysis.
- Speak directly to the user. No "As an AI..." preambles.`,
};
