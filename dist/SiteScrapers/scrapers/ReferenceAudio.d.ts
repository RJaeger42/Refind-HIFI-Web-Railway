import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Reference Audio
 * Uses Ashop e-commerce platform with JSON data in HTML attributes
 *
 * Base URL: https://www.referenceaudio.se
 * Type: Ashop e-commerce platform
 * Features: json_in_html, price_extraction, image_handling
 */
export declare class ReferenceAudioPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createReferenceAudioPlaywright(options?: ScraperOptions): ReferenceAudioPlaywright;
//# sourceMappingURL=ReferenceAudio.d.ts.map