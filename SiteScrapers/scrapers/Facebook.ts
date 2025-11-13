import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice, matchesSearchQuery } from '../utils';

/**
 * Playwright-based scraper for Facebook Marketplace
 * Note: Requires proper authentication or stored session
 *
 * Base URL: https://www.facebook.com
 * Type: JavaScript-heavy marketplace with authentication
 * Features: dynamic_content, authentication_required, pagination
 */
export class FacebookPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.facebook.com', 'Facebook Marketplace', options);
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

      // Build search URL for Stockholm marketplace
      const params = new URLSearchParams({
        query: query,
      });

      if (minPrice) {
        params.append('minPrice', Math.floor(minPrice).toString());
      }
      if (maxPrice) {
        params.append('maxPrice', Math.ceil(maxPrice).toString());
      }

      const searchUrl = `${this.baseUrl}/marketplace/stockholm/search?${params.toString()}`;

      // Navigate to search page
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout,
      });

      // Wait for content
      await page.waitForTimeout(1500);

      // Check if logged in (will redirect to login if not)
      const currentUrl = page.url();
      if (currentUrl.toLowerCase().includes('login')) {
        console.warn(
          'Facebook Marketplace requires authentication. Please log in or use saved session.'
        );
        return [];
      }

      // Scroll to load more results
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(2000);

      // Try to extract listings using multiple selector strategies
      const results: ListingResult[] = [];

      // Strategy 1: Using marketplace-specific selectors
      const selectors = [
        'div[data-testid="marketplace-search-result-item"]',
        'a[href*="/marketplace/item/"]',
        'div[role="article"]',
      ];

      for (const selector of selectors) {
        const items = await page.locator(selector).all();

        if (items.length > 0) {
          for (const item of items) {
            try {
              // Extract title
              const titleElement = item.locator('span').first();
              const title = await titleElement.textContent();

              if (!title || !matchesSearchQuery(title, query)) {
                continue;
              }

              // Extract URL
              const linkElement = item.locator('a[href*="/marketplace/item/"]').first();
              const href = await linkElement.getAttribute('href');
              if (!href) continue;

              // Extract price
              const priceElement = item.locator('[class*="price"]').first();
              const priceText = await priceElement.textContent();

              // Extract image
              const imageElement = item.locator('img').first();
              const imageUrl = await imageElement.getAttribute('src');

              const listing: ListingResult = {
                title: title.trim(),
                url: normalizeUrl(href, this.baseUrl),
                price: extractPrice(priceText || ''),
                description: undefined,
                imageUrl: imageUrl || undefined,
                location: undefined,
                postedDate: undefined,
                rawData: { source: 'facebook_marketplace' },
              };

              results.push(listing);
            } catch (error) {
              continue;
            }
          }

          if (results.length > 0) break;
        }
      }

      return filterByPrice(results, minPrice, maxPrice);
    } finally {
      await page.close();
    }
  }
}

export function createFacebookPlaywright(
  options?: ScraperOptions
): FacebookPlaywright {
  return new FacebookPlaywright(options);
}
