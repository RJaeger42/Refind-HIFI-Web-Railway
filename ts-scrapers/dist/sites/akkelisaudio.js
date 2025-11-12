import { BaseSiteScraper } from '../base.js';
export class AkkelisAudioScraper extends BaseSiteScraper {
    constructor() {
        super({
            name: 'Akkelis Audio',
            baseUrl: 'https://www.akkelisaudio.com',
            slug: 'akkelis-audio',
        });
    }
    async search(page, params) {
        throw new Error('AkkelisAudioScraper.search has not been ported to TypeScript yet.');
    }
}
/* Python reference:
  async def search(
          self, query: str, min_price: Optional[float] = None, max_price: Optional[float] = None, **kwargs
      ) -> List[ListingResult]:
          return await asyncio.to_thread(self._search_sync, query, min_price, max_price)
*/
