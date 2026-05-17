# Architecture — AI CMO

How the system works, end-to-end.

---

## 1. High-Level View

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │           React + Vite Frontend (port 5173)          │    │
│  │                                                      │    │
│  │   InputPanel  →  AnalysisView (live + dashboard)     │    │
│  │       │                  ↑                           │    │
│  │       │ POST /analyze    │ SSE /events/:id           │    │
│  └───────┼──────────────────┼───────────────────────────┘    │
└──────────┼──────────────────┼────────────────────────────────┘
           ▼                  │
┌──────────────────────────────────────────────────────────────┐
│            Express API Server (port 3000)                    │
│                                                              │
│   routes/analyze.ts  ←→  services/streaming.ts               │
│           │                       ▲                          │
│           ▼                       │  emit(step, status)      │
│   agent/analyzer.ts  ─────────────┘                          │
│           │                                                  │
│           ▼                                                  │
│   ┌─────────┬─────────┬─────────┬─────────┬─────────┐        │
│   │crawler  │ search  │   llm   │enrichmnt│  tools  │        │
│   └────┬────┴────┬────┴────┬────┴────┬────┴────┬────┘        │
└────────┼─────────┼─────────┼─────────┼─────────┼─────────────┘
         ▼         ▼         ▼         ▼         ▼
     Firecrawl  Tavily   OpenAI    Clearbit   (in-process)
```

**Two processes:**
1. **Frontend** (Vite dev server, 5173) — React UI, talks to backend over HTTP + SSE
2. **Backend** (Node.js + Express, 3000) — orchestrates the agent and streams progress

**Three streams of data:**
1. **HTTP request** — `POST /api/analyze { url }` returns an `analysisId` immediately
2. **SSE stream** — `GET /api/events/:analysisId` pushes step events as they happen
3. **Final result** — embedded in the `complete` SSE event (also fetchable via `GET /api/result/:id`)

---

## 2. Request Lifecycle

```
User types URL
       │
       ▼
[Frontend] POST /api/analyze { url: "https://example.com" }
       │
       │  (returns immediately — analysis runs in background)
       ▼
[Backend] generates analysisId (uuid)
          creates streamManager.createAnalysis(id)
          spawns async analysis task
          returns { analysisId }
       │
       ▼
[Frontend] opens EventSource('/api/events/:id')
          subscribes to:
            event: step      → upsert into store by step.id
            event: progress  → log message
            event: error     → show error UI
            event: complete  → render dashboard with result
       │
[Backend, in parallel]
       │  agent.analyze(url) runs the 9-step pipeline
       │  every step calls emit(id, msg, status)
       │  → streamManager broadcasts to all SSE listeners
       │
       ▼
[Frontend] receives events as they arrive
          ProgressTerminal updates spinner → checkmark per step
          ProgressBar advances based on done/total
       │
       ▼
[Backend] emits "complete" with full result payload
          SSE stream closes
       │
       ▼
[Frontend] renders dashboard:
          - CompanyInfoPanel (left)
          - AnalysisPanel with tabs (right)
          - CompetitorsPanel grid (full width below)
          - Agent log collapsed
