import React, { useEffect, useState } from 'react';
import { AnalysisResult } from '../types';
import { motion } from 'framer-motion';
import {
  getPageSpeedData,
  PageSpeedResultDTO,
  PageSpeedError,
  StrategyResultDTO,
} from '../services/api';
import { ScoreGauge, ScoreGaugeSkeleton } from './ScoreGauge';
import { CoreWebVitalsSection } from './CoreWebVitals';
import { SeoHealthTable } from './SeoHealthTable';

interface AnalyticsPanelProps {
  result: AnalysisResult;
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: PageSpeedResultDTO }
  | { status: 'no-key' }
  | { status: 'error'; message: string };

const SCORE_LABELS: Array<{ key: keyof StrategyResultDTO['scores']; label: string }> = [
  { key: 'performance',   label: 'Perf' },
  { key: 'accessibility', label: 'A11y' },
  { key: 'bestPractices', label: 'Best' },
  { key: 'seo',           label: 'SEO' },
];

const SCORE_LABELS_FULL: Array<{ key: keyof StrategyResultDTO['scores']; label: string }> = [
  { key: 'performance',   label: 'Performance' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'bestPractices', label: 'Best Practices' },
  { key: 'seo',           label: 'SEO' },
];

const ScoresSection: React.FC<{ strategy: StrategyResultDTO; baseDelay?: number }> = ({
  strategy,
  baseDelay = 0,
}) => (
  <div className="grid grid-cols-4 gap-2">
    {SCORE_LABELS.map(({ key, label }, i) => (
      <ScoreGauge
        key={key}
        label={label}
        score={strategy.scores[key]}
        size={68}
        strokeWidth={5}
        animationDelay={baseDelay + i * 0.1}
      />
    ))}
  </div>
);

const LoadingScores: React.FC = () => (
  <div className="grid grid-cols-4 gap-2">
    {[0, 1, 2, 3].map((i) => (
      <ScoreGaugeSkeleton key={i} size={68} />
    ))}
  </div>
);

const MobileIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const DesktopIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ result }) => {
  const [state, setState] = useState<LoadState>({ status: 'idle' });
  const [activeStrategy, setActiveStrategy] = useState<'mobile' | 'desktop'>('mobile');

  useEffect(() => {
    let cancelled = false;
    const targetUrl = result.company.url?.trim();
    if (!targetUrl) {
      setState({ status: 'error', message: 'Company URL is missing.' });
      return;
    }
    setState({ status: 'loading' });
    getPageSpeedData(targetUrl).then((res) => {
      if (cancelled) return;
      if ('data' in res) {
        setState({ status: 'success', data: res.data });
      } else {
        const err = res.error as PageSpeedError;
        if (err.code === 'NO_API_KEY') setState({ status: 'no-key' });
        else setState({ status: 'error', message: 'message' in err ? err.message : 'Unexpected error' });
      }
    });
    return () => { cancelled = true; };
  }, [result.company.url]);

  const isLive = state.status === 'success';
  const isLoading = state.status === 'loading';

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="shrink-0 relative border-b border-white/[0.04]">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-[13px] font-semibold text-slate-100 tracking-tight">Analytics</p>
          </div>
        </div>

        {/* Strategy tabs in header */}
        {(isLive || isLoading) && (
          <div className="flex items-center gap-1 px-4 pb-3">
            {(['mobile', 'desktop'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveStrategy(s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeStrategy === s
                    ? 'bg-blue-500/15 text-blue-300 border border-blue-500/25'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                {s === 'mobile' ? <MobileIcon /> : <DesktopIcon />}
                {s === 'mobile' ? 'Mobile' : 'Desktop'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Loading */}
        {state.status === 'loading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-3">
                {activeStrategy === 'mobile' ? 'Mobile' : 'Desktop'} Scores
              </p>
              <LoadingScores />
            </div>
            <div className="space-y-2 animate-pulse">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-xl bg-white/[0.03] border border-white/[0.04]" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Success */}
        {state.status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Scores */}
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider font-semibold mb-3">
                {activeStrategy === 'mobile' ? 'Mobile' : 'Desktop'} Performance
              </p>
              {activeStrategy === 'mobile' ? (
                <ScoresSection strategy={state.data.mobile} />
              ) : (
                <ScoresSection strategy={state.data.desktop} />
              )}
            </div>

            {/* Score legend */}
            <div className="flex items-center gap-4 text-[10px]">
              {[
                { color: 'bg-red-500', label: '0–49 Poor' },
                { color: 'bg-orange-500', label: '50–89 Needs work' },
                { color: 'bg-green-500', label: '90–100 Good' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${l.color}`} />
                  <span className="text-slate-600">{l.label}</span>
                </div>
              ))}
            </div>

            {/* M vs D comparison */}
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.04]">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Mobile vs Desktop
                </p>
              </div>
              <div className="px-4 py-3 space-y-2.5">
                {SCORE_LABELS_FULL.map(({ key, label }) => {
                  const mScore = state.data.mobile.scores[key];
                  const dScore = state.data.desktop.scores[key];
                  const delta = mScore != null && dScore != null ? dScore - mScore : null;
                  const pct = mScore != null ? mScore : 0;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-mono">{mScore ?? '—'}</span>
                          <span className="text-slate-700">→</span>
                          <span className="text-slate-400 font-mono">{dScore ?? '—'}</span>
                          {delta != null && (
                            <span className={`font-bold text-[9px] px-1 rounded ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-slate-600'}`}>
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-1 rounded-full bg-slate-800/60 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                          className={`h-full rounded-full ${
                            pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Core Web Vitals */}
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
              <CoreWebVitalsSection
                {...(activeStrategy === 'mobile' ? state.data.mobile.coreWebVitals : state.data.desktop.coreWebVitals)}
              />
            </div>

            {/* SEO Health */}
            <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4">
              <SeoHealthTable
                data={activeStrategy === 'mobile' ? state.data.mobile.seoHealth : state.data.desktop.seoHealth}
              />
            </div>

            <div className="text-[10px] text-slate-700 text-right">
              Fetched {new Date(state.data.fetchedAt).toLocaleTimeString()}
            </div>
          </motion.div>
        )}

        {/* No API key */}
        {state.status === 'no-key' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center gap-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-3xl">
              🔑
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Add a Google API Key</p>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">
                Add{' '}
                <code className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono text-[10px]">
                  GOOGLE_PAGESPEED_KEY
                </code>{' '}
                to your <code className="text-slate-400 font-mono text-[10px]">.env</code> to see real scores.
              </p>
            </div>
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 transition"
            >
              Get API Key →
            </a>
          </motion.div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-center gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl">
              ⚠️
            </div>
            <p className="text-sm font-semibold text-slate-200">PageSpeed fetch failed</p>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[220px]">{state.message}</p>
            <button
              onClick={() => {
                setState({ status: 'loading' });
                getPageSpeedData(result.company.url).then((res) => {
                  if ('data' in res) setState({ status: 'success', data: res.data });
                  else {
                    const err = res.error as PageSpeedError;
                    setState({ status: 'error', message: 'message' in err ? err.message : 'Unexpected error' });
                  }
                });
              }}
              className="text-xs px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Connect CTAs */}
        {state.status !== 'loading' && (
          <div className="space-y-2.5 pt-2 border-t border-white/[0.04]">
            <p className="text-[10px] text-slate-700 uppercase tracking-wider font-semibold">
              Connect more sources
            </p>
            {[
              { icon: '📊', label: 'Google Analytics', sub: 'Sessions, bounce rate, conversions' },
              { icon: '🔍', label: 'Search Console', sub: 'Keywords, CTR, impressions' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01]"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-400">{item.label}</p>
                  <p className="text-[10px] text-slate-600">{item.sub}</p>
                </div>
                <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-800/60 text-slate-600 border border-slate-700/50">
                  Soon
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
};
