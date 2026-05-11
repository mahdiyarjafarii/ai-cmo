import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../store/authStore';

interface InputPanelProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
  user?: User | null;
  onShowProjects?: () => void;
  onLogout?: () => void;
  onLogin?: () => void;
}

const FEATURES = [
  {
    icon: '🎯',
    title: 'ICP & Positioning',
    desc: 'Identifies your target customer and unique value prop',
    gradient: 'from-violet-500/20 to-purple-500/5',
    border: 'hover:border-violet-500/40',
    glow: 'group-hover:shadow-violet-500/10',
    tag: 'Strategy',
  },
  {
    icon: '🔍',
    title: 'Real Competitors',
    desc: 'AI-curated, not generic guesses — with logos and full profiles',
    gradient: 'from-cyan-500/20 to-blue-500/5',
    border: 'hover:border-cyan-500/40',
    glow: 'group-hover:shadow-cyan-500/10',
    tag: 'Intelligence',
  },
  {
    icon: '⚡',
    title: 'Live Agent',
    desc: 'Watch every research step unfold in real-time as it happens',
    gradient: 'from-amber-500/20 to-orange-500/5',
    border: 'hover:border-amber-500/40',
    glow: 'group-hover:shadow-amber-500/10',
    tag: 'Real-time',
  },
  {
    icon: '📊',
    title: 'Strategic Insights',
    desc: 'SWOT analysis, feature gaps, and prioritized recommendations',
    gradient: 'from-emerald-500/20 to-green-500/5',
    border: 'hover:border-emerald-500/40',
    glow: 'group-hover:shadow-emerald-500/10',
    tag: 'Insights',
  },
];

const EXAMPLE_URLS = [
  'https://slack.com',
  'https://notion.so',
  'https://figma.com',
  'https://stripe.com',
];

export const InputPanel: React.FC<InputPanelProps> = ({
  onSubmit,
  isLoading,
  error,
  user,
  onShowProjects,
  onLogout,
  onLogin,
}) => {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    let normalized = url.trim();
    if (!normalized) {
      setLocalError('Please enter a URL');
      return;
    }
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }

    try {
      new URL(normalized);
    } catch {
      setLocalError('Please enter a valid URL');
      return;
    }

    onSubmit(normalized);
  };

  return (
    <div className="relative h-screen flex flex-col overflow-hidden bg-[#050714]">
      {/* Background layers */}
      <div className="bg-mesh" />
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      {/* Floating stars */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Top nav */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 px-6 py-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg glow-purple">
              C
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-[#050714] animate-soft-pulse" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-lg leading-none">
              Nily AI 
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-soft-pulse" />
            All systems operational
          </div>
          {user ? (
            <>
              <button
                onClick={onShowProjects}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:text-slate-200 transition"
              >
                <span>📂</span>
                <span className="hidden sm:inline">My Projects</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={onLogout}
                  className="text-xs text-slate-500 hover:text-slate-300 transition hidden sm:block"
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="text-xs px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white font-medium hover:opacity-90 transition"
            >
              Sign in
            </button>
          )}
        </div>
      </motion.header>

      {/* Hero */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6">
        <div className="max-w-3xl w-full text-center mx-auto flex flex-col items-center justify-center min-h-full py-12">
          {/* Eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 backdrop-blur mb-8"
          >
            <span className="inline-flex items-center gap-1.5 text-xs">
              <span className="text-purple-400">✨</span>
              <span className="text-slate-300 font-medium">
                Powered by GPT-5 & real-time agents
              </span>
            </span>
          </motion.div>

          {/* Hero title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]"
          >
            <span className="text-gradient">Your AI</span>
            <br />
            <span className="text-gradient">Chief Marketing Officer</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Drop a URL. Get back a full competitive teardown — ICP, positioning,
            real competitors, SWOT, and a strategy — in under 90 seconds.
          </motion.p>

          {/* URL Input */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div
              className={`relative rounded-2xl p-[1.5px] transition-all duration-300 ${
                focused
                  ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 glow-purple'
                  : 'bg-slate-800'
              }`}
            >
              <div className="flex items-center bg-[#0a0d1f] rounded-2xl overflow-hidden">
                <div className="pl-5 pr-3 py-4 text-slate-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setLocalError('');
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="https://yourcompany.com"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-base disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="m-1.5 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center gap-2 disabled:cursor-not-allowed shrink-0"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Analyzing</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-red-400"
              >
                {localError || error}
              </motion.div>
            )}

            {/* Example URLs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs"
            >
              <span className="text-slate-500">Try:</span>
              {EXAMPLE_URLS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setUrl(example)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition disabled:opacity-50"
                >
                  {example.replace('https://', '')}
                </button>
              ))}
            </motion.div>
          </motion.form>
        </div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl w-full mt-16 mx-auto"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className={`relative p-5 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-slate-800/80 ${feature.border} backdrop-blur transition-all duration-300 group overflow-hidden cursor-default shadow-lg ${feature.glow}`}
            >
              {/* Subtle inner glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }} />

              {/* Tag */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 group-hover:text-slate-400 transition">
                  {feature.tag}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-green-400 transition-colors duration-500" />
              </div>

              {/* Icon */}
              <div className="text-3xl mb-3 transition-transform duration-300 group-hover:scale-110 inline-block">
                {feature.icon}
              </div>

              {/* Text */}
              <div className="font-semibold text-slate-100 text-sm mb-2 leading-snug">
                {feature.title}
              </div>
              <div className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-400 transition">
                {feature.desc}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative z-10 px-6 py-6 border-t border-slate-900"
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Crafted with <span className="text-red-400">♥</span> · Real-time
            agent · Real APIs · Zero mocks
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">Firecrawl</span>
            <span className="opacity-50">·</span>
            <span className="font-mono">Tavily</span>
            <span className="opacity-50">·</span>
            <span className="font-mono">OpenAI</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};
