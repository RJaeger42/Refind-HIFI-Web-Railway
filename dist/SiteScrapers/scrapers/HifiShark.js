"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifiSharkPlaywright = void 0;
exports.createHifiSharkPlaywright = createHifiSharkPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for HiFiShark.com
 * Uses JavaScript evaluation to extract search results from page context
 *
 * Base URL: https://www.hifishark.com
 * Type: JavaScript-heavy with page context data
 * Features: javascript_evaluation, price_extraction, image_handling, pagination
 */
class HifiSharkPlaywright extends BaseScraper_1.BaseScraper {
    constructor(options) {
        super('https://www.hifishark.com', 'HiFiShark', options);
    }
    async search(query, minPrice, maxPrice) {
        if (!query?.trim()) {
            return [];
        }
        const page = await this.newPage();
        try {
            await this.rateLimit();
            // Build search URL with Sweden filter
            const params = new URLSearchParams({
                q: query,
                country_iso: 'SE',
            });
            if (minPrice) {
                params.append('minPrice', Math.floor(minPrice).toString());
            }
            if (maxPrice) {
                params.append('maxPrice', Math.ceil(maxPrice).toString());
            }
            const searchUrl = `${this.baseUrl}/search?${params.toString()}`;
            // Navigate to search page
            await page.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout,
            });
            // Wait for JavaScript to populate search results
            await page.waitForTimeout(3000);
            // Extract search data from page context
            const searchData = await page.evaluate(() => {
                // @ts-ignore - searchResults is globally defined by page
                if (typeof window !== 'undefined' && window.searchResults) {
                    return window.searchResults;
                }
                return null;
            });
            if (!searchData || typeof searchData !== 'object') {
                return [];
            }
            // Extract hits from search data
            const hits = searchData.hits || [];
            const results = [];
            for (const hit of hits) {
                try {
                    const listing = this.parseHit(hit);
                    if (listing) {
                        results.push(listing);
                    }
                }
                catch (error) {
                    continue;
                }
            }
            return (0, utils_1.filterByPrice)(results, minPrice, maxPrice);
        }
        finally {
            await page.close();
        }
    }
    parseHit(hit) {
        try {
            const title = hit.title || hit.name || '';
            const url = hit.url || hit.link || '';
            const price = hit.price || hit.priceAsNumber;
            if (!title || !url) {
                return null;
            }
            const listing = {
                title: title.trim(),
                url: (0, utils_1.normalizeUrl)(url, this.baseUrl),
                price: typeof price === 'number' ? price : (0, utils_1.extractPrice)(price?.toString() || ''),
                description: hit.description || undefined,
                imageUrl: hit.image || hit.imageUrl || undefined,
                location: hit.location || hit.country || undefined,
                postedDate: hit.date || hit.posted || undefined,
                rawData: { source: 'hifishark', product_id: hit.id },
            };
            return listing;
        }
        catch (error) {
            return null;
        }
    }
}
exports.HifiSharkPlaywright = HifiSharkPlaywright;
function createHifiSharkPlaywright(options) {
    return new HifiSharkPlaywright(options);
}
//# sourceMappingURL=HifiShark.js.map