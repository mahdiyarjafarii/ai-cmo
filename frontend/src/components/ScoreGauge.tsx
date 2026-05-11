import React from 'react';
import { motion } from 'framer-motion';

export type ScoreRating = 'good' | 'needs-improvement' | 'poor' | 'loading' | 'unavailable';

interface ScoreGaugeProps {
  label: string;
  score: number | null;
  size?: number;
  strokeWidth?: number;
  /** Delay the animation for staggered entrance */
  animationDelay?: number;
}

const RATING_COLORS: Record<ScoreRating, { stroke: string; text: string; bg: string }> = {
  good:              { stroke: '#22c55e', text: 'text-green-400',  bg: 'bg-green-500/10' },
  'needs-improvement': { stroke: '#f97316', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  poor:              { stroke: '#ef4444', text: 'text-red-400',    bg: 'bg-red-500/10' },
  loading:           { stroke: '#475569', text: 'text-slate-500',  bg: 'bg-slate-800' },
  unavailable:       { stroke: '#334155', text: 'text-slate-600',  bg: 'bg-slate-900' },
};

export function getRating(score: number | null): ScoreRating {
  if (score == null) return 'unavailable';
  if (score >= 90) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  label,
  score,
  size = 80,
  strokeWidth = 6,
  animationDelay = 0,
}) => {
  const rating = getRating(score);
  const colors = RATING_COLORS[rating];

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillFraction = score != null ? score / 100 : 0;
  // Start from the top (rotate -90deg via transform)
  const dashOffset = circumference * (1 - fillFraction);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          {score != null && (
            <motion.circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{
                duration: 1,
                ease: 'easeOut',
                delay: animationDelay,
              }}
            />
          )}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center">
          {score != null ? (
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: animationDelay + 0.3, duration: 0.3 }}
              className={`text-lg font-bold leading-none ${colors.text}`}
            >
              {score}
            </motion.span>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}
        </div>
      </div>

      <span className="text-[11px] text-slate-400 text-center leading-tight max-w-[72px]">
        {label}
      </span>
    </div>
  );
};

// ─── Loading skeleton variant ──────────────────────────────────────────────

export const ScoreGaugeSkeleton: React.FC<{ size?: number }> = ({
  size = 80,
}) => {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative animate-pulse" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-4 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="w-14 h-2.5 bg-slate-800 rounded animate-pulse" />
    </div>
  );
};
