import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Audio Performance
 * Uses Starweb e-commerce platform
 *
 * Base URL: https://www.audioperformance.se (inferred)
 * Type: Starweb e-commerce platform
 * Features: html_parsing, pagination
 */
export declare class AudioPerformancePlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createAudioPerformancePlaywright(options?: ScraperOptions): AudioPerformancePlaywright;
//# sourceMappingURL=AudioPerformance.d.ts.map