```

---

## 3. The 9-Step Agent Pipeline

Defined in `src/agent/analyzer.ts`. Each step emits a `running` then `done` (or `error`) event with the same step ID, so the frontend updates an existing row instead of appending a new one.

| # | Step ID                      | What happens                                                            | API used         |
|---|------------------------------|-------------------------------------------------------------------------|------------------|
| 1 | `crawl-target`               | Fetch the target homepage, convert to markdown, clean & truncate        | Firecrawl        |
| 2 | `extract-profile`            | LLM extracts name, ICP, features, pricing, value prop from content      | OpenAI           |
| 3 | `search-candidates`          | Query Tavily with `{name} alternatives competitors {industry}`          | Tavily           |
| 4 | `filter-competitors`         | LLM filters/ranks the raw results to 3-5 real competitors as JSON       | OpenAI           |
| 5 | `enrich-logos`               | For each competitor, resolve logo via Clearbit → Google favicon fallback| Clearbit, Google |
| 6 | `crawl-competitors`          | Fetch each competitor's homepage                                        | Firecrawl        |
| 7 | `extract-competitor-profiles`| LLM extracts profile from each competitor's content                     | OpenAI           |
| 8 | `competitive-analysis`       | LLM produces SWOT, positioning, gaps, recommendations                   | OpenAI           |
| 9 | `finalize`                   | Assemble final `AnalysisResult` JSON                                    | (none)           |

**Failure handling:**
- Crawl failures retry 3× with exponential backoff (`crawler.ts`)
- LLM filter returning 0 → fallback to raw search candidates
- Competitor profile extraction failing → competitor still included, profile `undefined`
- Any unexpected throw → `error` event sent over SSE, stream closes

---

## 4. Backend File Layout

```
src/
├── server.ts                    # Express bootstrap, middleware, /api mount
├── config.ts                    # Loads .env, validates required keys
├── logger.ts                    # Pino with pretty transport
├── types/index.ts               # Shared TS interfaces
│
├── routes/
│   └── analyze.ts               # POST /analyze, GET /events/:id, GET /result/:id
│
├── agent/
│   └── analyzer.ts              # 9-step orchestrator. Takes a StepEmitter callback.
│
├── tools/
│   └── index.ts                 # AgentTools class — composes services into actions
│
├── services/
│   ├── crawler.ts               # Firecrawl wrapper, retry logic
│   ├── search.ts                # Tavily wrapper, query builder, result filter
│   ├── llm.ts                   # OpenAI / Anthropic dual provider
│   ├── enrichment.ts            # Logo resolution (Clearbit → favicon)
│   └── streaming.ts             # In-memory pub/sub for SSE events
│
└── prompts/
    └── index.ts                 # All LLM prompt templates
```

### Key abstractions

**`StepEmitter`** (`services/streaming.ts`)
```ts
type StepEmitter = (
  id: string,
  message: string,
  status: 'running' | 'done' | 'error',
  detail?: string
) => void;
```

The route creates one emitter per analysis bound to the analysisId, then passes it into `new CompanyAnalysisAgent(emit)`. Every layer (analyzer → tools → services) can call `emit(...)` and it ends up on the SSE stream.

**`streamManager`** (`services/streaming.ts`)

A simple in-memory Map of `analysisId → Set<listener>`. The SSE route subscribes a listener that writes to the response; the agent's `emit()` calls broadcast to all listeners. When the analysis completes, the stream closes and listeners unsubscribe.

For multi-instance production, swap this Map for Redis pub/sub — the interface stays the same.

---

## 5. Frontend File Layout

```
frontend/src/
├── main.tsx                     # ReactDOM.render
├── App.tsx                      # Top-level state machine (input → loading → result)
├── index.css                    # Tailwind + custom animations (mesh, glow, gradient)
├── types.ts                     # TS types mirrored from backend
│
├── store/
│   └── analysisStore.ts         # Zustand: result, steps Map<id, StepEvent>, stepOrder
│
├── services/
│   └── api.ts                   # axios POST + EventSource SSE wiring
│
└── components/
    ├── InputPanel.tsx           # Landing hero (URL input + features grid)
    ├── ProgressBar.tsx          # Top gradient bar, advances by completed steps
    ├── ProgressTerminal.tsx     # macOS-style terminal, spinner→checkmark per step
    ├── AnalysisView.tsx         # Layout: loading screen vs. completed dashboard
    ├── CompanyInfoPanel.tsx     # Left panel: name, description, ICP, pricing, features
    ├── CompetitorCard.tsx       # Single competitor card (logo, name, desc, button)
    ├── CompetitorsPanel.tsx     # Grid of CompetitorCard (skeleton during loading)
    └── AnalysisPanel.tsx        # Tabbed: Overview / SWOT / Gaps / Recommendations
