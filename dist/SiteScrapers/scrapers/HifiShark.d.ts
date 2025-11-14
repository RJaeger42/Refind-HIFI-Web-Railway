import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for HiFiShark.com
 * Uses JavaScript evaluation to extract search results from page context
 *
 * Base URL: https://www.hifishark.com
 * Type: JavaScript-heavy with page context data
 * Features: javascript_evaluation, price_extraction, image_handling, pagination
 */
export declare class HifiSharkPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
    private parseHit;
}
export declare function createHifiSharkPlaywright(options?: ScraperOptions): HifiSharkPlaywright;
//# sourceMappingURL=HifiShark.d.ts.map