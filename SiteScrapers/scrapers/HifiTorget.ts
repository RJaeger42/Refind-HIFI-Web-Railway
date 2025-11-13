import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice, matchesSearchQuery } from '../utils';

/**
 * Playwright-based scraper for HifiTorget.se
 * Swedish HiFi marketplace with JavaScript-rendered content
 *
 * Base URL: https://www.hifitorget.se
 * Type: JavaScript-heavy marketplace
 * Features: html_parsing, pagination, price_extraction, image_handling
 */
export class HifiTorgetPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.hifitorget.se', 'HifiTorget', options);
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

        const searchUrl = `${this.baseUrl}/?${params.toString()}`;

        // Navigate and wait for content
        await playwright.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.options.timeout,
        });

        // Wait for dynamic content to load
        await playwright.waitForTimeout(2000);

        // Try to wait for network idle, but don't fail if it times out
        try {
          await playwright.waitForLoadState('networkidle', { timeout: 5000 });
        } catch (error) {
          // Continue with current content if timeout
        }

        // Extract all listing items
        const items = await playwright
          .locator(
            'article, .listing-item, [class*="listing"], [data-testid*="listing"]'
          )
          .all();

        if (items.length === 0) {
          break; // No more items
        }

        // Parse each listing
        for (const item of items) {
          try {
            // Try multiple selectors for title/link
            const titleLink = item.locator('a[href*="/annonser/"]').first();
            const titleText = await titleLink.textContent();

            if (!titleText) continue;

            const href = await titleLink.getAttribute('href');
            if (!href) continue;

            if (!matchesSearchQuery(titleText, query)) {
              continue;
            }

            // Extract price
            const priceElement = item.locator('[class*="price"], .pris, [data-testid*="price"]').first();
            const priceText = await priceElement.textContent();

            // Extract description
            const descElement = item.locator('[class*="desc"], .description').first();
            const description = await descElement.textContent();

            // Extract image
            const imageElement = item.locator('img').first();
            const imageUrl = await imageElement.getAttribute('src');

            // Extract location if available
            const locationElement = item.locator('[class*="location"], .stad, [data-testid*="location"]').first();
            const location = await locationElement.textContent();

            const listing: ListingResult = {
              title: titleText.trim(),
              url: normalizeUrl(href, this.baseUrl),
              price: extractPrice(priceText || ''),
              description: description?.trim(),
              imageUrl: imageUrl || undefined,
              location: location?.trim(),
              postedDate: undefined,
              rawData: { source: 'hifitorget' },
            };

            results.push(listing);
          } catch (error) {
            continue;
          }
        }

        page++;
      } catch (error) {
        break;
      } finally {
        await playwright.close();
      }
    }

    return filterByPrice(results, minPrice, maxPrice);
  }
}

export function createHifiTorgetPlaywright(
  options?: ScraperOptions
): HifiTorgetPlaywright {
  return new HifiTorgetPlaywright(options);
}
