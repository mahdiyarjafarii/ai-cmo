export function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function getClearbitLogoUrl(url: string): string {
  return `https://logo.clearbit.com/${getDomain(url)}`;
}

export function getFaviconUrl(url: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${getDomain(url)}&sz=${size}`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
