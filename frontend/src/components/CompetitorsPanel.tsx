import React from 'react';
import { Competitor } from '../types';
import { motion } from 'framer-motion';
import { CompetitorCard } from './CompetitorCard';

interface CompetitorsPanelProps {
  competitors: Competitor[];
  loading?: boolean;
}

const SkeletonCard: React.FC<{ index: number }> = ({ index }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.05 }}
    className="bg-gray-100 border border-gray-300 rounded-xl p-5 animate-pulse"
  >
    <div className="w-14 h-14 rounded-lg bg-slate-700 mb-4" />
    <div className="h-5 bg-slate-700 rounded w-3/4 mb-2" />
    <div className="h-3 bg-slate-700 rounded w-1/2 mb-3" />
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-slate-700 rounded w-full" />
      <div className="h-3 bg-slate-700 rounded w-5/6" />
      <div className="h-3 bg-slate-700 rounded w-2/3" />
    </div>
    <div className="h-9 bg-slate-700 rounded" />
  </motion.div>
);

export const CompetitorsPanel: React.FC<CompetitorsPanelProps> = ({
  competitors,
  loading = false,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-gray-100/50 rounded-lg border border-gray-300 p-6 h-full"
    >
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Identified Competitors
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Discovering competitors...'
              : `${competitors.length} direct competitors found`}
          </p>
        </div>
        {!loading && competitors.length > 0 && (
          <span className="text-xs text-gray-400">
            Logos via Clearbit · Google
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} index={i} />
            ))
          : competitors.map((competitor, idx) => (
              <CompetitorCard
                key={competitor.url}
                competitor={competitor}
                index={idx}
              />
            ))}
      </div>

      {!loading && competitors.length === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <p>No competitors found</p>
        </div>
      )}
    </motion.div>
  );
};
