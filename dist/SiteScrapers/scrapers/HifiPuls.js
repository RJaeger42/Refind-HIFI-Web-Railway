"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifiPulsPlaywright = void 0;
exports.createHifiPulsPlaywright = createHifiPulsPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for HiFi Puls (PrestaShop)
 * Uses PrestaShop search API endpoint
 *
 * Base URL: https://www.hifipuls.se
 * Type: Paginated HTML search
 * Features: html_parsing, price_extraction, pagination, image_handling
 */
class HifiPulsPlaywright extends BaseScraper_1.BaseScraper {
    constructor(options) {
        super('https://www.hifipuls.se', 'HiFi Puls', options);
    }
    async search(query, minPrice, maxPrice) {
        if (!query?.trim()) {
            return [];
        }
        const results = [];
        let page = 1;
        const maxPages = this.options.maxPages;
        while (page <= maxPages) {
            await this.rateLimit();
            const playwright = await this.newPage();
            try {
                // Build search URL
                const searchParams = new URLSearchParams({
                    controller: 'search',
                    search_query: query,
                    page: page.toString(),
                });
                const url = `${this.baseUrl}/search?${searchParams.toString()}`;
                await playwright.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: this.options.timeout,
                });
                // Wait for product list to appear
                const items = await playwright
                    .locator('ul.product_list li.ajax_block_product')
                    .all();
                if (items.length === 0) {
                    break;
                }
                // Parse each item
                for (const item of items) {
                    const titleLink = item.locator('.product-name');
                    const titleText = await titleLink.textContent();
                    if (!titleText) {
                        continue;
                    }
                    const url = await titleLink.getAttribute('href');
                    const priceElement = item.locator('.product-price');
                    const priceText = await priceElement.textContent();
                    const descElement = item.locator('.product-desc');
                    const description = await descElement.textContent();
                    const stockElement = item.locator('.availability, .product-reference');
                    const location = await stockElement.textContent();
                    const imageElement = item.locator('.product-image-container img');
                    const imageUrl = await imageElement.getAttribute('data-original');
                    const listing = {
                        title: titleText.trim(),
                        url: (0, utils_1.normalizeUrl)(url || '', this.baseUrl),
                        price: (0, utils_1.extractPrice)(priceText || ''),
                        description: description?.trim(),
                        imageUrl: imageUrl || undefined,
                        location: location?.trim(),
                        postedDate: undefined,
                        rawData: { source: 'hifipuls' },
                    };
                    results.push(listing);
                }
                page++;
            }
            finally {
                await playwright.close();
            }
        }
        // Filter by price
        return (0, utils_1.filterByPrice)(results, minPrice, maxPrice);
    }
}
exports.HifiPulsPlaywright = HifiPulsPlaywright;
function createHifiPulsPlaywright(options) {
    return new HifiPulsPlaywright(options);
}
//# sourceMappingURL=HifiPuls.js.map