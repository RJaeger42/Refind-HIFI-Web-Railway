import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Rehifi
 * Uses Starweb e-commerce platform
 *
 * Base URL: https://www.rehifi.se
 * Type: Starweb e-commerce platform
 * Features: html_parsing, pagination
 */
export declare class RehifiPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createRehifiPlaywright(options?: ScraperOptions): RehifiPlaywright;
//# sourceMappingURL=Rehifi.d.ts.map