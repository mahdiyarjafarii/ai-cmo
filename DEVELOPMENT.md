# Development Guide

Guide for developers working on the AI Competitor Analysis Engine.

## Project Overview

The project is structured as a modular TypeScript application with the following key components:

- **Agent** (`src/agent/`) - Orchestrates the analysis workflow
- **Services** (`src/services/`) - External API integrations (crawler, search, LLM)
- **Tools** (`src/tools/`) - Agent capabilities
- **Prompts** (`src/prompts/`) - LLM instructions
- **Formatters** (`src/formatters/`) - Output generation
- **Types** (`src/types/`) - TypeScript interfaces

## Setup for Development

### Prerequisites
- Node.js 18+
- Git
- API keys (see QUICKSTART.md)

### Installation

```bash
git clone <repo>
cd ai-competitor-analysis
npm install
cp .env.example .env
# Edit .env with your API keys
```

### Development Workflow

```bash
# Watch mode (auto-recompile)
npm run dev -- --url=https://example.com

# Type checking
npm run type-check

# Build for production
npm run build

# Run built version
npm start -- --url=https://example.com
```

## Key Files to Understand

### 1. `src/main.ts` - Entry Point
- CLI argument parsing (yargs)
- File I/O for output
- Error handling

### 2. `src/agent/analyzer.ts` - Orchestrator
Main analysis workflow:
1. Crawl target website
2. Extract company profile
3. Search for competitors
4. Crawl competitor sites
5. Extract competitor profiles
6. Analyze competitive position
7. Generate report

### 3. `src/services/crawler.ts` - Website Crawling
- Uses Firecrawl API
- Retry logic (3 attempts)
- Markdown extraction
- Content cleaning

### 4. `src/services/search.ts` - Competitor Discovery
- Uses Tavily API
- Query building from company description
- Result filtering

### 5. `src/services/llm.ts` - LLM Integration
- Supports OpenAI (GPT-4o) and Claude
- Pluggable provider pattern
- Token counting

### 6. `src/tools/index.ts` - Agent Capabilities
Exposes:
- `extractCompanyProfile()` - Parse website → company info
- `searchCompetitors()` - Find competitors
- `crawlCompetitors()` - Fetch competitor sites
- `analyzeCompetitivePosition()` - Generate insights

## Adding Features

### Add a New Analysis Tool

1. Create method in `src/tools/index.ts`:

```typescript
async myNewTool(data: SomeType): Promise<ResultType> {
  logger.info("Running my new tool");
  // Implementation
  return result;
}
```

2. Call from `src/agent/analyzer.ts`:

```typescript
const result = await this.tools.myNewTool(data);
```

3. Update output format in `src/formatters/report.ts` if needed

### Modify LLM Prompts

Edit `src/prompts/index.ts`:

```typescript
export const PROMPTS = {
  myNewPrompt: `Your instruction here...`,
  // ...
};
```

Use in tools:

```typescript
const prompt = PROMPTS.myNewPrompt.replace("{placeholder}", value);
const response = await this.llm.analyzeText(prompt);
```

### Add a New Service

1. Create `src/services/myservice.ts`:

```typescript
import logger from "../logger";
import { config } from "../config";

export class MyService {
  constructor() {
    logger.info("MyService initialized");
  }

  async doSomething(): Promise<Result> {
    // Implementation
  }
}
```

2. Integrate into `src/tools/index.ts`:

```typescript
import { MyService } from "../services/myservice";

export class AgentTools {
  private myService: MyService;

  constructor() {
    this.myService = new MyService();
  }
}
```

### Add a New Output Format

1. Add method to `src/formatters/report.ts`:

```typescript
static generateCSV(result: AnalysisResult): string {
  // Implementation
  return csv;
}
```

2. Update CLI in `src/main.ts`:

```typescript
const format = argv.format; // "json" | "markdown" | "csv"

if (format === "csv" || format === "both") {
  const csvPath = path.join(outputDir, `${baseFilename}.csv`);
  fs.writeFileSync(csvPath, ReportFormatter.generateCSV(result));
}
```

## Configuration

### Environment Variables

In `.env`:

```env
# LLM Provider (openai or claude)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Or Claude
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# External APIs
FIRECRAWL_API_KEY=fc_...
TAVILY_API_KEY=tvly_...

# Logging
LOG_LEVEL=debug|info|warn|error

# Output
OUTPUT_DIR=./output
```

