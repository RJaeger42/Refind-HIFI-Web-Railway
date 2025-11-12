import { WooCommerceStoreScraper } from '../bases/woocommerce.js';

export class HifiExperienceScraper extends WooCommerceStoreScraper {
  constructor() {
    super({
      name: 'HiFi Experience',
      baseUrl: 'https://www.hifiexperience.se',
      slug: 'hifi-experience',
    });
  }
}
