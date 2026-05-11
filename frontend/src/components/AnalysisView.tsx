import React from 'react';
import { AnalysisResult, StreamMessage, StepEvent } from '../types';
import { ProgressTerminal } from './ProgressTerminal';
import { ProgressBar } from './ProgressBar';
import { CompanyInfoPanel } from './CompanyInfoPanel';
import { CompetitorsPanel } from './CompetitorsPanel';
import { AnalysisPanel } from './AnalysisPanel';
import { motion } from 'framer-motion';

interface AnalysisViewProps {
  isLoading: boolean;
  messages: StreamMessage[];
  steps: Map<string, StepEvent>;
  stepOrder: string[];
  error: string | null;
  result: AnalysisResult | null;
  onNewAnalysis: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  isLoading,
  steps,
  stepOrder,
  error,
  result,
  onNewAnalysis,
}) => {
  const isComplete = !!result && !isLoading;
  const hasError = !!error;

  return (
    <div className="min-h-screen bg-slate-950">
      <ProgressBar
        steps={steps}
        isComplete={isComplete}
        hasError={hasError && !result}
      />

      {/* Loading State - Full Screen Progress */}
      {isLoading && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen w-full p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg">
                  C
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-blue-400 border-2 border-slate-950 animate-soft-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-100">
                  AI CMO is working...
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Crawling, analyzing and discovering competitors in real-time
                </p>
              </div>
            </motion.div>
            <button
              onClick={onNewAnalysis}
              className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition border border-slate-700"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 max-w-4xl w-full mx-auto">
            <ProgressTerminal
              steps={steps}
              stepOrder={stepOrder}
              isComplete={false}
              error={error}
            />
          </div>
        </motion.div>
      )}

      {/* Completed Analysis - Dashboard */}
      {result && !isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-6 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg shrink-0">
                C
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">
                  Competitive Teardown
                </h1>
                <p className="text-slate-400 mt-1 text-sm">
                  {result.company.name} ·{' '}
                  {new Date(result.timestamp).toLocaleDateString()} ·{' '}
                  {result.competitors.length} competitors
                </p>
              </div>
            </motion.div>
            <button
              onClick={onNewAnalysis}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-90 text-white font-semibold rounded-xl transition"
            >
              + New Analysis
            </button>
          </div>

          {/* Top row: Company info + Analysis tabs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4">
              <CompanyInfoPanel company={result.company} />
            </div>

            <div className="lg:col-span-8">
              <AnalysisPanel
                analysis={result.analysis}
                companyName={result.company.name}
              />
            </div>
          </div>

          {/* Competitors grid takes full width */}
          <div>
            <CompetitorsPanel competitors={result.competitors} />
          </div>

          {/* Agent log - collapsed by default but available */}
          <motion.details
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 rounded-lg border border-slate-700 group"
          >
            <summary className="cursor-pointer px-6 py-4 text-slate-100 font-semibold list-none flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-blue-400">▸</span>
                Agent Activity Log ({stepOrder.length} steps)
              </span>
              <span className="text-xs text-slate-500">click to expand</span>
            </summary>
            <div className="px-6 pb-6 h-96">
              <ProgressTerminal
                steps={steps}
                stepOrder={stepOrder}
                isComplete={true}
                error={error}
                target={result.company.url || result.company.name}
              />
            </div>
          </motion.details>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4 justify-center py-8"
          >
            <button
              onClick={() => {
                const json = JSON.stringify(result, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analysis-${result.company.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')}.json`;
                a.click();
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition font-medium"
            >
              Download JSON
            </button>
            <button
              onClick={() => {
                const markdown = generateMarkdownReport(result);
                const blob = new Blob([markdown], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `analysis-${result.company.name
                  .toLowerCase()
                  .replace(/\s+/g, '-')}.md`;
                a.click();
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded transition font-medium"
            >
              Download Markdown
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Error State */}
      {error && !isLoading && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen flex items-center justify-center p-6"
        >
          <div className="max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              Analysis Failed
            </h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={onNewAnalysis}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium"
            >
              Try Again
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

function generateMarkdownReport(result: AnalysisResult): string {
  const { company, competitors, analysis } = result;

  return `# Competitive Analysis Report

**Generated:** ${new Date(result.timestamp).toLocaleDateString()}

## Executive Summary

${analysis.summary}

---

## Company Overview

### ${company.name}

**URL:** ${company.url}

**Description:** ${company.description}

**Industry:** ${company.industry || 'N/A'}

**ICP:** ${company.icp}

**Value Proposition:** ${company.valueProposition}

---

## Competitors

${competitors
  .map(
    (c, i) => `### ${i + 1}. ${c.name}

**URL:** ${c.url}
${c.logo ? `**Logo:** ${c.logo}` : ''}
${c.description ? `\n${c.description}` : ''}
`
  )
  .join('\n')}

---

## Analysis

### Positioning

${analysis.positioningComparison}

### Strengths

- **${company.name}:**
${analysis.strengths.targetCompany.map((s) => `  - ${s}`).join('\n')}

### Weaknesses

- **${company.name}:**
${analysis.weaknesses.targetCompany.map((w) => `  - ${w}`).join('\n')}

### Recommendations

${analysis.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

---

*Generated by Competitor Analysis Engine*
`;
}
