import { Page } from '@playwright/test';
import { BaseSiteScraper } from '../base.js';
import { ListingResult, SearchParams } from '../types.js';

interface RawListingData {
  title: string | null;
  url: string | null;
  priceText: string | null;
  location: string | null;
  timestamp: string | null;
  image: string | null;
  description: string | null;
  postedAt: string | null;
}

export class BlocketScraper extends BaseSiteScraper {
  constructor() {
    super({
      name: 'Blocket',
      baseUrl: 'https://www.blocket.se',
      slug: 'blocket',
    });
  }

  private resolveCategory(categoryParam: unknown): string | null {
    if (typeof categoryParam === 'string') {
      if (!categoryParam || categoryParam.toLowerCase() === 'all') {
        return null;
      }
      const trimmed = categoryParam.trim();
      if (/^\d+$/.test(trimmed)) {
        return trimmed;
      }
      const map: Record<string, string> = {
        elektronik: '5000',
        elektronik_kategori: '5000',
        ljudbild: '5040',
        'ljud-bild': '5040',
        stereo: '5044',
      };
      const key = trimmed.toLowerCase().replace(/\s+/g, '_');
      if (map[key]) {
        return map[key];
      }
    }
    return '5000';
  }

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {
    const query = (params.query ?? '').trim();
    if (!query) {
      return [];
    }

    const aggregated: RawListingData[] = [];
    const seenUrls = new Set<string>();

    const category = this.resolveCategory(params.category);

    for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
      const searchUrl = this.buildSearchUrl(query, params, pageIndex, category);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

      try {
        await page.waitForSelector('article', { timeout: 20000 });
      } catch {
        break;
      }

      const pageListings = await this.collectListings(page);
      if (process.env.DEBUG_BLOCKET) {
        console.log(`[Blocket] page ${pageIndex}: ${pageListings.length} listings`);
      }
      const newListings = pageListings.filter((listing) => {
        if (!listing.url) {
          return false;
        }
        if (seenUrls.has(listing.url)) {
          return false;
        }
        seenUrls.add(listing.url);
        return true;
      });

      aggregated.push(...newListings);

      if (process.env.DEBUG_BLOCKET) {
        console.log(`[Blocket] page ${pageIndex}: ${newListings.length} new listings`);
      }

      if (!pageListings.length || !newListings.length) {
        break;
      }
    }

    if (process.env.DEBUG_BLOCKET) {
      console.log(`[Blocket] aggregated listings before filters: ${aggregated.length}`);
    }

    const minPrice = params.minPrice ?? null;
    const maxPrice = params.maxPrice ?? null;
    const days = params.days ?? null;
    const seen = new Set<string>();
    const results: ListingResult[] = [];

    for (const listing of aggregated) {
      if (!listing.url || !listing.title) {
        continue;
      }

      if (!this.matchesQuery(query, listing.title, listing.description)) {
        continue;
      }

      const priceValue = listing.priceText ? this.extractPrice(listing.priceText) : null;
      if (minPrice && priceValue && priceValue < minPrice) {
        continue;
      }
      if (maxPrice && priceValue && priceValue > maxPrice) {
        continue;
      }

      if (seen.has(listing.url)) {
        continue;
      }
      seen.add(listing.url);

      results.push({
        title: listing.title,
        description: listing.description || undefined,
        price: priceValue ?? undefined,
        url: listing.url,
        imageUrl: listing.image ?? undefined,
        postedDate: listing.timestamp ?? undefined,
        location: listing.location ?? undefined,
        rawData: {
          source: 'blocket',
          priceText: listing.priceText,
          postedAt: listing.postedAt ?? undefined,
        },
      });
    }

    let filtered = results;
    if (days && days > 0) {
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      filtered = results.filter((listing) => {
        const postedAt = (listing.rawData as { postedAt?: string } | undefined)?.postedAt;
        if (!postedAt) {
          return false;
        }
        const timestamp = Date.parse(postedAt);
        if (Number.isNaN(timestamp)) {
          return false;
        }
        return timestamp >= cutoff;
      });
    }

