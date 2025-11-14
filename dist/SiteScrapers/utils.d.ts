import { ListingResult } from './types';
/**
 * Extract price from text string, handling various formats
 * Supports both comma and dot as decimal separators (Swedish format)
 */
export declare function extractPrice(text: string): number | undefined;
/**
 * Normalize URL to full URL if relative
 */
export declare function normalizeUrl(url: string, baseUrl: string): string;
/**
 * Create a default user agent string
 */
export declare function getDefaultUserAgent(): string;
/**
 * Filter listings by price range
 */
export declare function filterByPrice(listings: ListingResult[], minPrice?: number, maxPrice?: number): ListingResult[];
/**
 * Deduplicate listings by URL
 */
export declare function deduplicateByUrl(listings: ListingResult[]): ListingResult[];
/**
 * Filter listings by query string using strict word boundary matching
 * @deprecated Use matchesSearchQuery() directly instead for better control
 */
export declare function filterByQuery(listings: ListingResult[], query: string): ListingResult[];
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Check if text matches a search query with strict word boundary matching.
 * - Case-insensitive
 * - All search terms must be present as whole words
 * - Words can appear in any order
 * - Word boundaries prevent partial matches (e.g., "NAD" won't match "begagnad")
 *
 * @param text - The text to search in (title, description, etc.)
 * @param query - The search query (can be multiple words)
 * @returns true if all words in the query are found as whole words in the text
 *
 * @example
 * matchesSearchQuery("NAD M12 amplifier", "NAD M12") // true
 * matchesSearchQuery("M12 amplifier by NAD", "NAD M12") // true (any order)
 * matchesSearchQuery("begagnad amplifier", "NAD") // false (not a whole word)
 * matchesSearchQuery("NADC299", "NAD") // false (no word boundary)
 * matchesSearchQuery("NAD c299 amplifier", "NAD c299") // true
 */
export declare function matchesSearchQuery(text: string, query: string): boolean;
//# sourceMappingURL=utils.d.ts.map