import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Ljudmakarn
 * Uses Ashop e-commerce platform with JSON data in HTML attributes
 *
 * Base URL: https://www.ljudmakarn.se
 * Type: Ashop e-commerce platform
 * Features: json_in_html, price_extraction, image_handling
 */
export declare class LjudmakarnPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createLjudmakarnPlaywright(options?: ScraperOptions): LjudmakarnPlaywright;
//# sourceMappingURL=Ljudmakarn.d.ts.map