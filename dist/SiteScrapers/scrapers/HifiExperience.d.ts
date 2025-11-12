import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for HiFi Experience
 * Stub implementation - requires actual site analysis
 *
 * Base URL: https://hifiexperience.se (inferred)
 * Type: Unknown (stub)
 * Status: Placeholder - needs implementation
 */
export declare class HifiExperiencePlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createHifiExperiencePlaywright(options?: ScraperOptions): HifiExperiencePlaywright;
//# sourceMappingURL=HifiExperience.d.ts.map