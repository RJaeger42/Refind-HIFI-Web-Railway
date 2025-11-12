import { BaseSiteScraper } from '../base.js';
export class AudioPerformanceScraper extends BaseSiteScraper {
    categoryUrl;
    constructor() {
        super({
            name: 'AudioPerformance',
            baseUrl: 'https://www.audioperformance.se',
            slug: 'audioperformance',
        });
        this.categoryUrl = `${this.baseUrl}/category/begagnad-hifi`;
    }
    async search(page, params) {
        const query = (params.query ?? '').trim();
        if (!query) {
            return [];
        }
        const minPrice = params.minPrice ?? null;
        const maxPrice = params.maxPrice ?? null;
        const results = [];
        const seen = new Set();
        for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
            const url = pageIndex > 1 ? `${this.categoryUrl}?page=${pageIndex}` : this.categoryUrl;
            const $ = await this.fetchDocument(page, url);
            const items = $('ul.products li.gallery-item');
            if (!items.length) {
                break;
            }
            items.each((_, element) => {
                const node = $(element);
                const titleLink = node.find('.gallery-info-link').first();
                if (!titleLink.length) {
                    return;
                }
                const href = titleLink.attr('href');
                if (!href) {
                    return;
                }
                const titleNode = node.find('.description h3').first();
                const title = titleNode.text().trim() || titleLink.attr('title') || 'Okänd produkt';
                const descriptionNode = node.find('.product-sku').first();
                const statusNode = node.find('.stock-status').first();
                const priceNode = node.find('.product-price .amount').first();
                const imageNode = node.find('img').first();
                const description = descriptionNode.text().trim() || undefined;
                const location = statusNode.text().trim() || undefined;
                const priceText = priceNode.text().trim() || null;
                const imageUrl = imageNode.attr('data-src') ?? imageNode.attr('src') ?? undefined;
                if (!this.matchesQuery(query, title, description)) {
                    return;
                }
                const priceValue = priceText ? this.extractPrice(priceText) : null;
                if (minPrice && priceValue && priceValue < minPrice) {
                    return;
                }
                if (maxPrice && priceValue && priceValue > maxPrice) {
                    return;
                }
                const url = this.normalizeUrl(href);
                if (seen.has(url)) {
                    return;
                }
                seen.add(url);
                results.push({
                    title,
                    description,
                    price: priceValue ?? undefined,
                    url,
                    imageUrl,
                    postedDate: null,
                    location,
                    rawData: { source: 'audioperformance' },
                });
            });
        }
        return results;
    }
}
