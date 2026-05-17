# Agent Architecture — How It Actually Works

Deep-dive into how the AI agent and backend work internally.

---

## The Mental Model

This is **not** a fully autonomous agent loop (no "ReAct" or "tool-calling" loop where the LLM picks the next action). It's a **deterministic orchestrator** that runs LLM calls at fixed points in a hard-coded pipeline.

> The orchestrator owns the control flow. The LLM owns the reasoning at each step.

This trade-off is intentional:
- **Predictable cost** — fixed number of LLM calls per analysis
- **Predictable latency** — no agent "thinking" loops that can spiral
- **Debuggable** — every step has a name, a prompt, and a typed output
- **Reliable** — failure in one step doesn't crash the rest (we have fallbacks)

What "agent-like" means here:
- The LLM **reasons** at each step (extract structure from text, filter candidates, generate analysis)
- Each step **emits structured events** so the user sees what's happening
- Steps are composable **tools** the orchestrator calls in sequence

---

## The Three Layers

```
┌─────────────────────────────────────────────────────┐
│  agent/analyzer.ts        ← THE BRAIN               │
│  Knows the order. Calls tools. Emits events.        │
│  Doesn't know about HTTP, LLM, or external APIs.    │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  tools/index.ts           ← THE HANDS               │
│  Wraps services into high-level actions.            │
│  Knows about prompts. Doesn't know about HTTP.      │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  services/*.ts            ← THE SENSES              │
│  Raw API wrappers. One file per external service.   │
│  Crawler, search, LLM, enrichment, streaming.       │
└─────────────────────────────────────────────────────┘
```

**Strict dependency direction.** The brain calls hands. Hands call senses. Nothing flows backward. This is the only architectural rule.

---

## Layer 1: The Brain (`analyzer.ts`)

`CompanyAnalysisAgent` is a class with one public method: `analyze(url)`. It runs 9 steps in order. Each step:

1. **Emits "running"** with a step ID and message
2. **Calls a tool method** (or services directly for crawl)
3. **Emits "done"** with the same step ID and a result detail
4. **Stores the output** for the next step to consume

Here's the actual control flow, simplified:

```ts
class CompanyAnalysisAgent {
  constructor(emit: StepEmitter) {
    this.tools = new AgentTools();
    this.emit = emit;        // injected from the route handler
  }

  async analyze(url: string): Promise<AnalysisResult> {
    // Step 1
    this.emit("crawl-target", "Crawling homepage...", "running");
    const targetWebsite = await this.crawler.crawlWebsite(url);
    this.emit("crawl-target", "Crawled", "done", `${chars} chars`);

    // Step 2
    this.emit("extract-profile", "Extracting business profile...", "running");
    const profile = await this.tools.extractCompanyProfile(targetWebsite);
    this.emit("extract-profile", `Identified ${profile.name}`, "done");

    // Step 3
    this.emit("search-candidates", "Searching candidates...", "running");
    const candidates = await this.tools.searchCompetitorCandidates(profile);
    this.emit("search-candidates", `Found ${candidates.length}`, "done");

    // Step 4
    this.emit("filter-competitors", "AI filtering...", "running");
    let filtered = await this.tools.filterCompetitorsWithLLM(profile, candidates);
    if (filtered.length === 0) filtered = fallbackToRawCandidates(candidates);
    this.emit("filter-competitors", `Selected ${filtered.length}`, "done");

    // Step 5
    this.emit("enrich-logos", "Fetching logos...", "running");
    const competitors = await this.tools.buildCompetitorsWithLogos(filtered);
    this.emit("enrich-logos", "Logos resolved", "done");

    // Step 6
    this.emit("crawl-competitors", "Crawling sites...", "running");
    const competitorWebsites = await this.tools.crawlCompetitors(competitors);
    this.emit("crawl-competitors", `Crawled ${competitorWebsites.size}`, "done");

    // Step 7
    this.emit("extract-competitor-profiles", "Extracting...", "running");
    await this.tools.attachCompetitorProfiles(competitors, competitorWebsites);
    this.emit("extract-competitor-profiles", "Profiles ready", "done");

    // Step 8
    this.emit("competitive-analysis", "Analyzing...", "running");
    const raw = await this.tools.analyzeCompetitivePosition(profile, competitors);
    const analysis = await this.parseAnalysisContent(raw, profile, competitors);
    this.emit("competitive-analysis", "Analysis ready", "done");

    // Step 9
    this.emit("finalize", "Finalizing...", "running");
    const result = { timestamp, company: profile, competitors, analysis };
    this.emit("finalize", "Report ready", "done");

    return result;
  }
}
```

