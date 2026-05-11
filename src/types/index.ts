export interface WebsiteContent {
  url: string;
  title: string;
  content: string;
  metadata?: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  pages?: {
    homepage?: string;
    about?: string;
    pricing?: string;
    [key: string]: string | undefined;
  };
}

export interface CompanyProfile {
  name: string;
  url: string;
  description: string;
  icp: string;
  features: string[];
  pricing?: {
    model: string;
    tiers?: string[];
    range?: string;
  };
  valueProposition: string;
  targetMarket?: string;
  industry?: string;
}

export interface Competitor {
  name: string;
  url: string;
  relevanceScore: number;
  description?: string;
  logo?: string;
  profile?: CompanyProfile;
}

export type StepStatus = "running" | "done" | "error";

export interface StepEvent {
  type: "step";
  id: string;
  message: string;
  status: StepStatus;
  timestamp: string;
  detail?: string;
}

export interface CompetitorAnalysis {
  positioningComparison: string;
  targetCompany: CompanyProfile;
  competitors: Competitor[];
  strengths: {
    targetCompany: string[];
    competitors: Record<string, string[]>;
  };
  weaknesses: {
    targetCompany: string[];
    competitors: Record<string, string[]>;
  };
  featureGaps: {
    targetCompany: string[];
    competitiveAdvantages: string[];
  };
  marketDifferentiation: string;
  recommendations: string[];
  summary: string;
}

export interface AnalysisResult {
  timestamp: string;
  company: CompanyProfile;
  competitors: Competitor[];
  analysis: CompetitorAnalysis;
  rawData?: {
    companyWebsite: WebsiteContent;
    competitorWebsites: Record<string, WebsiteContent>;
  };
}

// ─── Twitter ────────────────────────────────────────────────────────────────

export type TwitterAngle =
  | 'pain-point'
  | 'opinion'
  | 'competitor'
  | 'value'
  | 'insight'
  | 'thread-opener'
  | 'lesson'
  | 'hot-take';

export interface TwitterPost {
  id: string;
  hook: string;
  body: string;
  cta: string;
  fullText: string;
  charCount: number;
  angle: TwitterAngle;
  whyThisWorks: string;
  estimatedEngagement: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface TwitterFeed {
  generatedAt: string;
  companyName?: string;
  posts: TwitterPost[];
}

// ─── LinkedIn ────────────────────────────────────────────────────────────────

export type LinkedInFormat = 'story' | 'list' | 'insight' | 'case-study' | 'founder-update';

export interface LinkedInPost {
  id: string;
  hook: string;
  body: string;
  cta: string;
  fullText: string;
  format: LinkedInFormat;
  whyThisWorks: string;
  estimatedReach: string;
  readTime: string;
  createdAt: string;
}

export interface LinkedInFeed {
  generatedAt: string;
  companyName?: string;
  posts: LinkedInPost[];
}

// ─── Reddit ─────────────────────────────────────────────────────────────────

export type RedditOpportunityType = 'answer' | 'soft-pitch' | 'competitor-thread' | 'show-hn-style';

export interface RedditOpportunity {
  id: string;
  subreddit: string;
  title: string;
  url: string;
  snippet: string;
  upvoteProxy: number;
  commentProxy: number;
  relevanceLabel: 'direct' | 'indirect' | 'competitor';
  opportunityType: RedditOpportunityType;
  whyItMatters: string;
  suggestedAngle: string;
  draftReply: string;
  fetchedAt: string;
}

export interface RedditFeed {
  fetchedAt: string;
  companyName?: string;
  opportunities: RedditOpportunity[];
}

// ─── SEO ─────────────────────────────────────────────────────────────────────

export type SeoImpact = 'critical' | 'high' | 'medium' | 'low';
export type SeoCategory = 'technical' | 'content' | 'keywords' | 'competitive' | 'performance';
export type SeoEffort = 'quick-win' | 'medium' | 'project';

export interface SeoRecommendation {
  id: string;
  priority: SeoImpact;
  category: SeoCategory;
  issue: string;
  impact: string;
  fix: string;
  reasoning: string;
  effort: SeoEffort;
  estimatedTrafficGain?: string;
}

export interface SeoReport {
  generatedAt: string;
  companyName?: string;
  overallScore: number;
  recommendations: SeoRecommendation[];
  keywordOpportunities: string[];
  topCompetitorGap: string;
}

// ─── Legacy (kept for backward compat) ──────────────────────────────────────

export interface GeneratedPost {
  id: string;
  platform: 'twitter' | 'linkedin';
  type: 'idea' | 'full';
  hook: string;
  content: string;
  cta: string;
  whyThisWorks: string;
  angle: string;
  createdAt: string;
}

export interface ContentFeed {
  generatedAt: string;
  analysisId?: string;
  companyName?: string;
  posts: GeneratedPost[];
}

export interface CrawlResult {
  success: boolean;
  url: string;
  content?: WebsiteContent;
  error?: string;
  attempts: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  relevance: number;
}
