import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for HiFi Punkten
 * Uses Ashop e-commerce platform with JSON data in HTML attributes
 *
 * Base URL: https://www.hifipunkten.se
 * Type: Ashop e-commerce platform
 * Features: json_in_html, price_extraction, image_handling
 */
export declare class HifiPunktenPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createHifiPunktenPlaywright(options?: ScraperOptions): HifiPunktenPlaywright;
//# sourceMappingURL=HifiPunkten.d.ts.map