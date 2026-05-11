import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SeoRecommendation, SeoReport, SeoImpact, SeoCategory, SeoEffort } from '../../types';

interface SeoDrawerProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  onGenerate: () => Promise<SeoReport>;
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
);

const PRIORITY_CONFIG: Record<SeoImpact, { label: string; color: string; bar: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10 border-red-500/30',    bar: 'bg-red-500',    dot: 'bg-red-400' },
  high:     { label: 'High',     color: 'text-orange-400 bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500', dot: 'bg-orange-400' },
  medium:   { label: 'Medium',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', bar: 'bg-yellow-500', dot: 'bg-yellow-400' },
  low:      { label: 'Low',      color: 'text-slate-400 bg-slate-800 border-slate-700',     bar: 'bg-slate-600',  dot: 'bg-slate-500' },
};

const CATEGORY_CONFIG: Record<SeoCategory, { label: string; icon: string }> = {
  technical:   { label: 'Technical',   icon: '⚙️' },
  content:     { label: 'Content',     icon: '📝' },
  keywords:    { label: 'Keywords',    icon: '🔑' },
  competitive: { label: 'Competitive', icon: '⚔️' },
  performance: { label: 'Performance', icon: '⚡' },
};

const EFFORT_CONFIG: Record<SeoEffort, { label: string; color: string }> = {
  'quick-win': { label: 'Quick Win', color: 'text-green-400' },
  medium:      { label: 'Medium',    color: 'text-yellow-400' },
  project:     { label: 'Project',   color: 'text-red-400' },
};

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#eab308' : '#ef4444';
  const angle = (score / 100) * 180;
  const rad = (angle - 90) * (Math.PI / 180);
  const x = 60 + 45 * Math.cos(rad);
  const y = 60 + 45 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center">
      <svg width="120" height="70" viewBox="0 0 120 70">
        {/* Background arc */}
        <path d="M 15 60 A 45 45 0 0 1 105 60" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        {/* Score arc */}
        <path
          d={`M 15 60 A 45 45 0 ${angle > 90 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
        />
        {/* Score text */}
        <text x="60" y="58" textAnchor="middle" fill="white" fontSize="22" fontWeight="700">{score}</text>
        <text x="60" y="68" textAnchor="middle" fill="#64748b" fontSize="8">/ 100</text>
      </svg>
    </div>
  );
};

const RecommendationCard: React.FC<{
  rec: SeoRecommendation;
  isSelected: boolean;
  onClick: () => void;
}> = ({ rec, isSelected, onClick }) => {
  const p = PRIORITY_CONFIG[rec.priority];
  const cat = CATEGORY_CONFIG[rec.category];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected ? 'border-green-500/30 bg-green-500/5' : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
      }`}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${p.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-200 font-medium leading-snug line-clamp-2">{rec.issue}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 ml-3.5">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>
        <span className="text-[9px] text-slate-600">{cat.icon} {cat.label}</span>
      </div>
    </motion.button>
  );
};

