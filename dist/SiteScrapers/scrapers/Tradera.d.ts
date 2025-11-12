import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Tradera (auction/marketplace)
 * Handles paginated search results
 *
 * Base URL: https://www.tradera.com
 * Type: Paginated HTML search with dynamic loading
 * Features: html_parsing, price_extraction, pagination, image_handling
 */
export declare class TraderaPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createTraderaPlaywright(options?: ScraperOptions): TraderaPlaywright;
//# sourceMappingURL=Tradera.d.ts.map