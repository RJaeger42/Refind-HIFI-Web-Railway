"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
const utils_1 = require("./utils");
/**
 * Abstract base class for Playwright-based web scrapers
 * Handles browser management, rate limiting, and common utilities
 */
class BaseScraper {
    constructor(baseUrl, name, options = {}) {
        this.lastRequestTime = 0;
        this.baseUrl = baseUrl;
        this.name = name;
        this.options = {
            headless: options.headless ?? true,
            timeout: options.timeout ?? 30000,
            userAgent: options.userAgent ?? (0, utils_1.getDefaultUserAgent)(),
            requestDelay: options.requestDelay ?? 1000,
            maxPages: options.maxPages ?? 5,
        };
    }
    /**
     * Initialize browser and context if not already done
     */
    async initializeBrowser(browser) {
        if (!this.browser) {
            this.browser = browser;
            try {
                this.context = await browser.newContext({
                    userAgent: this.options.userAgent,
                });
            }
            catch (error) {
                // Browser might be closed, clear reference
                this.browser = undefined;
                throw error;
            }
        }
    }
    /**
     * Create a new page in the current context
     */
    async newPage() {
        if (!this.context) {
            throw new Error('Browser context not initialized. Call initializeBrowser first.');
        }
        return await this.context.newPage();
    }
    /**
     * Apply rate limiting between requests
     */
    async rateLimit() {
        const timeSinceLast = Date.now() - this.lastRequestTime;
        if (timeSinceLast < this.options.requestDelay) {
            await (0, utils_1.sleep)(this.options.requestDelay - timeSinceLast);
        }
        this.lastRequestTime = Date.now();
    }
    /**
     * Close browser context and cleanup
     */
    async close() {
        if (this.context) {
            await this.context.close();
            this.context = undefined;
        }
    }
    /**
     * Dispose browser instance (called when browser is closed externally)
     */
    disposeBrowser() {
        this.browser = undefined;
        this.context = undefined;
    }
}
exports.BaseScraper = BaseScraper;
