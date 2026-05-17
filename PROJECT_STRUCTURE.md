# Project Structure Reference

Complete directory structure and file descriptions for the AI Competitor Analysis Engine.

## Directory Tree

```
ai-competitor-analysis/
├── src/                          # Source code (TypeScript)
│   ├── agent/
│   │   └── analyzer.ts          # Main analysis orchestrator
│   ├── services/
│   │   ├── crawler.ts           # Firecrawl API wrapper
│   │   ├── search.ts            # Tavily search API wrapper
│   │   └── llm.ts               # LLM integration (OpenAI/Claude)
│   ├── tools/
│   │   └── index.ts             # Agent tools/capabilities
│   ├── formatters/
│   │   └── report.ts            # Output formatting (JSON/Markdown)
│   ├── prompts/
│   │   └── index.ts             # LLM prompt templates
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── config.ts                # Configuration management
│   ├── logger.ts                # Pino logging setup
│   └── main.ts                  # CLI entry point
├── dist/                         # Compiled JavaScript (gitignored)
├── output/                       # Analysis results (gitignored)
├── examples/
│   ├── sample-output.json       # Example JSON report
│   └── sample-output.md         # Example Markdown report
├── .github/
│   └── workflows/
│       └── build.yml            # CI/CD pipeline
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── docker-compose.yml          # Docker Compose setup
├── Makefile                    # Common commands
├── README.md                   # Main documentation
├── QUICKSTART.md               # Quick start guide
├── DEVELOPMENT.md              # Development guide
└── PROJECT_STRUCTURE.md        # This file
```

## Core Files Description

### Configuration & Setup

#### `.env.example`
Environment variable template. Copy to `.env` and fill in API keys.
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=...
FIRECRAWL_API_KEY=...
TAVILY_API_KEY=...
```

#### `package.json`
NPM dependencies and scripts:
- `npm run build` - Compile TypeScript
- `npm run dev` - Watch mode
- `npm run analyze` - Run analysis
- `npm run type-check` - Type checking

#### `tsconfig.json`
TypeScript compiler configuration. Strict mode enabled.

#### `Makefile`
Convenient commands:
- `make install` - Install dependencies
- `make build` - Build project
- `make analyze URL=...` - Run analysis
- `make setup` - Initial setup

### Source Code

#### `src/main.ts` - CLI Entry Point
- Parses command-line arguments with yargs
- Validates configuration
- Runs analysis
- Saves JSON and/or Markdown output
- Handles errors and logging

**Key exports:** `main()` function

#### `src/agent/analyzer.ts` - Analysis Orchestrator
Core analysis workflow in `CompanyAnalysisAgent` class:

1. Crawls target website
2. Extracts company profile via LLM
3. Searches for competitors
4. Crawls competitor websites
5. Extracts competitor profiles
6. Analyzes competitive position
7. Generates final report

**Key method:** `analyze(targetUrl: string): Promise<AnalysisResult>`

#### `src/services/crawler.ts` - Web Crawling
`WebCrawler` class wraps Firecrawl API:
- `crawlWebsite(url: string)` - Crawl single page
- `crawlMultiple(urls: string[])` - Crawl multiple pages
- Retry logic (3 attempts with exponential backoff)
- Content cleaning

#### `src/services/search.ts` - Competitor Search
`CompetitorSearch` class wraps Tavily API:
- `findCompetitors(description: string)` - Find competitors
- Query building from company description
- Result filtering (removes spam domains)

#### `src/services/llm.ts` - LLM Integration
`LLMService` class handles LLM calls:
- Supports OpenAI (GPT-4o) and Claude
- Pluggable provider pattern
- `analyzeText(prompt: string)` - Send prompt to LLM
- `extractJSON<T>(text: string)` - Parse JSON from response

#### `src/tools/index.ts` - Agent Capabilities
`AgentTools` class exposes high-level capabilities:
- `extractCompanyProfile()` - Parse website → company info
- `searchCompetitors()` - Find competitors
- `crawlCompetitors()` - Fetch competitor sites
- `extractCompetitorProfiles()` - Parse competitor profiles
- `analyzeCompetitivePosition()` - Generate competitive analysis
- `generateReport()` - Create markdown report

#### `src/config.ts` - Configuration
Loads and validates environment variables:
```typescript
config.llm.provider          // "openai" or "claude"
config.llm.openai.apiKey    // OpenAI API key
config.crawling.firecrawlApiKey  // Firecrawl key
config.search.tavilyApiKey  // Tavily key
config.logging.level        // Log level
config.output.dir          // Output directory
```

#### `src/logger.ts` - Logging Setup
Pino logger configured with:
- Pretty printing
- Configurable level
- Timestamp formatting

#### `src/types/index.ts` - TypeScript Interfaces

Key interfaces:
- `WebsiteContent` - Crawled website data
- `CompanyProfile` - Extracted company info
- `Competitor` - Competitor info
- `CompetitorAnalysis` - Analysis results
- `AnalysisResult` - Full analysis output
- `SearchResult` - Search result

#### `src/prompts/index.ts` - LLM Prompts

Exported prompts:
- `PROMPTS.analyzeCompany` - Extract company profile
- `PROMPTS.findCompetitors` - Identify competitors
- `PROMPTS.analyzeCompetitors` - Generate competitive analysis
- `PROMPTS.generateReport` - Create markdown report

#### `src/formatters/report.ts` - Output Formatting

`ReportFormatter` class:
- `generateMarkdown(result: AnalysisResult)` - Create MD report
- `generateJSON(result: AnalysisResult)` - Create JSON output
- Markdown includes all analysis sections

### Documentation

#### `README.md`
Main documentation:
- Features overview
- Tech stack
- Setup instructions
- Usage examples
- Output formats
- Troubleshooting
- Deployment guide

#### `QUICKSTART.md`
5-minute setup guide:
- Prerequisites
- Installation
- Configuration
- Running first analysis
- Examples
- Common commands
- Troubleshooting

#### `DEVELOPMENT.md`
Developer guide:
- Project architecture
- Adding features
- Configuration
- Debugging
- Testing
- Docker development
- Code style

### Docker & Deployment

#### `Dockerfile`
Production-grade image:
- Based on `node:18-alpine`
- Installs production dependencies only
- Uses dumb-init for signal handling
- Creates output directory

#### `Dockerfile.dev`
Development image:
- Includes dev dependencies
- Mounts source code as volume
- Runs npm run dev for watch mode

#### `docker-compose.yml`
Local development setup:
- `analyzer` service for production image
- `dev` service for development mode
- Environment variable mapping
- Volume mounts for output

### CI/CD

#### `.github/workflows/build.yml`
GitHub Actions pipeline:
- Build and test on Node 18 and 20
- Type checking
- Docker image build
- Runs on push to main/develop

### Examples

#### `examples/sample-output.json`
Real example of JSON analysis output showing:
- Company profile (Slack)
- Competitors identified
- Competitive analysis results
- Strengths/weaknesses
- Feature gaps
- Recommendations

#### `examples/sample-output.md`
Real example of Markdown report showing:
- Executive summary
- Company overview
- Competitive landscape
- Positioning analysis
- SWOT analysis
- Strategic recommendations

## File Size Summary

```
Core Application:
  src/main.ts                ~300 lines
  src/agent/analyzer.ts      ~200 lines
  src/services/             ~400 lines total
  src/tools/index.ts        ~200 lines
  src/formatters/           ~200 lines
  
