import React from 'react';

interface PanelHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  accent?: 'default' | 'blue' | 'green' | 'orange' | 'purple' | 'cyan';
  badge?: React.ReactNode;
  logo?: React.ReactNode;
  statusDot?: 'live' | 'idle' | 'loading';
}

const ACCENT_GRADIENTS = {
  default: 'from-indigo-500/8 via-purple-500/5 to-transparent',
  blue:    'from-blue-500/8 via-cyan-500/5 to-transparent',
  green:   'from-green-500/8 via-emerald-500/5 to-transparent',
  orange:  'from-orange-500/8 via-red-500/5 to-transparent',
  purple:  'from-purple-500/8 via-pink-500/5 to-transparent',
  cyan:    'from-cyan-500/8 via-blue-500/5 to-transparent',
};

const ACCENT_BORDER = {
  default: 'from-indigo-500/40 via-purple-500/30 to-transparent',
  blue:    'from-blue-500/40 via-cyan-500/30 to-transparent',
  green:   'from-green-500/40 via-emerald-500/30 to-transparent',
  orange:  'from-orange-500/40 via-red-500/30 to-transparent',
  purple:  'from-purple-500/40 via-pink-500/30 to-transparent',
  cyan:    'from-cyan-500/40 via-blue-500/30 to-transparent',
};

const ACCENT_ICON_BG = {
  default: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-300',
  blue:    'bg-blue-500/15 border-blue-500/25 text-blue-300',
  green:   'bg-green-500/15 border-green-500/25 text-green-300',
  orange:  'bg-orange-500/15 border-orange-500/25 text-orange-300',
  purple:  'bg-purple-500/15 border-purple-500/25 text-purple-300',
  cyan:    'bg-cyan-500/15 border-cyan-500/25 text-cyan-300',
};

const StatusDot: React.FC<{ state: 'live' | 'idle' | 'loading' }> = ({ state }) => {
  if (state === 'live') return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-green-400 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live
    </span>
  );
  if (state === 'loading') return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-blue-400 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
      Fetching
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
      Idle
    </span>
  );
};

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  icon,
  title,
  subtitle,
  right,
  accent = 'default',
  badge,
  logo,
  statusDot,
}) => {
  return (
    <div
      className={`shrink-0 relative border-b border-white/[0.04] bg-gradient-to-r ${ACCENT_GRADIENTS[accent]}`}
      style={{ backdropFilter: 'blur(8px)' }}
    >
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${ACCENT_BORDER[accent]}`} />

      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">

          {/* Optional brand logo override */}
          {logo ? (
            <div className="shrink-0">{logo}</div>
          ) : icon ? (
            <div className={`shrink-0 w-7 h-7 rounded-lg border flex items-center justify-center ${ACCENT_ICON_BG[accent]}`}>
              {typeof icon === 'string' ? (
                <span className="text-xs">{icon}</span>
              ) : icon}
            </div>
          ) : null}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-slate-100 leading-tight tracking-[-0.01em] truncate">
                {title}
              </p>
              {badge && <div className="shrink-0">{badge}</div>}
              {statusDot && <StatusDot state={statusDot} />}
            </div>
            {subtitle && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-snug">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
};
