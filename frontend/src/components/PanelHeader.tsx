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

const StatusDot: React.FC<{ state: 'live' | 'idle' | 'loading' }> = ({ state }) => {
  if (state === 'live') return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-green-600 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
    </span>
  );
  if (state === 'loading') return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-[#fc6423] uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-[#fc6423] animate-ping" />Fetching
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />Idle
    </span>
  );
};

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  icon, title, subtitle, right, badge, logo, statusDot,
}) => {
  return (
    <div className="shrink-0 border-b border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {logo ? (
            <div className="shrink-0">{logo}</div>
          ) : icon ? (
            <div className="shrink-0 w-7 h-7 rounded-lg bg-[#fc6423]/10 border border-[#fc6423]/20 flex items-center justify-center text-[#fc6423]">
              {typeof icon === 'string' ? <span className="text-xs">{icon}</span> : icon}
            </div>
          ) : null}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-gray-800 leading-tight tracking-tight truncate">{title}</p>
              {badge && <div className="shrink-0">{badge}</div>}
              {statusDot && <StatusDot state={statusDot} />}
            </div>
            {subtitle && <p className="text-[10px] text-gray-400 truncate mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
    </div>
  );
};
