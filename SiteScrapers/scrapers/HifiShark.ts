import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Playwright-based scraper for HiFiShark.com
 * Uses JavaScript evaluation to extract search results from page context
 *
 * Base URL: https://www.hifishark.com
 * Type: JavaScript-heavy with page context data
 * Features: javascript_evaluation, price_extraction, image_handling, pagination
 */
export class HifiSharkPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.hifishark.com', 'HiFiShark', options);
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

      // Build search URL with Sweden filter
      const params = new URLSearchParams({
        q: query,
        country_iso: 'SE',
      });

      if (minPrice) {
        params.append('minPrice', Math.floor(minPrice).toString());
      }
      if (maxPrice) {
        params.append('maxPrice', Math.ceil(maxPrice).toString());
      }

      const searchUrl = `${this.baseUrl}/search?${params.toString()}`;

      // Navigate to search page
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout,
      });

      // Wait for JavaScript to populate search results
      await page.waitForTimeout(1500);

      // Extract search data from page context
      const searchData = await page.evaluate(() => {
        // @ts-ignore - searchResults is globally defined by page
        if (typeof window !== 'undefined' && (window as any).searchResults) {
          return (window as any).searchResults;
        }
        return null;
      });

      if (!searchData || typeof searchData !== 'object') {
        return [];
      }

      // Extract hits from search data
      const hits = (searchData as any).hits || [];
      const results: ListingResult[] = [];

      for (const hit of hits) {
        try {
          const listing = this.parseHit(hit);
          if (listing) {
            results.push(listing);
          }
        } catch (error) {
          continue;
        }
      }

      return filterByPrice(results, minPrice, maxPrice);
    } finally {
      await page.close();
    }
  }

  private parseHit(hit: any): ListingResult | null {
    try {
      const title = hit.title || hit.name || '';
      const url = hit.url || hit.link || '';
      const price = hit.price || hit.priceAsNumber;

      if (!title || !url) {
        return null;
      }

      const listing: ListingResult = {
        title: title.trim(),
        url: normalizeUrl(url, this.baseUrl),
        price: typeof price === 'number' ? price : extractPrice(price?.toString() || ''),
        description: hit.description || undefined,
        imageUrl: hit.image || hit.imageUrl || undefined,
        location: hit.location || hit.country || undefined,
        postedDate: hit.date || hit.posted || undefined,
        rawData: { source: 'hifishark', product_id: hit.id },
      };

      return listing;
    } catch (error) {
      return null;
    }
  }
}

export function createHifiSharkPlaywright(
  options?: ScraperOptions
): HifiSharkPlaywright {
  return new HifiSharkPlaywright(options);
}
