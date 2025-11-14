import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for HiFi Puls (PrestaShop)
 * Uses PrestaShop search API endpoint
 *
 * Base URL: https://www.hifipuls.se
 * Type: Paginated HTML search
 * Features: html_parsing, price_extraction, pagination, image_handling
 */
export declare class HifiPulsPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createHifiPulsPlaywright(options?: ScraperOptions): HifiPulsPlaywright;
//# sourceMappingURL=HifiPuls.d.ts.map