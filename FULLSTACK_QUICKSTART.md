# Full Stack Quick Start (10 Minutes)

Get the complete AI Competitor Analysis Engine running with frontend and backend.

## Prerequisites

- Node.js 18+
- API Keys:
  - Firecrawl: https://firecrawl.dev/signup
  - Tavily: https://tavily.com/signup
  - OpenAI: https://platform.openai.com/api-keys (or Claude)

## Step 1: Setup Environment

```bash
# From project root
cp .env.example .env

# Edit .env with your API keys
nano .env
```

**Required in .env:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_...
FIRECRAWL_API_KEY=fc_...
TAVILY_API_KEY=tvly_...
PORT=3000
```

## Step 2: Install Dependencies

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

## Step 3: Run Both Services

### Option A: Two Terminals (Recommended for Development)

**Terminal 1 - Backend:**
```bash
npm run server
```

Expected output:
```
🚀 Server running on http://localhost:3000
📊 Frontend: http://localhost:3000
📡 API: http://localhost:3000/api
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
Local:   http://localhost:5173/
```

### Option B: Docker Compose

```bash
# Make sure .env is configured first
docker-compose up --build
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Step 4: Open Browser

1. Go to http://localhost:5173
2. Enter a company URL (e.g., https://slack.com)
3. Click "Analyze"
4. Watch real-time progress in the terminal
5. View results in the dashboard

## What Happens Behind the Scenes

```
1. Frontend sends POST /api/analyze with URL
2. Backend generates analysisId
3. Frontend subscribes to /api/events/:analysisId (Server-Sent Events)
4. Backend starts analysis:
   - Crawls website
   - Analyzes company profile
   - Searches for competitors
   - Crawls competitor sites
   - Generates competitive analysis
5. Backend streams progress messages in real-time
6. Frontend displays live progress terminal
7. Analysis complete → Dashboard displays results
8. User can download JSON or Markdown report
```

## Testing the API Directly

```bash
# Start analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://slack.com"}'

# Response:
# {"analysisId": "550e8400-e29b-41d4-a716-446655440000"}

# Stream events (replace with your analysisId)
curl -N http://localhost:3000/api/events/550e8400-e29b-41d4-a716-446655440000

# Get results (after analysis completes)
curl http://localhost:3000/api/result/550e8400-e29b-41d4-a716-446655440000

# Check health
curl http://localhost:3000/health
```

## Frontend Features

### Input Page
- Simple form to enter company URL
- Input validation
- Loading state with spinner
- Error display

### Analysis In Progress
- Real-time terminal showing all steps
- Auto-scrolling log
- Typing animations
- Progress indicators

### Dashboard (After Completion)
- **Left Panel:** Company info (description, ICP, features, pricing)
- **Center Panel:** List of identified competitors
- **Right Panel:** Tabbed analysis view
  - Overview: Positioning and differentiation
  - SWOT: Strengths, weaknesses, opportunities, threats
  - Feature Gaps: Missing vs unique features
  - Recommendations: Strategic advice

### Export Options
- Download as JSON (structured data)
- Download as Markdown (readable report)

### Additional Features
- New Analysis button to start over
- Responsive design (works on mobile/tablet)
- Dark theme
- Smooth animations
- Real-time SSE streaming

## Troubleshooting

### "Backend not responding"
```bash
# Check if backend is running
curl http://localhost:3000/health

# If not, backend might have crashed
# Check terminal for error messages
# Restart: npm run server
```

### "Cannot GET /"
```bash
# Frontend is trying to serve files that don't exist
# Make sure you're on http://localhost:5173 (frontend dev server)
# Not http://localhost:3000 (backend)
```

### "Analysis failed to start"
```bash
# Check .env has all required keys
cat .env

# Verify API keys work
# Visit Firecrawl, Tavily, OpenAI dashboards

# Check logs
LOG_LEVEL=debug npm run server
```

### "SSE connection not working"
```bash
# Check if browser supports Server-Sent Events
# All modern browsers support it

# Verify network in browser DevTools:
# 1. Open DevTools (F12)
# 2. Network tab
# 3. Look for /api/events/* requests
# 4. Should show 200 status with streaming responses
```

## Common Commands Quick Reference

```bash
# Development
npm run server              # Start backend
cd frontend && npm run dev  # Start frontend

# Type checking
npm run type-check
cd frontend && npm run type-check && cd ..

# Build for production
npm run build
cd frontend && npm run build && cd ..

# Production start
npm start

# Logs
LOG_LEVEL=debug npm run server
```

## What to Try

### 1. Quick Analysis (2-3 minutes)
```
URL: https://slack.com
→ See company profile, pricing, competitors
→ View competitive positioning
→ Download report
```

### 2. E-commerce Site
```
URL: https://shopify.com
→ ICP-focused analysis
→ E-commerce competitors
```

### 3. Developer Tool
```
URL: https://vercel.com
→ Developer audience
→ SaaS competitors
```

### 4. Your Own Company
```
URL: https://yourcompany.com
→ Understand your competitive position
→ Identify feature gaps
→ Get strategic recommendations
```

## Key Technologies

**Backend:**
- Node.js + Express
- TypeScript
- Real-time streaming (Server-Sent Events)
- LLM: OpenAI GPT-4o or Claude
- APIs: Firecrawl (crawling), Tavily (search)

**Frontend:**
- React 18 with TypeScript
- Vite (ultra-fast build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Zustand (state management)
- Axios (HTTP client)

## Next Steps

1. ✓ Set up .env
2. ✓ Run `npm run server` in Terminal 1
3. ✓ Run `cd frontend && npm run dev` in Terminal 2
4. ✓ Open http://localhost:5173
5. ✓ Analyze a company
6. ✓ Review results
7. ✓ Download report

## Production Deployment

Once development is complete:

```bash
# Build both applications
npm run build
cd frontend && npm run build && cd ..

# Using Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:3000/health
```

See FULLSTACK_SETUP.md for detailed production guide.

## Documentation

- **FULLSTACK_SETUP.md** - Complete setup and deployment
- **frontend/README.md** - Frontend-specific documentation
- **README.md** - Main project documentation
- **REQUIREMENTS.md** - System and API requirements

## Getting Help

**Terminal errors?**
1. Check console output for error messages
2. Verify .env is set up correctly
3. Test APIs in their dashboards
4. Set LOG_LEVEL=debug for verbose output

**Frontend not loading?**
1. Clear browser cache (Ctrl+Shift+Del)
2. Hard refresh (Ctrl+F5)
3. Check browser console (F12) for errors

**Results not showing?**
1. Wait longer (first analysis is slower)
2. Check browser Network tab
3. Verify /api/events connection
4. Look for error messages

## Done! 🎉

You now have a full-stack AI competitor analysis engine running locally.

**Start analyzing:** http://localhost:5173
