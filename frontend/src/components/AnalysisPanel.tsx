import React, { useState } from 'react';
import { CompetitorAnalysis } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisPanelProps {
  analysis: CompetitorAnalysis;
  companyName: string;
}

type ActiveTab = 'overview' | 'swot' | 'gaps' | 'recommendations';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  companyName,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const tabs: { id: ActiveTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'swot', label: 'SWOT' },
    { id: 'gaps', label: 'Feature Gaps' },
    { id: 'recommendations', label: 'Recommendations' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="flex flex-col bg-slate-800 rounded-lg border border-slate-700 h-full"
    >
      {/* Tabs */}
      <div className="border-b border-slate-700 px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition relative ${
                activeTab === tab.id
                  ? 'text-blue-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Positioning
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {analysis.positioningComparison}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Market Differentiation
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {analysis.marketDifferentiation}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">
                  Summary
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {analysis.summary}
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'swot' && (
            <motion.div
              key="swot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">
                  ✓ Strengths ({companyName})
                </h3>
                <div className="space-y-1">
                  {analysis.strengths.targetCompany.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-slate-400 flex items-start gap-2"
                    >
                      <span className="text-green-400 text-xs">•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">
                  ✗ Weaknesses ({companyName})
                </h3>
                <div className="space-y-1">
                  {analysis.weaknesses.targetCompany.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-slate-400 flex items-start gap-2"
                    >
                      <span className="text-red-400 text-xs">•</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'gaps' && (
            <motion.div
              key="gaps"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-yellow-400 mb-2">
                  Missing Features
                </h3>
                <div className="space-y-1">
                  {analysis.featureGaps.targetCompany.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-sm text-slate-400 flex items-start gap-2"
                    >
                      <span className="text-yellow-400 text-xs">○</span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-2">
                  Competitive Advantages
                </h3>
                <div className="space-y-1">
                  {analysis.featureGaps.competitiveAdvantages.map(
                    (item, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-slate-400 flex items-start gap-2"
                      >
                        <span className="text-blue-400 text-xs">★</span>
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'recommendations' && (
            <motion.div
              key="recommendations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-semibold text-slate-300 mb-4">
                Strategic Recommendations
              </h3>
              {analysis.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-700/30 border border-slate-600 rounded text-sm text-slate-300"
                >
                  <span className="text-blue-400 font-semibold">{idx + 1}.</span>{' '}
                  {rec}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
