import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Playwright-based scraper for Akkelis Audio
 * Scrapes the Fyndhörnan (Finding Corner) category page
 *
 * Base URL: https://www.akkelisaudio.com
 * Type: HTML-based category scraper
 * Features: html_parsing, price_extraction, image_handling
 */
export class AkkelisAudioPlaywright extends BaseScraper {
  private readonly categoryUrl: string;

  constructor(options?: ScraperOptions) {
    super('https://www.akkelisaudio.com', 'Akkelis Audio', options);
    this.categoryUrl = `${this.baseUrl}/fyndhornan/`;
  }

  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    if (!query?.trim()) {
      return [];
    }

    const page = await this.newPage();
    try {
      await this.rateLimit();

      // Navigate to category page
      await page.goto(this.categoryUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout,
      });

      // Wait for items to appear
      await page.waitForSelector('.tws-list--grid-item', {
        timeout: 3000,
      });

      // Extract all items
      const items = await page.locator('.tws-list--grid-item').all();
      const results: ListingResult[] = [];
      const queryLower = query.toLowerCase();

      for (const item of items) {
        // Extract title
        const titleElement = item.locator('.tws-util-heading--heading a');
        const title = await titleElement.textContent();

        if (!title?.toLowerCase().includes(queryLower)) {
          continue;
        }

        // Extract URL
        const url = await titleElement.getAttribute('href');

        // Extract price
        const priceElement = item.locator(
          '.tws-api--price-current, .tws-api--price-regular'
        );
        const priceText = await priceElement.textContent();
        const price = extractPrice(priceText || '');

        // Extract description
        const descElement = item.locator('.tws-article-labels--label-text');
        const description = await descElement.textContent();

        // Extract image
        const imageElement = item.locator('.tws-img');
        const imageUrl = await imageElement.getAttribute('source');

        const listing: ListingResult = {
          title: title?.trim() || '',
          url: normalizeUrl(url || '', this.baseUrl),
          price,
          description: description?.trim(),
          imageUrl: imageUrl || undefined,
          location: undefined,
          postedDate: undefined,
          rawData: { source: 'akkelis' },
        };

        results.push(listing);
      }

      // Filter by price
      return filterByPrice(results, minPrice, maxPrice);
    } finally {
      await page.close();
    }
  }
}

export function createAkkelisAudioPlaywright(
  options?: ScraperOptions
): AkkelisAudioPlaywright {
  return new AkkelisAudioPlaywright(options);
}
