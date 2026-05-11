import logger from "../logger";
import { AgentTools } from "../tools";
import { WebCrawler } from "../services/crawler";
import { StepEmitter } from "../services/streaming";
import {
  AnalysisResult,
  CompanyProfile,
  Competitor,
  CompetitorAnalysis,
} from "../types";

const noopEmit: StepEmitter = () => {};

export class CompanyAnalysisAgent {
  private tools: AgentTools;
  private crawler: WebCrawler;
  private emit: StepEmitter;

  constructor(emit: StepEmitter = noopEmit) {
    this.tools = new AgentTools();
    this.crawler = new WebCrawler();
    this.emit = emit;
  }

  async analyze(targetUrl: string): Promise<AnalysisResult> {
    logger.info(`Starting analysis for ${targetUrl}`);

    try {
      // Step 1: Crawl target website
      this.emit("crawl-target", "Crawling homepage...", "running", targetUrl);
      const targetCrawlResult = await this.crawler.crawlWebsite(targetUrl);

      if (!targetCrawlResult.success || !targetCrawlResult.content) {
        this.emit(
          "crawl-target",
          "Failed to crawl target website",
          "error",
          targetCrawlResult.error
        );
        throw new Error(
          `Failed to crawl target website: ${targetCrawlResult.error}`
        );
      }

      const targetWebsite = targetCrawlResult.content;
      this.emit(
        "crawl-target",
        `Crawled ${targetWebsite.title}`,
        "done",
        `${targetWebsite.content.length} chars extracted`
      );

      // Step 2: Extract company profile
      this.emit(
        "extract-profile",
        "Extracting business profile (name, ICP, pricing, features)...",
        "running"
      );
      const companyProfile = await this.tools.extractCompanyProfile(
        targetWebsite
      );
      // Always use the original URL — LLM extraction can miss or mangle it
      companyProfile.url = targetUrl;
      this.emit(
        "extract-profile",
        `Identified ${companyProfile.name}`,
        "done",
        companyProfile.industry || ""
      );

      // Step 3: Search competitor candidates
      this.emit(
        "search-candidates",
        "Searching for competitor candidates...",
        "running",
        companyProfile.industry
      );
      const candidates = await this.tools.searchCompetitorCandidates(
        companyProfile
      );
      this.emit(
        "search-candidates",
        `Found ${candidates.length} candidates`,
        "done"
      );

      if (candidates.length === 0) {
        throw new Error("No competitor candidates found");
      }

      // Step 4: Filter & rank with LLM
      this.emit(
        "filter-competitors",
        "Filtering & ranking top competitors with AI...",
        "running"
      );
      let filtered = await this.tools.filterCompetitorsWithLLM(
        companyProfile,
        candidates
      );

      // Fallback: if LLM filter returned nothing, use raw candidates so the
      // analysis can still complete with reasonable results.
      if (filtered.length === 0) {
        logger.warn(
          "LLM filter returned 0 competitors, falling back to raw search candidates"
        );
        filtered = candidates.slice(0, 5).map((c) => ({
          name: c.title,
          url: c.url,
          description: c.snippet?.slice(0, 200) || "",
        }));
      }

      this.emit(
        "filter-competitors",
        `Selected ${filtered.length} verified competitors`,
        "done"
      );

      if (filtered.length === 0) {
        throw new Error("No competitors found after fallback");
      }

      // Step 5: Build competitors with logos
      this.emit(
        "enrich-logos",
        "Fetching logos for competitors...",
        "running"
      );
      const competitors = await this.tools.buildCompetitorsWithLogos(filtered);
      this.emit(
        "enrich-logos",
        `Logos resolved for ${competitors.length} competitors`,
        "done"
      );

      // Step 6: Crawl competitor websites
      this.emit(
        "crawl-competitors",
        "Crawling competitor websites...",
        "running"
      );
      const competitorWebsites = await this.tools.crawlCompetitors(competitors);
      this.emit(
        "crawl-competitors",
        `Crawled ${competitorWebsites.size}/${competitors.length} competitor sites`,
        "done"
      );

      // Step 7: Attach detailed profiles to competitors
      this.emit(
        "extract-competitor-profiles",
        "Extracting competitor profiles...",
        "running"
      );
      await this.tools.attachCompetitorProfiles(
        competitors,
        competitorWebsites
      );
      this.emit(
        "extract-competitor-profiles",
        "Competitor profiles ready",
        "done"
      );

      // Step 8: Analyze competitive position
      this.emit(
        "competitive-analysis",
        "Analyzing competitive positioning, strengths & weaknesses...",
        "running"
      );
      const analysisContent = await this.tools.analyzeCompetitivePosition(
        companyProfile,
        competitors
      );
      const analysis = await this.parseAnalysisContent(
        analysisContent,
        companyProfile,
        competitors
      );
      this.emit("competitive-analysis", "Competitive analysis ready", "done");

      // Step 9: Finalize
      this.emit("finalize", "Finalizing report...", "running");
      const result: AnalysisResult = {
        timestamp: new Date().toISOString(),
        company: companyProfile,
        competitors,
        analysis,
        rawData: {
          companyWebsite: targetWebsite,
          competitorWebsites: Object.fromEntries(competitorWebsites),
        },
      };
      this.emit("finalize", "Report ready", "done");

      logger.info("Analysis completed successfully");

      return result;
    } catch (error) {
      logger.error(
        `Analysis failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private async parseAnalysisContent(
    content: string,
    targetCompany: CompanyProfile,
    competitors: Competitor[]
  ): Promise<CompetitorAnalysis> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Partial<CompetitorAnalysis>;
        return {
          positioningComparison:
            parsed.positioningComparison || "Analysis not available",
          targetCompany,
          competitors,
          strengths: parsed.strengths || {
            targetCompany: [],
            competitors: {},
          },
          weaknesses: parsed.weaknesses || {
            targetCompany: [],
            competitors: {},
          },
          featureGaps: parsed.featureGaps || {
            targetCompany: [],
            competitiveAdvantages: [],
          },
          marketDifferentiation:
            parsed.marketDifferentiation || "Analysis not available",
          recommendations: parsed.recommendations || [],
          summary: parsed.summary || content.substring(0, 500),
        };
      }

      return {
        positioningComparison: content,
        targetCompany,
        competitors,
        strengths: { targetCompany: [], competitors: {} },
        weaknesses: { targetCompany: [], competitors: {} },
        featureGaps: { targetCompany: [], competitiveAdvantages: [] },
        marketDifferentiation: "See raw analysis",
        recommendations: [],
        summary: content,
      };
    } catch (error) {
      logger.warn(
        `Failed to parse analysis as JSON: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return {
        positioningComparison: content,
        targetCompany,
        competitors,
        strengths: { targetCompany: [], competitors: {} },
        weaknesses: { targetCompany: [], competitors: {} },
        featureGaps: { targetCompany: [], competitiveAdvantages: [] },
        marketDifferentiation: "Analysis content above",
        recommendations: [],
        summary: content.substring(0, 500),
      };
    }
  }
}
