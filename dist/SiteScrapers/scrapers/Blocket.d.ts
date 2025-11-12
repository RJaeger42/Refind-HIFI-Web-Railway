import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Blocket.se (Swedish marketplace)
 * Uses dynamic content loading and scrolling to fetch listings
 *
 * Base URL: https://www.blocket.se
 * Type: JavaScript-heavy marketplace with dynamic listing loading
 * Features: html_parsing, pagination, lazy_loading, price_extraction, image_handling
 */
export declare class BlocketPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createBlocketPlaywright(options?: ScraperOptions): BlocketPlaywright;
//# sourceMappingURL=Blocket.d.ts.map