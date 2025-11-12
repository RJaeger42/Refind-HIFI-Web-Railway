import { Browser, Page, BrowserContext } from 'playwright';
import { SiteScraper, ScraperOptions, ListingResult } from './types';
/**
 * Abstract base class for Playwright-based web scrapers
 * Handles browser management, rate limiting, and common utilities
 */
export declare abstract class BaseScraper implements SiteScraper {
    readonly name: string;
    readonly baseUrl: string;
    protected browser?: Browser;
    protected context?: BrowserContext;
    protected options: Required<ScraperOptions>;
    protected lastRequestTime: number;
    constructor(baseUrl: string, name: string, options?: ScraperOptions);
    /**
     * Initialize browser and context if not already done
     */
    protected initializeBrowser(browser: Browser): Promise<void>;
    /**
     * Create a new page in the current context
     */
    protected newPage(): Promise<Page>;
    /**
     * Apply rate limiting between requests
     */
    protected rateLimit(): Promise<void>;
    /**
     * Abstract search method - must be implemented by subclasses
     */
    abstract search(query: string, minPrice?: number, maxPrice?: number): Promise<ListingResult[]>;
    /**
     * Close browser context and cleanup
     */
    close(): Promise<void>;
    /**
     * Dispose browser instance (called when browser is closed externally)
     */
    disposeBrowser(): void;
}
//# sourceMappingURL=BaseScraper.d.ts.map