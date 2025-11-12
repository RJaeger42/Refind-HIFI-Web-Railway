import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Akkelis Audio
 * Scrapes the Fyndhörnan (Finding Corner) category page
 *
 * Base URL: https://www.akkelisaudio.com
 * Type: HTML-based category scraper
 * Features: html_parsing, price_extraction, image_handling
 */
export declare class AkkelisAudioPlaywright extends BaseScraper {
    private readonly categoryUrl;
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createAkkelisAudioPlaywright(options?: ScraperOptions): AkkelisAudioPlaywright;
//# sourceMappingURL=AkkelisAudio.d.ts.map