import { load } from 'cheerio';
import { BaseSiteScraper } from '../base.js';
export class HifiTorgetScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'HifiTorget',
            baseUrl: 'https://www.hifitorget.se',
            slug: 'hifitorget',
        });
    }
    async search(page, params) {
        const query = (params.query ?? '').trim();
        if (!query) {
            return [];
        }
        const minPrice = params.minPrice ?? null;
        const maxPrice = params.maxPrice ?? null;
        const days = params.days ?? null;
        const results = [];
        const seen = new Set();
        for (let pageIndex = 1; pageIndex <= 5; pageIndex += 1) {
            const searchUrl = this.buildSearchUrl(query, pageIndex);
            const $ = await this.loadPage(page, searchUrl);
            const cards = $('.card.mb-3').toArray();
            if (!cards.length) {
                if (pageIndex === 1) {
                    // Try fallback page without trailing slash
                    const fallbackUrl = this.buildFallbackUrl(query, pageIndex);
                    const fallbackHtml = await this.loadPage(page, fallbackUrl);
                    const fallbackCards = fallbackHtml('.card.mb-3').toArray();
                    if (!fallbackCards.length) {
                        break;
                    }
                    cards.push(...fallbackCards);
                }
                else {
                    break;
                }
            }
            for (const card of cards) {
                const listing = this.parseCard(load(card));
                if (!listing) {
                    continue;
                }
                if (!this.matchesQuery(query, listing.title, listing.description)) {
                    continue;
                }
                if (seen.has(listing.url)) {
                    continue;
                }
                seen.add(listing.url);
                if (minPrice && listing.price && listing.price < minPrice) {
                    continue;
                }
                if (maxPrice && listing.price && listing.price > maxPrice) {
                    continue;
                }
                results.push({
                    title: listing.title,
                    description: listing.description || undefined,
                    price: listing.price ?? undefined,
                    url: listing.url,
                    imageUrl: listing.imageUrl || undefined,
                    postedDate: listing.posted || undefined,
                    location: listing.location || undefined,
                    rawData: {
                        source: 'hifitorget',
                        postedAt: listing.postedAt,
                    },
                });
            }
        }
        if (days && days > 0) {
            const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
            return results.filter((listing) => {
                const postedAt = listing.rawData?.postedAt;
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
        return results;
    }
    buildSearchUrl(query, pageIndex) {
        const encoded = encodeURIComponent(query);
        const base = `${this.baseUrl}/?q=${encoded}`;
        return pageIndex > 1 ? `${base}&page=${pageIndex}` : base;
    }
    buildFallbackUrl(query, pageIndex) {
        const encoded = encodeURIComponent(query);
        const base = `${this.baseUrl}?q=${encoded}`;
        return pageIndex > 1 ? `${base}&page=${pageIndex}` : base;
    }
    async loadPage(page, url) {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(1500);
        const html = await page.content();
        return load(html);
    }
    parseCard(root) {
        const anchor = root('a[aria-label]')
            .filter((_, el) => /\bläs mer om\b/i.test(root(el).attr('aria-label') || ''))
            .first() ||
            root('a[href*="visa_annons"]').first() ||
            root('a[href]').first();
        const title = anchor.text()?.trim();
        if (!title) {
            return null;
        }
        const url = this.normalizeUrl(anchor.attr('href') || '');
        const priceText = root('.card-title').first().text()?.trim() || null;
        const price = priceText ? this.extractPrice(priceText) : null;
        const timeText = root('small.text-start').first().text()?.replace(/\s+/g, ' ').trim() || null;
        const locationCandidates = root('p.card-text small')
            .toArray()
            .map((el) => root(el).text()?.trim() || '')
            .filter(Boolean);
        const location = [...locationCandidates]
            .reverse()
            .find((text) => text &&
            !/säljes|köpes|bytes|byte|\d{1,2}:\d{2}/i.test(text) &&
            !/företag/i.test(text)) || null;
        const description = root('p.card-text').last().text()?.replace(/\s+/g, ' ').trim() ||
            root('p.card-text')
                .eq(1)
                .text()
                ?.replace(/\s+/g, ' ')
                .trim() ||
            null;
        const imageNode = root('img').first();
        const imageUrl = imageNode.attr('data-src') ||
            imageNode.attr('data-original') ||
            imageNode.attr('src') ||
            null;
        const postedAt = this.parseSwedishDate(timeText);
        return {
            title,
            url,
            price,
            posted: timeText,
            postedAt,
            location,
            description,
            imageUrl,
        };
    }
    parseSwedishDate(raw) {
        if (!raw) {
            return null;
        }
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
        const weekdayMatch = normalized.match(/^I\s+([A-Za-zåäöÅÄÖ]+)(?:\s+(\d{1,2}):(\d{2}))?$/i);
        if (weekdayMatch) {
            const [, weekdayRaw, hh, mm] = weekdayMatch;
            const weekdayMap = {
                måndag: 1,
                tisdag: 2,
                onsdag: 3,
                torsdag: 4,
                fredag: 5,
                lördag: 6,
                söndag: 0,
            };
            const key = weekdayRaw.toLowerCase();
            if (weekdayMap[key] !== undefined) {
                const base = new Date();
                const current = base.getDay();
                let delta = current - weekdayMap[key];
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
        const dateMatch = normalized.match(/^(\d{1,2})\s+(jan|feb|mar|apr|maj|jun|jul|aug|sep|okt|nov|dec)[a-zåäö]*\.?(?:\s+(\d{4}))?$/i);
        if (dateMatch) {
            const [, dayStr, monthStr, yearStr] = dateMatch;
            const monthMap = {
                jan: 0,
                feb: 1,
                mar: 2,
                apr: 3,
                maj: 4,
                jun: 5,
                jul: 6,
                aug: 7,
                sep: 8,
                okt: 9,
                nov: 10,
                dec: 11,
            };
            const month = monthMap[monthStr.toLowerCase().slice(0, 3)];
            const base = new Date();
            const year = yearStr ? Number(yearStr) : base.getFullYear();
            base.setFullYear(year, month, Number(dayStr));
            base.setHours(12, 0, 0, 0);
            if (base.getTime() > Date.now()) {
                base.setFullYear(base.getFullYear() - 1);
            }
            return base.toISOString();
        }
        return null;
    }
}
/* Python reference:
  async def search(self, query: str, min_price: Optional[float] = None,
                      max_price: Optional[float] = None, **kwargs) -> List[ListingResult]:
          """Search HifiTorget for listings using Playwright"""
          results = []

          debug_print(f"{self.name}: Starting search for '{query}'", info)

          browser = await self._get_browser()
          page = await browser.new_page()

          try:
              # Try multiple search URL patterns
              # Based on actual HTML source, the correct pattern is /?q=nad
              url_patterns = [
                  f"{self.base_url}/?q={quote_plus(query)}",  # Main search pattern (confirmed working)
                  f"{self.base_url}?q={quote_plus(query)}",  # Without trailing slash
                  f"{self.base_url}/annonser?q={quote_plus(query)}",
                  f"{self.base_url}/annonser",  # Fallback: just browse all ads
              ]

              response = None
              search_url = None

              for url in url_patterns:
                  debug_print(f"{self.name}: Trying URL: {url}", info)
                  try:
                      response = await page.goto(url, wait_until='domcontentloaded', timeout=30000)

                      try:
                          # Best-effort wait for quieter network to let dynamic content settle
                          await page.wait_for_load_state('networkidle', timeout=5000)
                      except PlaywrightTimeoutError:
                          debug_print(f"{self.name}: networkidle state not reached for {url} within 5s, continuing with current content", warning)

                      status = response.status if response else 'unknown'
                      debug_print(f"{self.name}: Response status: {status}", info)

                      # If we get 200 (success) or 304 (not modified), use this URL
                      if response and response.status in [200, 304]:
                          search_url = url
                          debug_print(f"{self.name}: Success! Using URL: {url}", info)
                          break
                  except PlaywrightTimeoutError as e:
                      debug_print(f"{self.name}: Timeout waiting for {url}: {e}", warning)
                      continue
                  except Exception as e:
                      debug_print(f"{self.name}: Failed with {url}: {e}", warning)
                      continue

              if not search_url or not response or response.status not in [200, 304]:
                  debug_print(f"{self.name}: All URL patterns failed", error)
                  return results

              debug_print(f"{self.name}: Page loaded successfully", info)

              # Wait a bit for JavaScript to render
              await page.wait_for_timeout(3000)

              # Get the page content
              html_content = await page.content()
              debug_print(f"{self.name}: Page content length: {len(html_content)} chars", info)
              debug_print(f"{self.name}: HTML preview (first 2000 chars):\n{html_content[:2000]}\n--- End HTML preview ---", info)

              # Parse with BeautifulSoup
              soup = BeautifulSoup(html_content, 'html.parser')

              # Try multiple selector strategies for finding listings
              listings = self._find_listings(soup)

              debug_print(f"{self.name}: Found {len(listings)} potential listing elements", info)

              for idx, listing in enumerate(listings, 1):
                  try:
                      debug_print(f"{self.name}: Parsing listing {idx}/{len(listings)}", info)
                      listing_data = self._parse_listing(listing)
                      if listing_data:
                          debug_print(f"{self.name}: Successfully parsed: {listing_data.title[:50]}...", info)
                          results.append(listing_data)
                      else:
                          debug_print(f"{self.name}: Listing {idx} returned no data", warning)
                  except Exception as e:
                      print(f"{error('Error parsing HifiTorget listing:')} {e}", file=sys.stderr)
                      import traceback
                      traceback.print_exc()
                      continue

          except Exception as e:
              print(f"{error('Error during HifiTorget search:')} {e}", file=sys.stderr)
              import traceback
              traceback.print_exc()
          finally:
              await page.close()

          debug_print(f"{self.name}: Returning {len(results)} valid results", info)
          return results
*/
