import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Playwright-based scraper for Rehifi
 * Uses Starweb e-commerce platform
 *
 * Base URL: https://www.rehifi.se
 * Type: Starweb e-commerce platform
 * Features: html_parsing, pagination
 */
export class RehifiPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.rehifi.se', 'Rehifi', options);
  }

  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    if (!query?.trim()) {
      return [];
    }

    const results: ListingResult[] = [];
    let page = 1;
    const maxPages = this.options.maxPages;

    while (page <= maxPages) {
      await this.rateLimit();

      const playwright = await this.newPage();
      try {
        // Build search URL
        const params = new URLSearchParams({
          q: query,
          page: page.toString(),
        });

        const searchUrl = `${this.baseUrl}/search?${params.toString()}`;

        // Navigate to search page
        await playwright.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.options.timeout,
        });

        // Extract listings
        const items = await playwright
          .locator('ul.products li.gallery-item, .product-item')
          .all();

        if (items.length === 0) {
          break;
        }

        for (const item of items) {
          try {
            const link = item.locator('a.gallery-info-link, a[href*="/product"]').first();
            const titleTag = item.locator('.description h3, .product-name').first();
            const priceTag = item.locator('.product-price .amount, .price').first();

            const url = await link.getAttribute('href');
            const title = await titleTag.textContent();
            const priceText = await priceTag.textContent();

            if (!title || !url) continue;

            if (!title.toLowerCase().includes(query.toLowerCase())) {
              continue;
            }

            const desc = await item.locator('.product-sku, .sku').textContent();
            const imgUrl = await item.locator('img').getAttribute('data-src');
            const loc = await item.locator('.stock-status').textContent();

            const listing: ListingResult = {
              title: title.trim(),
              url: normalizeUrl(url, this.baseUrl),
              price: extractPrice(priceText || ''),
              description: desc || undefined,
              imageUrl: imgUrl || undefined,
              location: loc || undefined,
              postedDate: undefined,
              rawData: { source: 'starweb' },
            };

            results.push(listing);
          } catch (error) {
            continue;
          }
        }

        page++;
      } finally {
        await playwright.close();
      }
    }

    return filterByPrice(results, minPrice, maxPrice);
  }
}

export function createRehifiPlaywright(
  options?: ScraperOptions
): RehifiPlaywright {
  return new RehifiPlaywright(options);
}
