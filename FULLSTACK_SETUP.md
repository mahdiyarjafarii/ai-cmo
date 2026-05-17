# Full Stack Setup & Deployment

Complete guide to running the AI Competitor Analysis Engine with frontend and backend together.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│   http://localhost:5173                 │
│  - Input form                           │
│  - Real-time progress tracking          │
│  - Dashboard with analysis results      │
└──────────────┬──────────────────────────┘
               │ (HTTP + Server-Sent Events)
┌──────────────▼──────────────────────────┐
│      Express.js Backend                 │
│   http://localhost:3000                 │
│  - POST /api/analyze                    │
│  - GET /api/events/:analysisId (SSE)    │
│  - GET /api/result/:analysisId          │
│  - GET /api/history                     │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┬──────────┬────────────┐
        │             │          │            │
    ┌───▼──┐  ┌──────▼──┐  ┌───▼────┐  ┌───▼──┐
    │Fire  │  │ Tavily  │  │OpenAI/ │  │Agent │
    │crawl │  │ Search  │  │Claude  │  │Logic │
    └──────┘  └─────────┘  └────────┘  └──────┘
```

## Quick Start (Development)

### Terminal 1: Backend
```bash
# Navigate to project root
cd /path/to/cmo

# Install dependencies (if not done)
npm install

# Create/update .env
cp .env.example .env
# Edit .env with your API keys

# Start backend server (port 3000)
npm run server
```

### Terminal 2: Frontend
```bash
# Navigate to frontend directory
cd /path/to/cmo/frontend

# Install dependencies (if not done)
npm install

# Start dev server (port 5173)
npm run dev
```

### Open in Browser
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- API Health: http://localhost:3000/health

## Backend API Endpoints

### POST /api/analyze
Start a new analysis

**Request:**
```json
{
  "url": "https://slack.com"
}
```

**Response:**
```json
{
  "analysisId": "uuid-here"
}
```

### GET /api/events/:analysisId
Server-Sent Events stream for real-time progress

**Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Events:**
```
event: progress
data: {"type":"progress","message":"...","timestamp":"..."}

event: complete
data: {"type":"complete","message":"...","data":{"result":{...}}}
```

### GET /api/result/:analysisId
Get completed analysis result

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "company": {...},
  "competitors": [...],
  "analysis": {...}
}
```

### GET /api/history
Get last 10 analyses

**Response:**
```json
[
  {...analysis result...},
  {...analysis result...}
]
```

### GET /health
Health check

## Environment Variables

Both frontend and backend need `.env` file in their respective roots:

### Backend (.env)
```env
# LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4o

# External APIs
FIRECRAWL_API_KEY=fc_...
TAVILY_API_KEY=tvly_...

# Server
PORT=3000
LOG_LEVEL=info

# Output
OUTPUT_DIR=./output
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:3000
```

## Running Tests

### Type Check
```bash
# Backend
npm run type-check

# Frontend
cd frontend
npm run type-check
```

### Build
```bash
# Backend
npm run build

# Frontend
cd frontend
npm run build
```

## Production Deployment

### 1. Build Both Applications
```bash
# Backend
npm install
npm run build

# Frontend
cd frontend
npm install
npm run build
```

### 2. Using Docker Compose
```bash
# Build and run both services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 3. Manual Deployment

#### Backend
```bash
# Install production dependencies
npm ci --only=production

# Set environment variables
export NODE_ENV=production
export PORT=3000
export LLM_PROVIDER=openai
export OPENAI_API_KEY=...
# ... other env vars

# Start server
npm start
```

#### Frontend
```bash
# Built files in frontend/dist
# Serve with your HTTP server (nginx, Apache, etc.)
# Or use Node.js:
cd frontend
npx serve -s dist -l 3000
```

## Docker Deployment

### Development
```bash
# Backend
docker build -f Dockerfile.dev -t ai-analysis-backend:dev .
docker run -p 3000:3000 --env-file .env ai-analysis-backend:dev

# Frontend
cd frontend
docker build -f Dockerfile.dev -t ai-analysis-frontend:dev .
docker run -p 5173:5173 ai-analysis-frontend:dev
```

### Production
```bash
# Build backend
docker build -t ai-analysis-backend:latest .
docker run -p 3000:3000 --env-file .env ai-analysis-backend:latest

# Build frontend
cd frontend
docker build -t ai-analysis-frontend:latest .
docker run -p 5173:5173 ai-analysis-frontend:latest
```

### Docker Compose
```bash
# Development
docker-compose up --build

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## Troubleshooting

