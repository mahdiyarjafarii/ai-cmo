import React from 'react';
import { AnalysisResult, StepEvent } from '../types';
import { ProgressBar } from './ProgressBar';
import { ProgressTerminal } from './ProgressTerminal';
import { AnalysisResultPanel } from './AnalysisResultPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { ChatPanel } from './ChatPanel';
import { ActionsPanel } from './ActionsPanel';
import { CompanyLogo } from './CompanyLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../store/authStore';

interface DashboardProps {
  isLoading: boolean;
  steps: Map<string, StepEvent>;
  stepOrder: string[];
  error: string | null;
  result: AnalysisResult | null;
  onNewAnalysis: () => void;
  user?: User | null;
  onShowProjects?: () => void;
  onLogout?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isLoading,
  steps,
  stepOrder,
  error,
  result,
  onNewAnalysis,
  user,
  onShowProjects,
  onLogout,
}) => {
  const isComplete = !!result && !isLoading;
  const hasError = !!error && !result;
  const doneCount = Array.from(steps.values()).filter((s) => s.status === 'done').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#050714] overflow-hidden">
      {(isComplete || hasError) && (
        <ProgressBar steps={steps} isComplete={isComplete} hasError={hasError} />
      )}

      {/* ── NAVBAR ──────────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-5 h-12 border-b border-white/[0.04] bg-[#050714]/80 backdrop-blur-md relative z-20">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-indigo-500/25">
              C
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-400 border-2 border-[#050714]" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-sm tracking-tight">AI CMO</span>
          </div>

          {/* Company context pill */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8 }}
                className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-white/[0.06]"
              >
                <CompanyLogo name={result.company.name} url={result.company.url} size={18} rounded="md" />
                <span className="text-slate-400 text-xs font-medium">{result.company.name}</span>
                <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {isLoading && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              {doneCount} / 9 steps
            </motion.span>
          )}
          {user && (
            <button
              onClick={onShowProjects}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200 transition"
            >
              <span>📂</span>
              <span className="hidden sm:inline">My Projects</span>
            </button>
          )}
          {user && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={onLogout}
                className="text-xs text-slate-600 hover:text-slate-400 transition hidden sm:block"
              >
                out
              </button>
            </div>
          )}
          <button
            onClick={onNewAnalysis}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-90 text-white transition shadow-sm shadow-indigo-500/20"
          >
            + New
          </button>
        </div>
      </header>

      {/* ── TERMINAL STRIP ─────────────────────────────────── */}
      <motion.div
        animate={{ height: isComplete ? 220 : hasError ? 0 : undefined }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`shrink-0 border-b border-white/[0.04] ${
          !isComplete && !hasError ? 'flex-1' : ''
        } overflow-hidden`}
      >
        {!hasError && (
          <ProgressTerminal
            steps={steps}
            stepOrder={stepOrder}
            isComplete={isComplete}
            error={error}
            compact={isComplete}
            target={result?.company.url || result?.company.name}
          />
        )}
      </motion.div>

      {/* ── 4-COLUMN DASHBOARD ─────────────────────────────── */}
      <AnimatePresence>
        {isComplete && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 overflow-hidden"
          >
            <div className="border-r border-white/[0.04] overflow-y-auto min-h-0">
              <AnalysisResultPanel result={result} />
            </div>
            <div className="border-r border-white/[0.04] overflow-y-auto min-h-0">
              <AnalyticsPanel result={result} />
            </div>
            <div className="border-r border-white/[0.04] overflow-hidden flex flex-col min-h-0">
              <ChatPanel result={result} />
            </div>
            <div className="overflow-hidden flex flex-col min-h-0">
              <ActionsPanel result={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ERROR STATE ──────────────────────────────────────── */}
      <AnimatePresence>
        {hasError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 flex items-center justify-center p-6"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-3xl mx-auto mb-5">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-slate-100 mb-2">Analysis Failed</h2>
              <p className="text-slate-400 mb-6 text-sm leading-relaxed">{error}</p>
              <button
                onClick={onNewAnalysis}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
