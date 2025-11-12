import { Page } from '@playwright/test';
import { BaseSiteScraper } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

interface MarketplaceListing {
  title: string | null;
  url: string | null;
  priceText: string | null;
  location: string | null;
  imageUrl: string | null;
}

export class FacebookScraper extends BaseSiteScraper {
  constructor() {
    super({
      name: 'Facebook Marketplace',
      baseUrl: 'https://www.facebook.com',
      slug: 'facebook-marketplace',
    });
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const query = (params.query ?? '').trim();
    if (!query) {
      return [];
    }

    const searchUrl = this.buildSearchUrl(query, params);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    const currentUrl = page.url().toLowerCase();
    if (currentUrl.includes('/login') || currentUrl.includes('facebook.com/login')) {
      return [];
    }

    for (let i = 0; i < 4; i += 1) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await page.waitForTimeout(1500);
    }

    const rawListings = await this.collectListings(page);
    const seen = new Set<string>();
    const results: ListingResult[] = [];

    for (const listing of rawListings) {
      if (!listing.url || !listing.title) {
        continue;
      }
      if (seen.has(listing.url)) {
        continue;
      }
      seen.add(listing.url);

      if (!this.matchesQuery(query, listing.title, listing.location)) {
        continue;
      }

      const priceValue = listing.priceText ? this.extractPrice(listing.priceText) : null;
      if (params.minPrice && priceValue && priceValue < params.minPrice) {
        continue;
      }
      if (params.maxPrice && priceValue && priceValue > params.maxPrice) {
        continue;
      }

      results.push({
        title: listing.title,
        description: listing.location || undefined,
        price: priceValue ?? undefined,
        url: listing.url,
        imageUrl: listing.imageUrl || undefined,
        postedDate: undefined,
        location: listing.location || undefined,
        rawData: {
          source: 'facebook',
          priceText: listing.priceText ?? undefined,
        },
      });
    }

    return results;
  }

  private buildSearchUrl(query: string, params: SearchParams): string {
    const url = new URL(`${this.baseUrl}/marketplace/stockholm/search/`);
    url.searchParams.set('query', query);
    if (params.minPrice) {
      url.searchParams.set('minPrice', String(Math.floor(params.minPrice)));
    }
    if (params.maxPrice) {
      url.searchParams.set('maxPrice', String(Math.floor(params.maxPrice)));
    }
    return url.toString();
  }

  private async collectListings(page: Page): Promise<MarketplaceListing[]> {
    const listings = await page.evaluate<MarketplaceListing[]>(() => {
      const anchors = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'));
      const results: MarketplaceListing[] = [];
      const seen = new Set<string>();

      const toAbsolute = (href: string | null) => {
        if (!href) return null;
        try {
          return new URL(href, window.location.origin).toString();
        } catch {
          return href;
        }
      };

      for (const anchor of anchors) {
        const href = toAbsolute(anchor.getAttribute('href'));
        if (!href || seen.has(href)) {
          continue;
        }
        seen.add(href);

        const text = anchor.textContent?.replace(/\s+/g, ' ').trim() || '';
        if (!text) {
          continue;
        }

        const image = anchor.querySelector('img');
        const imageUrl = image?.getAttribute('src') || image?.getAttribute('data-src') || null;

        const parts = text.split(/(?<=kr)/i);
        let remainder = text;
        let priceText: string | null = null;
        if (parts.length > 1) {
          const lastPrice = parts[parts.length - 2].match(/[\d\s\u00a0]+kr/i);
          priceText = lastPrice ? lastPrice[0].replace(/\u00a0/g, ' ').trim() : null;
          remainder = parts[parts.length - 1].trim();
        }

        const locationPattern = /([A-ZÅÄÖ][A-Za-zÅÄÖåäö]+(?:[\s-][A-Za-zÅÄÖåäö]+)*,\s*[A-Z]{2})$/;
        const locationMatch = remainder.match(locationPattern);
        let location: string | null = null;
        if (locationMatch) {
          location = locationMatch[1].trim();
          remainder = remainder.slice(0, -location.length).trim();
        }
        const title = remainder || text;

        results.push({
          title,
          url: href,
          priceText,
          location,
          imageUrl,
        });

        if (results.length >= 40) {
          break;
        }
      }

      return results;
    });

    return listings;
  }
}

/* Python reference:
  async def search(self, query: str, min_price: Optional[float] = None,
                      max_price: Optional[float] = None, **kwargs) -> List[ListingResult]:
          """Search Facebook Marketplace"""
          results = []

          browser = await self._get_browser()
          page = await browser.new_page()

          try:
              # Navigate to Facebook Marketplace search
              # Set location to Sweden (Stockholm) for Swedish results
              search_url = f"{self.base_url}/marketplace/stockholm/search"
              params = {
                  'query': query,
              }

              if min_price:
                  params['minPrice'] = int(min_price)
              if max_price:
                  params['maxPrice'] = int(max_price)

              param_string = '&'.join([f"{k}={v}" for k, v in params.items()])
              full_url = f"{search_url}?{param_string}"

              await page.goto(full_url, wait_until='networkidle', timeout=30000)
              await page.wait_for_timeout(3000)  # Wait for dynamic content and potential login redirects

              # Check if we're on a login page
              current_url = page.url
              if 'login' in current_url.lower() or 'facebook.com/login' in current_url.lower():
                  return results

              # Scroll to load more results
              await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
              await page.wait_for_timeout(2000)

              # Try multiple selectors for listings
              listings = await page.query_selector_all('div[data-testid="marketplace-search-result-item"]')

              # Alternative selectors
              if not listings:
                  listings = await page.query_selector_all('a[href*="/marketplace/item/"]')

              if not listings:
                  listings = await page.query_selector_all('div[role="article"]')

              if not listings:
                  listings = await page.query_selector_all('[data-testid*="marketplace"]')

              for listing in listings[:20]:  # Limit to first 20 results
                  try:
                      listing_data = await self._parse_listing(page, listing)
                      if listing_data:
                          results.append(listing_data)
                  except Exception:
                      continue

          except Exception as e:
              print(f"{error('Error searching Facebook Marketplace:')} {e}")
          finally:
              await page.close()

          return results
*/
