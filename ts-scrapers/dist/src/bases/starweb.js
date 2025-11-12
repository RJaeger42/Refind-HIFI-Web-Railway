import { load } from 'cheerio';
import { BaseSiteScraper } from '../base.js';
export class StarwebSearchScraper extends BaseSiteScraper {
    constructor(options) {
        super(options);
    }
    async search(page, params) {
        const normalizedQuery = (params.query ?? '').trim();
        if (!normalizedQuery) {
            return [];
        }
        const minPrice = params.minPrice;
        const maxPrice = params.maxPrice;
        const results = [];
        const seen = new Set();
        let pageIndex = 1;
        while (true) {
            const url = `${this.baseUrl}/search?q=${encodeURIComponent(normalizedQuery)}&page=${pageIndex}`;
            const $ = await this.fetchDocument(page, url);
            const items = $('ul.products li.gallery-item').toArray();
            if (!items.length) {
                break;
            }
            for (const node of items) {
                const li = load(node);
                const listing = this.parseListing(li);
                if (!listing) {
                    continue;
                }
                if (!this.matchesQuery(normalizedQuery, listing.title, listing.description)) {
                    continue;
                }
                if (listing.price && minPrice && listing.price < minPrice) {
                    continue;
                }
                if (listing.price && maxPrice && listing.price > maxPrice) {
                    continue;
                }
                if (seen.has(listing.url)) {
                    continue;
                }
                seen.add(listing.url);
                results.push(listing);
            }
            pageIndex += 1;
            if (pageIndex > 5) {
                break;
            }
        }
        return results;
    }
    parseListing(root) {
        const link = root('.gallery-info-link').first();
        if (!link.length) {
            return null;
        }
        const href = link.attr('href');
        if (!href) {
            return null;
        }
        const titleTag = root('.description h3').first();
        const priceTag = root('.product-price .amount').first();
        const skuTag = root('.product-sku').first();
        const statusTag = root('.stock-status').first();
        const image = root('img').first();
        const title = titleTag.text().trim() ||
            link.attr('title') ||
            'Okänd produkt';
        const priceText = priceTag.text().trim();
        const description = skuTag.text().trim() || undefined;
        const location = statusTag.text().trim() || undefined;
        const imageUrl = image.attr('data-src') ?? image.attr('src') ?? undefined;
        return {
            title,
            description,
            price: priceText ? this.extractPrice(priceText) ?? undefined : undefined,
            url: this.normalizeUrl(href),
            imageUrl,
            postedDate: null,
            location,
            rawData: { source: 'starweb' },
        };
    }
}
