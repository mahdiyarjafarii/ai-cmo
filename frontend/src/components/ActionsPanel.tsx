import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AnalysisResult,
  TwitterFeed, TwitterPost,
  LinkedInFeed, LinkedInPost,
  RedditFeed,
  SeoReport,
} from '../types';
import { XWriterDrawer } from './drawers/XWriterDrawer';
import { LinkedInDrawer } from './drawers/LinkedInDrawer';
import { RedditDrawer } from './drawers/RedditDrawer';
import { SeoDrawer } from './drawers/SeoDrawer';

interface ActionsPanelProps {
  result: AnalysisResult;
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

// ─── Platform SVG Icons ───────────────────────────────────────────────────────

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const RedditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const SeoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

// ─── Channel configs ──────────────────────────────────────────────────────────

interface ChannelConfig {
  id: 'twitter' | 'linkedin' | 'reddit' | 'seo';
  name: string;
  tagline: string;
  platformColor: string;
  bgGradient: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  glowColor: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    id: 'twitter',
    name: 'X / Twitter',
    tagline: 'Viral posts · Founder voice · Threads',
    platformColor: 'text-white',
    bgGradient: 'from-slate-900/80 to-black/60',
    borderColor: 'border-slate-700/60',
    iconBg: 'bg-black',
    iconColor: 'text-white',
    icon: <XIcon />,
    glowColor: 'rgba(148,163,184,0.1)',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    tagline: 'Thought leadership · B2B authority',
    platformColor: 'text-[#0a90d4]',
    bgGradient: 'from-[#0077b5]/8 to-[#0077b5]/3',
    borderColor: 'border-[#0077b5]/25',
    iconBg: 'bg-[#0077b5]',
    iconColor: 'text-white',
    icon: <LinkedInIcon />,
    glowColor: 'rgba(0,119,181,0.15)',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    tagline: 'Community threads · Authentic reach',
    platformColor: 'text-orange-400',
    bgGradient: 'from-orange-500/8 to-red-500/3',
    borderColor: 'border-orange-500/25',
    iconBg: 'bg-[#ff4500]',
    iconColor: 'text-white',
    icon: <RedditIcon />,
    glowColor: 'rgba(255,69,0,0.15)',
  },
  {
    id: 'seo',
    name: 'SEO Audit',
    tagline: 'Prioritized fixes · Impact-ranked',
    platformColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/8 to-green-500/3',
    borderColor: 'border-emerald-500/25',
    iconBg: 'bg-emerald-600',
    iconColor: 'text-white',
    icon: <SeoIcon />,
    glowColor: 'rgba(16,185,129,0.15)',
  },
];

// ─── Channel Card ─────────────────────────────────────────────────────────────

interface ChannelState {
  postsCount?: number;
  lastGenerated?: string;
  status: 'idle' | 'ready';
}

