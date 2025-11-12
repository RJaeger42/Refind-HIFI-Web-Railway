import { Page } from '@playwright/test';
import { BaseSiteScraper } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

export class HifiPulsScraper extends BaseSiteScraper {
  private readonly searchUrl: string;

  constructor() {
    super({
      name: 'HiFi Puls',
      baseUrl: 'https://www.hifipuls.se',
      slug: 'hifi-puls',
    });
    this.searchUrl = `${this.baseUrl}/search`;
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const query = (params.query ?? '').trim();
    if (!query) {
      return [];
    }

    const minPrice = params.minPrice ?? null;
    const maxPrice = params.maxPrice ?? null;
    const results: ListingResult[] = [];
    const seen = new Set<string>();

    for (let currentPage = 1; currentPage <= 5; currentPage += 1) {
      const listings = await this.fetchPage(page, query, currentPage);
      if (!listings.length) {
        break;
      }

      for (const listing of listings) {
        if (seen.has(listing.url)) {
          continue;
        }
        seen.add(listing.url);

        if (!this.matchesQuery(query, listing.title, listing.description)) {
          continue;
        }

        if (minPrice && listing.price && listing.price < minPrice) {
          continue;
        }
        if (maxPrice && listing.price && listing.price > maxPrice) {
          continue;
        }

        results.push(listing);
      }
    }

    return results;
  }

  private async fetchPage(page: Page, query: string, currentPage: number): Promise<ListingResult[]> {
    const url = new URL(this.searchUrl);
    url.searchParams.set('controller', 'search');
    url.searchParams.set('search_query', query);
    url.searchParams.set('page', String(currentPage));

    const $ = await this.fetchDocument(page, url.toString());
    const items = $('ul.product_list li.ajax_block_product').toArray();
    const listings: ListingResult[] = [];

    for (const item of items) {
      const node = $(item);
      const titleLink = node.find('.product-name').first();
      const title = titleLink.text()?.trim();
      if (!title) {
        continue;
      }

      const href = titleLink.attr('href') || '';
      const priceText = node.find('.product-price').first().text()?.trim() || null;
      const description = node.find('.product-desc').first().text()?.trim() || null;
      const stock = node.find('.availability, .product-reference').first().text()?.trim() || null;
      const image = node.find('.product-image-container img').first();
      const imageUrl = image.attr('data-original') || image.attr('data-src') || image.attr('src') || null;

      listings.push({
        title,
        description: description || undefined,
        price: priceText ? this.extractPrice(priceText) ?? undefined : undefined,
        url: this.normalizeUrl(href),
        imageUrl: imageUrl || undefined,
        postedDate: null,
        location: stock || undefined,
        rawData: {
          source: 'hifipuls',
        },
      });
    }

    return listings;
  }
}

/* Python reference:
  async def search(
          self, query: str, min_price: Optional[float] = None, max_price: Optional[float] = None, **kwargs
      ) -> List[ListingResult]:
          return await asyncio.to_thread(self._search_sync, query, min_price, max_price)
*/