**Key properties:**
- The brain doesn't know how `extractCompanyProfile` works internally — it just calls it
- The brain doesn't know about prompts, OpenAI, or markdown parsing
- The brain has **no retries, no LLM in the loop** — it's pure orchestration
- The `emit` is injected, so the agent works the same way in CLI mode (where emit is a no-op) as in API mode

---

## Layer 2: The Hands (`tools/index.ts`)

`AgentTools` is where the LLM meets the data. Each method does one of three things:

1. **Compose a prompt** from data + a template
2. **Call the LLM** with the prompt
3. **Parse the response** into typed output

### Tool: `extractCompanyProfile`

This is the prototype for every other LLM tool. Pseudo-code:

```ts
async extractCompanyProfile(website: WebsiteContent): Promise<CompanyProfile> {
  // 1. Truncate (real-world pages can be 200k+ chars)
  const content = website.content.slice(0, 30_000);

  // 2. Compose prompt by replacing {content} placeholder
  const prompt = PROMPTS.analyzeCompany.replace("{content}", content);

  // 3. Call LLM
  const response = await this.llm.analyzeText(prompt);

  // 4. Extract JSON from the response (strips markdown fences if present)
  return await this.llm.extractJSON<CompanyProfile>(response.content);
}
```

The prompt itself (in `prompts/index.ts`) tells the LLM exactly what JSON shape to return:

```
Extract and return a JSON object with ONLY these fields:
{
  "name": "company name",
  "description": "...",
  "icp": "...",
  "features": [...],
  "pricing": { "model": "...", "tiers": [...], "range": "..." },
  "valueProposition": "...",
  "targetMarket": "...",
  "industry": "..."
}
```

The LLM is **forced into a structured output** by the prompt. We don't use OpenAI's "JSON mode" because we want provider-agnostic code (works with both OpenAI and Claude). Instead, `extractJSON` greps for the first `{...}` block in the response.

### Tool: `filterCompetitorsWithLLM`

This is the "second brain" — the LLM does meaningful reasoning here, not just extraction.

```ts
async filterCompetitorsWithLLM(profile, candidates): Promise<FilteredCompetitor[]> {
  // 1. Format candidates as a numbered list
  const candidatesText = candidates
    .map((c, i) => `${i+1}. ${c.title}\n   URL: ${c.url}\n   Snippet: ${c.snippet}`)
    .join("\n\n");

  // 2. Inject company profile + candidates into the filter prompt
  const prompt = PROMPTS.filterCompetitors
    .replace("{name}", profile.name)
    .replace("{description}", profile.description)
    .replace("{industry}", profile.industry)
    .replace("{candidates}", candidatesText);

  // 3. The LLM reads the candidates and reasons:
  //    "Is this a real competitor? Is this a listicle? Is this the company itself?"
  //    "If a candidate URL is a deep link, infer the homepage."
  const response = await this.llm.analyzeText(prompt);

  // 4. Parse JSON, take top 5
  const parsed = await this.llm.extractJSON<{ competitors: [...] }>(response.content);
  return parsed.competitors.slice(0, 5);
}
```

This is the most "agent-like" call in the system. The LLM is given raw search results and asked to **reason** about which ones are real competitors, **infer** missing homepages, and **extract** competitor names from listicle-style results.

### Tool: `buildCompetitorsWithLogos`

This isn't an LLM call — it's a parallel enrichment.

```ts
async buildCompetitorsWithLogos(filtered): Promise<Competitor[]> {
  // Run all logo lookups in parallel
  return Promise.all(
    filtered.map(async (c) => ({
      ...c,
      logo: await resolveLogoUrl(c.url),  // Clearbit → favicon
      relevanceScore: 0.85,
    }))
  );
}
```

`resolveLogoUrl` does a HEAD request to Clearbit and falls back to Google favicon if Clearbit returns non-image. See `services/enrichment.ts`.

### Tool: `crawlCompetitors` + `attachCompetitorProfiles`

These run sequentially per competitor (not parallel — Firecrawl rate limits + politeness):