### Runtime Configuration

Edit `src/config.ts` to add new config options:

```typescript
export const config = {
  myOption: process.env.MY_OPTION || "default",
  myService: {
    timeout: parseInt(process.env.MY_TIMEOUT || "30000"),
  },
};
```

## Logging

Using Pino logger via `logger.ts`:

```typescript
import logger from "../logger";

logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message");

// With context
logger.info({ url: "https://example.com" }, "Processing URL");
```

## Error Handling

Pattern used throughout:

```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error(
    `Operation failed: ${error instanceof Error ? error.message : String(error)}`
  );
  throw error; // or handle gracefully
}
```

## Testing

Currently no automated tests, but structure supports adding:

```bash
npm install --save-dev jest @types/jest ts-jest
```

Then create `src/__tests__/services/crawler.test.ts`:

```typescript
import { WebCrawler } from "../../services/crawler";

describe("WebCrawler", () => {
  it("should crawl a website", async () => {
    const crawler = new WebCrawler();
    const result = await crawler.crawlWebsite("https://example.com");
    expect(result.success).toBe(true);
  });
});
```

## Docker Development

### Build Development Image

```bash
docker build -f Dockerfile.dev -t ai-analysis:dev .
```

### Run in Container with Hot Reload

```bash
docker-compose up dev
```

### Run One-Off Analysis

```bash
docker-compose run analyzer node dist/main.js --url=https://example.com
```

## Debugging

### Enable Debug Logging

```bash
LOG_LEVEL=debug npm run dev -- --url=https://example.com
```

### VS Code Debugging

Add `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Analyzer",
      "program": "${workspaceFolder}/dist/main.js",
      "preLaunchTask": "npm: build",
      "args": ["--url=https://example.com", "--verbose"],
      "env": { "LOG_LEVEL": "debug" }
    }
  ]
}
```

## Performance Optimization

### Caching

Add caching for competitor search:

```typescript
const cache = new Map<string, SearchResult[]>();

async findCompetitors(query: string) {
  if (cache.has(query)) {
    return cache.get(query)!;
  }
  const results = await tavily.search(query);
  cache.set(query, results);
  return results;
}
```

### Concurrency

Parallel crawling:

```typescript
async crawlMultiple(urls: string[]) {
  return Promise.all(urls.map(url => this.crawlWebsite(url)));
}
```

### Token Optimization

Monitor LLM token usage:

```typescript
logger.info(`Tokens used: ${response.usage.inputTokens + response.usage.outputTokens}`);
```

## Code Style

- **TypeScript strict mode** enabled
- **No implicit any**
- **Explicit return types**
- **Error handling required**
- **Logging for important steps**

Example:

```typescript
async analyzeCompany(content: WebsiteContent): Promise<CompanyProfile> {
  logger.info(`Analyzing ${content.url}`);
  
  try {
    const profile = await this.llm.analyzeText(prompt);
    logger.info(`Success: ${profile.name}`);
    return profile;
  } catch (error) {
    logger.error(`Failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}
```

## Common Tasks

### Add a New API Integration

1. Create service in `src/services/newapi.ts`
2. Add config to `src/config.ts`
3. Add API key to `.env.example`
4. Integrate into agent or tools

### Change LLM Provider Default

Edit `src/config.ts`:

```typescript
provider: (process.env.LLM_PROVIDER || "claude") as "openai" | "claude",
```

### Increase Crawl Timeout

Edit `src/config.ts`:

```typescript
timeout: 60000, // Was 30000
```

### Add More Competitors to Analysis

Edit `src/config.ts`:

```typescript
maxCompetitors: 10, // Was 5
```

## Troubleshooting Development

### TypeScript Errors After Changes

```bash
npm run type-check
```

### Dependencies Not Found

```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Already in Use

Change port in code or kill existing process:

```bash
lsof -i :3000
kill -9 <PID>
```

### Docker Issues

Rebuild without cache:

```bash
docker-compose build --no-cache dev
docker-compose up dev
```

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with tests
3. Commit: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Create Pull Request

## Resources

- [Firecrawl API Docs](https://docs.firecrawl.dev)
- [Tavily API Docs](https://tavily.com/api)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Claude API Docs](https://docs.anthropic.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [LangChain JS Docs](https://js.langchain.com)

---

Happy developing! 🚀
