import axios from "axios";
import logger from "../logger.js";

/**
 * Extracts the registrable domain from a URL.
 * Strips protocol, www., paths, and query strings.
 */
export function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Returns the Clearbit Logo API URL for a given domain.
 * Clearbit serves logos at https://logo.clearbit.com/{domain}
 * No API key required for the Logo API.
 */
export function getClearbitLogo(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Returns the Google favicon service URL as fallback.
 * Always returns something even if the site has no favicon.ico.
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

/**
 * Verifies that a URL returns a valid image response.
 * Uses HEAD request to avoid downloading the image.
 */
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      validateStatus: (status) => status < 400,
    });
    const contentType = String(response.headers["content-type"] || "");
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Resolves the best available logo URL for a given website URL.
 * Tries Clearbit first, falls back to Google favicon service.
 */
export async function resolveLogoUrl(url: string): Promise<string> {
  const domain = extractDomain(url);
  if (!domain) {
    return "";
  }

  const clearbitUrl = getClearbitLogo(domain);
  const faviconUrl = getFaviconUrl(domain);

  try {
    const isValid = await isValidImageUrl(clearbitUrl);
    if (isValid) {
      return clearbitUrl;
    }
  } catch (error) {
    logger.debug(
      `Clearbit logo check failed for ${domain}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return faviconUrl;
}

/**
 * Enriches a competitor object with a logo URL.
 */
export async function enrichWithLogo<T extends { url: string }>(
  competitor: T
): Promise<T & { logo: string }> {
  const logo = await resolveLogoUrl(competitor.url);
  return { ...competitor, logo };
}

/**
 * Enriches multiple competitors in parallel.
 */
export async function enrichCompetitors<T extends { url: string }>(
  competitors: T[]
): Promise<Array<T & { logo: string }>> {
  return Promise.all(competitors.map((c) => enrichWithLogo(c)));
}
