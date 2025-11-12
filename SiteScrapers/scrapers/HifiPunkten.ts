import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Playwright-based scraper for HiFi Punkten
 * Uses Ashop e-commerce platform with JSON data in HTML attributes
 *
 * Base URL: https://www.hifipunkten.se
 * Type: Ashop e-commerce platform
 * Features: json_in_html, price_extraction, image_handling
 */
export class HifiPunktenPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.hifipunkten.se', 'HiFi Punkten', options);
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

      // Navigate to base page to extract product data
      await page.goto(this.baseUrl, {
        waitUntil: 'domcontentloaded',
        timeout: this.options.timeout,
      });

      // Extract JSON data from HTML attribute
      const data = await page.evaluate(() => {
        const node = document.querySelector('[\\:product-data]');
        if (!node) return { products: [] };

        const jsonStr = node.getAttribute(':product-data') || '{}';
        // Decode HTML entities
        const decoded = jsonStr
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        try {
          return JSON.parse(decoded);
        } catch {
          return { products: [] };
        }
      });

      const products = (data as any).products || [];
      const results: ListingResult[] = [];
      const queryLower = query.toLowerCase();

      for (const product of products) {
        try {
          const name =
            product.product_name ||
            product.product_title ||
            'Unknown';
          const haystack = [
            product.product_name,
            product.product_title,
            product.product_info_puff,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!haystack.includes(queryLower)) {
            continue;
          }

          const priceText =
            product.product_display_price || product.product_price;

          const listing: ListingResult = {
            title: name.trim(),
            url: normalizeUrl(
              product.product_url || product.product_link || '',
              this.baseUrl
            ),
            price: extractPrice(priceText || ''),
            description:
              product.product_info_puff ||
              product.product_status_name ||
              undefined,
            imageUrl: product.product_puff_image || undefined,
            location: product.tags
              ?.map((t: any) => t.product_tag_name)
              .filter(Boolean)
              .join(', '),
            postedDate: undefined,
            rawData: {
              source: 'ashop',
              product_id: product.product_id,
            },
          };

          results.push(listing);
        } catch (error) {
          continue;
        }
      }

      return filterByPrice(results, minPrice, maxPrice);
    } finally {
      await page.close();
    }
  }
}

export function createHifiPunktenPlaywright(
  options?: ScraperOptions
): HifiPunktenPlaywright {
  return new HifiPunktenPlaywright(options);
}
