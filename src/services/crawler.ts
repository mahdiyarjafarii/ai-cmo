import axios from "axios";
import logger from "../logger";
import { config } from "../config";
import { WebsiteContent, CrawlResult } from "../types";

const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
    html?: string;
  };
  error?: string;
}

export class WebCrawler {
  private apiKey: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    this.apiKey = config.crawling.firecrawlApiKey;
    this.timeout = config.crawling.timeout;
    this.maxRetries = config.crawling.maxRetries;
    this.retryDelay = config.crawling.retryDelay;
  }

  async crawlWebsite(url: string): Promise<CrawlResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`Crawling ${url} (attempt ${attempt}/${this.maxRetries})`);

        const response = await axios.post<FirecrawlResponse>(
          `${FIRECRAWL_BASE_URL}/scrape`,
          {
            url,
            formats: ["markdown", "html"],
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              "Content-Type": "application/json",
            },
            timeout: this.timeout,
          }
        );

        if (!response.data.success) {
          throw new Error(response.data.error || "Firecrawl request failed");
        }

        const content = response.data.data?.markdown || "";
        const title = extractTitle(url, response.data.data?.metadata);

        const websiteContent: WebsiteContent = {
          url,
          title,
          content: cleanContent(content),
          metadata: {
            description:
              (response.data.data?.metadata?.description as string) || "",
            keywords: (response.data.data?.metadata?.keywords as string) || "",
            author: (response.data.data?.metadata?.author as string) || "",
          },
        };

        logger.info(`Successfully crawled ${url}`);

        return {
          success: true,
          url,
          content: websiteContent,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(
          `Failed to crawl ${url} on attempt ${attempt}: ${lastError.message}`
        );

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }

    return {
      success: false,
      url,
      error: lastError?.message || "Failed to crawl website",
      attempts: this.maxRetries,
    };
  }

  async crawlMultiple(urls: string[]): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];

    for (const url of urls) {
      const result = await this.crawlWebsite(url);
      results.push(result);
      await this.delay(1000);
    }

    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function extractTitle(url: string, metadata?: Record<string, unknown>): string {
  if (metadata?.title && typeof metadata.title === "string") {
    return metadata.title;
  }
  try {
    const domain = new URL(url).hostname;
    return domain.replace("www.", "");
  } catch {
    return url;
  }
}

function cleanContent(content: string): string {
  return content
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}