```

### State management

Zustand store (`analysisStore.ts`) holds:

```ts
{
  result: AnalysisResult | null,
  loading: boolean,
  messages: StreamMessage[],         // generic log
  steps: Map<string, StepEvent>,     // keyed by step id
  stepOrder: string[],               // insertion order for rendering
  error: string | null,
  url: string
}
```

The key trick: `upsertStep(step)` inserts a new step on first sight (running) and updates the same Map entry when the matching `done` event arrives. This is why a step animates from spinner to checkmark in place rather than appending a new row.

### Why SSE (not WebSockets)

- **One-way data flow** is all we need (server → client)
- **Native browser support** via `EventSource` — no library needed
- **Auto-reconnects** on network blip
- **Plays nicely with HTTP** (proxies, load balancers, auth)
- **Plain text protocol** — easy to debug with `curl -N`

---

## 6. Data Contract

### POST `/api/analyze`

```json
// Request
{ "url": "https://slack.com" }

// Response (immediate)
{ "analysisId": "550e8400-e29b-41d4-a716-446655440000" }
```

### SSE `/api/events/:analysisId`

Each event has a type and JSON payload:

```
event: step
data: {"type":"step","id":"crawl-target","message":"Crawling homepage...","status":"running","timestamp":"2026-04-30T08:21:00Z","detail":"https://slack.com"}

event: step
data: {"type":"step","id":"crawl-target","message":"Crawled Slack","status":"done","detail":"47832 chars extracted","timestamp":"2026-04-30T08:21:03Z"}

...