### Frontend Can't Connect to Backend
```
Issue: "Failed to connect to server"

Solutions:
1. Verify backend is running: curl http://localhost:3000/health
2. Check VITE_API_URL in frontend/.env.local
3. Check backend CORS configuration
4. Review browser console for error details
```

### Backend Fails to Start
```
Issue: "Error: listen EADDRINUSE: address already in use :::3000"

Solutions:
1. Change PORT: PORT=3001 npm run server
2. Kill existing process: lsof -i :3000 && kill -9 <PID>
3. Check if another service is using port 3000
```

### SSE Not Working
```
Issue: "Connection closed" or no progress updates

Solutions:
1. Check browser Network tab for /api/events calls
2. Verify backend is emitting progress events
3. Check for reverse proxy issues (nginx, etc.)
4. Enable debug logs: LOG_LEVEL=debug
```

### API Key Errors
```
Issue: "Configuration validation failed"

Solutions:
1. Verify .env file exists in project root
2. Check all required keys are present
3. Verify no extra spaces around values
4. Test each API key individually in their dashboards
```

## Performance Tuning

### Backend Optimizations
```bash
# Increase Node.js memory
NODE_OPTIONS=--max-old-space-size=4096 npm start

# Enable compression
# Already included in express middleware

# Use clustering for multiple cores
# Can be added to server.ts with cluster module
```

### Frontend Optimizations
```bash
# Build with optimizations
npm run build

# Analyze bundle size
npm install -D webpack-bundle-analyzer
```

## Monitoring & Logging

### Backend Logs
```bash
# Set log level
LOG_LEVEL=debug npm run server

# Levels: debug, info, warn, error
```

### Frontend Errors
```bash
# Check browser console
# Network tab for API calls
# Application storage for state
```

## Scaling for Production

### Database
Replace in-memory storage with database:
```typescript
// In routes/analyze.ts
import { prisma } from './db';

// Store results in database instead of Map
const result = await prisma.analysis.create({
  data: { analysisId, result }
});
```

### Caching
```typescript
// Add Redis for caching results
import redis from 'redis';
const client = redis.createClient();

// Cache frequently requested analyses
```

### Job Queue
```typescript
// Replace background analysis with Bull/BullMQ
import Queue from 'bull';
const analysisQueue = new Queue('analysis');

analysisQueue.process(async (job) => {
  // Run analysis
});
```

### Load Balancing
```nginx
# nginx configuration
upstream backend {
  server localhost:3000;
  server localhost:3001;
  server localhost:3002;
}

server {
  listen 80;
  location /api {
    proxy_pass http://backend;
  }
}
```

## Continuous Integration

### GitHub Actions
See `.github/workflows/build.yml` for:
- Type checking
- Building
- Testing
- Docker image creation

## File Structure

```
/cmo
├── src/
│   ├── server.ts              # Express server
│   ├── routes/analyze.ts      # API endpoints
│   ├── services/streaming.ts  # SSE manager
│   └── ... (other backend files)
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Pages
│   │   ├── services/api.ts    # API integration
│   │   ├── store/             # Zustand store
│   │   └── App.tsx            # Main component
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── .env.example
├── package.json
├── Dockerfile
└── docker-compose.yml
```

## Common Commands

```bash
# Install all dependencies
npm install
cd frontend && npm install && cd ..

# Run both (separate terminals)
# Terminal 1:
npm run server

# Terminal 2:
cd frontend && npm run dev

# Type check both
npm run type-check
cd frontend && npm run type-check && cd ..

# Build both
npm run build
cd frontend && npm run build && cd ..

# Production start
npm start

# Clean
npm run clean
cd frontend && npm run clean && cd ..
```

## Security Notes

1. **Environment Variables:** Never commit .env to git
2. **CORS:** Configure for your domain in production
3. **Rate Limiting:** Add to routes/analyze.ts if needed
4. **Authentication:** Consider adding JWT for user management
5. **Data Privacy:** Results stored in memory (add DB for persistence)

## Support

- Backend issues: Check logs with `LOG_LEVEL=debug`
- Frontend issues: Check browser console
- API issues: Test endpoints with `curl` or Postman
- See REQUIREMENTS.md for API setup
- See DEVELOPMENT.md for extending functionality

## Next Steps

1. ✓ Start backend: `npm run server`
2. ✓ Start frontend: `cd frontend && npm run dev`
3. ✓ Open browser: http://localhost:5173
4. ✓ Enter a company URL
5. ✓ Watch real-time analysis progress
6. ✓ Review competitive intelligence

---

**Both services running? Let's analyze!** 🚀
