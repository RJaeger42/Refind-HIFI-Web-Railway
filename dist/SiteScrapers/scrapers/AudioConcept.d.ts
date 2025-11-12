import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Audio Concept
 * Stub implementation - requires actual site analysis
 *
 * Base URL: https://audioconcept.se (inferred)
 * Type: Unknown (stub)
 * Status: Placeholder - needs implementation
 */
export declare class AudioConceptPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createAudioConceptPlaywright(options?: ScraperOptions): AudioConceptPlaywright;
//# sourceMappingURL=AudioConcept.d.ts.map