event: complete
data: {"type":"complete","message":"Analysis completed","timestamp":"...","data":{"result":{...}}}
```

### Final `AnalysisResult`

```ts
{
  timestamp: string,
  company: {
    name, url, description, icp, features[], pricing, valueProposition, industry
  },
  competitors: [
    {
      name, url, description, logo, relevanceScore,
      profile: { ...same shape as company }
    }
  ],
  analysis: {
    positioningComparison, marketDifferentiation, summary,
    strengths: { targetCompany[], competitors{} },
    weaknesses: { targetCompany[], competitors{} },
    featureGaps: { targetCompany[], competitiveAdvantages[] },
    recommendations[]
  }
}
```

---

## 7. External Dependencies

| Service     | Purpose                              | API key env var      | Free tier         |
|-------------|--------------------------------------|----------------------|-------------------|
| Firecrawl   | Convert URL → clean markdown         | `FIRECRAWL_API_KEY`  | 100 credits/mo    |
| Tavily      | Web search for competitor candidates | `TAVILY_API_KEY`     | 1000 searches/mo  |
| OpenAI      | LLM for extraction & analysis        | `OPENAI_API_KEY`     | $5 trial credit   |
| Anthropic   | (Optional) Claude alternative        | `CLAUDE_API_KEY`     | Trial credit      |
| Clearbit    | Logo resolution                      | (none — public)      | Unlimited         |
| Google      | Favicon fallback                     | (none — public)      | Unlimited         |

The LLM provider is selected via `LLM_PROVIDER=openai|claude` in `.env`. Reasoning models (gpt-5.x, o1, o3) are auto-detected and use `max_completion_tokens` instead of `max_tokens`.

---

## 8. Why It's Built This Way

**Streaming-first.** The analysis takes 60-90 seconds. A loading spinner for that long feels broken. Streaming the agent's actual work makes the wait feel transparent and short.

**LLM-filtered competitor discovery.** Raw search results are noisy (PDFs, listicles, news articles). Two-phase discovery — search wide, then have an LLM extract real competitor names — produces dramatically better results than either step alone.

**Logo enrichment is graceful.** Clearbit's free Logo API has good coverage but isn't 100%. The 3-tier fallback (Clearbit → Google favicon → CSS initials) means every card always shows something, even for obscure competitors.

**Stateless backend.** Results live in an in-memory `Map`. For a single instance this is fine; for production swap in Postgres/Redis. The streaming layer uses the same in-memory pattern — replace with Redis pub/sub for multi-instance.

**Step IDs, not line numbers.** Each step has a stable ID (`crawl-target`, `extract-profile`, etc.). The frontend updates a Map keyed by ID, so the same row animates from spinner to checkmark. No DOM rebuild, smooth UX.

**Content truncation at 30k chars.** Real-world pages can be 200k+ chars (annual reports, etc.). Truncating before the LLM call avoids token limit errors while still capturing the meaningful "above the fold" content where ICP/pricing/features live.

---

## 9. How To Extend

| Want to...                          | Where to change                                         |
|-------------------------------------|---------------------------------------------------------|
| Add a new step in the pipeline      | `agent/analyzer.ts` + emit before/after                 |
| Change a prompt                     | `prompts/index.ts`                                      |
| Add a new LLM provider              | `services/llm.ts` (mirror the OpenAI/Anthropic split)   |
| Swap streaming for WebSockets       | `services/streaming.ts` + `routes/analyze.ts`           |
| Persist results                     | `routes/analyze.ts` — replace the `analysisResults` Map |
| Add auth                            | `server.ts` middleware before `app.use('/api', ...)`    |
| Customize a panel's layout          | `frontend/src/components/AnalysisView.tsx`              |
| Add a new analysis tab              | `frontend/src/components/AnalysisPanel.tsx`             |
| Change the landing page             | `frontend/src/components/InputPanel.tsx`                |

---

## 10. Sequence Diagram (Detailed)

```
User    Frontend           Backend          Firecrawl   Tavily    OpenAI    Clearbit
 │         │                   │                │          │         │          │
 │ enter   │                   │                │          │         │          │
 │  URL    │                   │                │          │         │          │
 ├────────►│                   │                │          │         │          │
 │         │ POST /analyze     │                │          │         │          │
 │         ├──────────────────►│                │          │         │          │
 │         │                   ├─ uuid          │          │         │          │
 │         │ { analysisId }    │                │          │         │          │
 │         │◄──────────────────┤                │          │         │          │
 │         │                   │                │          │         │          │
 │         │ GET /events/:id   │                │          │         │          │
 │         ├──────────────────►│                │          │         │          │
 │         │                   │                │          │         │          │
 │         │ event: step run   │   crawl URL    │          │         │          │
 │         │◄──────────────────┤───────────────►│          │         │          │
 │         │ event: step done  │   markdown     │          │         │          │
 │         │◄──────────────────┤◄───────────────┤          │         │          │
 │         │                   │                           │         │          │
 │         │ event: step run   │   extract profile         │         │          │
 │         │◄──────────────────┤──────────────────────────►│         │          │
 │         │ event: step done  │   { name, icp, ... }      │         │          │
 │         │◄──────────────────┤◄──────────────────────────┤         │          │
 │         │                   │                                     │          │
 │         │ event: step run   │   search competitors                │          │
 │         │◄──────────────────┤────────────────►│                   │          │
 │         │ event: step done  │   candidates                        │          │
 │         │◄──────────────────┤◄────────────────┤                   │          │
 │         │                   │                                     │          │
 │         │ event: step run   │   filter w/ LLM                     │          │
 │         │◄──────────────────┤────────────────────────────────────►│          │
 │         │ event: step done  │   { competitors: [...] }            │          │
 │         │◄──────────────────┤◄────────────────────────────────────┤          │
 │         │                   │                                                │
 │         │ event: step run   │   resolve logos                                │
 │         │◄──────────────────┤───────────────────────────────────────────────►│
 │         │ event: step done  │   logo URLs                                    │
 │         │◄──────────────────┤◄───────────────────────────────────────────────┤
 │         │                   │                                                │
 │         │  ... 4 more steps (crawl + profile competitors, analyze, finalize)│
 │         │                                                                   │
 │         │ event: complete   │   { result }                                   │
 │         │◄──────────────────┤                                                │
 │         │   render UI       │                                                │
 │◄────────┤                                                                    │
```

---

**TL;DR** — The frontend opens an SSE stream and the backend pushes 9 step events (`running` → `done`) as a 9-stage agent calls Firecrawl, Tavily, OpenAI, and Clearbit in sequence. The final `complete` event carries the full JSON result. State is shared via `streamManager` (in-memory pub/sub) and rendered by Zustand-backed React components.
