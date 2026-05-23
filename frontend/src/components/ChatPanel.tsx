import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisResult } from '../types';
import { useAnalysisStore } from '../store/analysisStore';
import { sendChatMessage } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  result: AnalysisResult;
}

const SUGGESTIONS = [
  "What are this company's biggest weaknesses?",
  'Compare it to its top competitor',
  'What should they improve first?',
  'Who is their ideal customer?',
  'How is their pricing positioned?',
  'What differentiates them most?',
];

const TypingDots: React.FC = () => (
  <div className="flex items-center gap-1 px-3 py-2.5">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-indigo-400"
        animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

const SendIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const renderInline = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith('**') && token.endsWith('**')) {
      nodes.push(
        <strong key={nodes.length} className="font-semibold text-gray-800">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(
        <code
          key={nodes.length}
          className="px-1 py-0.5 rounded bg-gray-100 border border-gray-200 text-[0.92em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (m) {
        nodes.push(
          <a
            key={nodes.length}
            href={m[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
          >
            {m[1]}
          </a>
        );
      } else {
        nodes.push(token);
      }
    } else {
      nodes.push(token);
    }

    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
};

const MarkdownMessage: React.FC<{ content: string }> = ({ content }) => {
  const parts = content.split(/```/g);
  return (
    <div className="space-y-2">
      {parts.map((part, idx) => {
        const isCode = idx % 2 === 1;
        if (isCode) {
          const code = part.replace(/^\n+|\n+$/g, '');
          return (
            <pre
              key={idx}
              className="text-xs leading-relaxed overflow-x-auto rounded-xl bg-black/30 border border-gray-200 p-3"
            >
              <code className="text-gray-800">{code}</code>
            </pre>
          );
        }

        const lines = part.split('\n');
        const blocks: React.ReactNode[] = [];
        let i = 0;
        while (i < lines.length) {
          const line = lines[i];
          if (line.trim() === '') {
            i += 1;
            continue;
          }
          if (line.startsWith('- ')) {
            const items: string[] = [];
            while (i < lines.length && lines[i].startsWith('- ')) {
              items.push(lines[i].slice(2));
              i += 1;
            }
            blocks.push(
              <ul key={blocks.length} className="list-disc pl-5 space-y-1">
                {items.map((t, liIdx) => (
                  <li key={liIdx} className="text-sm">
                    {renderInline(t)}
                  </li>
                ))}
              </ul>
            );
            continue;
          }

          const paragraph: string[] = [];
          while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('- ')) {
            paragraph.push(lines[i]);
            i += 1;
          }
          blocks.push(
            <p key={blocks.length} className="text-sm leading-relaxed">
              {renderInline(paragraph.join('\n'))}
            </p>
          );
        }

        return (
          <div key={idx} className="space-y-2">
            {blocks}
          </div>
        );
      })}
    </div>
  );
};

const createMessageId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const ChatPanel: React.FC<ChatPanelProps> = ({ result }) => {
  const { analysisId, projectId, chat, addChatMessage } = useAnalysisStore();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat, isThinking]);

  const send = useCallback(
    async (text: string) => {
      const msg = text.trim();
      if (!msg || isThinking || (!analysisId && !projectId)) return;
      setInput('');
      setError(null);

      addChatMessage({
        id: createMessageId(),
        role: 'user',
        content: msg,
        timestamp: new Date().toISOString(),
      });
      setIsThinking(true);

      try {
        const reply = await sendChatMessage(msg, chat, { analysisId, projectId });
        addChatMessage({
          id: createMessageId(),
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        const message =
          typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          (err as { response?: { data?: { error?: string } } }).response?.data?.error
            ? (err as { response: { data: { error: string } } }).response.data.error
            : err instanceof Error
              ? err.message
              : 'Chat failed';
        setError(message);
      } finally {
        setIsThinking(false);
        inputRef.current?.focus();
      }
    },
    [analysisId, projectId, chat, addChatMessage, isThinking]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Chat Header ──────────────────────────── */}
      <div className="shrink-0 relative border-b border-gray-200">
        <div className="flex items-center px-4 py-3 gap-2.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-[13px] font-semibold text-gray-900 tracking-tight">AI Chat</p>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Empty state */}
        {chat.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {/* AI greeting */}
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white font-black text-[11px] shrink-0 shadow-md shadow-indigo-500/20">
                C
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-md px-4 py-3 bg-white border border-gray-200 text-sm text-gray-700 leading-relaxed">
                <p>
                  I've analyzed{' '}
                  <span className="text-indigo-300 font-semibold">{result.company.name}</span>{' '}
                  in depth — their positioning, competitors, strengths, and gaps.
                </p>
                <p className="mt-1.5 text-gray-500 text-xs">
                  What would you like to explore?
                </p>
              </div>
            </div>

            {/* Suggestion chips */}
            <div className="pl-9.5 space-y-1.5">
              {SUGGESTIONS.map((s, i) => (
                <motion.button
                  key={s}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  onClick={() => send(s)}
                  disabled={isThinking}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white/30 border border-gray-200 hover:border-indigo-500/30 hover:bg-indigo-500/5 text-xs text-gray-500 hover:text-gray-800 transition-all disabled:opacity-50 group"
                >
                  <span className="text-indigo-500/60 group-hover:text-indigo-400 mr-2 transition">→</span>
                  {s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat messages */}
        <AnimatePresence initial={false}>
          {chat.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-sm shadow-indigo-500/20">
                  C
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm shadow-md shadow-indigo-500/15'
                    : 'bg-white/70 border border-gray-200 text-gray-700 rounded-bl-sm backdrop-blur-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <MarkdownMessage content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-lg bg-slate-700 border border-slate-600 flex items-center justify-center text-gray-700 text-[10px] shrink-0">
                  U
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-end gap-2"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white text-[10px] font-black shrink-0">
              C
            </div>
            <div className="bg-white/70 border border-gray-200 rounded-2xl rounded-bl-sm backdrop-blur-sm">
              <TypingDots />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="text-xs text-red-400 text-center py-1 px-4 rounded-xl bg-red-500/5 border border-red-500/15 mx-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Premium Input ─────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-gray-200 bg-gradient-to-t from-[#050714] to-transparent">
        <div className="flex items-end gap-2 rounded-2xl bg-white/70 border border-gray-200 focus-within:border-indigo-500/40 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.08)] transition-all px-3.5 py-2.5 backdrop-blur-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${result.company.name}…`}
            disabled={isThinking}
            rows={1}
            className="flex-1 resize-none bg-transparent text-gray-800 placeholder-slate-600 text-sm focus:outline-none py-0.5 max-h-28 overflow-y-auto disabled:opacity-50"
            style={{ scrollbarWidth: 'none' }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || isThinking}
            className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-30 text-white flex items-center justify-center transition-all shadow-sm shadow-indigo-500/20"
          >
            {isThinking ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SendIcon />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          Enter ↵ to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
