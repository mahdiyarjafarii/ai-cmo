import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GeneratedPost } from '../types';

interface PostDrawerProps {
  post: GeneratedPost | null;
  companyName: string;
  onClose: () => void;
  onRegenerate: (postId: string) => Promise<void>;
}

const XIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedInIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const ANGLE_COLORS: Record<string, string> = {
  'pain-point': 'text-red-400 bg-red-500/10 border-red-500/20',
  opinion: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  competitor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  value: 'text-green-400 bg-green-500/10 border-green-500/20',
  founder: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  data: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'thought-leadership': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'case-study': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
};

export const PostDrawer: React.FC<PostDrawerProps> = ({
  post,
  companyName,
  onClose,
  onRegenerate,
}) => {
  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (post) {
      setEditedContent(post.content);
      setCopied(false);
    }
  }, [post]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editedContent]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToX = () => {
    const text = encodeURIComponent(editedContent);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handlePostToLinkedIn = () => {
    const text = encodeURIComponent(editedContent);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`, '_blank');
  };

  const handleRegenerate = async () => {
    if (!post) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(post.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const isTwitter = post?.platform === 'twitter';
  const angleColor = post ? (ANGLE_COLORS[post.angle] ?? 'text-slate-400 bg-slate-800 border-slate-700') : '';

  return (
    <AnimatePresence>
      {post && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl bg-[#0a0d1a] border-l border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            {/* ── Header ───────────────────────────────────────── */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isTwitter ? 'bg-black border border-slate-700' : 'bg-[#0077b5]/20 border border-[#0077b5]/30'
                  }`}
                >
                  {isTwitter ? (
                    <span className="text-white"><XIcon size={14} /></span>
                  ) : (
                    <span className="text-[#0077b5]"><LinkedInIcon size={14} /></span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">{companyName}</p>
                  <p className="text-[10px] text-slate-500">
                    {isTwitter ? 'X / Twitter' : 'LinkedIn'} · {post.type === 'idea' ? 'Idea' : 'Full Post'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full border capitalize ${angleColor}`}
                >
                  {post.angle.replace('-', ' ')}
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ── Scrollable body ───────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Hook */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Hook</p>
                <p className="text-sm font-semibold text-slate-100 leading-snug">{post.hook}</p>
              </div>

              {/* Editable content */}
              <div>
                <p className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider">Post Content</p>
                <div className="relative rounded-xl border border-slate-700 bg-slate-900/40 focus-within:border-indigo-500/50 transition-colors">
                  <textarea
                    ref={textareaRef}
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-200 leading-relaxed resize-none outline-none px-4 py-3 min-h-[120px]"
                    placeholder="Post content..."
                  />
                  <div className="px-4 pb-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">
                      {editedContent.length}{isTwitter ? ' / 280' : ''} chars
                    </span>
                    {isTwitter && editedContent.length > 280 && (
                      <span className="text-[10px] text-red-400">Over limit</span>
                    )}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">Call to Action</p>
                <p className="text-xs text-slate-300">{post.cta}</p>
              </div>

              {/* Why This Works */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-indigo-400 text-[10px]">✦</span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                    Why This Works
                  </p>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{post.whyThisWorks}</p>
              </div>
            </div>

            {/* ── Action buttons ────────────────────────────────── */}
            <div className="shrink-0 px-5 py-4 border-t border-slate-800 space-y-2">
              {/* Row 1 — utility */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  {copied ? '✓ Copied' : '⎘ Copy'}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-50"
                >
                  {isRegenerating ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      Rewriting…
                    </span>
                  ) : (
                    '↻ Rewrite'
                  )}
                </button>
                <button
                  onClick={() => textareaRef.current?.focus()}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition"
                >
                  ✎ Edit
                </button>
              </div>

              {/* Row 2 — publish */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePostToX}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-black border border-slate-600 text-sm font-semibold text-white hover:bg-slate-900 hover:border-slate-400 transition"
                >
                  <XIcon size={13} />
                  Post to X
                </button>
                <button
                  onClick={handlePostToLinkedIn}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#0077b5]/20 border border-[#0077b5]/40 text-sm font-semibold text-[#0a90d4] hover:bg-[#0077b5]/30 transition"
                >
                  <LinkedInIcon size={13} />
                  Post to LinkedIn
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
