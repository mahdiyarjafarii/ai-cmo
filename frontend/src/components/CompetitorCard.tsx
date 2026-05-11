import React, { useState } from 'react';
import { Competitor } from '../types';
import { motion } from 'framer-motion';

interface CompetitorCardProps {
  competitor: Competitor;
  index: number;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function getFaviconFallback(url: string): string {
  return `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=128`;
}

function getInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export const CompetitorCard: React.FC<CompetitorCardProps> = ({ competitor, index }) => {
  const [imgError, setImgError] = useState(0);
  const description = competitor.description || competitor.profile?.description || '';

  const logoSrc =
    imgError === 0
      ? competitor.logo || getFaviconFallback(competitor.url)
      : imgError === 1
      ? getFaviconFallback(competitor.url)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={competitor.name}
            className="w-full h-full object-contain p-0.5"
            onError={() => setImgError((n) => n + 1)}
            loading="lazy"
          />
        ) : (
          <span className="text-slate-300 font-bold text-xs">{getInitials(competitor.name)}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-200 truncate">{competitor.name}</p>
        {description && (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2 mt-0.5">{description}</p>
        )}
      </div>

      {/* Visit button */}
      <a
        href={competitor.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-slate-800/80 border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 transition-colors mt-0.5"
      >
        Visit →
      </a>
    </motion.div>
  );
};
