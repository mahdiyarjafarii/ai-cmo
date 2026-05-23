import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TwitterPost, TwitterFeed, TwitterAngle } from '../../types';

interface XWriterDrawerProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  onGenerate: () => Promise<TwitterFeed>;
  onRewrite: (postId: string) => Promise<TwitterPost>;
}

const XLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ANGLE_META: Record<TwitterAngle, { label: string; color: string; desc: string }> = {
  'pain-point':     { label: 'Pain Point',    color: 'text-red-400 bg-red-500/10 border-red-500/20',       desc: 'Empathy-first problem framing' },
  opinion:          { label: 'Opinion',       color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Spiky contrarian take' },
  competitor:       { label: 'Competitor',    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Positioning contrast' },
  value:            { label: 'Value',         color: 'text-green-400 bg-green-500/10 border-green-500/20',  desc: 'Transformation story' },
  insight:          { label: 'Insight',       color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',     desc: 'Non-obvious observation' },
  'thread-opener':  { label: 'Thread',        color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',     desc: 'Thread hook tweet' },
  lesson:           { label: 'Lesson',        color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Hard-learned insight' },
  'hot-take':       { label: 'Hot Take',      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',     desc: 'Polarizing strong opinion' },
};

const ENGAGEMENT_CONFIG = {
  high:   { label: 'High Engagement', color: 'text-green-400', bar: 'bg-green-400', width: 'w-[85%]' },
  medium: { label: 'Med Engagement',  color: 'text-yellow-400', bar: 'bg-yellow-400', width: 'w-[55%]' },
  low:    { label: 'Low Engagement',  color: 'text-gray-400',  bar: 'bg-slate-600', width: 'w-[28%]' },
};

const TweetPreview: React.FC<{ text: string; companyName: string }> = ({ text, companyName }) => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initials = companyName.slice(0, 2).toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-300 bg-[#000] p-4">
      {/* Author */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-white">{companyName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#1d9bf0">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91C1.88 9.33 1 10.57 1 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.26 3.91.81c.66 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.33-2.19c1.4.46 2.91.2 3.92-.81s1.26-2.52.8-3.91C21.36 14.67 22.25 13.43 22.25 12zm-6.12-1.37l-3.5 3.5-1.5-1.5a.75.75 0 0 0-1.06 1.06l2.03 2.03a.75.75 0 0 0 1.06 0l4.03-4.03a.75.75 0 0 0-1.06-1.06z"/>
            </svg>
          </div>
          <span className="text-[12px] text-gray-400">@{companyName.toLowerCase().replace(/\s+/g, '')}</span>
        </div>
      </div>

      {/* Tweet content */}
      <p className="text-[15px] text-white leading-[1.5] whitespace-pre-wrap mb-3">
        {text || <span className="text-gray-400">Your tweet will appear here…</span>}
      </p>

      {/* Meta */}
      <div className="text-[12px] text-gray-400 border-t border-gray-200 pt-2.5 mt-2.5">
        {timeStr} · <span className="text-white font-medium">X for AI CMO</span>
      </div>

      {/* Actions row */}
      <div className="flex items-center justify-around mt-3 pt-2.5 border-t border-gray-200 text-gray-400">
        {['💬', '🔄', '❤', '📊', '↗'].map((icon, i) => (
          <span key={i} className="text-[16px] hover:text-gray-500 cursor-pointer transition">{icon}</span>
        ))}
      </div>
    </div>
  );
};

const PostCard: React.FC<{
  post: TwitterPost;
  isSelected: boolean;
  onClick: () => void;
}> = ({ post, isSelected, onClick }) => {
  const meta = ANGLE_META[post.angle];
  const eng = ENGAGEMENT_CONFIG[post.estimatedEngagement];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-slate-500 bg-gray-100/70'
          : 'border-gray-200 bg-gray-50/30 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.color}`}>
          {meta.label}
        </span>
        <span className={`text-[10px] ${eng.color}`}>{eng.label}</span>
      </div>
      <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug mb-1.5">
        {post.hook}
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-0.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${eng.bar} ${eng.width}`} />
        </div>
        <span className={`text-[10px] ${post.charCount > 280 ? 'text-red-400' : 'text-gray-400'}`}>
          {post.charCount}/280
        </span>
      </div>
    </motion.button>
  );
};

export const XWriterDrawer: React.FC<XWriterDrawerProps> = ({
  open, onClose, companyName, onGenerate, onRewrite,
}) => {
  const [feed, setFeed] = useState<TwitterFeed | null>(null);
  const [selected, setSelected] = useState<TwitterPost | null>(null);
  const [editedText, setEditedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'preview' | 'why'>('preview');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selected) setEditedText(selected.fullText);
  }, [selected]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
  }, [editedText]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const newFeed = await onGenerate();
      setFeed(newFeed);
      if (newFeed.posts[0]) {
        setSelected(newFeed.posts[0]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRewrite = async () => {
    if (!selected) return;
    setIsRewriting(true);
    try {
      const newPost = await onRewrite(selected.id);
      setFeed((prev) => prev ? {
        ...prev,
        posts: prev.posts.map((p) => p.id === selected.id ? newPost : p),
      } : prev);
      setSelected(newPost);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(editedText)}`, '_blank');
  };

  const charCount = editedText.length;
  const overLimit = charCount > 280;
  const charPct = Math.min(charCount / 280, 1);
  const circleColor = overLimit ? '#f87171' : charCount > 240 ? '#fbbf24' : '#818cf8';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white border-l border-gray-200 z-50 flex flex-col"
          >
            {/* ── Header ── */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-black border border-gray-300 flex items-center justify-center text-white">
                  <XLogo />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">X Writer</h2>
                  <p className="text-[11px] text-gray-400">AI-native tweet generator · founder tone</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {feed && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 border border-gray-300 text-gray-500">
                    {feed.posts.length} posts
                  </span>
                )}
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-100 transition">✕</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* ── Left: post list ── */}
              <div className="w-[200px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
                <div className="px-3 py-3 border-b border-gray-200">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                        Generating…
                      </>
                    ) : (
                      <>✦ Generate</>
                    )}
                  </button>
                  {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {feed ? (
                    feed.posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        isSelected={selected?.id === post.id}
                        onClick={() => setSelected(post)}
                      />
                    ))
                  ) : isGenerating ? (
                    <div className="py-6 flex flex-col items-center gap-2">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-full h-14 rounded-xl bg-gray-100/50 animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center px-2">
                      <p className="text-[11px] text-gray-400">Generate posts to see them here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right: editor + preview ── */}
              {selected ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                  {/* Angle + tabs */}
                  <div className="shrink-0 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${ANGLE_META[selected.angle].color}`}>
                        {ANGLE_META[selected.angle].label}
                      </span>
                      <span className="text-[10px] text-gray-400">{ANGLE_META[selected.angle].desc}</span>
                    </div>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      {(['preview', 'why'] as const).map((t) => (
                        <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 text-[10px] font-semibold capitalize transition ${tab === t ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                          {t === 'why' ? 'Why It Works' : 'Preview'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {tab === 'preview' ? (
                      <>
                        {/* Tweet preview */}
                        <TweetPreview text={editedText} companyName={companyName} />

                        {/* Editor */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Edit</p>
                            <div className="flex items-center gap-2">
                              {/* Circular char counter */}
                              <svg width="20" height="20" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="8" fill="none" stroke="#1e293b" strokeWidth="2" />
                                <circle
                                  cx="10" cy="10" r="8" fill="none"
                                  stroke={circleColor} strokeWidth="2"
                                  strokeDasharray={`${charPct * 50.27} 50.27`}
                                  strokeLinecap="round"
                                  transform="rotate(-90 10 10)"
                                />
                              </svg>
                              <span className={`text-[11px] font-mono ${overLimit ? 'text-red-400' : 'text-gray-400'}`}>
                                {280 - charCount}
                              </span>
                            </div>
                          </div>
                          <textarea
                            ref={textareaRef}
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 focus:border-slate-500 rounded-xl text-sm text-gray-800 leading-relaxed resize-none outline-none px-4 py-3 min-h-[100px] transition-colors"
                          />
                        </div>
                      </>
                    ) : (
                      /* Why it works */
                      <div className="space-y-3">
                        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                              <span className="text-indigo-400 text-xs">✦</span>
                            </div>
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Why This Works</p>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{selected.whyThisWorks}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50/30 p-4 space-y-3">
                          <p className="text-[10px] uppercase tracking-wider text-gray-400">Post Structure</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[10px] text-gray-400 mb-1">Hook</p>
                              <p className="text-xs text-gray-800 font-medium">{selected.hook}</p>
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div>
                              <p className="text-[10px] text-gray-400 mb-1">Body</p>
                              <p className="text-xs text-gray-500 whitespace-pre-wrap">{selected.body}</p>
                            </div>
                            <div className="h-px bg-gray-100" />
                            <div>
                              <p className="text-[10px] text-gray-400 mb-1">CTA</p>
                              <p className="text-xs text-gray-700">{selected.cta}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Actions ── */}
                  <div className="shrink-0 px-4 py-3 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:text-white transition">
                        {copied ? '✓ Copied' : '⎘ Copy'}
                      </button>
                      <button onClick={handleRewrite} disabled={isRewriting} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:text-white transition disabled:opacity-50">
                        {isRewriting ? (
                          <><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" /> Rewriting…</>
                        ) : '↻ Rewrite'}
                      </button>
                    </div>
                    <button
                      onClick={handlePostToX}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-slate-100 transition"
                    >
                      <XLogo /> Post to X
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-xl bg-black border border-gray-200 flex items-center justify-center text-gray-400 mx-auto mb-3">
                      <XLogo />
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