    return filtered;
  }

  private buildSearchUrl(
    query: string,
    params: SearchParams,
    pageIndex: number,
    category: string | null,
  ): string {
    const url = new URL(`${this.baseUrl}/annonser/hela_sverige`);
    url.searchParams.set('q', query);

    if (pageIndex > 1) {
      url.searchParams.set('page', String(pageIndex));
    }

    if (category) {
      url.searchParams.set('cg', category);
    }

    if (params.minPrice) {
      url.searchParams.set('price_min', String(Math.floor(params.minPrice)));
    }
    if (params.maxPrice) {
      url.searchParams.set('price_max', String(Math.floor(params.maxPrice)));
    }

    return url.toString();
  }

  private async collectListings(page: Page): Promise<RawListingData[]> {
    const listings = await page.evaluate<RawListingData[]>(() => {
      function makeAbsolute(href: string | null): string | null {
        if (!href) {
          return null;
        }
        try {
          return new URL(href, window.location.origin).toString();
        } catch {
          return href;
        }
      }

      const seen = new Set<string>();
      const cards = Array.from(document.querySelectorAll('article'));
      const items: RawListingData[] = [];

      for (const card of cards) {
        const anchor = card.querySelector('a[href*="/annons/"]') as HTMLAnchorElement | null;
        if (!anchor) {
          continue;
        }

        const normalizedUrl = makeAbsolute(anchor.getAttribute('href'));
        if (!normalizedUrl || seen.has(normalizedUrl)) {
          continue;
        }
        seen.add(normalizedUrl);

        const titleText = anchor.textContent?.trim() || anchor.getAttribute('aria-label') || null;
        const priceNode = card.querySelector('[class*="Price__StyledPrice"]');
        let priceText = priceNode?.textContent?.trim() || null;

        if (!priceText) {
          const textNodes = Array.from(card.querySelectorAll('div,span'))
            .map((node) => node.textContent?.trim() || '')
            .filter(Boolean);
          priceText = textNodes.find((text) => /kr/.test(text)) || null;
        }

        const topInfoNode = card.querySelector('[class*="TopInfoWrapper"]');
        const topInfoText =
          topInfoNode
            ?.textContent?.replace(/\u00a0/g, ' ')
            .replace(/\s*·\s*/g, ' · ')
            .replace(/\s+/g, ' ')
            .trim() || null;

        const locationWrapper = topInfoNode;
        let locationText: string | null = null;
        if (locationWrapper) {
          const links = Array.from(locationWrapper.querySelectorAll('a'));
          if (links.length) {
            locationText = links[links.length - 1].textContent?.trim() || null;
          } else {
            locationText = locationWrapper.textContent?.trim() || null;
          }
        }

        const timeNode = card.querySelector('p[class*="styled__Time"]');
        const timeText = timeNode?.textContent?.replace(/\s+/g, ' ').trim() || null;
        const postedAt = (function parseTime(raw: string | null): string | null {
          if (!raw) return null;
          const normalized = raw.replace(/\u00a0/g, ' ').trim();

          const relMatch = normalized.match(/^(Idag|Igår)\s+(\d{1,2}):(\d{2})$/i);
          if (relMatch) {
            const [, label, hh, mm] = relMatch;
            const base = new Date();
            if (label.toLowerCase() === 'igår') {
              base.setDate(base.getDate() - 1);
            }
            base.setHours(Number(hh), Number(mm), 0, 0);
            return base.toISOString();
          }

          const weekdayMatch = normalized.match(/^I\s+([A-Za-zåäöÅÄÖ]+)s?(?:\s+(\d{1,2}):(\d{2}))?$/i);
          if (weekdayMatch) {
            const [, weekdayRaw, hh, mm] = weekdayMatch;
            const weekdayKey = weekdayRaw.toLowerCase().replace(/s$/, '');
            const weekdayMap: Record<string, number> = {
              måndag: 1,
              tisdag: 2,
              onsdag: 3,
              torsdag: 4,
              fredag: 5,
              lördag: 6,
              söndag: 0,
            };
            if (weekdayKey in weekdayMap) {
              const target = weekdayMap[weekdayKey];
              const base = new Date();
              const current = base.getDay();
              let delta = current - target;
              if (delta <= 0) {
                delta += 7;
              }
              base.setDate(base.getDate() - delta);
              if (hh && mm) {
                base.setHours(Number(hh), Number(mm), 0, 0);
              }
              return base.toISOString();
            }
          }

          const dateMatch = normalized.match(/^(\d{1,2})\s+([a-zåäö\.]+)\.?(?:\s+(\d{4}))?(?:\s+(\d{1,2}):(\d{2}))?$/i);
          if (dateMatch) {
            const [, dayStr, monthStrRaw, yearStr, hh, mm] = dateMatch;
            const monthMap: Record<string, number> = {
              jan: 0,
              januari: 0,
              feb: 1,
              februari: 1,
              mar: 2,
              mars: 2,
              apr: 3,
              april: 3,
              maj: 4,
              jun: 5,
              juni: 5,
              jul: 6,
              juli: 6,
              aug: 7,
              augusti: 7,
              sep: 8,
              sept: 8,
              september: 8,
              okt: 9,
              oktober: 9,
              nov: 10,
              november: 10,
              dec: 11,
              december: 11,
            };
            const monthKey = monthStrRaw.toLowerCase().replace('.', '');
            if (monthKey in monthMap) {
              const base = new Date();
              const year = yearStr ? Number(yearStr) : base.getFullYear();
              base.setFullYear(year, monthMap[monthKey], Number(dayStr));
              base.setHours(hh ? Number(hh) : 12, mm ? Number(mm) : 0, 0, 0);
              if (base.getTime() > Date.now()) {
                base.setFullYear(base.getFullYear() - 1);
              }
              return base.toISOString();
            }
          }

          const daysAgoMatch = normalized.match(/^för\s+(\d+)\s+dagar\s+sedan$/i);
          if (daysAgoMatch) {
            const [, days] = daysAgoMatch;
            const base = new Date();
            base.setDate(base.getDate() - Number(days));
            return base.toISOString();
          }

          return null;
        })(timeText);

        const timestamp =
          [topInfoText, timeText].filter((segment) => segment && segment.length).join(' ') || timeText || topInfoText;

        const imageNode = card.querySelector('img');
        const image =
          imageNode?.getAttribute('src') ||
          imageNode?.getAttribute('data-src') ||
          (imageNode?.getAttribute('srcset') || imageNode?.getAttribute('data-srcset'))?.split(' ')[0] ||
          null;

        const descriptionNode = card.querySelector('[class*="SubjectContainer"]');
        const description = descriptionNode?.textContent?.trim() || null;

        items.push({
          title: titleText,
          url: normalizedUrl,
          priceText,
          location: locationText,
          timestamp,
          image,
          description,
          postedAt,
        });
      }

      return items;
    });

    return listings;
  }
}