Configuration:
  src/config.ts             ~50 lines
  src/logger.ts             ~20 lines
  src/types/index.ts        ~80 lines
  
Documentation:
  README.md                 ~400 lines
  QUICKSTART.md            ~250 lines
  DEVELOPMENT.md           ~400 lines
  
Config Files:
  package.json             ~50 lines
  tsconfig.json            ~30 lines
  .env.example             ~20 lines
```

## Data Flow

```
User Input (URL)
    ↓
main.ts (Parse CLI args)
    ↓
analyzer.ts (Orchestrate)
    ↓
┌─ crawler.ts (Crawl target site)
├─ llm.ts (Extract company profile)
├─ search.ts (Find competitors)
├─ crawler.ts (Crawl competitors)
├─ llm.ts (Extract competitor profiles)
└─ llm.ts (Analyze competitive position)
    ↓
formatters/report.ts (Generate output)
    ↓
Output (JSON + Markdown)
```

## API Integration Points

### External APIs Used
1. **Firecrawl** - Website scraping
2. **Tavily** - Competitor search
3. **OpenAI** - GPT-4o LLM
4. **Anthropic** - Claude LLM

### API Call Sequence
```
1. Firecrawl.scrape(targetUrl)
   → WebsiteContent

2. LLM.analyze(content)
   → CompanyProfile

3. Tavily.search(companyDescription)
   → SearchResults

4. Firecrawl.scrape(competitorUrls) × N
   → WebsiteContents[]

5. LLM.analyze(competitorContent) × N
   → CompetitorProfiles[]

6. LLM.analyze(allProfiles + question)
   → CompetitorAnalysis

7. LLM.analyze(analysis + template)
   → MarkdownReport
```

## Environment Variables

Required:
- `LLM_PROVIDER` - "openai" or "claude"
- Either `OPENAI_API_KEY` or `CLAUDE_API_KEY`
- `FIRECRAWL_API_KEY`
- `TAVILY_API_KEY`

Optional:
- `OPENAI_MODEL` - Default: gpt-4o
- `CLAUDE_MODEL` - Default: claude-3-5-sonnet-20241022
- `LOG_LEVEL` - Default: info
- `OUTPUT_DIR` - Default: ./output

## Adding New Features

### To Add a New Analysis Feature
1. Create service in `src/services/`
2. Add interface to `src/types/index.ts`
3. Create tool in `src/tools/index.ts`
4. Call from `src/agent/analyzer.ts`
5. Update report formatter if needed

### To Change LLM Provider
Edit `src/config.ts`:
- Change default `LLM_PROVIDER`
- Update env validation in `validateConfig()`

### To Add New Output Format
1. Add method to `src/formatters/report.ts`
2. Update CLI in `src/main.ts`
3. Add to format options

## Scaling Considerations

For production at scale:
- Add database layer for result storage
- Implement job queue (Bull, BullMQ)
- Add caching layer (Redis)
- Expose REST API (Express, Fastify)
- Add authentication
- Implement rate limiting
- Monitor token usage
- Add observability (APM, distributed tracing)

---

**Last Updated:** 2024
**Version:** 1.0.0
