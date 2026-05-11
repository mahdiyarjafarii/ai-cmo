import axios from "axios";
import logger from "../logger";
import { config } from "../config";

const BASE_URL =
  "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

// ─── Raw API response types ────────────────────────────────────────────────

interface LighthouseCategory {
  score: number | null;
  title: string;
}

interface LighthouseAudit {
  id: string;
  title: string;
  displayValue?: string;
  numericValue?: number;
  score?: number | null;
}

interface LighthouseResult {
  categories: {
    performance?: LighthouseCategory;
    accessibility?: LighthouseCategory;
    "best-practices"?: LighthouseCategory;
    seo?: LighthouseCategory;
  };
  audits: Record<string, LighthouseAudit>;
}

interface PageSpeedApiResponse {
  lighthouseResult: LighthouseResult;
  loadingExperience?: {
    metrics?: Record<string, { percentile?: number; category?: string }>;
    overall_category?: string;
  };
}

function safeMatch(input: string, re: RegExp): string | null {
  const m = input.match(re);
  if (!m) return null;
  return (m[1] ?? "").trim() || null;
}

function parseSeoHealthFromHtml(html: string): {
  titleText: string | null;
  metaDescription: string | null;
  canonicalHref: string | null;
  htmlLang: string | null;
  hasViewport: boolean;
} {
  const titleText = safeMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaDescription = safeMatch(
    html,
    /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  );
  const canonicalHref = safeMatch(
    html,
    /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["'][^>]*>/i
  );
  const htmlLang = safeMatch(html, /<html[^>]+lang=["']([^"']+)["'][^>]*>/i);
  const hasViewport = /<meta[^>]+name=["']viewport["'][^>]*>/i.test(html);

  return {
    titleText,
    metaDescription,
    canonicalHref,
    htmlLang,
    hasViewport,
  };
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await axios.get<string>(url, {
      timeout: 15_000,
      responseType: "text",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CMO-Analytics/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      maxContentLength: 1024 * 1024,
      validateStatus: (s) => (typeof s === "number" ? s >= 200 && s < 400 : false),
    });
    if (typeof res.data !== "string") return null;
    return res.data;
  } catch {
    return null;
  }
}

function buildSeoHealthFromHtml(html: string | null): SeoHealth {
  const parsed = html ? parseSeoHealthFromHtml(html) : null;
  const titleLen = parsed?.titleText?.length ?? 0;
  const descLen = parsed?.metaDescription?.length ?? 0;

  const signals: SeoHealthSignal[] = [
    {
      key: "meta_title",
      label: "Meta Title",
      value: titleLen ? `${titleLen} chars` : "Not set",
      status: titleLen ? "pass" : "fail",
    },
    {
      key: "meta_description",
      label: "Meta Description",
      value: descLen ? `${descLen} chars` : "Not set",
      status: descLen ? "pass" : "fail",
    },
    {
      key: "canonical",
      label: "Canonical URL",
      value: parsed?.canonicalHref ? "Set" : "Not set",
      status: parsed?.canonicalHref ? "pass" : "warn",
    },
    {
      key: "language",
      label: "Language",
      value: parsed?.htmlLang ? "Set" : "Not set",
      status: parsed?.htmlLang ? "pass" : "warn",
    },
    {
      key: "mobile_friendly",
      label: "Mobile Friendly",
      value: parsed?.hasViewport ? "Yes" : "No",
      status: parsed?.hasViewport ? "pass" : "warn",
    },
  ];

  return {
    title: "SEO Health",
    subtitle: "On-page metadata and content signals",
    signals,
  };
}

function buildPageSpeedParams(
  url: string,
  apiKey: string,
  strategy: "mobile" | "desktop"
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("url", url);
  params.set("key", apiKey);
  params.set("strategy", strategy);
  params.append("category", "performance");
  params.append("category", "accessibility");
  params.append("category", "best-practices");
  params.append("category", "seo");
  return params;
}

// ─── Exported types ───────────────────────────────────────────────────────

export interface CategoryScores {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface CoreWebVital {
  label: string;
  displayValue: string;
  numericValue: number | null;
  /** "fast" | "average" | "slow" */
  rating: "fast" | "average" | "slow" | null;
}

export interface SeoHealthSignal {
  key: string;
  label: string;
  value: string;
  status: "pass" | "warn" | "fail";
}

export interface SeoHealth {
  title: string;
  subtitle: string;
  signals: SeoHealthSignal[];
}

export interface StrategyResult {
  strategy: "mobile" | "desktop";
  scores: CategoryScores;
  coreWebVitals: {
    lcp: CoreWebVital;
    fcp: CoreWebVital;
    cls: CoreWebVital;
    tbt: CoreWebVital;
  };
  seoHealth: SeoHealth;
  fetchedAt: string;
}

export interface PageSpeedResult {
  url: string;
  mobile: StrategyResult;
  desktop: StrategyResult;
  fetchedAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function toScore(raw: number | null | undefined): number | null {
  if (raw == null) return null;
  return Math.round(raw * 100);
}

function ratingFromValue(
  value: number | null,
  good: number,
  poor: number
): "fast" | "average" | "slow" | null {
  if (value == null) return null;
  if (value <= good) return "fast";
  if (value <= poor) return "average";
  return "slow";
}

function extractCWV(audits: Record<string, LighthouseAudit>) {
  const get = (id: string) => audits[id];

  const lcp = get("largest-contentful-paint");
  const fcp = get("first-contentful-paint");
  const cls = get("cumulative-layout-shift");
  const tbt = get("total-blocking-time");

  return {
    lcp: {
      label: "LCP",
      displayValue: lcp?.displayValue ?? "—",
      numericValue: lcp?.numericValue ?? null,
      rating: ratingFromValue(lcp?.numericValue ?? null, 2500, 4000),
    } as CoreWebVital,

    fcp: {
      label: "FCP",
      displayValue: fcp?.displayValue ?? "—",
      numericValue: fcp?.numericValue ?? null,
      rating: ratingFromValue(fcp?.numericValue ?? null, 1800, 3000),
    } as CoreWebVital,

    cls: {
      label: "CLS",
      displayValue: cls?.displayValue ?? "—",
      numericValue: cls?.numericValue ?? null,
      // CLS: good ≤ 0.1, poor > 0.25
      rating: ratingFromValue(cls?.numericValue ?? null, 0.1, 0.25),
    } as CoreWebVital,

    tbt: {
      label: "TBT",
      displayValue: tbt?.displayValue ?? "—",
      numericValue: tbt?.numericValue ?? null,
      // TBT (ms): good ≤ 200, poor > 600
      rating: ratingFromValue(tbt?.numericValue ?? null, 200, 600),
    } as CoreWebVital,
  };
}

function parseResponse(
  data: PageSpeedApiResponse,
  strategy: "mobile" | "desktop",
  seoHealth: SeoHealth
): StrategyResult {
  const cats = data.lighthouseResult.categories;
  const audits = data.lighthouseResult.audits;

  return {
    strategy,
    scores: {
      performance: toScore(cats.performance?.score),
      accessibility: toScore(cats.accessibility?.score),
      bestPractices: toScore(cats["best-practices"]?.score),
      seo: toScore(cats.seo?.score),
    },
    coreWebVitals: extractCWV(audits),
    seoHealth,
    fetchedAt: new Date().toISOString(),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function fetchPageSpeedData(
  rawUrl: string
): Promise<PageSpeedResult> {
  const apiKey = config.google.pagespeedKey;
  if (!apiKey) {
    throw new Error("GOOGLE_PAGESPEED_KEY is not configured");
  }

  // Normalise the URL
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  logger.info(`Fetching PageSpeed data for ${url}`);

  const [html, mobileRes, desktopRes] = await Promise.all([
    fetchHtml(url),
    axios.get<PageSpeedApiResponse>(BASE_URL, {
      params: buildPageSpeedParams(url, apiKey, "mobile"),
      timeout: 60_000,
    }),
    axios.get<PageSpeedApiResponse>(BASE_URL, {
      params: buildPageSpeedParams(url, apiKey, "desktop"),
      timeout: 60_000,
    }),
  ]);

  const seoHealth = buildSeoHealthFromHtml(html);

  logger.info(`PageSpeed data fetched for ${url}`);

  return {
    url,
    mobile: parseResponse(mobileRes.data, "mobile", seoHealth),
    desktop: parseResponse(desktopRes.data, "desktop", seoHealth),
    fetchedAt: new Date().toISOString(),
  };
}
