import { ListingResult } from './types';

/**
 * Extract price from text string, handling various formats
 * Supports both comma and dot as decimal separators (Swedish format)
 */
export function extractPrice(text: string): number | undefined {
  if (!text) {
    return undefined;
  }

  // Remove currency symbols and spaces, keep numbers and commas/dots
  let cleaned = text.replace(/[^\d,.]/g, '').replace(/\s/g, '');

  // Handle multiple separators (Swedish format: 1.234,56)
  if (cleaned.includes(',') && cleaned.includes('.')) {
    const lastCommaIndex = cleaned.lastIndexOf(',');
    const lastDotIndex = cleaned.lastIndexOf('.');

    if (lastCommaIndex > lastDotIndex) {
      // Comma is decimal separator (1.234,56 -> 1234.56)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Dot is decimal separator (1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Only comma - check if it's a decimal separator (2 digits after)
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  try {
    const price = parseFloat(cleaned);
    return isNaN(price) ? undefined : price;
  } catch {
    return undefined;
  }
}

/**
 * Normalize URL to full URL if relative
 */
export function normalizeUrl(url: string, baseUrl: string): string {
  if (!url) {
    return '';
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    const base = new URL(baseUrl);
    return `${base.protocol}//${base.host}${url}`;
  }

  return `${baseUrl.replace(/\/$/, '')}/${url}`;
}

/**
 * Create a default user agent string
 */
export function getDefaultUserAgent(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

/**
 * Filter listings by price range
 */
export function filterByPrice(
  listings: ListingResult[],
  minPrice?: number,
  maxPrice?: number
): ListingResult[] {
  return listings.filter((listing) => {
    if (minPrice && listing.price && listing.price < minPrice) {
      return false;
    }
    if (maxPrice && listing.price && listing.price > maxPrice) {
      return false;
    }
    return true;
  });
}

/**
 * Deduplicate listings by URL
 */
export function deduplicateByUrl(listings: ListingResult[]): ListingResult[] {
  const seen = new Set<string>();
  return listings.filter((listing) => {
    if (seen.has(listing.url)) {
      return false;
    }
    seen.add(listing.url);
    return true;
  });
}

/**
 * Filter listings by query string (case-insensitive substring match)
 */
export function filterByQuery(
  listings: ListingResult[],
  query: string
): ListingResult[] {
  const lowerQuery = (query || '').toLowerCase();
  return listings.filter(
    (listing) =>
      lowerQuery === '' ||
      listing.title.toLowerCase().includes(lowerQuery) ||
      (listing.description &&
        listing.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
