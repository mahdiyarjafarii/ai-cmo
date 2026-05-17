# AI Competitor Analysis Engine

A production-ready Node.js agent that performs automated company and competitor analysis from a given URL. The system crawls websites, extracts business information, identifies competitors, and generates comprehensive competitive analysis reports.

## Features

✅ **Automated Website Crawling** - Extract content from company websites using Firecrawl  
✅ **AI-Powered Business Analysis** - Extract company details (ICP, features, pricing, positioning)  
✅ **Competitor Discovery** - Use Tavily search to find competing companies  
✅ **Competitor Crawling** - Extract information from competitor websites  
✅ **Structured Analysis** - Generate detailed competitive landscape analysis  
✅ **Multi-Format Output** - JSON + Markdown reports  
✅ **Flexible LLM Support** - OpenAI (GPT-4o) or Claude API  
✅ **Production-Grade** - TypeScript, error handling, logging, retry logic  

## Tech Stack

- **Runtime:** Node.js 18+ 
- **Language:** TypeScript
- **APIs:**
  - Firecrawl (web crawling)
  - Tavily (competitor search)
  - OpenAI or Anthropic (LLM analysis)
- **Libraries:**
  - LangChain JS (LLM orchestration)
  - Pino (logging)
  - Axios (HTTP)
  - Yargs (CLI)

## Project Structure

```
.
├── src/
│   ├── agent/
│   │   └── analyzer.ts          # Main analysis orchestrator
│   ├── services/
│   │   ├── crawler.ts           # Website crawling with Firecrawl
│   │   ├── search.ts            # Competitor search with Tavily
│   │   └── llm.ts               # LLM integration (OpenAI/Claude)
│   ├── tools/
│   │   └── index.ts             # Agent tools and capabilities
│   ├── formatters/
│   │   └── report.ts            # Markdown & JSON formatting
│   ├── prompts/
│   │   └── index.ts             # LLM prompts
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── config.ts                # Configuration management
│   ├── logger.ts                # Logging setup
│   └── main.ts                  # CLI entry point
├── .env.example                 # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd ai-competitor-analysis
npm install
```

### 2. Configure API Keys

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

**Required API Keys:**
- **FIRECRAWL_API_KEY** - Get from [firecrawl.dev](https://firecrawl.dev)
- **TAVILY_API_KEY** - Get from [tavily.com](https://tavily.com)
- **OpenAI OR Claude credentials:**
  - OpenAI: `OPENAI_API_KEY` and optionally `OPENAI_MODEL`
  - Claude: `CLAUDE_API_KEY` and optionally `CLAUDE_MODEL`

`.env` file example:

```env
# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# APIs
FIRECRAWL_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here

# Output
OUTPUT_DIR=./output
LOG_LEVEL=info
```

### 3. Build

```bash
npm run build
```

## Usage

### CLI - Analyze a Company

```bash
# Provide URL as argument
npm run analyze -- --url=https://example.com

# Provide URL interactively (if running in terminal)
npm run analyze

# Specify output format
npm run analyze -- --url=https://example.com --format=markdown

# Custom output directory
npm run analyze -- --url=https://example.com --output-dir=./reports

# Verbose logging
npm run analyze -- --url=https://example.com --verbose
```

### Options

```
--url, -u              Target company URL to analyze
--output-dir, -o       Output directory for results (default: ./output)
--format, -f           Output format: json | markdown | both (default: both)
--verbose, -v          Enable verbose logging
--help                 Show help
```

### Example Output

```
============================================================
ANALYSIS COMPLETE
============================================================

Company: Example Company
URL: https://example.com
Competitors Found: 5

Output Directory: /path/to/output
============================================================
```

Generated files:
- `2024-01-15_example-company.json` - Structured data
- `2024-01-15_example-company.md` - Readable report

## Output Format

### JSON Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "company": {
    "name": "Company Name",
    "url": "https://...",
    "description": "...",
    "icp": "...",
    "features": [...],
    "pricing": {...},
    "valueProposition": "...",
    "industry": "..."
  },
  "competitors": [
    {
      "name": "Competitor Name",
      "url": "https://...",
      "relevanceScore": 0.85,
      "profile": {...}
    }
  ],
  "analysis": {
    "positioningComparison": "...",
    "strengths": {...},
    "weaknesses": {...},
    "featureGaps": {...},
    "marketDifferentiation": "...",
    "recommendations": [...]
  }
}
```

### Markdown Report

Includes sections:
- Executive Summary
- Company Overview
- Competitive Landscape
- Positioning Analysis
- Strengths & Weaknesses
- Feature Gaps & Differentiators
- Market Differentiation
- Strategic Recommendations

## LLM Provider Configuration

### Using OpenAI (Default)

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

### Using Claude

```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

