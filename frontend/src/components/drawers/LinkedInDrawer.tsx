import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LinkedInPost, LinkedInFeed, LinkedInFormat } from '../../types';

interface LinkedInDrawerProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  onGenerate: () => Promise<LinkedInFeed>;
  onRewrite: (postId: string) => Promise<LinkedInPost>;
}

const LinkedInLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const FORMAT_META: Record<LinkedInFormat, { label: string; color: string; icon: string; desc: string }> = {
  story:           { label: 'Story',         color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',  icon: '📖', desc: 'Personal narrative' },
  list:            { label: 'List',           color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',       icon: '📋', desc: 'Numbered takeaways' },
  insight:         { label: 'Insight',        color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',       icon: '💡', desc: 'Market observation' },
  'case-study':    { label: 'Case Study',     color: 'text-green-400 bg-green-500/10 border-green-500/20',    icon: '📊', desc: 'Outcome story' },
  'founder-update':{ label: 'Founder Update', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', icon: '🚀', desc: 'Authentic update' },
};

const LinkedInPostCard: React.FC<{ post: LinkedInPost; isSelected: boolean; onClick: () => void }> = ({
  post, isSelected, onClick,
}) => {
  const meta = FORMAT_META[post.format];
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected ? 'border-[#0077b5]/50 bg-[#0077b5]/10' : 'border-gray-200 bg-gray-50/30 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
          {meta.icon} {meta.label}
        </span>
        <span className="text-[10px] text-gray-400">{post.readTime}</span>
      </div>
      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug mb-1">
        {post.hook}
      </p>
      <p className="text-[10px] text-gray-400">{post.estimatedReach} est. reach</p>
    </motion.button>
  );
};

const LinkedInPreviewCard: React.FC<{ post: LinkedInPost; editedText: string; companyName: string }> = ({
  post, editedText, companyName,
}) => {
  const [expanded, setExpanded] = useState(false);
  const preview = expanded ? editedText : editedText.slice(0, 210);
  const needsExpand = editedText.length > 210;
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-xl border border-gray-300 bg-[#1b1f2e] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{companyName}</p>
            <p className="text-[11px] text-gray-500">Founder · Building in AI SaaS</p>
            <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
              Just now · 🌐
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap mb-2">
          {preview}
          {needsExpand && !expanded && '…'}
        </div>
        {needsExpand && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-[12px] text-gray-500 hover:text-gray-800 transition mb-2"
          >
            {expanded ? 'see less' : 'see more'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="px-4 py-2.5 border-t border-gray-300/50 flex items-center justify-between text-[11px] text-gray-400">
        <span>👍 ❤️ 💡 &nbsp;<span className="text-gray-500">{post.estimatedReach} est.</span></span>
        <span>{Math.floor(Math.random() * 20 + 5)} comments</span>
      </div>

      {/* Action bar */}
      <div className="px-2 py-1.5 border-t border-gray-300/50 flex items-center justify-around">
        {[['👍', 'Like'], ['💬', 'Comment'], ['🔄', 'Repost'], ['↗', 'Share']].map(([icon, label]) => (
          <button key={label} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-slate-700/30 transition">
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export const LinkedInDrawer: React.FC<LinkedInDrawerProps> = ({
  open, onClose, companyName, onGenerate, onRewrite,
}) => {
  const [feed, setFeed] = useState<LinkedInFeed | null>(null);
  const [selected, setSelected] = useState<LinkedInPost | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'preview' | 'edit' | 'why'>('preview');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selected) { setEditedText(selected.fullText); setTab('preview'); }
  }, [selected]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
  }, [editedText, tab]);

  const handleGenerate = async () => {
    setIsGenerating(true); setError(null);
    try {
      const newFeed = await onGenerate();
      setFeed(newFeed);
      if (newFeed.posts[0]) setSelected(newFeed.posts[0]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Generation failed'); }
    finally { setIsGenerating(false); }
  };

  const handleRewrite = async () => {
    if (!selected) return;
    setIsRewriting(true);
    try {
      const newPost = await onRewrite(selected.id);
      setFeed((prev) => prev ? { ...prev, posts: prev.posts.map((p) => p.id === selected.id ? newPost : p) } : prev);
      setSelected(newPost);
    } finally { setIsRewriting(false); }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(editedText)}`, '_blank');
  };

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
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-gray-200 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#0077b5]/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0077b5] flex items-center justify-center text-white">
                  <LinkedInLogo />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">LinkedIn Writer</h2>
                  <p className="text-[11px] text-gray-400">Thought-leadership content · B2B storytelling</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {feed && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#0077b5]/10 border border-[#0077b5]/30 text-[#0a90d4]">
                    {feed.posts.length} posts
                  </span>
                )}
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-100 transition">✕</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Post list */}
              <div className="w-[200px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
                <div className="px-3 py-3 border-b border-gray-200">
                  <button
                    onClick={handleGenerate} disabled={isGenerating}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-[#0077b5] text-white hover:bg-[#006396] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isGenerating ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Generating…</> : '✦ Generate'}
                  </button>
                  {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {feed ? (
                    feed.posts.map((post) => (
                      <LinkedInPostCard key={post.id} post={post} isSelected={selected?.id === post.id} onClick={() => setSelected(post)} />
                    ))
                  ) : isGenerating ? (
                    <div className="py-4 space-y-2">
                      {[0,1,2].map(i => <div key={i} className="w-full h-16 rounded-xl bg-gray-100/50 animate-pulse" />)}
                    </div>
                  ) : (
                    <div className="py-8 text-center px-2">
                      <p className="text-[11px] text-gray-400">Generate posts to begin</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Editor + preview */}
              {selected ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                  {/* Format + tabs */}
                  <div className="shrink-0 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${FORMAT_META[selected.format].color}`}>
                        {FORMAT_META[selected.format].icon} {FORMAT_META[selected.format].label}
                      </span>
                      <span className="text-[10px] text-gray-400">{selected.readTime}</span>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      {(['preview', 'edit', 'why'] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-[10px] font-semibold capitalize transition ${tab === t ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                          {t === 'why' ? 'Why' : t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {tab === 'preview' && (
                      <LinkedInPreviewCard post={selected} editedText={editedText} companyName={companyName} />
                    )}

                    {tab === 'edit' && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">Edit Post</p>
                          <span className="text-[10px] text-gray-400">{editedText.length} chars</span>
                        </div>
                        <textarea
                          ref={textareaRef}
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 focus:border-[#0077b5]/50 rounded-xl text-sm text-gray-800 leading-relaxed resize-none outline-none px-4 py-3 min-h-[200px] transition-colors"
                        />
                      </div>
                    )}

                    {tab === 'why' && (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-[#0077b5]/20 bg-[#0077b5]/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-[#0077b5]/20 flex items-center justify-center text-[#0a90d4] text-xs">✦</div>
                            <p className="text-xs font-bold text-[#0a90d4] uppercase tracking-wider">Why This Works</p>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{selected.whyThisWorks}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/30 p-4">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">Reach Estimate</p>
                          <div className="flex items-end gap-3">
                            <span className="text-2xl font-bold text-white">{selected.estimatedReach}</span>
                            <span className="text-xs text-gray-400 pb-1">impressions</span>
                          </div>
                          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#0077b5] to-cyan-400 rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/30 p-4 space-y-2">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">Structure</p>
                          <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">Opening Hook (before "see more")</p>
                            <p className="text-xs text-gray-700 leading-snug">{selected.hook}</p>
                          </div>
                          <div className="h-px bg-gray-100" />
                          <div>
                            <p className="text-[10px] text-gray-400 mb-0.5">CTA</p>
                            <p className="text-xs text-gray-500">{selected.cta}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 px-4 py-3 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:text-white transition">
                        {copied ? '✓ Copied' : '⎘ Copy'}
                      </button>
                      <button onClick={handleRewrite} disabled={isRewriting} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:text-white transition disabled:opacity-50">
                        {isRewriting ? <><span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" /> Rewriting…</> : '↻ Rewrite'}
                      </button>
                    </div>
                    <button
                      onClick={handlePostToLinkedIn}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0077b5] text-white text-sm font-bold hover:bg-[#006396] transition"
                    >
                      <LinkedInLogo /> Post to LinkedIn
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-xl bg-[#0077b5]/10 border border-[#0077b5]/20 flex items-center justify-center text-[#0a90d4] mx-auto mb-3">
                      <LinkedInLogo />
                    </div>
                    <p className="text-sm text-gray-400">Generate posts, then select one to edit</p>
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