```ts
async crawlCompetitors(competitors): Promise<Map<name, WebsiteContent>> {
  const results = new Map();
  for (const c of competitors) {
    try {
      const crawl = await this.crawler.crawlWebsite(c.url);
      if (crawl.success) results.set(c.name, crawl.content);
    } catch {
      // Skip failures; the competitor still appears in the final result without profile
    }
  }
  return results;
}

async attachCompetitorProfiles(competitors, websites) {
  for (const c of competitors) {
    const content = websites.get(c.name);
    if (!content) continue;
    try {
      c.profile = await this.extractCompanyProfile(content);  // reuses Tool 1
    } catch {
      // Leave profile undefined; UI handles this gracefully
    }
  }
}
```

Notice `attachCompetitorProfiles` **mutates** the competitors array. We could return new objects, but mutation here is intentional and contained.

### Tool: `analyzeCompetitivePosition`

The big synthesis call. Takes everything we've gathered and generates the SWOT/positioning analysis.

```ts
async analyzeCompetitivePosition(target, competitors): Promise<string> {
  const prompt = PROMPTS.analyzeCompetitors
    .replace("{targetCompany}", JSON.stringify(target))
    .replace("{competitorsData}", JSON.stringify(competitors));

  const response = await this.llm.analyzeText(prompt);
  return response.content;  // raw — analyzer.ts parses to typed shape
}
```

The prompt asks for a JSON object with `positioningComparison`, `strengths`, `weaknesses`, `featureGaps`, `marketDifferentiation`, `recommendations`, `summary`. The brain (`analyzer.ts`) handles parsing and provides defaults for missing fields.

---

## Layer 3: The Senses (`services/`)

Each service is a thin wrapper around an external API. They have no business logic.

### `services/crawler.ts` — Firecrawl

```ts
class WebCrawler {
  async crawlWebsite(url): Promise<CrawlResult> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.post(FIRECRAWL_BASE + "/scrape", {
          url, formats: ["markdown", "html"]
        }, { headers: { Authorization: `Bearer ${apiKey}` } });

        return { success: true, content: parseToWebsiteContent(response) };
      } catch (error) {
        if (attempt < 3) await delay(2000 * attempt);  // exponential backoff
      }
    }
    return { success: false, error: lastError.message };
  }
}
```

Returns markdown text + metadata (title, description). The `parseToWebsiteContent` step cleans up triple-newlines and extracts the title.

### `services/search.ts` — Tavily

```ts
class CompetitorSearch {
  async findCompetitors({ name, description, industry }): Promise<SearchResult[]> {
    // Build a focused query
    const query = name && industry
      ? `${name} alternatives competitors ${industry}`
      : `${name || extractKeywords(description)} alternatives competitors`;

    const response = await axios.post("https://api.tavily.com/search", {
      api_key, query, max_results: 15, search_depth: "advanced"
    });

    // Filter out clearly non-competitor sources
    return response.data.results
      .map(toSearchResult)
      .filter(notSocialMediaOrTarget)
      .slice(0, 5);
  }
}
```

The filter rejects: Wikipedia, Reddit, YouTube, Twitter/X, Facebook, Instagram, TikTok, PDFs, and the target company itself. Review/comparison sites (G2, Capterra) are **kept** because the LLM filter step extracts real competitor names from them.

### `services/llm.ts` — OpenAI / Anthropic dual-provider

```ts
class LLMService {
  constructor() {
    if (provider === "openai") {
      this.openai = new OpenAI({ apiKey });
      this.isReasoningModel = /^(o1|o3|o4|gpt-5)/i.test(model);
    } else {
      this.claude = new Anthropic({ apiKey });
    }
  }

  async analyzeText(prompt): Promise<LLMResponse> {
    if (provider === "openai") {
      const params = {
        model, messages: [{ role: "user", content: prompt }],
        ...(this.isReasoningModel
          ? { max_completion_tokens: 4096 }       // gpt-5, o1, o3
          : { max_tokens: 4096, temperature: 0.7 }) // gpt-4o etc
      };
      return await openai.chat.completions.create(params);
    } else {
      return await claude.messages.create({ model, max_tokens: 4096, messages });
    }
  }

  async extractJSON<T>(text): Promise<T> {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match[0]);
  }
}
```

The reasoning-model detection is the trick that makes gpt-5.x work. Newer "reasoning" models (`o1`, `o3`, `gpt-5*`) reject `max_tokens` and `temperature`. The regex catches them and uses the new parameter names.

### `services/enrichment.ts` — Logo Resolution

```ts
async function resolveLogoUrl(url: string): Promise<string> {
  const domain = extractDomain(url);  // strips www., paths, etc.

  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  // HEAD request to check if Clearbit has a real logo
  try {
    const res = await axios.head(clearbitUrl, { timeout: 5000 });
    if (res.headers["content-type"]?.startsWith("image/")) {
      return clearbitUrl;
    }
  } catch { /* fall through */ }

  return faviconUrl;  // Google favicon always works
}
```

