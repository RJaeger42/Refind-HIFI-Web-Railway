import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for HifiTorget.se
 * Swedish HiFi marketplace with JavaScript-rendered content
 *
 * Base URL: https://www.hifitorget.se
 * Type: JavaScript-heavy marketplace
 * Features: html_parsing, pagination, price_extraction, image_handling
 */
export declare class HifiTorgetPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createHifiTorgetPlaywright(options?: ScraperOptions): HifiTorgetPlaywright;
//# sourceMappingURL=HifiTorget.d.ts.map