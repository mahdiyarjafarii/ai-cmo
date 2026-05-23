import React from 'react';
import { motion } from 'framer-motion';
import { SeoHealthDTO, SeoHealthSignalDTO } from '../services/api';

const STATUS_STYLES: Record<SeoHealthSignalDTO['status'], { icon: string; className: string }> = {
  pass: { icon: '✅', className: 'text-green-400' },
  warn: { icon: '⚠️', className: 'text-yellow-400' },
  fail: { icon: '⛔', className: 'text-red-400' },
};

export const SeoHealthTable: React.FC<{ data: SeoHealthDTO }> = ({ data }) => {
  return (
    <div>
      <div className="text-base font-bold text-gray-900 mb-0.5">{data.title}</div>
      <div className="text-xs text-gray-400 mb-3">{data.subtitle}</div>

      <div className="rounded-xl overflow-hidden border border-gray-200 bg-white/30">
        <div className="grid grid-cols-2 px-3 py-2 bg-white/50 border-b border-gray-200">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            Signal
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold text-right">
            Value
          </div>
        </div>

        <div>
          {data.signals.map((s, idx) => {
            const st = STATUS_STYLES[s.status];
            return (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="grid grid-cols-2 px-3 py-2.5 border-b border-gray-200 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs ${st.className}`}>{st.icon}</span>
                  <span className="text-xs text-gray-700 truncate">{s.label}</span>
                </div>
                <div className="text-xs text-gray-700 text-right font-semibold">{s.value}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