The HEAD request is cheap (no body downloaded) and lets us pick the better logo at decision time.

### `services/streaming.ts` — Pub/Sub for SSE

This is the magic that connects the agent to the SSE stream. Pseudo-code of the in-memory pub/sub:

```ts
class AnalysisStreamManager {
  private analyses = new Map<string, {
    listeners: Set<(msg) => void>;
    isComplete: boolean;
  }>();

  createAnalysis(id) {
    this.analyses.set(id, { listeners: new Set(), isComplete: false });
  }

  // Called by SSE route handler when client connects
  subscribe(id, listener): () => void {
    this.analyses.get(id).listeners.add(listener);
    return () => this.analyses.get(id).listeners.delete(listener);
  }

  // Called by the agent's emit() function
  emit(id, message) {
    this.analyses.get(id).listeners.forEach(l => l(message));
  }
}
```

The route handler creates a "step emitter" bound to a specific analysisId:

```ts
function createStepEmitter(analysisId) {
  return (id, message, status, detail) => {
    streamManager.emit(analysisId, {
      type: "step", id, message, status, detail,
      timestamp: new Date().toISOString()
    });
  };
}
```

Then injects it into the agent:

```ts
const emit = createStepEmitter(analysisId);
const agent = new CompanyAnalysisAgent(emit);
await agent.analyze(url);
```

When the SSE route handler subscribes, it writes each emitted message as an SSE frame:

```ts
const unsubscribe = streamManager.subscribe(analysisId, (msg) => {
  res.write(`event: ${msg.type}\n`);
  res.write(`data: ${JSON.stringify(msg)}\n\n`);
  if (msg.type === "complete" || msg.type === "error") res.end();
});
```

**This is the entire streaming pipeline.** The agent calls `emit(...)`. The emitter pushes to `streamManager`. The streamManager pushes to all listeners. The SSE listener writes to the HTTP response. The browser's `EventSource` fires a `message` event. React updates state.

---

## How the Backend Receives a Request

Walking through `routes/analyze.ts`:

```
POST /api/analyze
   │
   ▼
1. Parse body for { url }
2. Generate analysisId = uuid()
3. streamManager.createAnalysis(analysisId)
4. RESPOND IMMEDIATELY with { analysisId }
5. Spawn an async task (NOT awaited):
      ┌──────────────────────────────────────────┐
      │ const emit = createStepEmitter(id)       │
      │ const agent = new Agent(emit)            │
      │ try {                                    │
      │   const result = await agent.analyze(url)│
      │   results.set(id, result)                │
      │   emitComplete(id, { result })           │
      │ } catch (error) {                        │
      │   emitError(id, error.message)           │
      │ }                                        │
      └──────────────────────────────────────────┘
```

**Why respond before the work is done?** Because the work takes 60-90 seconds. We can't keep the HTTP request open that long (proxy timeouts, browser timeouts, retries). Instead:

1. Return `{ analysisId }` immediately (50ms)
2. Frontend opens SSE on `/api/events/:id` (separate connection)
3. Backend pushes step events as they happen
4. Backend pushes the final result on the SSE stream when done

The HTTP `POST` is just a "start the work" trigger. The SSE stream is where the real data flows.

---

## How the Frontend Receives Events

Walking through `services/api.ts`:

```ts
const eventSource = new EventSource(`${API_BASE}/api/events/${analysisId}`);

eventSource.addEventListener("step", (event) => {
  const stepEvent = JSON.parse(event.data);
  store.upsertStep(stepEvent);   // Map<id, StepEvent>
});

eventSource.addEventListener("complete", (event) => {
  const data = JSON.parse(event.data);
  store.setResult(data.data.result);
  eventSource.close();
});

eventSource.addEventListener("error", (event) => {
  store.setError(event.data.message);
  eventSource.close();
});
```

The Zustand `upsertStep` is the key piece:

```ts
upsertStep: (step) => set((state) => {
  const newSteps = new Map(state.steps);
  const isNew = !newSteps.has(step.id);
  newSteps.set(step.id, step);  // OVERWRITES if same id
  return {
    steps: newSteps,
    stepOrder: isNew ? [...state.stepOrder, step.id] : state.stepOrder,
  };
});
```

