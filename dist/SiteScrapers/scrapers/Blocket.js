"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlocketPlaywright = void 0;
exports.createBlocketPlaywright = createBlocketPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for Blocket.se (Swedish marketplace)
 * Uses dynamic content loading and scrolling to fetch listings
 *
 * Base URL: https://www.blocket.se
 * Type: JavaScript-heavy marketplace with dynamic listing loading
 * Features: html_parsing, pagination, lazy_loading, price_extraction, image_handling
 */
class BlocketPlaywright extends BaseScraper_1.BaseScraper {
    constructor(options) {
        super('https://www.blocket.se', 'Blocket', options);
    }
    async search(query, minPrice, maxPrice) {
        if (!query?.trim()) {
            return [];
        }
        const page = await this.newPage();
        try {
            await this.rateLimit();
            // Build search URL
            const params = new URLSearchParams({
                q: query,
            });
            if (minPrice) {
                params.append('price_min', Math.floor(minPrice).toString());
            }
            if (maxPrice) {
                params.append('price_max', Math.ceil(maxPrice).toString());
            }
            const searchUrl = `${this.baseUrl}/annonser/hela_sverige?${params.toString()}`;
            // Navigate to search page
            await page.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout,
            });
            // Wait for listings to load
            await page.waitForTimeout(2000);
            // Scroll multiple times to trigger lazy loading
            for (let i = 0; i < 3; i++) {
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                await page.waitForTimeout(1500);
            }
            // Extract listings using multiple selector strategies
            const results = [];
            const seenUrls = new Set();
            // Try different article selectors (site may have changed)
            const selectors = [
                'article a[href*="/annonser/"]',
                'a[data-testid*="listing"]',
                'a[href*="/annons/"]',
            ];
            for (const selector of selectors) {
                const items = await page.locator(selector).all();
                if (items.length > 0) {
                    for (const item of items) {
                        try {
                            const href = await item.getAttribute('href');
                            if (!href || href.includes('javascript:'))
                                continue;
                            const url = (0, utils_1.normalizeUrl)(href, this.baseUrl);
                            if (seenUrls.has(url))
                                continue;
                            seenUrls.add(url);
                            // Try to get title from link text or aria-label
                            let title = await item.textContent();
                            if (!title) {
                                title = await item.getAttribute('aria-label');
                            }
                            if (!title?.toLowerCase().includes(query.toLowerCase())) {
                                // Try to extract from parent container
                                const parent = await item.locator('..').first();
                                const parentText = await parent.textContent();
                                if (!parentText?.toLowerCase().includes(query.toLowerCase())) {
                                    continue;
                                }
                            }
                            // Get parent container to extract price and image
                            const container = await item.locator('.. >> ..').first();
                            const priceElement = container.locator('[data-testid*="price"], .price, [class*="price"]').first();
                            const priceText = await priceElement.textContent();
                            const imageElement = item.locator('img, [data-src]').first();
                            const imageUrl = (await imageElement.getAttribute('src')) ||
                                (await imageElement.getAttribute('data-src'));
                            const listing = {
                                title: title?.trim() || '',
                                url,
                                price: (0, utils_1.extractPrice)(priceText || ''),
                                description: undefined,
                                imageUrl: imageUrl || undefined,
                                location: undefined,
                                postedDate: undefined,
                                rawData: { source: 'blocket' },
                            };
                            results.push(listing);
                        }
                        catch (error) {
                            // Continue if individual item parsing fails
                            continue;
                        }
                    }
                    if (results.length > 0)
                        break; // Success with this selector
                }
            }
            return (0, utils_1.filterByPrice)(results, minPrice, maxPrice);
        }
        finally {
            await page.close();
        }
    }
}
exports.BlocketPlaywright = BlocketPlaywright;
function createBlocketPlaywright(options) {
    return new BlocketPlaywright(options);
}
//# sourceMappingURL=Blocket.js.map