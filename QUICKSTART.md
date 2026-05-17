# Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- API keys for:
  - Firecrawl (https://firecrawl.dev) - Free tier available
  - Tavily (https://tavily.com) - Free tier available
  - OpenAI OR Claude

## Installation

```bash
# 1. Clone/download the project
cd ai-competitor-analysis

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Edit .env with your API keys
# Get free keys from:
# - Firecrawl: https://firecrawl.dev/signup
# - Tavily: https://tavily.com/signup
# - OpenAI: https://platform.openai.com/api-keys
nano .env
```

## Configure .env

Edit `.env` with your API keys:

```env
# OpenAI (recommended for beginners)
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o

# Crawling
FIRECRAWL_API_KEY=fc_your-key-here

# Search
TAVILY_API_KEY=tvly_your-key-here

# Output location
OUTPUT_DIR=./output
LOG_LEVEL=info
```

Or use Claude:

```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-your-key-here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

## Run Your First Analysis

```bash
# Build the project
npm run build

# Analyze a company
npm run analyze -- --url=https://slack.com

# Or run in dev mode (auto-recompile)
npm run dev -- --url=https://slack.com
```

## Expected Output

```
============================================================
ANALYSIS COMPLETE
============================================================

Company: Slack
URL: https://slack.com
Competitors Found: 5

Output Directory: /path/to/output
============================================================
```

Check the output directory:
- `2024-01-15_slack.json` - Structured data
- `2024-01-15_slack.md` - Readable report

## Example Analyses

### SaaS Products
```bash
npm run analyze -- --url=https://notion.so
npm run analyze -- --url=https://figma.com
npm run analyze -- --url=https://stripe.com
```

### E-commerce
```bash
npm run analyze -- --url=https://shopify.com
npm run analyze -- --url=https://wix.com
```

### Developer Tools
```bash
npm run analyze -- --url=https://github.com
npm run analyze -- --url=https://vercel.com
```

## Output Examples

### JSON Output (`.json`)

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "company": {
    "name": "Slack",
    "url": "https://slack.com",
    "description": "Leading team communication platform",
    "icp": "Mid-market to enterprise teams",
    "features": [
      "Real-time messaging",
      "Channel organization",
      "File sharing",
      "Integrations"
    ],
    "pricing": {
      "model": "Subscription",
      "tiers": ["Free", "Pro", "Business+", "Enterprise"],
      "range": "$8 - Custom"
    }
  },
  "competitors": [
    {
      "name": "Microsoft Teams",
      "url": "https://teams.microsoft.com",
      "relevanceScore": 0.95
    }
  ],
  "analysis": {
    "positioningComparison": "...",
    "strengths": {...},
    "weaknesses": {...}
  }
}
```

### Markdown Report (`.md`)

Professional markdown report with:
- Executive summary
- Company overview with ICP and pricing
- Competitive landscape table
- SWOT analysis
- Feature comparison
- Strategic recommendations

## Common Commands

```bash
# Run analysis
npm run analyze -- --url=https://example.com

# Custom output format
npm run analyze -- --url=https://example.com --format=markdown

# Custom output directory
npm run analyze -- --url=https://example.com --output-dir=./reports

# Verbose logging for debugging
npm run analyze -- --url=https://example.com --verbose

# Type checking
npm run type-check

# Development with hot reload
npm run dev -- --url=https://example.com
```

## Troubleshooting

### "Configuration validation failed"

```
Error: FIRECRAWL_API_KEY is required
```

**Solution:** Make sure `.env` file exists and has all required keys:

```bash
# Check your .env file
cat .env

# Should include:
# FIRECRAWL_API_KEY=...
# TAVILY_API_KEY=...
# OPENAI_API_KEY=... OR CLAUDE_API_KEY=...
```

### "Failed to crawl website"

```
Failed to crawl website after 3 attempts
```

**Possible causes:**
- URL is incorrect or website is down
- Firecrawl API key is invalid
- Website blocks automated crawling (rare)

**Solution:**
```bash
# Test the URL in your browser first
# Verify API key at: https://firecrawl.dev/dashboard
# Check usage quota
```

### "No competitors found"

**Solution:**
- Company might be too niche
- Try a different/more specific URL
- Check Tavily search configuration

### LLM Errors

**OpenAI errors:**
```bash
# Check API key format (starts with sk-)
# Verify account has credits
# Check rate limits at https://platform.openai.com/account/rate-limits
```

**Claude errors:**
```bash
# Check API key format (starts with sk-ant-)
# Verify account is active
```

## Next Steps

1. **Batch Analysis:** Analyze multiple companies at once
2. **API Server:** Expose analysis as REST API
3. **Custom Prompts:** Modify analysis prompts in `src/prompts/index.ts`
4. **Database:** Store results in PostgreSQL/MongoDB
5. **Scheduling:** Run analyses on a schedule with cron

## Getting Free API Credits

- **Firecrawl:** Free tier available (100 credits/month)
  - https://firecrawl.dev/pricing
- **Tavily:** Free tier available (1000 searches/month)
  - https://tavily.com/pricing
- **OpenAI:** $5 free trial
  - https://platform.openai.com/account/billing/overview

## Need Help?

- Check the main [README.md](./README.md)
- Review logs: `LOG_LEVEL=debug npm run analyze ...`
- Check API documentation:
  - [Firecrawl Docs](https://docs.firecrawl.dev)
  - [Tavily Docs](https://tavily.com/api)
  - [OpenAI API](https://platform.openai.com/docs)
  - [Claude API](https://docs.anthropic.com)

---

Happy analyzing! 🚀
