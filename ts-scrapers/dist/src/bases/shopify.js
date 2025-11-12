import { load } from 'cheerio';
import { BaseSiteScraper } from '../base.js';
export class ShopifyCollectionScraper extends BaseSiteScraper {
    collectionPath;
    constructor(options) {
        super(options);
        this.collectionPath = options.collectionPath.replace(/\/$/, '');
    }
    async search(page, params) {
        const normalizedQuery = (params.query ?? '').trim();
        if (!normalizedQuery) {
            return [];
        }
        const minPrice = params.minPrice;
        const maxPrice = params.maxPrice;
        const results = [];
        for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
            const products = await this.fetchProducts(page, pageIndex);
            if (!products.length) {
                break;
            }
            for (const product of products) {
                const title = product.title ?? '';
                const priceValue = this.parsePrice(product.variants?.[0]?.price);
                if (priceValue && minPrice && priceValue < minPrice) {
                    continue;
                }
                if (priceValue && maxPrice && priceValue > maxPrice) {
                    continue;
                }
                const descriptionHtml = product.body_html ?? '';
                const description = descriptionHtml ? load(descriptionHtml).text().trim() : undefined;
                if (!this.matchesQuery(normalizedQuery, title, description)) {
                    continue;
                }
                results.push({
                    title: title || 'Okänd produkt',
                    description,
                    price: priceValue ?? undefined,
                    url: `${this.baseUrl}/products/${product.handle}`,
                    imageUrl: product.image?.src,
                    postedDate: product.published_at,
                    location: undefined,
                    rawData: { source: 'shopify', productId: product.id },
                });
            }
        }
        return results;
    }
    async fetchProducts(page, pageNumber) {
        const url = `${this.baseUrl}${this.collectionPath}/products.json`;
        try {
            const data = await this.fetchJson(page, url, { page: pageNumber, limit: 250 });
            return data.products ?? [];
        }
        catch {
            return [];
        }
    }
    parsePrice(raw) {
        if (!raw) {
            return null;
        }
        const value = Number(raw);
        return Number.isFinite(value) ? value : null;
    }
}
