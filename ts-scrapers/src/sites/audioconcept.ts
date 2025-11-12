import { WooCommerceStoreScraper } from '../bases/woocommerce.js';

export class AudioConceptScraper extends WooCommerceStoreScraper {
  constructor() {
    super({
      name: 'AudioConcept',
      baseUrl: 'https://audioconcept.se',
      slug: 'audioconcept',
    });
  }
}
