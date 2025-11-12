import { Page } from '@playwright/test';
import { load } from 'cheerio';
import { BaseScraperOptions, BaseSiteScraper } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

interface ShopifyVariant {
  price?: string;
}

interface ShopifyImage {
  src?: string;
}

interface ShopifyProduct {
  id: number;
  title?: string;
  handle?: string;
  body_html?: string;
  variants?: ShopifyVariant[];
  image?: ShopifyImage;
  published_at?: string;
}

interface ShopifyResponse {
  products?: ShopifyProduct[];
}

interface ShopifyOptions extends BaseScraperOptions {
  collectionPath: string;
}

export abstract class ShopifyCollectionScraper extends BaseSiteScraper {
  private readonly collectionPath: string;

  protected constructor(options: ShopifyOptions) {
    super(options);
    this.collectionPath = options.collectionPath.replace(/\/$/, '');
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const normalizedQuery = (params.query ?? '').trim();
    if (!normalizedQuery) {
      return [];
    }

    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const results: ListingResult[] = [];

    for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
      const products = await this.fetchProducts(page, pageIndex);
      if (!products.length) {
        break;
      }

      for (const product of products) {
        const title = product.title ?? '';

        const priceValue = this.parsePrice(product.variants?.[0]?.price);
        if (priceValue && minPrice && priceValue < minPrice) {
          continue;
        }
        if (priceValue && maxPrice && priceValue > maxPrice) {
          continue;
        }

        const descriptionHtml = product.body_html ?? '';
        const description = descriptionHtml ? load(descriptionHtml).text().trim() : undefined;

        if (!this.matchesQuery(normalizedQuery, title, description)) {
          continue;
        }

        results.push({
          title: title || 'Okänd produkt',
          description,
          price: priceValue ?? undefined,
          url: `${this.baseUrl}/products/${product.handle}`,
          imageUrl: product.image?.src,
          postedDate: product.published_at,
          location: undefined,
          rawData: { source: 'shopify', productId: product.id },
        });
      }
    }

    return results;
  }

  private async fetchProducts(page: Page, pageNumber: number): Promise<ShopifyProduct[]> {
    const url = `${this.baseUrl}${this.collectionPath}/products.json`;
    try {
      const data = await this.fetchJson<ShopifyResponse>(page, url, { page: pageNumber, limit: 250 });
      return data.products ?? [];
    } catch {
      return [];
    }
  }

  private parsePrice(raw?: string): number | null {
    if (!raw) {
      return null;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }
}
