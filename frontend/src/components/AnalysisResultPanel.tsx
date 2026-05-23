import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { CompetitorCard } from './CompetitorCard';
import { CompanyLogo } from './CompanyLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { getDomain } from '../utils/brand';

interface AnalysisResultPanelProps {
  result: AnalysisResult;
}

const Section: React.FC<{
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ icon = '▣', title, subtitle, badge, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mx-3 my-2 rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-[#fc6423]/10 border border-[#fc6423]/20 flex items-center justify-center text-[#fc6423] text-[11px] shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-800 truncate">{title}</div>
            {(subtitle || badge) && (
              <div className="flex items-center gap-2">
                {subtitle && <div className="text-[10px] text-gray-400 truncate">{subtitle}</div>}
                {badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#fc6423]/10 text-[#fc6423] border border-[#fc6423]/20 shrink-0 font-medium">
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
          className="text-gray-400 text-[10px] shrink-0"
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
            <div className="px-4 pb-4 pt-1 border-t border-gray-100">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CompanyHeroCard: React.FC<{ company: AnalysisResult['company']; competitorCount: number }> = ({
  company, competitorCount,
}) => {
  const domain = getDomain(company.url);
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-3 mt-3 mb-1 rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white"
    >
      <div className="h-1 bg-gradient-to-r from-[#fc6423] to-[#fb923c]" />
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
              <CompanyLogo name={company.name} url={company.url} size={52} rounded="lg" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 leading-tight truncate">{company.name}</h2>
            <a
              href={company.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#fc6423] hover:text-[#e55a1c] font-medium transition flex items-center gap-1 mt-0.5"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {domain}
            </a>
            {company.industry && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#fc6423]/8 text-[#fc6423] border border-[#fc6423]/20">
                  {company.industry}
                </span>
                {company.targetMarket && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-200">
                    {company.targetMarket}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {company.description && (
          <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 mb-3">{company.description}</p>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-gray-800">{competitorCount}</div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider">Competitors</div>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-green-600">✓</div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider">Analyzed</div>
          </div>
          <div className="w-px h-6 bg-gray-200" />
          <div className="flex-1 text-center">
            <div className="text-xs font-bold text-[#fc6423]">AI</div>
            <div className="text-[9px] text-gray-400 uppercase tracking-wider">Powered</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AnalysisResultPanel: React.FC<AnalysisResultPanelProps> = ({ result }) => {
  const { company, competitors, analysis } = result;

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2.5 px-4 py-3">
          <svg className="w-4 h-4 text-[#fc6423] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-[13px] font-semibold text-gray-800 tracking-tight truncate">Company</p>
        </div>
      </div>

      <CompanyHeroCard company={company} competitorCount={competitors.length} />

      <Section icon="◈" title="Overview" subtitle="Company snapshot">
        <p className="text-xs text-gray-600 leading-relaxed">{company.description}</p>
      </Section>

      <Section icon="🎯" title="Target Audience" subtitle="Ideal customer profile">
        <p className="text-xs text-gray-600 leading-relaxed">{company.icp}</p>
      </Section>

      <Section icon="✦" title="Value Proposition" subtitle="Core differentiation">
        <div className="p-3 rounded-xl bg-[#fc6423]/5 border border-[#fc6423]/15">
          <p className="text-xs text-[#e55a1c] leading-relaxed italic">"{company.valueProposition}"</p>
        </div>
      </Section>

      {company.features?.length > 0 && (
        <Section icon="▦" title="Key Features" badge={`${company.features.length}`} subtitle="Product capabilities">
          <div className="flex flex-wrap gap-1.5">
            {company.features.map((f, i) => (
              <span key={i} className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 border border-gray-200 text-gray-700">
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
              <span className="text-[11px] text-gray-500">Model</span>
              <span className="text-[11px] text-gray-800 font-medium">{company.pricing.model}</span>
            </div>
            {company.pricing.range && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Range</span>
                <span className="text-[11px] text-green-600 font-semibold">{company.pricing.range}</span>
              </div>
            )}
            {company.pricing.tiers && company.pricing.tiers.length > 0 && (
              <div className="pt-1.5 flex flex-wrap gap-1.5">
                {company.pricing.tiers.map((t, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-green-50 border border-green-200 rounded-full text-green-700">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>
      )}

      <Section icon="⇄" title="Market Position" subtitle="Positioning vs competitors">
        <p className="text-xs text-gray-600 leading-relaxed">{analysis.positioningComparison}</p>
      </Section>

      <Section icon="▣" title="SWOT" subtitle="Strengths & weaknesses" defaultOpen={false}>
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
            <div className="text-[10px] font-bold text-green-700 mb-2 uppercase tracking-wider">Strengths</div>
            <ul className="space-y-1.5">
              {analysis.strengths.targetCompany.slice(0, 4).map((s, i) => (
                <li key={i} className="text-[11px] text-gray-700 flex gap-1.5">
                  <span className="text-green-600 shrink-0 font-bold">+</span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-200">
            <div className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-wider">Weaknesses</div>
            <ul className="space-y-1.5">
              {analysis.weaknesses.targetCompany.slice(0, 4).map((w, i) => (
                <li key={i} className="text-[11px] text-gray-700 flex gap-1.5">
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
            <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-[11px] text-gray-700 leading-relaxed">
              <span className="text-[#fc6423] font-bold shrink-0 text-xs">{i + 1}.</span>
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
          {competitors.map((c, i) => <CompetitorCard key={c.url} competitor={c} index={i} />)}
        </div>
      </Section>

      <div className="h-6" />
    </div>
  );
};
