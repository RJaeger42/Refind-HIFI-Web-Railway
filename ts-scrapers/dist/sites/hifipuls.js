import { BaseSiteScraper } from '../base.js';
export class HifiPulsScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'HiFi Puls',
            baseUrl: 'https://www.hifipuls.se',
            slug: 'hifi-puls',
        });
    }
    async search(page, params) {
        throw new Error('HifiPulsScraper.search has not been ported to TypeScript yet.');
    }
}
/* Python reference:
  async def search(
          self, query: str, min_price: Optional[float] = None, max_price: Optional[float] = None, **kwargs
      ) -> List[ListingResult]:
          return await asyncio.to_thread(self._search_sync, query, min_price, max_price)
*/
