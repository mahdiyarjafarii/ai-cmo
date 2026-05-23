import React from 'react';
import logoUrl from '../assets/logo.png';
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
  isLoading, steps, stepOrder, error, result,
  onNewAnalysis, user, onShowProjects, onLogout,
}) => {
  const isComplete = !!result && !isLoading;
  const hasError = !!error && !result;
  const doneCount = Array.from(steps.values()).filter((s) => s.status === 'done').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f8f9fb] overflow-hidden">
      {(isComplete || hasError) && (
        <ProgressBar steps={steps} isComplete={isComplete} hasError={hasError} />
      )}

      {/* ── NAVBAR ── */}
      <header className="shrink-0 flex items-center justify-between px-5 h-12 border-b border-gray-200 bg-white/90 backdrop-blur-md relative z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={logoUrl} alt="logo" className="w-7 h-7 object-contain" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm tracking-tight">AI CMO</span>

          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, x: -8, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8 }}
                className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-gray-200"
              >
                <CompanyLogo name={result.company.name} url={result.company.url} size={18} rounded="md" />
                <span className="text-gray-500 text-xs font-medium">{result.company.name}</span>
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-gray-500 flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#fc6423] animate-ping" />
              {doneCount} / 9 steps
            </motion.span>
          )}
          {user && (
            <button
              onClick={onShowProjects}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-gray-100 border border-gray-200 hover:border-[#fc6423]/40 text-gray-500 hover:text-gray-800 transition"
            >
              <span>📂</span>
              <span className="hidden sm:inline">My Projects</span>
            </button>
          )}
          {user && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#fc6423] flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <button onClick={onLogout} className="text-xs text-gray-400 hover:text-gray-600 transition hidden sm:block">
                out
              </button>
            </div>
          )}
          <button
            onClick={onNewAnalysis}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[#fc6423] hover:bg-[#e55a1c] text-white transition shadow-sm shadow-[#fc6423]/20"
          >
            + New
          </button>
        </div>
      </header>

      {/* ── TERMINAL STRIP ── */}
      <motion.div
        animate={{ height: isComplete ? 220 : hasError ? 0 : undefined }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className={`shrink-0 border-b border-gray-200 ${!isComplete && !hasError ? 'flex-1' : ''} overflow-hidden`}
      >
        {!hasError && (
          <ProgressTerminal
            steps={steps} stepOrder={stepOrder}
            isComplete={isComplete} error={error}
            compact={isComplete}
            target={result?.company.url || result?.company.name}
          />
        )}
      </motion.div>

      {/* ── 4-COLUMN DASHBOARD ── */}
      <AnimatePresence>
        {isComplete && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 overflow-hidden"
          >
            <div className="border-r border-gray-200 overflow-y-auto min-h-0 bg-white">
              <AnalysisResultPanel result={result} />
            </div>
            <div className="border-r border-gray-200 overflow-y-auto min-h-0 bg-white">
              <AnalyticsPanel result={result} />
            </div>
            <div className="border-r border-gray-200 overflow-hidden flex flex-col min-h-0 bg-white">
              <ChatPanel result={result} />
            </div>
            <div className="overflow-hidden flex flex-col min-h-0 bg-white">
              <ActionsPanel result={result} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ERROR STATE ── */}
      <AnimatePresence>
        {hasError && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 flex items-center justify-center p-6"
          >
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-3xl mx-auto mb-5">
                ⚠️
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">{error}</p>
              <button
                onClick={onNewAnalysis}
                className="px-6 py-2.5 bg-[#fc6423] hover:bg-[#e55a1c] text-white rounded-xl font-semibold text-sm transition"
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