**The `running → done` transition is just a Map overwrite.** Same step.id, new status. React re-renders the same row in place. The spinner becomes a checkmark via Framer Motion's spring animation, not a DOM mount/unmount.

---

## What Happens When Things Go Wrong

### Crawl fails (network, 404, etc.)
- `WebCrawler.crawlWebsite` retries 3× with backoff (2s, 4s, 6s)
- If all 3 fail, returns `{ success: false, error }`
- For the target site → analyzer throws → `emitError` → SSE closes
- For a competitor site → that competitor gets `profile: undefined` → UI shows the card without rich profile

### LLM returns 0 competitors
- Filter prompt explicitly says "return 3-5"
- If LLM still returns 0, `analyzer.ts` falls back to raw search candidates
- Raw candidates are mapped to FilteredCompetitor shape and used as-is

### LLM returns bad JSON
- `extractJSON` matches the first `{...}` block — handles markdown fences
- If parse fails, the orchestrator catches and provides default empty values
- Analysis still completes, just with reduced fidelity

### LLM hits token limit
- Content is pre-truncated to 30k chars before every LLM call
- If we ever hit the limit anyway (huge prompts in step 8), we'd want to trim competitor data — currently this is a known weak spot

### Single competitor profile extraction fails
- Caught locally in `attachCompetitorProfiles`
- Competitor still appears in final result with no `profile` field
- UI's `CompetitorCard` uses `competitor.description` as fallback, then "No description"

---

## Why Not a "Real" Agent Loop?

A "true" agent (like LangChain agents or AutoGPT) lets the LLM **decide** the next action:

```
LLM: "I should crawl the homepage."
[crawl runs]
LLM: "Now I'll search for competitors."
[search runs]
LLM: "Hmm, the results are bad. Let me search again with different keywords."
[search runs again]
...
```

We deliberately **don't** do this because:

1. **Cost is unbounded.** An agent loop can call 50 tools in one analysis.
2. **Latency is unbounded.** Each "what should I do next" call adds 2-5 seconds.
3. **Failure modes are weird.** Agents can get stuck in loops, hallucinate tools, or invent goals.
4. **Hard to stream sensibly.** With a fixed pipeline, we know all the step IDs in advance — that's why ProgressBar has a stable percentage.

The right pattern for "structured analysis pipelines" is: **orchestrator owns the flow, LLM owns the reasoning at each step.** That's what we built.

---

## Where the LLM Actually Reasons

Out of the 9 steps, only **3** call the LLM, and only **1** asks for genuine reasoning:

| Step | LLM call?            | What it does                                           |
|------|----------------------|--------------------------------------------------------|
| 1    | No                   | HTTP scrape via Firecrawl                              |
| 2    | Extraction           | Pull structured fields from raw text                   |
| 3    | No                   | HTTP search via Tavily                                 |
| 4    | **Reasoning**        | Decide which candidates are real competitors           |
| 5    | No                   | Logo URL resolution                                    |
| 6    | No                   | HTTP scrape (parallel competitors)                     |
| 7    | Extraction (×N)      | Same as step 2, repeated per competitor                |
| 8    | **Synthesis**        | Generate SWOT, positioning, recommendations            |
| 9    | No                   | JSON assembly                                          |

So it's really 1 reasoning call (filter), 1 synthesis call (analysis), and N+1 extraction calls (one per company). For 5 competitors that's **8 LLM calls total** per analysis.

At ~$0.01-0.03 per call with gpt-5, that's **~$0.10-0.25 per full analysis**.

---

## TL;DR Mental Model

```
analyzer.ts is a recipe.
tools/index.ts is the chef's hands.
services/*.ts are the kitchen tools.
prompts/index.ts are the recipe instructions for the LLM.
streaming.ts is the dining room — what the customer sees.

The recipe is fixed (9 steps).
The chef (LLM) decides how to interpret each instruction.
The kitchen tools (Firecrawl, Tavily, OpenAI, Clearbit) just do what they're told.
The dining room (SSE stream) shows the customer what's happening in real time.
```

Read in this order to understand the codebase:

1. `src/agent/analyzer.ts` — see the recipe
2. `src/prompts/index.ts` — see what we ask the LLM to do
3. `src/tools/index.ts` — see how prompts get composed
4. `src/services/streaming.ts` — see how events flow out
5. `src/routes/analyze.ts` — see how everything is wired together
6. `frontend/src/services/api.ts` — see how the browser receives events
7. `frontend/src/store/analysisStore.ts` — see how state is managed
8. `frontend/src/components/ProgressTerminal.tsx` — see how steps render
