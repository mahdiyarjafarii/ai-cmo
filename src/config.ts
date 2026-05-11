import dotenv from "dotenv";

dotenv.config();

export const config = {
  llm: {
    provider: (process.env.LLM_PROVIDER || "openai") as "openai" | "claude",
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4o",
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || "",
      model: process.env.CLAUDE_MODEL || "claude-3-5-sonnet-20241022",
    },
  },
  crawling: {
    firecrawlApiKey: process.env.FIRECRAWL_API_KEY || "",
    timeout: 30000,
    maxRetries: 3,
    retryDelay: 2000,
  },
  search: {
    tavilyApiKey: process.env.TAVILY_API_KEY || "",
    maxCompetitors: 5,
  },
  logging: {
    level: (process.env.LOG_LEVEL || "info") as
      | "debug"
      | "info"
      | "warn"
      | "error",
  },
  output: {
    dir: process.env.OUTPUT_DIR || "./output",
  },
  google: {
    pagespeedKey: process.env.GOOGLE_PAGESPEED_KEY || "",
  },
};

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.llm.openai.apiKey && !config.llm.claude.apiKey) {
    errors.push("Either OPENAI_API_KEY or CLAUDE_API_KEY must be set");
  }

  if (!config.crawling.firecrawlApiKey) {
    errors.push("FIRECRAWL_API_KEY is required");
  }

  if (!config.search.tavilyApiKey) {
    errors.push("TAVILY_API_KEY is required");
  }

  if (errors.length > 0) {
    console.error("Configuration validation failed:");
    errors.forEach((err) => console.error(`  - ${err}`));
    process.exit(1);
  }
}
