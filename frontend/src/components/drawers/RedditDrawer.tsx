import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RedditOpportunity, RedditFeed } from '../../types';

interface RedditDrawerProps {
  open: boolean;
  onClose: () => void;
  companyName: string;
  onFind: () => Promise<RedditFeed>;
}

const RedditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
  </svg>
);

const RELEVANCE_CONFIG = {
  direct:     { label: 'Direct Match',     color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  indirect:   { label: 'Indirect Match',   color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  competitor: { label: 'Competitor Thread', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const OPP_TYPE_CONFIG = {
  answer:            { label: 'Answer',          icon: '💬' },
  'soft-pitch':      { label: 'Soft Pitch',      icon: '🎯' },
  'competitor-thread':{ label: 'Competitor',     icon: '⚔️' },
  'show-hn-style':   { label: 'Show HN Style',   icon: '🚀' },
};

const OpportunityCard: React.FC<{
  opp: RedditOpportunity;
  isSelected: boolean;
  onClick: () => void;
}> = ({ opp, isSelected, onClick }) => {
  const rel = RELEVANCE_CONFIG[opp.relevanceLabel];
  const oppType = OPP_TYPE_CONFIG[opp.opportunityType];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        isSelected
          ? 'border-orange-500/40 bg-orange-500/10'
          : 'border-gray-200 bg-gray-50/30 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] font-bold text-orange-400 font-mono">{opp.subreddit}</span>
        <span className="text-slate-700">·</span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${rel.color}`}>
          {rel.label}
        </span>
      </div>
      <p className="text-xs text-gray-800 font-medium leading-snug line-clamp-2 mb-1.5">
        {opp.title}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span>▲ {opp.upvoteProxy}</span>
        <span>💬 {opp.commentProxy}</span>
        <span className="ml-auto">{oppType.icon} {oppType.label}</span>
      </div>
    </motion.button>
  );
};

export const RedditDrawer: React.FC<RedditDrawerProps> = ({
  open, onClose, companyName, onFind,
}) => {
  const [feed, setFeed] = useState<RedditFeed | null>(null);
  const [selected, setSelected] = useState<RedditOpportunity | null>(null);
  const [editedReply, setEditedReply] = useState('');
  const [isFinding, setIsFinding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTab, setReplyTab] = useState<'draft' | 'angle'>('draft');

  const handleFind = async () => {
    setIsFinding(true); setError(null);
    try {
      const newFeed = await onFind();
      setFeed(newFeed);
      if (newFeed.opportunities[0]) {
        setSelected(newFeed.opportunities[0]);
        setEditedReply(newFeed.opportunities[0].draftReply);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
    } finally {
      setIsFinding(false);
    }
  };

  const handleSelectOpp = (opp: RedditOpportunity) => {
    setSelected(opp);
    setEditedReply(opp.draftReply);
    setReplyTab('draft');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenThread = () => {
    if (selected) window.open(selected.url, '_blank');
  };

  const rel = selected ? RELEVANCE_CONFIG[selected.relevanceLabel] : null;
  const oppType = selected ? OPP_TYPE_CONFIG[selected.opportunityType] : null;

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
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ff4500] flex items-center justify-center text-white">
                  <RedditIcon />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Reddit Opportunities</h2>
                  <p className="text-[11px] text-gray-400">Real threads · AI-matched · Authentic engagement</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {feed && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    {feed.opportunities.length} threads
                  </span>
                )}
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-100 transition">✕</button>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Thread list */}
              <div className="w-[210px] shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
                <div className="px-3 py-3 border-b border-gray-200">
                  <button
                    onClick={handleFind} disabled={isFinding}
                    className="w-full py-2 rounded-lg text-xs font-semibold bg-[#ff4500] text-white hover:bg-[#e03d00] transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isFinding ? <><span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" /> Searching…</> : '🔍 Find Threads'}
                  </button>
                  {error && <p className="text-[10px] text-red-400 mt-1.5">{error}</p>}
                  {!isFinding && !feed && (
                    <p className="text-[10px] text-gray-400 mt-2 text-center leading-relaxed">
                      Searches real Reddit threads relevant to {companyName}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {feed ? (
                    feed.opportunities.length === 0 ? (
                      <div className="py-8 text-center px-2">
                        <p className="text-[11px] text-gray-400">No threads found. Try after running an analysis.</p>
                      </div>
                    ) : (
                      feed.opportunities.map((opp) => (
                        <OpportunityCard key={opp.id} opp={opp} isSelected={selected?.id === opp.id} onClick={() => handleSelectOpp(opp)} />
                      ))
                    )
                  ) : isFinding ? (
                    <div className="py-4 space-y-2">
                      {[0,1,2,3].map(i => <div key={i} className="w-full h-16 rounded-xl bg-gray-100/50 animate-pulse" />)}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Detail pane */}
              {selected ? (
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                  {/* Thread header */}
                  <div className="shrink-0 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-orange-400 font-mono">{selected.subreddit}</span>
                      {rel && (
                        <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${rel.color}`}>
                          {rel.label}
                        </span>
                      )}
                      {oppType && (
                        <span className="text-[9px] text-gray-400">{oppType.icon} {oppType.label}</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-2">
                      {selected.title}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-400">
                      <span>▲ {selected.upvoteProxy} upvotes</span>
                      <span>💬 {selected.commentProxy} comments</span>
                      <button
                        onClick={handleOpenThread}
                        className="ml-auto text-orange-400 hover:text-orange-300 transition flex items-center gap-1"
                      >
                        Open Thread ↗
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Snippet */}
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/30">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">Thread Context</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{selected.snippet}</p>
                    </div>

                    {/* Why it matters */}
                    <div className="p-3 rounded-xl border border-orange-500/20 bg-orange-500/5">
                      <p className="text-[10px] uppercase tracking-wider text-orange-400 mb-2">Why It Matters for {companyName}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{selected.whyItMatters}</p>
                    </div>

                    {/* Draft reply tabs */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex rounded-lg overflow-hidden border border-gray-200">
                          {(['draft', 'angle'] as const).map((t) => (
                            <button key={t} onClick={() => setReplyTab(t)} className={`px-3 py-1 text-[10px] font-semibold capitalize transition ${replyTab === t ? 'bg-slate-700 text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                              {t === 'draft' ? 'Draft Reply' : 'Suggested Angle'}
                            </button>
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">{editedReply.length} chars</span>
                      </div>

                      {replyTab === 'draft' ? (
                        <textarea
                          value={editedReply}
                          onChange={(e) => setEditedReply(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 focus:border-orange-500/50 rounded-xl text-sm text-gray-800 leading-relaxed resize-none outline-none px-4 py-3 min-h-[160px] transition-colors"
                          placeholder="Draft your reply here…"
                        />
                      ) : (
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/30">
                          <p className="text-xs text-gray-700 leading-relaxed">{selected.suggestedAngle}</p>
                        </div>
                      )}
                    </div>

                    {/* Community reminder */}
                    <div className="p-3 rounded-xl border border-gray-200 bg-gray-50/20">
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        💡 <strong className="text-gray-500">Community-first rule:</strong> Lead with genuine value. Only mention {companyName} if it naturally fits the conversation. Authentic replies outperform promotional ones.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 px-4 py-3 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleCopy} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700 hover:text-white transition">
                        {copied ? '✓ Copied' : '⎘ Copy Reply'}
                      </button>
                      <button onClick={handleOpenThread} className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#ff4500]/10 border border-[#ff4500]/20 text-xs text-orange-400 hover:bg-[#ff4500]/20 transition">
                        Open Reddit ↗
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center px-6">
                    <div className="w-12 h-12 rounded-xl bg-[#ff4500]/10 border border-[#ff4500]/20 flex items-center justify-center text-[#ff4500] mx-auto mb-3">
                      <RedditIcon />
                    </div>
                    <p className="text-sm text-gray-400">Find threads, then select one to see the opportunity</p>
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
