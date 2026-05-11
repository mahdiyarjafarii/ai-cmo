import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { CompetitorCard } from './CompetitorCard';
import { CompanyLogo } from './CompanyLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { getDomain } from '../utils/brand';

interface AnalysisResultPanelProps {
  result: AnalysisResult;
}

// ─── Section accordion ────────────────────────────────────────────────────────

const Section: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: string;
}> = ({ icon = '▣', title, subtitle, badge, children, defaultOpen = true, accentColor = 'border-slate-800' }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mx-3 my-2.5 rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-6 h-6 rounded-lg bg-slate-800/80 border ${accentColor} flex items-center justify-center text-slate-400 text-[11px] shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate">{title}</div>
            {(subtitle || badge) && (
              <div className="flex items-center gap-2">
                {subtitle && <div className="text-[10px] text-slate-600 truncate">{subtitle}</div>}
                {badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/60 shrink-0">
                    {badge}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-600 text-[10px] shrink-0"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Company Hero Card ────────────────────────────────────────────────────────

const CompanyHeroCard: React.FC<{ company: AnalysisResult['company']; competitorCount: number }> = ({
  company,
  competitorCount,
}) => {
  const domain = getDomain(company.url);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-3 mt-3 mb-1 rounded-2xl border border-white/[0.06] overflow-hidden relative"
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(168,85,247,0.04) 50%, rgba(15,23,42,0.8) 100%)',
      }}
    >
      {/* Subtle top shimmer */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

      <div className="p-4">
        {/* Logo + name row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl shadow-black/20">
              <CompanyLogo name={company.name} url={company.url} size={52} rounded="lg" />
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050714] shadow-sm shadow-green-400/50" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-100 leading-tight truncate">{company.name}</h2>
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition flex items-center gap-1 mt-0.5"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {domain}
            </a>

            {/* Industry badge */}
            {company.industry && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/12 text-indigo-300 border border-indigo-500/20">
                  {company.industry}
                </span>
                {company.targetMarket && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/12 text-purple-300 border border-purple-500/20">
                    {company.targetMarket}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {company.description && (
          <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2 mb-3">
            {company.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-slate-200">{competitorCount}</div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider">Competitors</div>
          </div>
          <div className="w-px h-6 bg-white/[0.05]" />
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-green-400">✓</div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider">Analyzed</div>
          </div>
          <div className="w-px h-6 bg-white/[0.05]" />
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-indigo-400">AI</div>
            <div className="text-[9px] text-slate-600 uppercase tracking-wider">Powered</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Panel ───────────────────────────────────────────────────────────────

export const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({ result }) => {
  const { company, competitors, analysis } = result;

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#050714]/95 backdrop-blur-md border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-[13px] font-semibold text-slate-100 tracking-tight truncate">Company</p>
        </div>
      </div>

      {/* Hero card */}
      <CompanyHeroCard company={company} competitorCount={competitors.length} />

      {/* Sections */}
      <Section icon="◈" title="Overview" subtitle="Company snapshot">
        <p className="text-xs text-slate-400 leading-relaxed">{company.description}</p>
      </Section>

      <Section icon="🎯" title="Target Audience" subtitle="Ideal customer profile">
        <p className="text-xs text-slate-400 leading-relaxed">{company.icp}</p>
      </Section>

      <Section icon="✦" title="Value Proposition" subtitle="Core differentiation">
        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
          <p className="text-xs text-indigo-200 leading-relaxed italic">"{company.valueProposition}"</p>
        </div>
      </Section>

      {company.features?.length > 0 && (
        <Section icon="▦" title="Key Features" badge={`${company.features.length}`} subtitle="Product capabilities">
          <div className="flex flex-wrap gap-1.5">
            {company.features.map((f, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[11px] rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300"
              >
                {f}
              </span>
            ))}
          </div>
        </Section>
      )}

      {company.pricing && (
        <Section icon="$" title="Pricing" subtitle="Monetization model">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Model</span>
              <span className="text-[11px] text-slate-200 font-medium">{company.pricing.model}</span>
            </div>
            {company.pricing.range && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Range</span>
                <span className="text-[11px] text-green-400 font-semibold">{company.pricing.range}</span>
              </div>
            )}
            {company.pricing.tiers && company.pricing.tiers.length > 0 && (
              <div className="pt-1.5 flex flex-wrap gap-1.5">
                {company.pricing.tiers.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-green-500/8 border border-green-500/20 rounded-full text-green-300">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section icon="⇄" title="Market Position" subtitle="Positioning vs competitors">
        <p className="text-xs text-slate-400 leading-relaxed">{analysis.positioningComparison}</p>
      </Section>

      <Section icon="▣" title="SWOT" subtitle="Strengths & weaknesses" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/15">
            <div className="text-[10px] font-bold text-green-400 mb-2 uppercase tracking-wider">Strengths</div>
            <ul className="space-y-1.5">
              {analysis.strengths.targetCompany.slice(0, 4).map((s, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex gap-1.5">
                  <span className="text-green-500 shrink-0 font-bold">+</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15">
            <div className="text-[10px] font-bold text-red-400 mb-2 uppercase tracking-wider">Weaknesses</div>
            <ul className="space-y-1.5">
              {analysis.weaknesses.targetCompany.slice(0, 4).map((w, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex gap-1.5">
                  <span className="text-red-500 shrink-0 font-bold">−</span>
                  <span className="leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section
        icon="⚡"
        title="Recommendations"
        subtitle="High-impact next steps"
        badge={`${analysis.recommendations.length}`}
        defaultOpen={false}
      >
        <div className="space-y-2">
          {analysis.recommendations.map((rec, i) => (
            <div
              key={i}
              className="flex gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] text-[11px] text-slate-300 leading-relaxed"
            >
              <span className="text-indigo-400 font-bold shrink-0 text-xs">{i + 1}.</span>
              {rec}
            </div>
          ))}
        </div>
      </Section>

      <Section
        icon="◎"
        title="Competitors"
        subtitle="Competitive landscape"
        badge={`${competitors.length}`}
        defaultOpen={false}
      >
        <div className="space-y-3">
          {competitors.map((c, i) => (
            <CompetitorCard key={c.url} competitor={c} index={i} />
          ))}
        </div>
      </Section>

      <div className="h-6" />
    </div>
  );
};
