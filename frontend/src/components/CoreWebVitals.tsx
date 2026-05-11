import React from 'react';
import { motion } from 'framer-motion';

export interface CoreWebVitalData {
  label: string;
  displayValue: string;
  numericValue: number | null;
  rating: 'fast' | 'average' | 'slow' | null;
}

interface CoreWebVitalsProps {
  lcp: CoreWebVitalData;
  fcp: CoreWebVitalData;
  cls: CoreWebVitalData;
  tbt: CoreWebVitalData;
}

const RATING_CONFIG = {
  fast:    { label: 'Good',  className: 'text-green-400 bg-green-500/10 border-green-500/20' },
  average: { label: 'Needs Improvement', className: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  slow:    { label: 'Poor',  className: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const VITAL_INFO: Record<string, { name: string; goodThreshold: string; desc: string }> = {
  LCP: {
    name: 'Largest Contentful Paint',
    goodThreshold: '≤ 2.5s',
    desc: 'Time until the largest visible element loads',
  },
  FCP: {
    name: 'First Contentful Paint',
    goodThreshold: '≤ 1.8s',
    desc: 'Time until first content appears on screen',
  },
  CLS: {
    name: 'Cumulative Layout Shift',
    goodThreshold: '≤ 0.1',
    desc: 'Visual stability — how much the page shifts',
  },
  TBT: {
    name: 'Total Blocking Time',
    goodThreshold: '≤ 200ms',
    desc: 'Time main thread is blocked from responding',
  },
};

const VitalRow: React.FC<{ vital: CoreWebVitalData; index: number }> = ({
  vital,
  index,
}) => {
  const cfg = vital.rating ? RATING_CONFIG[vital.rating] : null;
  const info = VITAL_INFO[vital.label];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex items-center gap-3 py-2.5 border-b border-slate-900/60 last:border-0"
    >
      {/* Label + description */}
      <div className="w-12 shrink-0">
        <div className="text-xs font-bold text-slate-300">{vital.label}</div>
        <div className="text-[10px] text-slate-600">{info?.goodThreshold}</div>
      </div>

      {/* Bar + value */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span
            className={`text-base font-bold leading-none ${
              cfg ? cfg.className.split(' ')[0] : 'text-slate-500'
            }`}
          >
            {vital.displayValue}
          </span>
          {cfg && (
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${cfg.className}`}
            >
              {cfg.label}
            </span>
          )}
        </div>
        {/* Progress bar relative to the "poor" threshold */}
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
          {vital.numericValue != null && (
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, clampPercent(vital))}%`,
              }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.07 + 0.2 }}
              className={`h-full rounded-full ${
                vital.rating === 'fast'
                  ? 'bg-green-500'
                  : vital.rating === 'average'
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};

/** Map a CWV numeric value to a 0-100 percent for the progress bar. */
function clampPercent(vital: CoreWebVitalData): number {
  if (vital.numericValue == null) return 0;
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 8000],
    FCP: [1800, 6000],
    CLS: [0.1, 0.6],
    TBT: [200, 1200],
  };
  const [, max] = thresholds[vital.label] ?? [1, 2];
  const pct = (vital.numericValue / max) * 100;
  return Math.max(5, Math.min(100, pct));
}

export const CoreWebVitalsSection: React.FC<CoreWebVitalsProps> = ({
  lcp,
  fcp,
  cls,
  tbt,
}) => {
  return (
    <div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-semibold">
        Core Web Vitals
      </div>
      <div>
        {[lcp, fcp, cls, tbt].map((v, i) => (
          <VitalRow key={v.label} vital={v} index={i} />
        ))}
      </div>
    </div>
  );
};