const CategoryFilter: React.FC<{
  active: SeoCategory | 'all';
  onChange: (cat: SeoCategory | 'all') => void;
}> = ({ active, onChange }) => {
  const cats: (SeoCategory | 'all')[] = ['all', 'technical', 'content', 'keywords', 'competitive', 'performance'];
  return (
    <div className="flex flex-wrap gap-1 px-3 pb-2">
      {cats.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition capitalize ${
            active === c
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
          }`}
        >
          {c === 'all' ? '✦ All' : `${CATEGORY_CONFIG[c].icon} ${CATEGORY_CONFIG[c].label}`}
        </button>
      ))}
    </div>
  );
};

export const SeoDrawer: React.FC<SeoDrawerProps> = ({
  open, onClose, companyName, onGenerate,
}) => {
  const [report, setReport] = useState<SeoReport | null>(null);
  const [selected, setSelected] = useState<SeoRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SeoCategory | 'all'>('all');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true); setError(null);
    try {
      const r = await onGenerate();
      setReport(r);
      if (r.recommendations[0]) setSelected(r.recommendations[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyFix = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(`${selected.issue}\n\nFix: ${selected.fix}\n\nImpact: ${selected.impact}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredRecs = report?.recommendations.filter(
    (r) => filter === 'all' || r.category === filter
  ) ?? [];

  const p = selected ? PRIORITY_CONFIG[selected.priority] : null;
  const cat = selected ? CATEGORY_CONFIG[selected.category] : null;
  const effort = selected ? EFFORT_CONFIG[selected.effort] : null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#050714] border-l border-slate-800 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-green-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400">
                  <SearchIcon />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">SEO Recommendations</h2>
                  <p className="text-[11px] text-slate-500">AI-powered audit · Prioritized by impact · {companyName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {report && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                    {report.recommendations.length} issues
                  </span>
                )}
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition">✕</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Left panel */}
              <div className="w-[210px] shrink-0 border-r border-slate-800 flex flex-col overflow-hidden">
                {/* Score + generate */}
                <div className="px-3 py-3 border-b border-slate-800 space-y-3">
                  {report && (
                    <div className="flex flex-col items-center py-1">
                      <ScoreGauge score={report.overallScore} />
                      <p className="text-[10px] text-slate-500 mt-1">SEO Health Score</p>
                    </div>
                  )}
                  <button
                    onClick={handleGenerate} disabled={isGenerating}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-500 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isGenerating ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Analyzing…</> : `${report ? '↻ Re-analyze' : '✦ Analyze SEO'}`}
                  </button>
                  {error && <p className="text-[10px] text-red-400">{error}</p>}
                </div>

                {/* Category filter */}
                {report && (
                  <div className="pt-2">
                    <CategoryFilter active={filter} onChange={setFilter} />
                  </div>
                )}

                {/* Rec list */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                  {filteredRecs.length > 0 ? (
                    filteredRecs.map((rec) => (
                      <RecommendationCard key={rec.id} rec={rec} isSelected={selected?.id === rec.id} onClick={() => setSelected(rec)} />
                    ))
                  ) : isGenerating ? (
                    <div className="space-y-2 py-2">
                      {[0,1,2,3,4].map(i => <div key={i} className="w-full h-14 rounded-xl bg-slate-800/50 animate-pulse" />)}
                    </div>
                  ) : !report ? (
                    <div className="py-8 text-center px-2">
                      <p className="text-[11px] text-slate-600">Run analysis to see recommendations</p>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Detail pane */}
              {selected ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                  {/* Badges */}
                  <div className="shrink-0 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2 flex-wrap">
                    {p && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>}
                    {cat && <span className="text-[10px] text-slate-500">{cat.icon} {cat.label}</span>}
                    {effort && <span className={`text-[10px] font-semibold ml-auto ${effort.color}`}>{effort.label}</span>}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Issue */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5">Issue</p>
                      <p className="text-base font-bold text-white leading-snug">{selected.issue}</p>
                    </div>

                    {/* Impact + traffic */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5">
                        <p className="text-[10px] uppercase tracking-wider text-green-400 mb-1">Impact</p>
                        <p className="text-sm font-semibold text-white">{selected.impact}</p>
                        {selected.estimatedTrafficGain && (
                          <p className="text-[10px] text-green-400 mt-0.5">{selected.estimatedTrafficGain}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Effort</p>
                        {effort && <p className={`text-sm font-semibold ${effort.color}`}>{effort.label}</p>}
                      </div>
                    </div>

                    {/* Fix */}
                    <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
                      <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-2">Recommended Fix</p>
                      <p className="text-sm text-slate-200 leading-relaxed">{selected.fix}</p>
                    </div>

                    {/* Reasoning */}
                    <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20">
                      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Why This Matters for {companyName}</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{selected.reasoning}</p>
                    </div>

                    {/* Keyword opportunities */}
                    {report && report.keywordOpportunities.length > 0 && (
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20">
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Keyword Opportunities</p>
                        <div className="flex flex-wrap gap-2">
                          {report.keywordOpportunities.map((kw, i) => (
                            <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Competitor gap */}
                    {report?.topCompetitorGap && (
                      <div className="p-3 rounded-xl border border-red-500/10 bg-red-500/5">
                        <p className="text-[10px] uppercase tracking-wider text-red-400 mb-1.5">Top Competitor Gap</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{report.topCompetitorGap}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 px-4 py-3 border-t border-slate-800">
                    <button
                      onClick={handleCopyFix}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition"
                    >
                      {copied ? '✓ Copied to clipboard' : '⎘ Copy Issue + Fix'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-3">
                      <SearchIcon />
                    </div>
                    <p className="text-sm text-slate-500">Run analysis, then select an issue to see details</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
