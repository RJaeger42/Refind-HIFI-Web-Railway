import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Lasseshifi
 * Stub implementation - requires actual site analysis
 *
 * Base URL: https://lasseshifi.se (inferred)
 * Type: Unknown (stub)
 * Status: Placeholder - needs implementation
 */
export declare class LasseshifiPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createLasseshifiPlaywright(options?: ScraperOptions): LasseshifiPlaywright;
//# sourceMappingURL=Lasseshifi.d.ts.map