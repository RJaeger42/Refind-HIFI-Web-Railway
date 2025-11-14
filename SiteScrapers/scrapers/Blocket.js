"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlocketPlaywright = void 0;
exports.createBlocketPlaywright = createBlocketPlaywright;
const BaseScraper_1 = require("../BaseScraper");
const utils_1 = require("../utils");
/**
 * Playwright-based scraper for Blocket.se (Swedish marketplace)
 * Uses GraphQL API interception to fetch listings
 *
 * Base URL: https://www.blocket.se
 * Type: Modern React SPA with GraphQL API
 * Features: API_interception, real_data_extraction, price_extraction
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
            // Intercept API responses to get clean JSON data
            let apiResponse = null;
            page.on('response', async (response) => {
                const url = response.url();
                // Look for GraphQL or API responses containing listings
                if (url.includes('graphql') || url.includes('api') || url.includes('search')) {
                    try {
                        const contentType = response.headers()['content-type'] || '';
                        if (contentType.includes('application/json')) {
                            const json = await response.json();
                            // Store response if it contains listings data
                            if (json &&
                                (json.data?.listings ||
                                    json.listings ||
                                    json.results ||
                                    (typeof json === 'object' && Object.keys(json).length > 0))) {
                                apiResponse = json;
                            }
                        }
                    }
                    catch (error) {
                        // Ignore parsing errors
                    }
                }
            });
            // Build search URL with parameters
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
            // Navigate with shorter timeout
            await page.goto(searchUrl, {
                waitUntil: 'domcontentloaded',
                timeout: Math.min(this.options.timeout, 30000),
            });
            // Wait for listings to appear with a reasonable timeout
            let retries = 0;
            while (retries < 6) {
                // Try to find listing elements with different selectors
                const listingCount = await page.locator('[data-testid="search-result-item"], [class*="listing"], article').count();
                if (listingCount > 0) {
                    break;
                }
                await page.waitForTimeout(500);
                retries++;
            }
            // Try DOM extraction first (more reliable)
            const results = await this.extractFromDOM(page, query);
            if (results.length > 0) {
                return (0, utils_1.filterByPrice)(results, minPrice, maxPrice);
            }
            // Fallback to API data if available
            if (apiResponse) {
                return this.extractFromAPI(apiResponse, query, minPrice, maxPrice);
            }
            return [];
        }
        catch (error) {
            // Return empty results on error instead of throwing
            return [];
        }
        finally {
            await page.close();
        }
    }
    async extractFromDOM(page, query) {
        const results = [];
        try {
            // Get all article elements or listing containers
            const articles = await page.locator('article, [role="article"]').all();
            for (const article of articles) {
                try {
                    // Extract link - try multiple selectors
                    let link = null;
                    let href = await article.locator('a[href*="/annons/"]').first().getAttribute('href').catch(() => null);
                    if (href) {
                        link = article.locator('a[href*="/annons/"]').first();
                    }
                    else {
                        const allLinks = await article.locator('a').all();
                        for (const l of allLinks) {
                            const h = await l.getAttribute('href').catch(() => null);
                            if (h && h.includes('/annons/')) {
                                href = h;
                                link = l;
                                break;
                            }
                        }
                    }
                    if (!href)
                        continue;
                    // Get title
                    let title = null;
                    if (link) {
                        title = await link.innerText().catch(() => null);
                    }
                    if (!title) {
                        const heading = await article.locator('h1, h2, h3, [class*="title"]').first().innerText().catch(() => null);
                        title = heading;
                    }
                    if (!title || !(0, utils_1.matchesSearchQuery)(title, query)) {
                        continue;
                    }
                    // Extract price - look for common price indicators
                    let price = undefined;
                    try {
                        const priceText = await article
                            .locator('[class*="price"], [data-testid*="price"], span')
                            .first()
                            .innerText()
                            .catch(() => null);
                        if (priceText) {
                            price = (0, utils_1.extractPrice)(priceText);
                        }
                    }
                    catch (error) {
                        // Continue without price
                    }
                    // Extract image
                    let imageUrl = undefined;
                    try {
                        const img = await article.locator('img').first();
                        imageUrl = (await img.getAttribute('src').catch(() => null)) ||
                            (await img.getAttribute('data-src').catch(() => null));
                    }
                    catch (error) {
                        // Continue without image
                    }
                    // Extract location (if available)
                    let location = undefined;
                    try {
                        location = await article
                            .locator('[class*="location"], [data-testid*="location"]')
                            .first()
                            .innerText()
                            .catch(() => null);
                    }
                    catch (error) {
                        // Continue without location
                    }
                    const listing = {
                        title: title.trim(),
                        url: (0, utils_1.normalizeUrl)(href, this.baseUrl),
                        price,
                        imageUrl,
                        location,
                        postedDate: undefined,
                        description: undefined,
                        rawData: { source: 'blocket' },
                    };
                    results.push(listing);
                }
                catch (error) {
                    // Continue to next article
                    continue;
                }
            }
        }
        catch (error) {
            // Continue without throwing
        }
        return results;
    }
    extractFromAPI(apiResponse, query, minPrice, maxPrice) {
        const results = [];
        try {
            // Extract listings from various possible API response structures
            const listings = apiResponse.data?.listings ||
                apiResponse.listings ||
                apiResponse.results ||
                apiResponse.hits ||
                [];
            for (const item of listings) {
                if (!item)
                    continue;
                const title = item.title || item.heading || item.name || '';
                if (!(0, utils_1.matchesSearchQuery)(title, query)) {
                    continue;
                }
                const price = item.price || item.cost;
                if ((minPrice && price < minPrice) || (maxPrice && price > maxPrice)) {
                    continue;
                }
                const listing = {
                    title,
                    url: item.url || item.link || '',
                    price: typeof price === 'number' ? price : (0, utils_1.extractPrice)(price?.toString() || ''),
                    imageUrl: item.image || item.imageUrl || item.thumbnail,
                    location: item.location || item.city,
                    postedDate: item.date || item.postedDate || item.createdAt,
                    description: item.description || item.body,
                    rawData: item,
                };
                results.push(listing);
            }
        }
        catch (error) {
            // Return empty on parse error
        }
        return results;
    }
}
exports.BlocketPlaywright = BlocketPlaywright;
function createBlocketPlaywright(options) {
    return new BlocketPlaywright(options);
}
