import { Page } from '@playwright/test';
import { load } from 'cheerio';
import { BaseScraperOptions, BaseSiteScraper } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

interface WooCommercePrices {
  price?: string;
  regular_price?: string;
  sale_price?: string;
  currency_minor_unit?: number;
}

interface WooCommerceProduct {
  id: number;
  name?: string;
  permalink?: string;
  short_description?: string;
  date_created?: string;
  images?: Array<{ src?: string }>;
  prices?: WooCommercePrices;
}

export abstract class WooCommerceStoreScraper extends BaseSiteScraper {
  private readonly endpoint: string;
  private readonly perPage: number;

  protected constructor(options: BaseScraperOptions & { perPage?: number }) {
    super(options);
    this.endpoint = `${this.baseUrl}/wp-json/wc/store/products`;
    this.perPage = options.perPage ?? 20;
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const normalizedQuery = (params.query ?? '').trim();
    if (!normalizedQuery) {
      return [];
    }

    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const listings: ListingResult[] = [];

    for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
      let products: WooCommerceProduct[] = [];
      try {
        products = await this.fetchJson<WooCommerceProduct[]>(page, this.endpoint, {
          search: normalizedQuery,
          page: pageIndex,
          per_page: this.perPage,
        });
      } catch {
        break;
      }

      if (!products.length) {
        break;
      }

      for (const product of products) {
        const priceValue = this.resolvePrice(product.prices);

        if (priceValue && minPrice && priceValue < minPrice) {
          continue;
        }
        if (priceValue && maxPrice && priceValue > maxPrice) {
          continue;
        }

        const descriptionHtml = product.short_description ?? '';
        const description = descriptionHtml ? load(descriptionHtml).text().trim() : undefined;

        const title = product.name ?? 'Okänd produkt';

        if (!this.matchesQuery(normalizedQuery, title, description)) {
          continue;
        }

        listings.push({
          title: product.name ?? 'Okänd produkt',
          description,
          price: priceValue ?? undefined,
          url: product.permalink ?? this.baseUrl,
          imageUrl: product.images?.[0]?.src,
          postedDate: product.date_created,
          location: undefined,
          rawData: { source: 'woocommerce', productId: product.id },
        });
      }
    }

    return listings;
  }

  private resolvePrice(prices?: WooCommercePrices): number | null {
    if (!prices || !prices.price) {
      return null;
    }
    const minorUnit = typeof prices.currency_minor_unit === 'number' ? prices.currency_minor_unit : 2;
    const divisor = 10 ** minorUnit;
    const numeric = Number(prices.price);
    if (!Number.isFinite(numeric) || divisor === 0) {
      return null;
    }
    return numeric / divisor;
  }
}
