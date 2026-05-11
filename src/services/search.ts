import axios from "axios";
import logger from "../logger";
import { config } from "../config";
import { SearchResult } from "../types";

const TAVILY_API_BASE = "https://api.tavily.com/search";

interface TavilyResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
}

export interface SearchInput {
  name: string;
  description: string;
  industry?: string;
}

export class CompetitorSearch {
  private apiKey: string;
  private maxCompetitors: number;

  constructor() {
    this.apiKey = config.search.tavilyApiKey;
    this.maxCompetitors = config.search.maxCompetitors;
  }

  async findCompetitors(
    descriptionOrInput: string | SearchInput,
    industry?: string
  ): Promise<SearchResult[]> {
    try {
      logger.info("Searching for competitors...");

      const input: SearchInput =
        typeof descriptionOrInput === "string"
          ? { name: "", description: descriptionOrInput, industry }
          : descriptionOrInput;

      const query = this.buildSearchQuery(input);
      logger.info(`Search query: ${query}`);

      const response = await axios.post<TavilyResponse>(TAVILY_API_BASE, {
        api_key: this.apiKey,
        query,
        max_results: this.maxCompetitors * 3,
        include_answer: false,
        search_depth: "advanced",
      });

      if (!response.data.results) {
        logger.warn("No search results found");
        return [];
      }

      const results = response.data.results
        .map((result) => ({
          title: result.title,
          url: result.url,
          snippet: result.content,
          relevance: result.score,
        }))
        .filter((r) => this.isValidResult(r, input.name))
        .slice(0, this.maxCompetitors);

      logger.info(`Found ${results.length} competitors`);

      return results;
    } catch (error) {
      logger.error(
        `Competitor search failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  private buildSearchQuery(input: SearchInput): string {
    if (input.name && input.industry) {
      return `${input.name} alternatives competitors ${input.industry}`;
    }
    if (input.name) {
      return `${input.name} alternatives competitors`;
    }
    if (input.industry) {
      return `top ${input.industry} companies competitors`;
    }
    const keywords = extractKeywords(input.description).slice(0, 3);
    return `${keywords.join(" ")} competitors alternatives`;
  }

  private isValidResult(result: SearchResult, companyName: string): boolean {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();

    // Only block clearly non-competitor sources.
    // Review/comparison sites are kept because they often surface real competitors
    // that the LLM filter can extract.
    const invalidDomains = [
      "wikipedia.org",
      "reddit.com",
      "youtube.com",
      "twitter.com",
      "x.com",
      "facebook.com",
      "instagram.com",
      "tiktok.com",
    ];

    if (invalidDomains.some((domain) => url.includes(domain))) {
      return false;
    }

    if (
      url.endsWith(".pdf") ||
      url.endsWith(".doc") ||
      url.endsWith(".docx") ||
      url.endsWith(".xls") ||
      url.endsWith(".xlsx")
    ) {
      return false;
    }

    if (companyName) {
      const lowerName = companyName.toLowerCase();
      if (url.includes(lowerName) || title.includes(lowerName)) {
        return false;
      }
    }

    return true;
  }
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "have",
    "their",
    "your",
    "what",
    "when",
    "where",
    "which",
    "they",
  ]);

  return text
    .split(/[\s,\.]+/)
    .filter((word) => word.length > 3 && !stopWords.has(word.toLowerCase()))
    .slice(0, 5);
}
