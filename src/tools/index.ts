import { WebCrawler } from "../services/crawler.js";
import { CompetitorSearch } from "../services/search.js";
import { LLMService } from "../services/llm.js";
import { enrichCompetitors } from "../services/enrichment.js";
import { PROMPTS } from "../prompts/index.js";
import logger from "../logger.js";
import {
  CompanyProfile,
  WebsiteContent,
  Competitor,
  SearchResult,
} from "../types/index.js";

interface FilteredCompetitor {
  name: string;
  url: string;
  description: string;
  reason?: string;
}

export class AgentTools {
  private crawler: WebCrawler;
  private search: CompetitorSearch;
  private llm: LLMService;

  constructor() {
    this.crawler = new WebCrawler();
    this.search = new CompetitorSearch();
    this.llm = new LLMService();
  }

  async extractCompanyProfile(
    websiteContent: WebsiteContent
  ): Promise<CompanyProfile> {
    logger.info(`Extracting company profile from ${websiteContent.title}`);

    const MAX_CONTENT_CHARS = 30000;
    const truncatedContent =
      websiteContent.content.length > MAX_CONTENT_CHARS
        ? websiteContent.content.slice(0, MAX_CONTENT_CHARS) +
          "\n\n[... content truncated ...]"
        : websiteContent.content;

    const prompt = PROMPTS.analyzeCompany.replace(
      "{content}",
      truncatedContent
    );

    const response = await this.llm.analyzeText(prompt);

    try {
      const profile = await this.llm.extractJSON<CompanyProfile>(
        response.content
      );
      logger.info(`Extracted profile for: ${profile.name}`);
      return profile;
    } catch (error) {
      logger.error(
        `Failed to extract profile: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async searchCompetitorCandidates(
    companyProfile: CompanyProfile
  ): Promise<SearchResult[]> {
    logger.info(
      `Searching competitor candidates for ${companyProfile.name} in ${companyProfile.industry}`
    );

    const results = await this.search.findCompetitors({
      name: companyProfile.name,
      description: companyProfile.description,
      industry: companyProfile.industry,
    });

    logger.info(`Found ${results.length} candidate URLs`);
    return results;
  }

  /**
   * Sends raw search candidates to the LLM and returns 5 verified competitors.
   */
  async filterCompetitorsWithLLM(
    companyProfile: CompanyProfile,
    candidates: SearchResult[]
  ): Promise<FilteredCompetitor[]> {
    if (candidates.length === 0) {
      return [];
    }

    logger.info(`Filtering ${candidates.length} candidates with LLM`);

    const candidatesText = candidates
      .map(
        (c, i) =>
          `${i + 1}. ${c.title}\n   URL: ${c.url}\n   Snippet: ${c.snippet?.slice(0, 200) || "n/a"}`
      )
      .join("\n\n");

    const prompt = PROMPTS.filterCompetitors
      .replace("{name}", companyProfile.name)
      .replace("{description}", companyProfile.description)
      .replace("{industry}", companyProfile.industry || "N/A")
      .replace("{icp}", companyProfile.icp || "N/A")
      .replace("{candidates}", candidatesText);

    const response = await this.llm.analyzeText(prompt);

    try {
      const parsed = await this.llm.extractJSON<{
        competitors: FilteredCompetitor[];
      }>(response.content);
      const filtered = (parsed.competitors || []).slice(0, 5);
      logger.info(`LLM picked ${filtered.length} competitors`);
      return filtered;
    } catch (error) {
      logger.warn(
        `LLM filter parsing failed, falling back to candidates: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return candidates.slice(0, 5).map((c) => ({
        name: c.title,
        url: c.url,
        description: c.snippet?.slice(0, 200) || "",
      }));
    }
  }

  /**
   * Builds Competitor objects from filtered candidates and enriches with logos.
   */
  async buildCompetitorsWithLogos(
    filtered: FilteredCompetitor[]
  ): Promise<Competitor[]> {
    const enriched = await enrichCompetitors(
      filtered.map((c) => ({ ...c, relevanceScore: 0.85 }))
    );

    return enriched.map((c) => ({
      name: c.name,
      url: c.url,
      description: c.description,
      logo: c.logo,
      relevanceScore: c.relevanceScore,
    }));
  }

  async crawlCompetitors(
    competitors: Competitor[]
  ): Promise<Map<string, WebsiteContent>> {
    logger.info(`Crawling ${competitors.length} competitor websites`);

    const competitorMap = new Map<string, WebsiteContent>();

    for (const competitor of competitors) {
      try {
        const crawlResult = await this.crawler.crawlWebsite(competitor.url);
        if (crawlResult.success && crawlResult.content) {
          competitorMap.set(competitor.name, crawlResult.content);
          logger.info(`Successfully crawled competitor: ${competitor.name}`);
        } else {
          logger.warn(
            `Failed to crawl ${competitor.name}: ${crawlResult.error}`
          );
        }
      } catch (error) {
        logger.warn(
          `Error crawling ${competitor.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return competitorMap;
  }

  /**
   * Enriches competitors with full profiles extracted from their crawled websites.
   * Mutates the input array — returns it for convenience.
   */
  async attachCompetitorProfiles(
    competitors: Competitor[],
    competitorWebsites: Map<string, WebsiteContent>
  ): Promise<Competitor[]> {
    logger.info(
      `Extracting full profiles for ${competitorWebsites.size} crawled competitors`
    );

    for (const competitor of competitors) {
      const content = competitorWebsites.get(competitor.name);
      if (!content) continue;

      try {
        const profile = await this.extractCompanyProfile(content);
        competitor.profile = profile;
      } catch (error) {
        logger.warn(
          `Failed to extract profile for ${competitor.name}: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }

    return competitors;
  }

  async analyzeCompetitivePosition(
    targetCompany: CompanyProfile,
    competitors: Competitor[]
  ): Promise<string> {
    logger.info("Analyzing competitive position");

    const competitorsSummary = competitors
      .map((c) => ({
        name: c.name,
        url: c.url,
        description: c.description,
        profile: c.profile,
      }))
      .slice(0, 5);

    const prompt = PROMPTS.analyzeCompetitors
      .replace("{targetCompany}", JSON.stringify(targetCompany, null, 2))
      .replace(
        "{competitorsData}",
        JSON.stringify(competitorsSummary, null, 2)
      );

    const response = await this.llm.analyzeText(prompt);
    return response.content;
  }

  async generateReport(analysisData: Record<string, unknown>): Promise<string> {
    logger.info("Generating markdown report");

    const prompt = PROMPTS.generateReport.replace(
      "{analysisData}",
      JSON.stringify(analysisData, null, 2)
    );

    const response = await this.llm.analyzeText(prompt);
    return response.content;
  }
}
