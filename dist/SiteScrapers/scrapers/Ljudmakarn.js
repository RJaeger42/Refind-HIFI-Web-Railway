"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LjudmakarnPlaywright = void 0;
exports.createLjudmakarnPlaywright = createLjudmakarnPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for Ljudmakarn
 * Uses Ashop e-commerce platform with JSON data in HTML attributes
 *
 * Base URL: https://www.ljudmakarn.se
 * Type: Ashop e-commerce platform
 * Features: json_in_html, price_extraction, image_handling
 */
class LjudmakarnPlaywright extends BaseScraper_1.BaseScraper {
    constructor(options) {
        super('https://www.ljudmakarn.se', 'Ljudmakarn', options);
    }
    async search(query, minPrice, maxPrice) {
        if (!query?.trim()) {
            return [];
        }
        const page = await this.newPage();
        try {
            await this.rateLimit();
            // Navigate to base page to extract product data
            await page.goto(this.baseUrl, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout,
            });
            // Extract JSON data from HTML attribute
            const data = await page.evaluate(() => {
                const node = document.querySelector('[\\:product-data]');
                if (!node)
                    return { products: [] };
                const jsonStr = node.getAttribute(':product-data') || '{}';
                // Decode HTML entities
                const decoded = jsonStr
                    .replace(/&quot;/g, '"')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&amp;/g, '&');
                try {
                    return JSON.parse(decoded);
                }
                catch {
                    return { products: [] };
                }
            });
            const products = data.products || [];
            const results = [];
            const queryLower = query.toLowerCase();
            for (const product of products) {
                try {
                    const name = product.product_name ||
                        product.product_title ||
                        'Unknown';
                    const haystack = [
                        product.product_name,
                        product.product_title,
                        product.product_info_puff,
                    ]
                        .filter(Boolean)
                        .join(' ')
                        .toLowerCase();
                    if (!haystack.includes(queryLower)) {
                        continue;
                    }
                    const priceText = product.product_display_price || product.product_price;
                    const listing = {
                        title: name.trim(),
                        url: (0, utils_1.normalizeUrl)(product.product_url || product.product_link || '', this.baseUrl),
                        price: (0, utils_1.extractPrice)(priceText || ''),
                        description: product.product_info_puff ||
                            product.product_status_name ||
                            undefined,
                        imageUrl: product.product_puff_image || undefined,
                        location: product.tags
                            ?.map((t) => t.product_tag_name)
                            .filter(Boolean)
                            .join(', '),
                        postedDate: undefined,
                        rawData: {
                            source: 'ashop',
                            product_id: product.product_id,
                        },
                    };
                    results.push(listing);
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
}
exports.LjudmakarnPlaywright = LjudmakarnPlaywright;
function createLjudmakarnPlaywright(options) {
    return new LjudmakarnPlaywright(options);
}
//# sourceMappingURL=Ljudmakarn.js.map