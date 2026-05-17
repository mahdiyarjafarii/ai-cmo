# System Requirements & API Setup

Complete guide to setting up all required APIs and dependencies.

## System Requirements

### Hardware
- **RAM:** 2 GB minimum (4 GB recommended)
- **Storage:** 500 MB for installation and dependencies
- **Network:** Internet connection for API calls

### Software
- **Node.js:** 18.0.0 or higher (LTS recommended)
- **npm:** 9.0.0 or higher
- **Git:** 2.0 or higher (optional, for cloning repo)

Check versions:
```bash
node --version    # Should be v18.0.0 or higher
npm --version     # Should be 9.0.0 or higher
```

## API Keys Setup

You need 3-4 API keys from different services. All have free tiers available.

### 1. Firecrawl API (Required)

**Purpose:** Website scraping and content extraction

**Setup:**
1. Go to https://firecrawl.dev
2. Click "Get Started" or "Sign Up"
3. Create account (email verification required)
4. Go to Dashboard → API Keys
5. Copy your API key

**Free Tier:** 100 credits/month (sufficient for ~100 analyses)

**Pricing:** 
- Free: $0 for 100 credits
- Pay-as-you-go: $1 per 1000 credits (~1000 analyses)

**In .env:**
```env
FIRECRAWL_API_KEY=fc_your_key_here
```

### 2. Tavily API (Required)

**Purpose:** Competitor search and discovery

**Setup:**
1. Go to https://tavily.com
2. Click "Get API Key" or "Sign Up"
3. Create account
4. Go to Dashboard → API Keys
5. Copy your API key

**Free Tier:** 1000 searches/month (sufficient for unlimited analyses)

**Pricing:**
- Free: $0 for 1000 searches/month
- Paid: $10/month for unlimited searches

**In .env:**
```env
TAVILY_API_KEY=tvly_your_key_here
```

### 3. OpenAI API (Option A - Recommended for Beginners)

**Purpose:** LLM analysis (GPT-4o)

