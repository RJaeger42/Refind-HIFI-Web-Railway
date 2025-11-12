import { Page, APIRequestContext } from '@playwright/test';

export interface ListingResult {
  title: string;
  description?: string | null;
  price?: number | null;
  url: string;
  imageUrl?: string | null;
  postedDate?: string | null;
  location?: string | null;
  rawData?: Record<string, unknown>;
}

export interface SearchParams {
  query: string;
  minPrice?: number;
  maxPrice?: number;
  days?: number;
  [key: string]: unknown;
}

export interface SiteScraper {
  readonly name: string;
  readonly slug: string;
  readonly baseUrl: string;
  search(page: Page, params: SearchParams): Promise<ListingResult[]>;
}

export interface FetchContext {
  page: Page;
  request?: APIRequestContext;
}
