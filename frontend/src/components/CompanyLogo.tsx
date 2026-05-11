import React, { useState } from 'react';
import { getClearbitLogoUrl, getFaviconUrl, getInitials } from '../utils/brand';

interface CompanyLogoProps {
  name: string;
  url: string;
  size?: number;
  className?: string;
  rounded?: 'md' | 'lg' | 'xl' | 'full';
}

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name,
  url,
  size = 40,
  className = '',
  rounded = 'xl',
}) => {
  const [attempt, setAttempt] = useState(0);

  const src =
    attempt === 0
      ? getClearbitLogoUrl(url)
      : attempt === 1
      ? getFaviconUrl(url, 128)
      : null;

  const roundedClass = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  }[rounded];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`object-contain bg-white ${roundedClass} ${className}`}
        style={{ width: size, height: size, minWidth: size }}
        onError={() => setAttempt((n) => n + 1)}
        loading="lazy"
      />
    );
  }

  // Initials fallback
  const initials = getInitials(name);
  const fontSize = Math.max(10, Math.floor(size * 0.35));

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shrink-0 ${roundedClass} ${className}`}
      style={{ width: size, height: size, minWidth: size, fontSize }}
    >
      {initials}
    </div>
  );
};
