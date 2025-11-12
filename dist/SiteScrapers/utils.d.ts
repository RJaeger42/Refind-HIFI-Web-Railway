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
 * Filter listings by query string (case-insensitive substring match)
 */
export declare function filterByQuery(listings: ListingResult[], query: string): ListingResult[];
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=utils.d.ts.map