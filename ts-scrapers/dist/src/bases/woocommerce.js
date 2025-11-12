import { load } from 'cheerio';
import { BaseSiteScraper } from '../base.js';
export class WooCommerceStoreScraper extends BaseSiteScraper {
    endpoint;
    perPage;
    constructor(options) {
        super(options);
        this.endpoint = `${this.baseUrl}/wp-json/wc/store/products`;
        this.perPage = options.perPage ?? 20;
    }
    async search(page, params) {
        const normalizedQuery = (params.query ?? '').trim();
        if (!normalizedQuery) {
            return [];
        }
        const minPrice = params.minPrice;
        const maxPrice = params.maxPrice;
        const listings = [];
        for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
            let products = [];
            try {
                products = await this.fetchJson(page, this.endpoint, {
                    search: normalizedQuery,
                    page: pageIndex,
                    per_page: this.perPage,
                });
            }
            catch {
                break;
            }
            if (!products.length) {
                break;
            }
            for (const product of products) {
                const priceValue = this.resolvePrice(product.prices);
                if (priceValue && minPrice && priceValue < minPrice) {
                    continue;
                }
                if (priceValue && maxPrice && priceValue > maxPrice) {
                    continue;
                }
                const descriptionHtml = product.short_description ?? '';
                const description = descriptionHtml ? load(descriptionHtml).text().trim() : undefined;
                const title = product.name ?? 'Okänd produkt';
                if (!this.matchesQuery(normalizedQuery, title, description)) {
                    continue;
                }
                listings.push({
                    title: product.name ?? 'Okänd produkt',
                    description,
                    price: priceValue ?? undefined,
                    url: product.permalink ?? this.baseUrl,
                    imageUrl: product.images?.[0]?.src,
                    postedDate: product.date_created,
                    location: undefined,
                    rawData: { source: 'woocommerce', productId: product.id },
                });
            }
        }
        return listings;
    }
    resolvePrice(prices) {
        if (!prices || !prices.price) {
            return null;
        }
        const minorUnit = typeof prices.currency_minor_unit === 'number' ? prices.currency_minor_unit : 2;
        const divisor = 10 ** minorUnit;
        const numeric = Number(prices.price);
        if (!Number.isFinite(numeric) || divisor === 0) {
            return null;
        }
        return numeric / divisor;
    }
}
