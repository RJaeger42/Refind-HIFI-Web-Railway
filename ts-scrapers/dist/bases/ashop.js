import { BaseSiteScraper } from '../base.js';
const ashopText = (product) => [
    product.product_name,
    product.product_title,
    product.product_info_puff,
]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
export class AshopCategoryScraper extends BaseSiteScraper {
    categoryUrl;
    constructor(options) {
        super(options);
        this.categoryUrl = options.categoryUrl.replace(/\/$/, '');
    }
    async search(page, params) {
        const query = (params.query ?? '').trim().toLowerCase();
        if (!query) {
            return [];
        }
        const minPrice = params.minPrice;
        const maxPrice = params.maxPrice;
        const seen = new Set();
        const listings = [];
        let pageNumber = 1;
        let maxPage = null;
        while (true) {
            const { products, total, perPage } = await this.fetchProducts(page, pageNumber);
            if (!products.length) {
                break;
            }
            if (total && perPage) {
                maxPage = Math.ceil(total / perPage);
            }
            for (const product of products) {
                if (!ashopText(product).includes(query)) {
                    continue;
                }
                const listing = this.toListing(product);
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
                listings.push(listing);
            }
            pageNumber += 1;
            if ((maxPage && pageNumber > maxPage) || pageNumber > 10) {
                break;
            }
        }
        return listings;
    }
    async fetchProducts(page, pageNumber) {
        const separator = this.categoryUrl.includes('?') ? '&' : '?';
        const url = pageNumber > 1 ? `${this.categoryUrl}${separator}page=${pageNumber}` : this.categoryUrl;
        const $ = await this.fetchDocument(page, url);
        const node = $('body *')
            .toArray()
            .find((el) => !!el.attribs && typeof el.attribs[':product-data'] === 'string');
        if (!node) {
            return { products: [], total: 0, perPage: 0 };
        }
        try {
            const raw = (node.attribs[':product-data'] ?? '').replace(/&quot;/g, '"');
            const payload = JSON.parse(raw);
            const products = payload.products ?? [];
            const total = Number(payload.total_amount_of_products ?? products.length) || 0;
            const perPage = Number(payload.per_page ?? products.length) || products.length || 1;
            return { products, total, perPage };
        }
        catch {
            return { products: [], total: 0, perPage: 0 };
        }
    }
    toListing(product) {
        const priceText = product.product_display_price ?? product.product_price ?? null;
        const url = product.product_url ?? this.normalizeUrl(product.product_link);
        const locationTags = product.tags?.map((tag) => tag.product_tag_name).filter(Boolean) ?? [];
        return {
            title: product.product_name ?? product.product_title ?? 'Okänd produkt',
            description: product.product_info_puff ?? undefined,
            price: priceText ? this.extractPrice(priceText) : undefined,
            url,
            imageUrl: product.product_puff_image ?? undefined,
            postedDate: null,
            location: locationTags.length ? locationTags.join(', ') : undefined,
            rawData: { source: 'ashop', productId: product.product_id },
        };
    }
}
