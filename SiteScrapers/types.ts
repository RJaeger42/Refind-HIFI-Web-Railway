/**
 * Normalized listing result from web scrapers
 */
export interface ListingResult {
  title: string;
  description?: string;
  price?: number;
  url: string;
  imageUrl?: string;
  postedDate?: string;
  location?: string;
  rawData?: Record<string, unknown>;
}

/**
 * Base interface for all site scrapers
 */
export interface SiteScraper {
  /** Display name of the site */
  readonly name: string;

  /** Base URL of the site */
  readonly baseUrl: string;

  /**
   * Search for listings matching the query
   * @param query Search query string
   * @param minPrice Optional minimum price filter
   * @param maxPrice Optional maximum price filter
   * @returns Promise resolving to list of ListingResult objects
   */
  search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]>;

  /**
   * Close any resources (browser, connections, etc.)
   */
  close(): Promise<void>;
}

/**
 * Options for scraper initialization
 */
export interface ScraperOptions {
  headless?: boolean;
  timeout?: number;
  userAgent?: string;
  requestDelay?: number;
  maxPages?: number;
}
