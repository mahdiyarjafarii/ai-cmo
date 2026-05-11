import React from 'react';
import { motion } from 'framer-motion';
import { StepEvent } from '../types';

interface ProgressBarProps {
  steps: Map<string, StepEvent>;
  isComplete: boolean;
  hasError: boolean;
}

// Total expected high-level steps the agent emits.
// Used to calculate a stable progress percentage even before all steps arrive.
const TOTAL_EXPECTED_STEPS = 9;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  isComplete,
  hasError,
}) => {
  const allSteps = Array.from(steps.values());
  const doneCount = allSteps.filter((s) => s.status === 'done').length;
  const totalKnown = Math.max(allSteps.length, TOTAL_EXPECTED_STEPS);

  const percent = isComplete
    ? 100
    : Math.min(95, Math.round((doneCount / totalKnown) * 100));

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900/40 backdrop-blur">
      <motion.div
        className={`h-full ${
          hasError
            ? 'bg-red-500'
            : isComplete
            ? 'bg-green-500'
            : 'bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500'
        }`}
        initial={{ width: '0%' }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          backgroundSize: '200% 100%',
        }}
      >
        {!isComplete && !hasError && (
          <motion.div
            className="h-full w-full"
            animate={{
              backgroundPosition: ['0% 50%', '200% 50%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
