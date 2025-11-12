"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacebookPlaywright = void 0;
exports.createFacebookPlaywright = createFacebookPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for Facebook Marketplace
 * Note: Requires proper authentication or stored session
 *
 * Base URL: https://www.facebook.com
 * Type: JavaScript-heavy marketplace with authentication
 * Features: dynamic_content, authentication_required, pagination
 */
class FacebookPlaywright extends BaseScraper_1.BaseScraper {
    constructor(options) {
        super('https://www.facebook.com', 'Facebook Marketplace', options);
    }
    async search(query, minPrice, maxPrice) {
        if (!query?.trim()) {
            return [];
        }
        const page = await this.newPage();
        try {
            await this.rateLimit();
            // Build search URL for Stockholm marketplace
            const params = new URLSearchParams({
                query: query,
            });
            if (minPrice) {
                params.append('minPrice', Math.floor(minPrice).toString());
            }
            if (maxPrice) {
                params.append('maxPrice', Math.ceil(maxPrice).toString());
            }
            const searchUrl = `${this.baseUrl}/marketplace/stockholm/search?${params.toString()}`;
            // Navigate to search page
            await page.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: this.options.timeout,
            });
            // Wait for content
            await page.waitForTimeout(3000);
            // Check if logged in (will redirect to login if not)
            const currentUrl = page.url();
            if (currentUrl.toLowerCase().includes('login')) {
                console.warn('Facebook Marketplace requires authentication. Please log in or use saved session.');
                return [];
            }
            // Scroll to load more results
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(2000);
            // Try to extract listings using multiple selector strategies
            const results = [];
            // Strategy 1: Using marketplace-specific selectors
            const selectors = [
                'div[data-testid="marketplace-search-result-item"]',
                'a[href*="/marketplace/item/"]',
                'div[role="article"]',
            ];
            for (const selector of selectors) {
                const items = await page.locator(selector).all();
                if (items.length > 0) {
                    for (const item of items) {
                        try {
                            // Extract title
                            const titleElement = item.locator('span').first();
                            const title = await titleElement.textContent();
                            if (!title || !title.toLowerCase().includes(query.toLowerCase())) {
                                continue;
                            }
                            // Extract URL
                            const linkElement = item.locator('a[href*="/marketplace/item/"]').first();
                            const href = await linkElement.getAttribute('href');
                            if (!href)
                                continue;
                            // Extract price
                            const priceElement = item.locator('[class*="price"]').first();
                            const priceText = await priceElement.textContent();
                            // Extract image
                            const imageElement = item.locator('img').first();
                            const imageUrl = await imageElement.getAttribute('src');
                            const listing = {
                                title: title.trim(),
                                url: (0, utils_1.normalizeUrl)(href, this.baseUrl),
                                price: (0, utils_1.extractPrice)(priceText || ''),
                                description: undefined,
                                imageUrl: imageUrl || undefined,
                                location: undefined,
                                postedDate: undefined,
                                rawData: { source: 'facebook_marketplace' },
                            };
                            results.push(listing);
                        }
                        catch (error) {
                            continue;
                        }
                    }
                    if (results.length > 0)
                        break;
                }
            }
            return (0, utils_1.filterByPrice)(results, minPrice, maxPrice);
        }
        finally {
            await page.close();
        }
    }
}
exports.FacebookPlaywright = FacebookPlaywright;
function createFacebookPlaywright(options) {
    return new FacebookPlaywright(options);
}
//# sourceMappingURL=Facebook.js.map