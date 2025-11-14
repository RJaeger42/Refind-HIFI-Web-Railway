import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
/**
 * Playwright-based scraper for Facebook Marketplace
 * Note: Requires proper authentication or stored session
 *
 * Base URL: https://www.facebook.com
 * Type: JavaScript-heavy marketplace with authentication
 * Features: dynamic_content, authentication_required, pagination
 */
export declare class FacebookPlaywright extends BaseScraper {
    constructor(options?: ScraperOptions);
    search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
}
export declare function createFacebookPlaywright(options?: ScraperOptions): FacebookPlaywright;
//# sourceMappingURL=Facebook.d.ts.map