import { ShopifyCollectionScraper } from '../bases/shopify.js';

export class LassesHiFiScraper extends ShopifyCollectionScraper {
  constructor() {
    super({
      name: 'Lasses HiFi',
      baseUrl: 'https://lasseshifi.se',
      collectionPath: '/collections/erbjudande',
      slug: 'lasses-hifi',
    });
  }
}
