import { Browser, Page, BrowserContext } from 'playwright';
import { SiteScraper, ScraperOptions, ListingResult } from './types';
import { getDefaultUserAgent, sleep } from './utils';

/**
 * Abstract base class for Playwright-based web scrapers
 * Handles browser management, rate limiting, and common utilities
 */
export abstract class BaseScraper implements SiteScraper {
  readonly name: string;
  readonly baseUrl: string;

  protected browser?: Browser;
  protected context?: BrowserContext;
  protected options: Required<ScraperOptions>;
  protected lastRequestTime: number = 0;

  constructor(
    baseUrl: string,
    name: string,
    options: ScraperOptions = {}
  ) {
    this.baseUrl = baseUrl;
    this.name = name;
    this.options = {
      headless: options.headless ?? true,
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent ?? getDefaultUserAgent(),
      requestDelay: options.requestDelay ?? 1000,
      maxPages: options.maxPages ?? 5,
    };
  }

  /**
   * Initialize browser and context if not already done
   */
  protected async initializeBrowser(browser: Browser): Promise<void> {
    if (!this.browser) {
      this.browser = browser;
      try {
        this.context = await browser.newContext({
          userAgent: this.options.userAgent,
        });
      } catch (error) {
        // Browser might be closed, clear reference
        this.browser = undefined;
        throw error;
      }
    }
  }

  /**
   * Create a new page in the current context
   */
  protected async newPage(): Promise<Page> {
    if (!this.context) {
      throw new Error(
        'Browser context not initialized. Call initializeBrowser first.'
      );
    }
    return await this.context.newPage();
  }

  /**
   * Apply rate limiting between requests
   */
  protected async rateLimit(): Promise<void> {
    const timeSinceLast = Date.now() - this.lastRequestTime;
    if (timeSinceLast < this.options.requestDelay) {
      await sleep(this.options.requestDelay - timeSinceLast);
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Abstract search method - must be implemented by subclasses
   */
  abstract search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]>;

  /**
   * Close browser context and cleanup
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = undefined;
    }
  }

  /**
   * Dispose browser instance (called when browser is closed externally)
   */
  disposeBrowser(): void {
    this.browser = undefined;
    this.context = undefined;
  }
}