## Development

### Watch Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

### Build Production

```bash
npm run build
npm start -- --url=https://example.com
```

## Error Handling & Retry Logic

The system includes:
- **Automatic retries** on failed crawls (3 attempts with exponential backoff)
- **Graceful degradation** if competitor crawling partially fails
- **Comprehensive logging** with Pino
- **Input validation** before processing

## Performance Considerations

- **Crawling timeout:** 30 seconds per page
- **Search limit:** Top 5 competitors max
- **Token limits:** 4096 max tokens per LLM call
- **Rate limiting:** 1 second delay between competitor crawls

## Example Analysis Workflow

1. **Input:** `https://saas-product.com`
2. **Crawl:** Extract homepage, about, pricing pages
3. **Extract:** LLM analyzes content → company profile
4. **Search:** Find competitors via Tavily
5. **Crawl Competitors:** Fetch competitor websites
6. **Analyze:** LLM generates competitive insights
7. **Output:** JSON + Markdown report

## Troubleshooting

### API Key Errors
```
Configuration validation failed: FIRECRAWL_API_KEY is required
```
Ensure all required keys are in `.env`

### Crawling Failures
```
Failed to crawl website after 3 attempts
```
- Check URL is valid and publicly accessible
- Verify Firecrawl API key has quota
- Check network connectivity

### LLM Errors
```
LLM analysis failed: Invalid API key
```
- Verify LLM provider credentials
- Check API key has correct permissions
- Ensure sufficient account balance

### Memory/Performance
For large-scale analysis:
- Reduce competitor sample size
- Use streaming for large reports
- Implement caching layer

## Production Deployment

### Environment Setup

```bash
export NODE_ENV=production
export LOG_LEVEL=warn
export OUTPUT_DIR=/var/lib/analysis/output
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/main.js", "--url", "$TARGET_URL"]
```

### Scaling

For concurrent analyses:
- Use a job queue (Bull, BullMQ)
- Implement database for result storage
- Add API layer with Express/Fastify
- Monitor API quotas and rate limits

## API Integration (Optional)

To expose as an API, create `src/api/server.ts`:

```typescript
import express from "express";
import { CompanyAnalysisAgent } from "../agent/analyzer";

const app = express();
app.use(express.json());

app.post("/analyze", async (req, res) => {
  try {
    const { url } = req.body;
    const agent = new CompanyAnalysisAgent();
    const result = await agent.analyze(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(3000);
```

## Limitations

- Requires public URLs (can't crawl behind auth walls)
- Dependent on LLM quality (results vary by model)
- Search may not find very new/small competitors
- Pricing data often requires manual extraction
- Rate limits on external APIs apply

## Future Enhancements

- [ ] Historical competitor tracking
- [ ] Custom analysis templates
- [ ] Batch processing for multiple companies
- [ ] Browser automation fallback
- [ ] Database backend for results
- [ ] REST API wrapper
- [ ] WebSocket streaming for real-time analysis

## Contributing

Contributions welcome! Areas for improvement:
- Better prompt engineering
- Additional data sources
- Performance optimization
- Enhanced error handling

## License

MIT

## Support

For issues or questions:
- Check `.env` configuration
- Review logs with `LOG_LEVEL=debug`
- Verify API credentials and quotas
- Check network/firewall settings

---

**Built with ❤️ for AI-driven business intelligence**