const ChannelCard: React.FC<{
  channel: ChannelConfig;
  state: ChannelState;
  index: number;
  onClick: () => void;
}> = ({ channel, state, index, onClick }) => {
  const isReady = state.status === 'ready';

  const relativeTime = state.lastGenerated
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(state.lastGenerated).getTime()) / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, ease: 'easeOut' }}
      onClick={onClick}
      whileHover={{ y: -2, scale: 1.005 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full text-left rounded-2xl border ${channel.borderColor} bg-gradient-to-br ${channel.bgGradient} transition-all group relative overflow-hidden`}
      style={{
        boxShadow: `0 0 0 0 ${channel.glowColor}`,
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ boxShadow: `inset 0 0 20px ${channel.glowColor}` }}
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Platform icon + info */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${channel.iconBg} ${channel.iconColor} flex items-center justify-center shrink-0 shadow-lg`}>
              {channel.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 leading-tight">{channel.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{channel.tagline}</p>
            </div>
          </div>

          {/* Arrow + badge */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-slate-500 group-hover:text-slate-300 group-hover:bg-white/[0.08] transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {isReady && state.postsCount !== undefined && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${channel.borderColor} ${channel.platformColor} bg-black/20`}>
                {state.postsCount} ready
              </span>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          <div className={`flex items-center gap-1.5 text-[10px] font-medium ${isReady ? 'text-green-400' : 'text-slate-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-green-400 animate-pulse' : 'bg-slate-700'}`} />
            {isReady ? 'Content ready' : 'Click to generate'}
          </div>
          {relativeTime && (
            <span className="text-[10px] text-slate-600">{relativeTime}</span>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const ActionsPanel: React.FC<ActionsPanelProps> = ({ result }) => {
  const [activeDrawer, setActiveDrawer] = useState<ChannelConfig['id'] | null>(null);
  const [twitterFeed, setTwitterFeed] = useState<TwitterFeed | null>(null);
  const [linkedinFeed, setLinkedinFeed] = useState<LinkedInFeed | null>(null);
  const [redditFeed, setRedditFeed] = useState<RedditFeed | null>(null);
  const [seoReport, setSeoReport] = useState<SeoReport | null>(null);

  const generateTwitter = async (): Promise<TwitterFeed> => {
    const res = await fetch(`${API_BASE}/api/content/twitter/generate`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
    const data = await res.json();
    setTwitterFeed(data.feed);
    return data.feed;
  };

  const rewriteTwitter = async (postId: string): Promise<TwitterPost> => {
    const res = await fetch(`${API_BASE}/api/content/twitter/rewrite/${postId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Rewrite failed');
    const data = await res.json();
    setTwitterFeed((prev) =>
      prev ? { ...prev, posts: prev.posts.map((p) => p.id === postId ? data.post : p) } : prev
    );
    return data.post;
  };

  const generateLinkedIn = async (): Promise<LinkedInFeed> => {
    const res = await fetch(`${API_BASE}/api/content/linkedin/generate`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
    const data = await res.json();
    setLinkedinFeed(data.feed);
    return data.feed;
  };

  const rewriteLinkedIn = async (postId: string): Promise<LinkedInPost> => {
    const res = await fetch(`${API_BASE}/api/content/linkedin/rewrite/${postId}`, { method: 'POST' });
    if (!res.ok) throw new Error('Rewrite failed');
    const data = await res.json();
    setLinkedinFeed((prev) =>
      prev ? { ...prev, posts: prev.posts.map((p) => p.id === postId ? data.post : p) } : prev
    );
    return data.post;
  };

  const findReddit = async (): Promise<RedditFeed> => {
    const res = await fetch(`${API_BASE}/api/content/reddit/find`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
    const data = await res.json();
    setRedditFeed(data.feed);
    return data.feed;
  };

  const generateSeo = async (): Promise<SeoReport> => {
    const res = await fetch(`${API_BASE}/api/content/seo/generate`, { method: 'POST' });
    if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
    const data = await res.json();
    setSeoReport(data.report);
    return data.report;
  };

  const channelStates: Record<ChannelConfig['id'], ChannelState> = {
    twitter:  { status: twitterFeed ? 'ready' : 'idle', postsCount: twitterFeed?.posts.length, lastGenerated: twitterFeed?.generatedAt },
    linkedin: { status: linkedinFeed ? 'ready' : 'idle', postsCount: linkedinFeed?.posts.length, lastGenerated: linkedinFeed?.generatedAt },
    reddit:   { status: redditFeed ? 'ready' : 'idle', postsCount: redditFeed?.opportunities.length, lastGenerated: redditFeed?.fetchedAt },
    seo:      { status: seoReport ? 'ready' : 'idle', postsCount: seoReport?.recommendations.length, lastGenerated: seoReport?.generatedAt },
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 relative border-b border-white/[0.04]">
          <div className="flex items-center px-4 py-3 gap-2.5">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <p className="text-[13px] font-semibold text-slate-100 tracking-tight">Actions Feed


</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
          {CHANNELS.map((channel, i) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              state={channelStates[channel.id]}
              index={i}
              onClick={() => setActiveDrawer(channel.id)}
            />
          ))}

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 p-3 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01]"
          >
            <p className="text-[10px] text-slate-600 text-center leading-relaxed">
              Each channel generates platform-native content
              <br />grounded in your company analysis.
            </p>
          </motion.div>

          <div className="h-3" />
        </div>
      </div>

      <XWriterDrawer
        open={activeDrawer === 'twitter'}
        onClose={() => setActiveDrawer(null)}
        companyName={result.company.name}
        onGenerate={generateTwitter}
        onRewrite={rewriteTwitter}
      />
      <LinkedInDrawer
        open={activeDrawer === 'linkedin'}
        onClose={() => setActiveDrawer(null)}
        companyName={result.company.name}
        onGenerate={generateLinkedIn}
        onRewrite={rewriteLinkedIn}
      />
      <RedditDrawer
        open={activeDrawer === 'reddit'}
        onClose={() => setActiveDrawer(null)}
        companyName={result.company.name}
        onFind={findReddit}
      />
      <SeoDrawer
        open={activeDrawer === 'seo'}
        onClose={() => setActiveDrawer(null)}
        companyName={result.company.name}
        onGenerate={generateSeo}
      />
    </>
  );
};
