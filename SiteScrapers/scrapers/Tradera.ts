import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Playwright-based scraper for Tradera (auction/marketplace)
 * Handles paginated search results
 *
 * Base URL: https://www.tradera.com
 * Type: Paginated HTML search with dynamic loading
 * Features: html_parsing, price_extraction, pagination, image_handling
 */
export class TraderaPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.tradera.com', 'Tradera', options);
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
    const seenUrls = new Set<string>();
    let page = 1;
    const maxPages = this.options.maxPages;

    while (page <= maxPages) {
      await this.rateLimit();

      const playwright = await this.newPage();
      try {
        // Build search URL
        const url = new URL(`${this.baseUrl}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('page', page.toString());

        await playwright.goto(url.toString(), {
          waitUntil: 'domcontentloaded',
          timeout: this.options.timeout,
        });

        // Wait for search results
        await playwright
          .waitForSelector('.search-result-item', { timeout: 3000 })
          .catch(() => {}); // Continue even if timeout

        // Extract all listing items
        const items = await playwright.locator('.search-result-item').all();

        if (items.length === 0) {
          break;
        }

        // Parse each listing
        for (const item of items) {
          // Extract basic information
          const titleLink = item.locator('a.item-title');
          const title = await titleLink.textContent();
          const itemUrl = await titleLink.getAttribute('href');

          if (!title || !itemUrl) {
            continue;
          }

          // Extract price information
          const priceElement = item.locator('.current-price, .price');
          const priceText = await priceElement.textContent();

          // Extract additional details
          const descElement = item.locator('.item-description, .description');
          const description = await descElement.textContent();

          // Extract location
          const locationElement = item.locator('.location, .item-location');
          const location = await locationElement.textContent();

          // Extract image
          const imageElement = item.locator('img.item-image');
          const imageUrl = await imageElement.getAttribute('src');

          // Extract condition/status
          const statusElement = item.locator('.item-status, .condition');
          const status = await statusElement.textContent();

          const normalizedUrl = normalizeUrl(itemUrl, this.baseUrl);

          // Skip duplicates
          if (seenUrls.has(normalizedUrl)) {
            continue;
          }
          seenUrls.add(normalizedUrl);

          const listing: ListingResult = {
            title: title.trim(),
            url: normalizedUrl,
            price: extractPrice(priceText || ''),
            description: description?.trim(),
            imageUrl: imageUrl || undefined,
            location: location?.trim(),
            postedDate: undefined,
            rawData: {
              source: 'tradera',
              status: status?.trim(),
            },
          };

          results.push(listing);
        }

        page++;
      } catch (error) {
        console.error(
          `Error scraping Tradera page ${page}:`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        break;
      } finally {
        await playwright.close();
      }
    }

    // Filter by price
    return filterByPrice(results, minPrice, maxPrice);
  }
}

export function createTraderaPlaywright(
  options?: ScraperOptions
): TraderaPlaywright {
  return new TraderaPlaywright(options);
}
