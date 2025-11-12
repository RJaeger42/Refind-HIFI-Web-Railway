import { BaseSiteScraper } from '../base.js';
export class HiFiSharkScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'HiFiShark',
            baseUrl: 'https://www.hifishark.com',
            slug: 'hifishark',
        });
    }
    async search(page, params) {
        const query = (params.query ?? '').trim();
        if (!query) {
            return [];
        }
        const searchUrl = this.buildSearchUrl(query, params);
        await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(2000);
        const { searchResults, searchInfo } = await page.evaluate(() => {
            const globalWindow = window;
            return {
                searchResults: globalWindow.searchResults ?? null,
                searchInfo: globalWindow.searchInfo ?? null,
            };
        });
        if (!searchResults || !searchResults.hits) {
            return [];
        }
        const hits = [...(searchResults.hits ?? [])];
        const total = searchResults.total ?? hits.length;
        if (total > hits.length && searchInfo) {
            const extraHits = await this.fetchAdditionalHits(page, searchInfo, hits.length, total);
            hits.push(...extraHits);
        }
        const listings = [];
        for (const hit of hits) {
            const parsed = this.parseHit(hit);
            if (!parsed) {
                continue;
            }
            if (!this.matchesQuery(query, parsed.title, parsed.description)) {
                continue;
            }
            listings.push(parsed);
        }
        return listings;
    }
    buildSearchUrl(query, params) {
        const url = new URL(`${this.baseUrl}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('country_iso', 'SE');
        if (params.minPrice) {
            url.searchParams.set('minPrice', String(Math.floor(params.minPrice)));
        }
        if (params.maxPrice) {
            url.searchParams.set('maxPrice', String(Math.floor(params.maxPrice)));
        }
        return url.toString();
    }
    async fetchAdditionalHits(page, searchInfo, startFrom, total) {
        const collected = [];
        let offset = startFrom;
        while (offset < total) {
            const response = await page.evaluate(async ({ info, offsetValue, totalHits }) => {
                const params = new URLSearchParams();
                const formatValue = (value) => {
                    if (value === null || value === undefined) {
                        return '';
                    }
                    if (typeof value === 'boolean') {
                        return value ? 'true' : 'false';
                    }
                    return String(value);
                };
                Object.entries(info ?? {}).forEach(([key, value]) => {
                    params.append(`searchInfo[${key}]`, formatValue(value));
                });
                params.set('searchInfo[from]', String(offsetValue));
                params.set('searchInfo[totalHits]', String(totalHits));
                const response = await fetch('/searchSlice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: params.toString(),
                });
                if (!response.ok) {
                    return null;
                }
                return (await response.json());
            }, { info: searchInfo, offsetValue: offset, totalHits: total });
            if (!response || !response.hits?.length) {
                break;
            }
            collected.push(...response.hits);
            offset += response.hits.length;
        }
        return collected;
    }
    parseHit(hit) {
        try {
            const description = hit.description || 'No description';
            const title = description.trim();
            const priceData = hit.price || {};
            const price = priceData.value ?? null;
            const displayPrice = hit.display_price || null;
            const relativeUrl = hit.url || '';
            if (!relativeUrl) {
                return null;
            }
            const url = this.normalizeUrl(relativeUrl);
            const imageUrl = hit.image_url || undefined;
            const location = hit.location || {};
            if ((location.country_iso || '').toLowerCase() !== 'se') {
                return null;
            }
            let postedDate;
            if (typeof hit.display_date_str === 'string') {
                postedDate = hit.display_date_str;
            }
            else if (typeof hit.display_date === 'number') {
                const date = new Date(hit.display_date * 1000);
                postedDate = date.toISOString();
            }
            const rawData = {
                source: 'hifishark',
                sourceSite: hit.site_id,
                score: hit._score,
                lastSeen: hit.last_seen_str,
            };
            return {
                title,
                description: displayPrice || undefined,
                price: price ?? undefined,
                url,
                imageUrl,
                postedDate,
                location: 'Sweden',
                rawData,
            };
        }
        catch {
            return null;
        }
    }
}
/* Python reference:
  async def search(self, query: str, min_price: Optional[float] = None,
                      max_price: Optional[float] = None, **kwargs) -> List[ListingResult]:
          """
          Search HiFiShark with Sweden filter

          Args:
              query: Search query string
              min_price: Minimum price filter (optional)
              max_price: Maximum price filter (optional)
              **kwargs: Additional parameters

          Returns:
              List of ListingResult objects filtered to Sweden only
          """
          results = []

          try:
              browser = await self._get_browser()
              page = await browser.new_page()

              try:
                  # Build search URL with Sweden country filter
                  # The correct URL parameter is country_iso=SE (not country or country[])
                  search_url = f"{self.base_url}/search"
                  params = [
                      f"q={query}",
                      "country_iso=SE",  # Filter for Sweden only
                  ]

                  # Add price filters if provided
                  if min_price:
                      params.append(f"minPrice={int(min_price)}")
                  if max_price:
                      params.append(f"maxPrice={int(max_price)}")

                  full_url = f"{search_url}?{'&'.join(params)}"

                  debug_print(f"{self.name}: Navigating to {full_url}", info)

                  # Navigate and wait for network to be idle
                  await page.goto(full_url, wait_until='networkidle', timeout=60000)

                  # Wait for JavaScript to populate search results
                  await page.wait_for_timeout(3000)

                  # Extract search results from JavaScript object
                  search_data = await page.evaluate("""
                      () => {
                          if (typeof searchResults !== 'undefined') {
                              return searchResults;
                          }
                          return null;
                      }
                  """)
                  search_info = await page.evaluate("""
                      () => {
                          if (typeof searchInfo !== 'undefined') {
                              return searchInfo;
                          }
                          return null;
                      }
                  """)

                  if not search_data:
                      print(f"{warning(f'{self.name}:')} No search results data found", file=sys.stderr)
                      return results

                  # Check if we have hits
                  if not isinstance(search_data, dict) or 'hits' not in search_data:
                      print(f"{warning(f'{self.name}:')} Unexpected search data structure", file=sys.stderr)
                      return results

                  hits = search_data.get('hits', [])
                  total = search_data.get('total', 0)

                  debug_print(f"{self.name}: Found {len(hits)} results (total: {total}), filtering for Sweden...", info)

                  if total > len(hits):
                      if not search_info:
                          print(f"{warning(f'{self.name}:')} Unable to fetch additional pages (missing searchInfo)", file=sys.stderr)
                      else:
                          extra_hits = await self._fetch_additional_hits(page, search_info, len(hits), total)
                          if extra_hits:
                              hits.extend(extra_hits)
                              debug_print(f"{self.name}: Retrieved {len(hits)}/{total} hits after pagination", info)
                          else:
                              print(f"{warning(f'{self.name}:')} Pagination request returned no extra hits", file=sys.stderr)

                  # Process each hit
                  for hit in hits:
                      try:
                          listing = self._parse_hit(hit)
                          if listing:
                              results.append(listing)
                      except Exception as e:
                          print(f"{warning(f'{self.name} parse error:')} {e}", file=sys.stderr)
                          continue

                  debug_print(f"{self.name}: Successfully parsed {len(results)} listings", success)

              finally:
                  await page.close()

          except Exception as e:
              print(f"{error(f'Error searching {self.name}:')} {e}", file=sys.stderr)

          return results
*/
