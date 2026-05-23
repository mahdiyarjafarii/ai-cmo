import React, { useEffect, useRef } from 'react';
import { StepEvent } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressTerminalProps {
  steps: Map<string, StepEvent>;
  stepOrder: string[];
  isComplete: boolean;
  error?: string | null;
  compact?: boolean;
  target?: string;
}

const StatusIcon: React.FC<{ status: StepEvent['status'] }> = ({ status }) => {
  if (status === 'running') {
    return <span className="inline-block w-4 h-4 border-2 border-[#fc6423]/40 border-t-[#fc6423] rounded-full animate-spin" />;
  }
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-green-100 text-green-600 text-[10px]"
      >
        ✓
      </motion.span>
    );
  }
  return <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-red-100 text-red-500 text-[10px]">✗</span>;
};

export const ProgressTerminal: React.FC<ProgressTerminalProps> = ({
  steps, stepOrder, isComplete, error, compact = false, target,
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const doneCount = Array.from(steps.values()).filter((s) => s.status === 'done').length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [stepOrder.length, steps]);

  return (
    <div className={`w-full h-full flex flex-col bg-gray-50 font-mono text-sm ${compact ? '' : 'border border-gray-200'}`}>
      {/* Header */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#fc6423]/10 border border-[#fc6423]/20 flex items-center justify-center text-[#fc6423] text-xs">
              ▣
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-gray-700 truncate font-medium">
                AI CMO Terminal · {isComplete ? 'Completed' : error ? 'Failed' : 'Running'}
              </div>
              <div className="text-[10px] text-gray-400 truncate">
                {target ? `Target: ${target}` : 'Target: —'}
              </div>
            </div>
          </div>
          <div className="text-[10px] shrink-0">
            {isComplete ? (
              <span className="text-green-600 font-semibold uppercase tracking-[0.18em]">Complete</span>
            ) : error ? (
              <span className="text-red-500 font-semibold uppercase tracking-[0.18em]">Failed</span>
            ) : (
              <span className="text-[#fc6423] font-semibold uppercase tracking-[0.18em] animate-pulse">Running</span>
            )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[10px] text-gray-400">
          <div className="truncate">&gt; TARGET: <span className="text-gray-700">{target ?? '—'}</span></div>
          <div className="truncate">&gt; STATUS: <span className="text-gray-700">{isComplete ? 'COMPLETED' : error ? 'FAILED' : 'RUNNING'}</span></div>
          <div className="truncate">&gt; PLAN: <span className="text-gray-700">FREE</span></div>
          <div className="truncate">&gt; ROLE: <span className="text-gray-700">AGENT</span></div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {stepOrder.length === 0 ? (
          <div className="text-gray-400">Initializing agent...</div>
        ) : (
          <AnimatePresence initial={false}>
            {stepOrder.map((id) => {
              const step = steps.get(id);
              if (!step) return null;
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 shrink-0"><StatusIcon status={step.status} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={
                        step.status === 'error' ? 'text-red-500' :
                        step.status === 'done' ? 'text-gray-700' : 'text-[#fc6423]'
                      }>
                        {step.message}
                      </span>
                    </div>
                    {step.detail && (
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{step.detail}</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 flex items-start gap-2 mt-2 pt-2 border-t border-gray-200"
          >
            <span>✗</span><span>{error}</span>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {!compact && (
        <div className="border-t border-gray-200 px-4 py-2 bg-white text-xs text-gray-400 flex items-center justify-between">
          <span>{stepOrder.length} step{stepOrder.length !== 1 ? 's' : ''}</span>
          <span>{doneCount} done</span>
        </div>
      )}
    </div>
  );
};
