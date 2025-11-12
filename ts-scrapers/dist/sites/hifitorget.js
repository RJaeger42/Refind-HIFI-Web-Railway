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
        throw new Error('HifiTorgetScraper.search has not been ported to TypeScript yet.');
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
