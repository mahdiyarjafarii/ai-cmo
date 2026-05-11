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
    return (
      <span className="inline-block w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin" />
    );
  }
  if (status === 'done') {
    return (
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-green-500/20 text-green-400"
      >
        ✓
      </motion.span>
    );
  }
  return (
    <span className="inline-flex w-4 h-4 items-center justify-center rounded-full bg-red-500/20 text-red-400">
      ✗
    </span>
  );
};

export const ProgressTerminal: React.FC<ProgressTerminalProps> = ({
  steps,
  stepOrder,
  isComplete,
  error,
  compact = false,
  target,
}) => {
  const endRef = useRef<HTMLDivElement>(null);

  const doneCount = Array.from(steps.values()).filter((s) => s.status === 'done')
    .length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [stepOrder.length, steps]);

  return (
    <div className={`w-full h-full flex flex-col bg-slate-900/60 font-mono text-sm ${compact ? '' : 'rounded-lg border border-slate-700'}`}>
      {/* Active agent context */}
      <div className="px-4 py-2 bg-[#080B16] border-b border-slate-900/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-300 text-xs">
              ▣
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-300 truncate">
                AI CMO Terminal · {isComplete ? 'Completed' : error ? 'Failed' : 'Running'}
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                {target ? `Target: ${target}` : 'Target: —'}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 shrink-0">
            {isComplete ? (
              <span className="text-green-400 font-semibold uppercase tracking-[0.18em]">
                Complete
              </span>
            ) : error ? (
              <span className="text-red-400 font-semibold uppercase tracking-[0.18em]">
                Failed
              </span>
            ) : (
              <span className="text-blue-400 font-semibold uppercase tracking-[0.18em] animate-pulse">
                Running
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <div className="truncate">&gt; TARGET: <span className="text-slate-300">{target ?? '—'}</span></div>
          <div className="truncate">&gt; STATUS: <span className="text-slate-300">{isComplete ? 'COMPLETED' : error ? 'FAILED' : 'RUNNING'}</span></div>
          <div className="truncate">&gt; PLAN: <span className="text-slate-300">FREE</span></div>
          <div className="truncate">&gt; ROLE: <span className="text-slate-300">AGENT</span></div>
        </div>
      </div>

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {stepOrder.length === 0 ? (
          <div className="text-slate-500">Initializing agent...</div>
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
                  <div className="mt-0.5 shrink-0">
                    <StatusIcon status={step.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`${
                          step.status === 'error'
                            ? 'text-red-400'
                            : step.status === 'done'
                            ? 'text-slate-300'
                            : 'text-blue-300'
                        }`}
                      >
                        {step.message}
                      </span>
                    </div>
                    {step.detail && (
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        {step.detail}
                      </div>
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
            className="text-red-400 flex items-start gap-2 mt-2 pt-2 border-t border-slate-700"
          >
            <span className="text-red-500">✗</span>
            <span>{error}</span>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Footer */}
      {!compact && (
        <div className="border-t border-slate-700 px-4 py-2 bg-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>{stepOrder.length} step{stepOrder.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-500">{doneCount} done</span>
        </div>
      )}
    </div>
  );
};
