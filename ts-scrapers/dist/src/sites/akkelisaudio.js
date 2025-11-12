import { BaseSiteScraper } from '../base.js';
export class AkkelisaudioScraper extends BaseSiteScraper {
    categoryUrl;
    constructor() {
        super({
            name: 'Akkelisaudio',
            baseUrl: 'https://www.akkelisaudio.com',
            slug: 'akkelisaudio',
        });
        this.categoryUrl = `${this.baseUrl}/fyndhornan/`;
    }
    async search(page, params) {
        const normalizedQuery = (params.query ?? '').trim();
        if (!normalizedQuery) {
            return [];
        }
        const minPrice = params.minPrice ?? null;
        const maxPrice = params.maxPrice ?? null;
        const $ = await this.fetchDocument(page, this.categoryUrl);
        const cards = $('.tws-list--grid-item').toArray();
        const results = [];
        for (const card of cards) {
            const node = $(card);
            const heading = node.find('.tws-util-heading--heading a').first();
            const title = heading.text()?.trim();
            if (!title) {
                continue;
            }
            const description = node.find('.tws-article-labels--label-text').first().text()?.trim() || null;
            if (!this.matchesQuery(normalizedQuery, title, description)) {
                continue;
            }
            const href = heading.attr('href') || '';
            const url = this.normalizeUrl(href);
            const currentPrice = node.find('.tws-api--price-current').first();
            const fallbackPrice = node.find('.tws-api--price-regular').first();
            const priceText = currentPrice.text()?.trim() || fallbackPrice.text()?.trim() || null;
            const priceValue = priceText ? this.extractPrice(priceText) : null;
            if (minPrice && priceValue && priceValue < minPrice) {
                continue;
            }
            if (maxPrice && priceValue && priceValue > maxPrice) {
                continue;
            }
            const image = node.find('.tws-img').first();
            const imageUrl = image.attr('src') ||
                image.attr('data-src') ||
                image.attr('data-original') ||
                image.attr('source') ||
                null;
            results.push({
                title,
                description: description || undefined,
                price: priceValue ?? undefined,
                url,
                imageUrl: imageUrl || undefined,
                postedDate: null,
                location: null,
                rawData: {
                    source: 'akkelisaudio',
                },
            });
        }
        return results;
    }
}
