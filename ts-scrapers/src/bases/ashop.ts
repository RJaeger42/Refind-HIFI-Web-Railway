import { Page } from '@playwright/test';
import { BaseSiteScraper, BaseScraperOptions } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

interface AshopOptions extends BaseScraperOptions {
  categoryUrl: string;
}

interface AshopProduct {
  product_name?: string;
  product_title?: string;
  product_info_puff?: string;
  product_display_price?: string;
  product_price?: string;
  product_puff_image?: string;
  product_url?: string;
  product_link?: string;
  tags?: Array<{ product_tag_name?: string }>;
  product_id?: string | number;
}

interface AshopPayload {
  products?: AshopProduct[];
  total_amount_of_products?: number | string;
  per_page?: number | string;
}

export abstract class AshopCategoryScraper extends BaseSiteScraper {
  private readonly categoryUrl: string;

  protected constructor(options: AshopOptions) {
    super(options);
    this.categoryUrl = options.categoryUrl.replace(/\/$/, '');
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const normalizedQuery = (params.query ?? '').trim();
    if (!normalizedQuery) {
      return [];
    }

    const minPrice = params.minPrice;
    const maxPrice = params.maxPrice;
    const seen = new Set<string>();
    const listings: ListingResult[] = [];

    let pageNumber = 1;
    let maxPage: number | null = null;

    while (true) {
      const { products, total, perPage } = await this.fetchProducts(page, pageNumber);
      if (!products.length) {
        break;
      }

      if (total && perPage) {
        maxPage = Math.ceil(total / perPage);
      }

      for (const product of products) {
        if (
          !this.matchesQuery(
            normalizedQuery,
            product.product_name,
            product.product_title,
            product.product_info_puff,
          )
        ) {
          continue;
        }

        const listing = this.toListing(product);
        if (listing.price && minPrice && listing.price < minPrice) {
          continue;
        }
        if (listing.price && maxPrice && listing.price > maxPrice) {
          continue;
        }

        if (seen.has(listing.url)) {
          continue;
        }

        seen.add(listing.url);
        listings.push(listing);
      }

      pageNumber += 1;
      if ((maxPage && pageNumber > maxPage) || pageNumber > 10) {
        break;
      }
    }

    return listings;
  }

  private async fetchProducts(
    page: Page,
    pageNumber: number,
  ): Promise<{ products: AshopProduct[]; total: number; perPage: number }> {
    const separator = this.categoryUrl.includes('?') ? '&' : '?';
    const url = pageNumber > 1 ? `${this.categoryUrl}${separator}page=${pageNumber}` : this.categoryUrl;
    const $ = await this.fetchDocument(page, url);
    const node = $('body *')
      .toArray()
      .find((el) => !!el.attribs && typeof el.attribs[':product-data'] === 'string');

    if (!node) {
      return { products: [], total: 0, perPage: 0 };
    }

    try {
      const raw = (node.attribs[':product-data'] ?? '').replace(/&quot;/g, '"');
      const payload: AshopPayload = JSON.parse(raw);
      const products = payload.products ?? [];

      const total = Number(payload.total_amount_of_products ?? products.length) || 0;
      const perPage = Number(payload.per_page ?? products.length) || products.length || 1;

      return { products, total, perPage };
    } catch {
      return { products: [], total: 0, perPage: 0 };
    }
  }

  private toListing(product: AshopProduct): ListingResult {
    const priceText = product.product_display_price ?? product.product_price ?? null;
    const url = product.product_url ?? this.normalizeUrl(product.product_link);
    const locationTags = product.tags?.map((tag) => tag.product_tag_name).filter(Boolean) ?? [];

    return {
      title: product.product_name ?? product.product_title ?? 'Okänd produkt',
      description: product.product_info_puff ?? undefined,
      price: priceText ? this.extractPrice(priceText) : undefined,
      url,
      imageUrl: product.product_puff_image ?? undefined,
      postedDate: null,
      location: locationTags.length ? locationTags.join(', ') : undefined,
      rawData: { source: 'ashop', productId: product.product_id },
    };
  }
}