**Setup:**
1. Go to https://platform.openai.com
2. Sign up or log in
3. Go to Settings → API Keys
4. Click "Create new secret key"
5. Copy immediately (can't be retrieved again)

**Cost:**
- Free trial: $5 (usually expires in 3 months)
- Pay-as-you-go: ~$0.03 per analysis with GPT-4o
- Monitor usage at https://platform.openai.com/account/billing/overview

**Model:**
- GPT-4o is recommended (fastest, most capable)
- Can use gpt-4-turbo or gpt-3.5-turbo for cost savings

**In .env:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_your_key_here
OPENAI_MODEL=gpt-4o
```

### 4. Claude API (Option B - Alternative to OpenAI)

**Purpose:** LLM analysis (Claude 3.5 Sonnet)

**Setup:**
1. Go to https://console.anthropic.com
2. Sign up or log in
3. Go to API Keys
4. Click "Create Key"
5. Copy immediately

**Cost:**
- Free trial: Available for some accounts
- Pay-as-you-go: ~$0.03 per analysis with Claude 3.5 Sonnet
- Monitor usage in your console

**Model:**
- claude-3-5-sonnet-20241022 is recommended (best value)
- Can use claude-3-opus for higher quality

**In .env:**
```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk_ant_your_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

## Setup Checklist

### Step 1: Install Node.js

**macOS (using Homebrew):**
```bash
brew install node@18
node --version  # Should show v18.x.x
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
- Download from https://nodejs.org/ (LTS version)
- Run installer

### Step 2: Clone Repository

```bash
git clone <repository-url>
cd ai-competitor-analysis
```

Or if not using git, download and extract the files.

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- LangChain JS for LLM integration
- Axios for HTTP requests
- Pino for logging
- Yargs for CLI parsing

### Step 4: Get API Keys

Follow the steps above for:
- ✓ Firecrawl API key
- ✓ Tavily API key
- ✓ OpenAI OR Claude API key

### Step 5: Configure .env

```bash
cp .env.example .env
```

Edit `.env` with your keys:

**Option A: Using OpenAI**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4o

FIRECRAWL_API_KEY=fc_...
TAVILY_API_KEY=tvly_...

OUTPUT_DIR=./output
LOG_LEVEL=info
```

**Option B: Using Claude**
```env
LLM_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022

FIRECRAWL_API_KEY=fc_...
TAVILY_API_KEY=tvly_...

OUTPUT_DIR=./output
LOG_LEVEL=info
```

### Step 6: Validate Setup

```bash
bash scripts/validate.sh
```

Or manually:
```bash
npm run type-check
npm run build
```

### Step 7: Run First Analysis

```bash
npm run analyze -- --url=https://slack.com
```

Check output in `./output` directory.

## Cost Estimation

For monthly usage:

### Light Use (1-5 analyses/month)
- Firecrawl: Free tier (100 credits)
- Tavily: Free tier (1000 searches)
- LLM: Free trial or ~$0.15/month
- **Total: $0-5/month**

### Medium Use (10-50 analyses/month)
- Firecrawl: Free tier (100 credits)
- Tavily: Free tier (1000 searches)
- LLM: ~$0.50/month
- **Total: $0-10/month**

### Heavy Use (100+ analyses/month)
- Firecrawl: $10/month (~$1 per 100 credits)
- Tavily: Free tier includes 1000 searches (100 analyses)
- LLM: ~$3-5/month
- **Total: $15-20/month**

## Quota & Rate Limits

### Firecrawl
- Free: 100 credits/month
- 1 credit = ~1 page crawl
- Rate limit: 10 requests/minute
- Timeout: 30 seconds per page

### Tavily
- Free: 1000 searches/month
- 1 search = ~5 competitors found
- Rate limit: 100 requests/minute
- Includes 100 monthly searches for custom queries

### OpenAI
- Rate limit: Depends on account, typically 3,500 RPM
- Token limit: ~4,096 tokens per request (for gpt-4o)
- Cost: ~$0.03 per analysis

### Claude
- Rate limit: 50 requests per minute (free tier)
- Token limit: ~4,096 tokens per request
- Cost: ~$0.03 per analysis

## Troubleshooting Setup

### "Node.js not found"
```bash
node --version
# If not found, install from https://nodejs.org
```

### "npm install fails"
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### "API key rejected"
- Double-check key is copied completely (no extra spaces)
- Verify key hasn't been regenerated/revoked in service dashboard
- Check .env file format is correct: `KEY=value` (no quotes)

### "Type errors after install"
```bash
npm run type-check
# Fix any errors in .env or configuration
```

### "Build fails"
```bash
npm run clean
npm run build
# If still fails, check Node version and npm version
```

## Docker Setup (Alternative)

If you prefer not to install Node.js locally:

### Install Docker
- **Mac:** https://docs.docker.com/desktop/install/mac-install
- **Windows:** https://docs.docker.com/desktop/install/windows-install
- **Linux:** https://docs.docker.com/engine/install

### Run with Docker

```bash
# Create .env file
cp .env.example .env
# Edit .env with your API keys

# Build Docker image
docker build -t ai-analysis:latest .

# Run analysis
docker run -it \
  --env-file .env \
  -v $(pwd)/output:/app/output \
  ai-analysis:latest \
  node dist/main.js --url=https://example.com
```

Or use Docker Compose:
```bash
docker-compose up --build analyzer
```

## Production Deployment

For production use, consider:

1. **Environment Variables**
   - Never commit `.env` to git
   - Use secrets management (AWS Secrets, HashiCorp Vault)
   - Rotate API keys regularly

2. **Monitoring**
   - Monitor API quota usage
   - Log all analyses with timestamps
   - Alert on failures

3. **Scaling**
   - Use job queue (Bull, BullMQ)
   - Implement caching (Redis)
   - Database for result persistence
   - API wrapper with authentication

4. **Cost Control**
   - Monitor LLM token usage
   - Implement rate limiting
   - Cache results for repeated queries
   - Set API budget alerts

## Getting Help

### Documentation
- [README.md](./README.md) - Main documentation
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide

### API Documentation
- [Firecrawl Docs](https://docs.firecrawl.dev)
- [Tavily Docs](https://tavily.com/api)
- [OpenAI Docs](https://platform.openai.com/docs)
- [Claude Docs](https://docs.anthropic.com)

### Troubleshooting
1. Run `bash scripts/validate.sh` for diagnostics
2. Set `LOG_LEVEL=debug` in `.env` for verbose logging
3. Check API quotas in service dashboards
4. Verify network connectivity

### Common Issues

| Error | Solution |
|-------|----------|
| "Configuration validation failed" | Check all API keys are set in .env |
| "Failed to crawl" | Verify Firecrawl API key has quota |
| "No competitors found" | Check Tavily API key and try different URL |
| "LLM analysis failed" | Verify LLM API key and account balance |
| "ENOTFOUND" | Check internet connection |

---

**Ready to start?** Run `bash scripts/validate.sh` and then check [QUICKSTART.md](./QUICKSTART.md)
