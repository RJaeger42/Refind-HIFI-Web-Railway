import { BaseSiteScraper } from '../base.js';
export class TraderaScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'Tradera',
            baseUrl: 'https://www.tradera.com',
            slug: 'tradera',
        });
    }
    async search(page, params) {
        throw new Error('TraderaScraper.search has not been ported to TypeScript yet.');
    }
}
/* Python reference:
  async def search(self, query: str, min_price: Optional[float] = None,
                      max_price: Optional[float] = None, **kwargs) -> List[ListingResult]:
          """Search Tradera for auctions"""
          results = []
          query = query or ""
          query_tokens = [tok for tok in re.split(r"\s+", query.lower().strip()) if tok]
          full_query = " ".join(query_tokens)

          # Build search URL - Tradera uses 'q' parameter, not 'query'
          search_url = f"{self.base_url}/search"
          params = {
              'q': query,
          }

          if min_price:
              params['minPrice'] = int(min_price)
          if max_price:
              params['maxPrice'] = int(max_price)

          param_string = '&'.join([f"{k}={quote_plus(str(v))}" for k, v in params.items()])
          full_url = f"{search_url}?{param_string}"

          # Tradera is a React app, so use Playwright for dynamic content
          soup = None
          try:
              browser = await self._get_browser()
              page = await browser.new_page()

              await page.goto(full_url, wait_until='networkidle', timeout=30000)
              await page.wait_for_timeout(3000)  # Wait for React to render

              # Scroll to trigger lazy loading
              for i in range(2):
                  await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                  await page.wait_for_timeout(2000)

              content = await page.content()
              await page.close()

              soup = BeautifulSoup(content, 'html.parser')
          except Exception as e:
              soup = self._fetch_page(full_url)

          if not soup:
              return results

          # Tradera is a React app - look for common React listing patterns
          # Try multiple strategies for finding listings
          listings = []

          # Strategy 1: Look for links with /auktion/ pattern
          listing_links = soup.find_all('a', href=re.compile(r'/auktion/', re.I))
          for link in listing_links:
              parent = link.find_parent(['article', 'div', 'li', 'section'])
              if parent and parent not in listings:
                  listings.append(parent)

          # Strategy 1b: Look for any links that might be listings (href contains item ID pattern)
          if not listings:
              # Tradera might use different URL patterns - try to find clickable items
              clickable_items = soup.find_all('a', href=re.compile(r'/(item|product|listing|auction)/|/\d+', re.I))
              for link in clickable_items:
                  href = link.get('href', '')
                  # Skip navigation links
                  if any(skip in href.lower() for skip in ['/search', '/login', '/register', '/help', '/about']):
                      continue
                  parent = link.find_parent(['article', 'div', 'li', 'section'])
                  if parent and parent not in listings:
                      listings.append(parent)

          # Strategy 2: Look for article/div with auction/item indicators
          if not listings:
              listings = soup.find_all('article', class_=lambda x: x and ('auction' in str(x).lower() or 'item' in str(x).lower() or 'listing' in str(x).lower()))

          # Strategy 3: Try data attributes
          if not listings:
              listings = soup.find_all('div', {'data-testid': re.compile(r'item|auction|listing', re.I)})

          # Strategy 4: Look for elements containing price patterns (kr)
          if not listings:
              price_elements = soup.find_all(string=re.compile(r'\d+.*kr', re.I))
              for price_elem in price_elements[:20]:  # Limit to avoid too many
                  parent = price_elem.find_parent(['article', 'div', 'li', 'section', 'a'])
                  if parent and parent not in listings:
                      # Check if it has a link to an auction
                      if parent.find('a', href=re.compile(r'/auktion/', re.I)):
                          listings.append(parent)

          for listing in listings:
              try:
                  listing_data = self._parse_listing(listing)
                  if listing_data and self._matches_query(listing_data.title, query_tokens, full_query):
                      if min_price and listing_data.price and listing_data.price < min_price:
                          continue
                      if max_price and listing_data.price and listing_data.price > max_price:
                          continue
                      results.append(listing_data)
              except Exception:
                  continue

          return results
*/
