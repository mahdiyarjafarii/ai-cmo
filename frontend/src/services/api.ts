import axios from 'axios';
import { AnalysisResult, StreamMessage, StepEvent, ChatMessage } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export async function startAnalysis(
  url: string
): Promise<{ analysisId: string }> {
  const response = await api.post('/api/analyze', { url });
  return response.data;
}

export async function subscribeToAnalysis(
  analysisId: string,
  handlers: {
    onMessage: (message: StreamMessage) => void;
    onStep?: (step: StepEvent) => void;
    onError: (error: string) => void;
    onComplete: (result?: AnalysisResult) => void;
  }
): Promise<() => void> {
  const eventSource = new EventSource(
    `${API_BASE}/api/events/${analysisId}`
  );

  eventSource.addEventListener('progress', (event: MessageEvent) => {
    try {
      handlers.onMessage(JSON.parse(event.data));
    } catch (e) {
      console.error('progress parse error', e);
    }
  });

  eventSource.addEventListener('step', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as StepEvent;
      handlers.onStep?.(data);
      handlers.onMessage(data as unknown as StreamMessage);
    } catch (e) {
      console.error('step parse error', e);
    }
  });

  eventSource.addEventListener('error', (event: MessageEvent) => {
    try {
      handlers.onError(JSON.parse(event.data).message);
    } catch {
      handlers.onError('Stream connection error');
    }
    eventSource.close();
  });

  eventSource.addEventListener('complete', (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      handlers.onMessage(data);
      handlers.onComplete(data?.data?.result);
    } catch (e) {
      console.error('complete parse error', e);
      handlers.onComplete();
    }
    eventSource.close();
  });

  eventSource.onerror = () => {
    handlers.onError('Connection lost');
    eventSource.close();
  };

  return () => eventSource.close();
}

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  ids: { analysisId?: string | null; projectId?: string | null }
): Promise<string> {
  const response = await api.post('/api/chat', {
    analysisId: ids.analysisId ?? undefined,
    projectId: ids.projectId ?? undefined,
    message,
    history: history.map((m) => ({ role: m.role, content: m.content })),
  });
  return response.data.message as string;
}

export async function getAnalysisResult(
  analysisId: string
): Promise<AnalysisResult> {
  const response = await api.get(`/api/result/${analysisId}`);
  return response.data;
}

// ─── PageSpeed ─────────────────────────────────────────────────────────────

export interface CoreWebVitalDTO {
  label: string;
  displayValue: string;
  numericValue: number | null;
  rating: 'fast' | 'average' | 'slow' | null;
}

export interface CategoryScoresDTO {
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface SeoHealthSignalDTO {
  key: string;
  label: string;
  value: string;
  status: 'pass' | 'warn' | 'fail';
}

export interface SeoHealthDTO {
  title: string;
  subtitle: string;
  signals: SeoHealthSignalDTO[];
}

export interface StrategyResultDTO {
  strategy: 'mobile' | 'desktop';
  scores: CategoryScoresDTO;
  coreWebVitals: {
    lcp: CoreWebVitalDTO;
    fcp: CoreWebVitalDTO;
    cls: CoreWebVitalDTO;
    tbt: CoreWebVitalDTO;
  };
  seoHealth: SeoHealthDTO;
  fetchedAt: string;
}

export interface PageSpeedResultDTO {
  url: string;
  mobile: StrategyResultDTO;
  desktop: StrategyResultDTO;
  fetchedAt: string;
}

export type PageSpeedError =
  | { code: 'NO_API_KEY' }
  | { code: 'PAGESPEED_ERROR'; message: string }
  | { code: 'NETWORK_ERROR'; message: string };

export async function getPageSpeedData(
  url: string
): Promise<{ data: PageSpeedResultDTO } | { error: PageSpeedError }> {
  try {
    const response = await api.get<PageSpeedResultDTO>('/api/pagespeed', {
      params: { url },
      timeout: 90_000, // PageSpeed can be slow (runs Lighthouse in Google Cloud)
    });
    return { data: response.data };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'response' in err
    ) {
      const axiosErr = err as { response: { data?: { code?: string; error?: string } } };
      const code = axiosErr.response?.data?.code;
      if (code === 'NO_API_KEY') return { error: { code: 'NO_API_KEY' } };
      return {
        error: {
          code: 'PAGESPEED_ERROR',
          message: axiosErr.response?.data?.error ?? 'PageSpeed API error',
        },
      };
    }
    return {
      error: {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Network error',
      },
    };
  }
}
